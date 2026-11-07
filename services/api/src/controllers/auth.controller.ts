import type { Request, Response } from "express";
import { hashPassword } from "../utils/password.js";
import { createUserWithOrganization } from "../repositories/auth.repository.js";
//login
import { comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/token.js";
import { findUserForLogin} from "../repositories/auth.repository.js";
//create member
import { createOrganizationMember } from "../repositories/auth.repository.js";
import { ROLES } from "../constants/roles.js";
//get members
import { getOrganizationMembers,updateMemberRole } from "../repositories/auth.repository.js";
import {generateSlug} from "../utils/slug.js"

export const signUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, organizationName} =
      req.body;
    if (
      !name ||
      !email ||
      !password ||
      !organizationName
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }
    const passwordHash = await hashPassword(password);
    const organizationSlug = generateSlug(organizationName)

    //create user with organization
    const result = await createUserWithOrganization({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      organizationName,
      organizationSlug: organizationSlug.toLowerCase().trim(),
    });
    console.log("result", result);
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    const dbError = error as {
      code?: string;
      constraint?: string;
    };

    // PostgreSQL unique constraint violation
    if (dbError.code === "23505") {
      if (dbError.constraint === "users_email_key") {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }

      if (dbError.constraint === "organizations_slug_key") {
        return res.status(409).json({
          success: false,
          message: "Organization slug already exists",
        });
      }

      return res.status(409).json({
        success: false,
        message: "A record with these details already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong during signup",
    });
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const { email, password} = req.body;
    if (!email || !password ) {
      return res.status(400).json({
        success: false,
        message: "Email, password and organization are required",
      });
    }
    // const slugId = await fetchSlugID(email.toLowerCase().trim())

    const user = await findUserForLogin(
      email.toLowerCase().trim(),
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email, password or organization",
      });
    }
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email, password or organization",
      });
    }

    const token = generateToken({
      userId: user.user_id,
      organizationId: user.organization_id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: user.organization_id,
          name: user.organization_name,
          slug: user.organization_slug,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
    });
  }
};

export const createMember = async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
  
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }
  
      if (![ROLES.MANAGER, ROLES.MEMBER].includes(role))  {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }
  
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
  
      const organizationId = req.user?.organizationId;
  
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access denied",
        });
      }
  
      const passwordHash = await hashPassword(password);
  
      const result = await createOrganizationMember({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        organizationId,
        role,
      });
  
      return res.status(201).json({
        success: true,
        message: "Member created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Create member error:", error);
  
      const dbError = error as { code?: string };
  
      if (dbError.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
  
      return res.status(500).json({
        success: false,
        message: "Failed to create member",
      });
    }
  };

  export const getMembers = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
  
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access denied",
        });
      }
  
      const members = await getOrganizationMembers(organizationId);
  
      return res.status(200).json({
        success: true,
        count: members.length,
        data: members,
      });
    } catch (error) {
      console.error("Get members error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to fetch organization members",
      });
    }
  };

  export const changeMemberRole = async (
    req: Request,
    res: Response
  ) => {
    try {
        const rawId = req.params.id;

        const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const { role } = req.body;
      const organizationId = req.user?.organizationId;
  
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access denied",
        });
      }
  
      if (!["manager", "member"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Member ID is required",
        });
      }
  
        const updatedMember = await updateMemberRole(
        id,
        organizationId,
        role
        );
  
      if (!updatedMember) {
        return res.status(404).json({
          success: false,
          message: "Member not found in your organization",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        data: updatedMember,
      });
    } catch (error) {
      console.error("Update member role error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to update member role",
      });
    }
  };
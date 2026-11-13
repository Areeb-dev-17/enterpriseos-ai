import type { Request, Response, NextFunction } from "express";
import { askAI } from "../services/ai.service.js";

export const askAIController = async(
    req:Request,
    res:Response,
    next: NextFunction
)=>{
    try{
        const {userId,organizationId} = req.user
        const { question } = req.body;
        if (
            typeof question !== "string" ||
            question.trim().length < 3 ||
            question.length > 1000
          ) {
            return res.status(400).json({
              success: false,
              message: "Question must be between 3 and 1000 characters",
            });
          }
      
          const result = await askAI({
            question: question.trim(),
            userId,
            organizationId,
          });

          return res.status(200).json({
            success: true,
            data: result,
          });
      
    }
    catch(error){
        next(error)
    }
}
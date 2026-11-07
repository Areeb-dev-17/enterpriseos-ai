
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  Building2,
} from "lucide-react";

import AuthTabs from "./AuthTabs";

const makeSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function AuthForm({ onSubmit }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");

  const isSignup = mode === "signup";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    setError("");
    setLoading(true);
  
    const submittedMode = mode;
  
    try {
      const payload =
        submittedMode === "signup"
          ? {
              mode: submittedMode,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              organizationName: organizationName.trim(),
            }
          : {
              mode: submittedMode,
              email: email.trim().toLowerCase(),
              password,
            };
  
      await onSubmit(payload);
  
      if (submittedMode === "signup") {
        // Clear signup form
        setName("");
        setEmail("");
        setPassword("");
        setOrganizationName("");
  
        // Switch to login
        setMode("login");
        setShowPassword(false);
      }
      if(submittedMode === 'login')
      {
        setName("");
        setEmail("");
      }
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="mobile-brand">
        <LockKeyhole size={18} />
        <span>
          EnterpriseOS <span className="brand-ai">AI</span>
        </span>
      </div>

      <div className="form-heading">
        <span className="form-kicker">
          {isSignup ? "GET STARTED" : "WELCOME BACK"}
        </span>

        <h2>
          {isSignup ? "Create your account" : "Welcome back."}
        </h2>

        <p>
          {isSignup
            ? "Set up your organization and bring intelligence to your operations."
            : "Sign in to access your business workspace."}
        </p>
      </div>

      <AuthTabs mode={mode} onModeChange={changeMode} />

      <form onSubmit={handleSubmit}>
        {/* Full name — Signup only */}
        <div
          className={`conditional-slot name-slot ${
            isSignup ? "is-visible" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {isSignup && (
              <motion.div
                className="field-group animated-field"
                key="signup-name"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
              >
                <label htmlFor="name">Full name</label>

                <div className="input-wrap">
                  <UserRound size={17} aria-hidden="true" />

                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required={isSignup}
                    disabled={!isSignup}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Organization name — Signup only */}
        <div
          className={`conditional-slot organization-slot ${
            isSignup ? "is-visible" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {isSignup && (
              <motion.div
                className="field-group animated-field"
                key="organization-name"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
              >
                <label htmlFor="organizationName">
                  Organization name
                </label>

                <div className="input-wrap">
                  <Building2 size={17} aria-hidden="true" />

                  <input
                    id="organizationName"
                    name="organizationName"
                    autoComplete="organization"
                    placeholder="e.g. Acme Retail"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    required={isSignup}
                    disabled={!isSignup}
                  />
                </div>

                {organizationName.trim() && (
                  <p className="slug-preview">
                    Organization workspace:{" "}
                    {makeSlug(organizationName) || "—"}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Organization workspace — Login only */}
        {/* <div
          className={`conditional-slot workspace-slot ${
            !isSignup ? "is-visible" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {!isSignup && (
              <motion.div
                className="field-group animated-field"
                key="workspace-slug"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
              >
                <label htmlFor="organizationSlug">
                  Organization workspace
                </label>

                <div className="input-wrap">
                  <Building2 size={17} aria-hidden="true" />

                  <input
                    id="organizationSlug"
                    name="organizationSlug"
                    placeholder="e.g. acme-retail"
                    autoComplete="organization"
                    value={organizationSlug}
                    onChange={(event) =>
                      setOrganizationSlug(event.target.value)
                    }
                    required={!isSignup}
                    disabled={isSignup}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div> */}

        {/* Email */}
        <div className="field-group">
          <label htmlFor="email">Work email</label>

          <div className="input-wrap">
            <Mail size={17} aria-hidden="true" />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="field-group">
          <label htmlFor="password">Password</label>

          <div className="input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                isSignup ? "new-password" : "current-password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
        </div>

        {/* Login options */}
        <div
          className={`conditional-slot options-slot ${
            isSignup ? "is-hidden" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {!isSignup && (
              <motion.div
                className="form-options animated-field"
                key="login-options"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <label className="remember-option">
                  <input type="checkbox" name="rememberMe" />
                  <span>Remember me</span>
                </label>

                <button className="text-link" type="button">
                  Forgot password?
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="submit-button"
          type="submit"
          disabled={loading}
        >
          <span>
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Sign in to workspace"}
          </span>

          {!loading && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </form>

      <div className="form-divider">
        <span />
        <small>SECURE ACCESS</small>
        <span />
      </div>

      <p className="security-note">
        <LockKeyhole size={14} aria-hidden="true" />
        <span>
          Your workspace is protected with secure authentication.
        </span>
      </p>

      <p className="switch-prompt">
        {isSignup
          ? "Already have an account? "
          : "New to EnterpriseOS AI? "}

        <button
          type="button"
          onClick={() => changeMode(isSignup ? "login" : "signup")}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

export default AuthForm;

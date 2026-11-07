
function AuthTabs({ mode, onModeChange }) {
    return (
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => onModeChange("login")}
        >
          Sign in
        </button>
  
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => onModeChange("signup")}
        >
          Create account
        </button>
      </div>
    );
  }
  
  export default AuthTabs;
  
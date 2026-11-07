
import AuthVisual from "../components/AuthVisual";
import AuthForm from "../components/AuthForm";
import { logIn, signUp } from "../services/authService";
import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../../../App.css";

function AuthPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const handleAuthSubmit = async (data) => {
    if (data.mode === "signup") {
      await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
      });

      setToast("Account created successfully!");
      return;
    }

    const result = await logIn({
      email: data.email,
      password: data.password,
    });

    console.log('result',result)

    //Store authentication session
    localStorage.setItem("accessToken", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    localStorage.setItem(
      "organization",
      JSON.stringify(result.organization)
    );

    setToast("Login successful!");

    // Navigate after showing success toast
    setTimeout(() => {
      navigate("/dashboard");
    }, 900);
  };

  useEffect(() => {
    if (!toast) return;
  
    const timer = setTimeout(() => {
      setToast("");
    }, 3000);
  
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <main className="auth-page">
      {toast && (
        <div className="success-toast" role="status">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">✦</span>
          <span>
            EnterpriseOS<span className="brand-ai"> AI</span>
          </span>
        </a>

        <span className="topbar-caption">
          INTELLIGENCE FOR MODERN BUSINESS
        </span>
      </header>

      <section className="auth-layout">
        <AuthVisual />

        <div className="form-panel">
          <AuthForm onSubmit={handleAuthSubmit} />
        </div>
      </section>

      <footer className="page-footer">
        <span>© 2026 EnterpriseOS AI</span>
        <span>BUILT FOR THE INTELLIGENT ENTERPRISE</span>
      </footer>
    </main>
  );
}

export default AuthPage;

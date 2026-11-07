
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

function AuthVisual() {
  return (
    <section className="visual-panel">
      <div className="visual-content">
        <div className="eyebrow">
          <span className="status-dot" />
          THE FUTURE OF OPERATIONS
        </div>

        <div className="orb-stage">
          <div className="orb-orbit orbit-one" />
          <div className="orb-orbit orbit-two" />
          <div className="orb-orbit orbit-three" />

          <motion.div
            className="ai-orb"
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.035, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="orb-core" />
            <div className="orb-shine" />
          </motion.div>

          <div className="orb-label">
            <Sparkles size={14} />
            <span>INTELLIGENCE ENGINE</span>
          </div>
        </div>

        <div className="visual-copy">
          <h1>
            Your business.
            <br />
            <span>In a new light.</span>
          </h1>

          <p>
            Connect your operations, uncover insights, and turn
            business intelligence into meaningful action.
          </p>
        </div>

        <div className="visual-footer">
          <span>01 — THINK SMARTER</span>
          <span>02 — ACT FASTER</span>
          <span>03 — GROW FURTHER</span>
        </div>
      </div>
    </section>
  );
}

export default AuthVisual;

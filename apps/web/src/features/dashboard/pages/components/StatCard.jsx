
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  trend = "up",
}) {
  const isPositive = trend === "up";

  return (
    <article className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>

        {Icon && (
          <div className="stat-card-icon">
            <Icon size={19} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="stat-card-value">{value}</div>

      <div className="stat-card-footer">
        {change && (
          <span
            className={`stat-card-change ${
              isPositive ? "positive" : "negative"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {change}
          </span>
        )}

        {description && (
          <span className="stat-card-description">{description}</span>
        )}
      </div>
    </article>
  );
}

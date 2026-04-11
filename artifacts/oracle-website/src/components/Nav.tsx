import { Link } from "wouter";

interface NavProps {
  current: "home" | "privacy" | "support";
}

export function Nav({ current }: NavProps) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href={`${base}/`} className="nav-logo">
          <span className="logo-symbol">◈</span>
          The Oracle
        </a>
        <ul className="nav-links">
          <li>
            <a href={`${base}/`} className={current === "home" ? "active" : ""}>
              Home
            </a>
          </li>
          <li>
            <a href={`${base}/#features`}>Features</a>
          </li>
          <li>
            <a href={`${base}/#how-it-works`}>How It Works</a>
          </li>
          <li>
            <a href={`${base}/support`} className={current === "support" ? "active" : ""}>
              Support
            </a>
          </li>
          <li>
            <a href={`${base}/privacy`} className={current === "privacy" ? "active" : ""}>
              Privacy
            </a>
          </li>
          <li>
            <a href="#appstore" className="nav-cta">Download</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

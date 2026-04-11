export function Footer() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">◈ The Oracle</span>
            <p className="footer-tagline">
              Ancient wisdom, illuminated by modern AI. Discover what your body has always known.
            </p>
          </div>

          <div className="footer-nav-group">
            <h4>App</h4>
            <ul>
              <li><a href="#appstore">Download on iOS</a></li>
              <li><a href={`${base}/#features`}>Features</a></li>
              <li><a href={`${base}/#how-it-works`}>How It Works</a></li>
              <li><a href={`${base}/#testimonials`}>Testimonials</a></li>
            </ul>
          </div>

          <div className="footer-nav-group">
            <h4>Company</h4>
            <ul>
              <li><a href={`${base}/support`}>Support</a></li>
              <li><a href={`${base}/privacy`}>Privacy Policy</a></li>
              <li><a href="mailto:privacy@theoracleapp.com">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} The Oracle. All rights reserved. For entertainment and reflective purposes.
          </p>
          <div className="footer-links">
            <a href={`${base}/privacy`}>Privacy Policy</a>
            <a href={`${base}/support`}>Support</a>
            <a href="mailto:privacy@theoracleapp.com">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import "../styles.css";
import { StarsBg } from "../components/StarsBg";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <StarsBg />
      <Nav current="home" />

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Ancient Wisdom · Modern Technology</span>
          <h1 className="hero-title">The Oracle</h1>
          <p className="hero-tagline">
            Discover the secrets written in your hands, eyes, and face. Personalised readings powered by AI — anytime, anywhere.
          </p>
          <div className="hero-cta-group">
            <a href="#appstore" className="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on the App Store
            </a>
            <span className="hero-badge">Free to try · iOS 16+ required</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Three Ancient Arts</span>
            <h2 className="section-title">Read Your Destiny</h2>
            <p className="section-subtitle">
              The Oracle combines three ancient traditions of body-based divination, each offering a unique window into your path.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 1 1 3 0m-3 6a1.5 1.5 0 0 0 3 0m0 0V8.5a1.5 1.5 0 1 1 3 0V14m-3-5.5a1.5 1.5 0 0 1 3 0m0 0v2m0-2a1.5 1.5 0 0 1 3 0V14" />
                </svg>
              </div>
              <h3 className="feature-title">Palm Reading</h3>
              <p className="feature-desc">
                Your hand holds the map of your life. The Oracle analyses the major and minor lines in your palm — heart, head, life, and fate — to reveal your emotional depths, intellectual path, vitality, and destiny.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <h3 className="feature-title">Iris Reading</h3>
              <p className="feature-desc">
                The iris is a mirror of the soul. Through iridology, The Oracle studies the unique patterns, colours, and markings in your iris to illuminate your constitution, energy reserves, and innate sensitivities.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h3 className="feature-title">Face Reading</h3>
              <p className="feature-desc">
                Ancient Chinese face reading, or Mian Xiang, reveals character and fortune through facial features. The Oracle interprets the proportions, shapes, and markings of your face with centuries of accumulated wisdom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Simple & Profound</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps stand between you and a reading that spans centuries of mystical tradition.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number">I</div>
              <h3 className="step-title">Choose Your Reading</h3>
              <p className="step-desc">
                Select from palm, iris, or face reading — or try all three for a complete Oracle experience. Each reading type offers its own unique insights.
              </p>
            </div>

            <div className="step">
              <div className="step-number">II</div>
              <h3 className="step-title">Capture Your Image</h3>
              <p className="step-desc">
                Use your phone camera to take a clear, well-lit photo. The Oracle guides you on the optimal angle and lighting for each reading type. Your photo is processed securely and never stored.
              </p>
            </div>

            <div className="step">
              <div className="step-number">III</div>
              <h3 className="step-title">Receive Your Wisdom</h3>
              <p className="step-desc">
                Within moments, receive a personalised, richly detailed reading grounded in traditional interpretation and surfaced by our AI. Save, share, or revisit your readings at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Voices from the Seekers</span>
            <h2 className="section-title">What Others Have Found</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">
                "I was sceptical at first, but my palm reading described my creative block and the need to embrace uncertainty — exactly where I am in life right now. The detail was uncanny."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">S</div>
                <div>
                  <div className="testimonial-name">Sophia R.</div>
                  <div className="testimonial-location">London, UK</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">
                "The iris reading identified my tendency toward anxiety and suggested I nurture my nervous system. It felt like talking to a wise elder who truly saw me. I keep coming back."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">M</div>
                <div>
                  <div className="testimonial-name">Marcus T.</div>
                  <div className="testimonial-location">New York, USA</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">
                "The face reading captured personality traits I've never told anyone. My friends who tried it were equally amazed. This is my go-to app for reflection and self-understanding."
              </p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">A</div>
                <div>
                  <div className="testimonial-name">Aiko N.</div>
                  <div className="testimonial-location">Tokyo, Japan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Begin Your Journey</h2>
          <p className="cta-subtitle">
            The answers you seek are closer than you think. Let The Oracle guide the way.
          </p>
          <a href="#appstore" className="appstore-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{color: '#c9a84c'}}>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div>
              <span className="appstore-badge-text-top">Download on the</span>
              <span className="appstore-badge-text-main">App Store</span>
            </div>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

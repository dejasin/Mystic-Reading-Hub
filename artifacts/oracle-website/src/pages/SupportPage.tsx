import "../styles.css";
import { useState } from "react";
import { StarsBg } from "../components/StarsBg";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

const faqs = [
  {
    question: "How do I take a good photo for my reading?",
    answer: "For the best results: use natural daylight or a bright, even light source. Hold your hand flat against a light background for palm readings; look straight into the camera in a well-lit room for iris and face readings. Avoid harsh shadows, heavy filters, or backlit conditions. The Oracle will provide in-app guidance for each reading type before you capture your image."
  },
  {
    question: "Is my photo stored on your servers?",
    answer: "No. Your photos are transmitted securely for analysis and discarded immediately after your reading is generated. We do not retain, store, or sell your images. Once the AI has produced your reading and the result is returned to your device, the image is permanently deleted from our processing pipeline. Please see our Privacy Policy for full details."
  },
  {
    question: "My reading doesn't seem to reflect me — what should I do?",
    answer: "Reading accuracy improves greatly with clear, well-lit, high-resolution images. If your reading feels off, try retaking the photo in better lighting with your subject in sharp focus. Keep in mind that these readings are interpretive and holistic in nature — they reflect tendencies and potentials rather than fixed facts. If you remain unsatisfied, you're welcome to contact us and we'll be happy to help."
  },
  {
    question: "How do I manage or cancel my subscription?",
    answer: "Your subscription is managed through Apple's App Store. To cancel, open the Settings app on your iPhone, tap your name at the top, then go to Subscriptions. Find The Oracle and select Cancel Subscription. Changes take effect at the end of your current billing period. We do not process subscription payments directly, so any billing questions should be directed to Apple Support."
  },
  {
    question: "Which types of readings are available?",
    answer: "The Oracle offers three reading types: Palm Reading (palmistry), which analyses the major and minor lines of your hand to explore your life path, emotions, and destiny; Iris Reading (iridology), which studies the patterns and colours of your iris to illuminate your constitution and sensitivities; and Face Reading (Mian Xiang / physiognomy), which interprets facial features according to centuries of Chinese and Western tradition. Each reading type provides a unique and complementary perspective."
  },
  {
    question: "The app crashed or a feature isn't working — how do I get help?",
    answer: "We're sorry to hear you're experiencing an issue. First, try closing the App fully and reopening it, or restart your device. Ensure your iOS version and the App are both up to date. If the problem persists, please contact us via the form below, describing the issue in as much detail as possible (the reading type you were attempting, what happened, and your device model). We aim to respond within 1–2 business days."
  }
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button
        className={`faq-question${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <svg className="faq-chevron" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 8.5-7 7-7-7" />
        </svg>
      </button>
      <div className={`faq-answer${open ? " open" : ""}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="page-wrapper">
      <StarsBg />
      <Nav current="support" />

      <div className="container-narrow" style={{paddingTop: '2rem', paddingBottom: '5rem'}}>
        <div className="page-hero">
          <h1 className="page-hero-title">Support Centre</h1>
          <p className="page-hero-subtitle">Find answers and get in touch with our team.</p>
        </div>

        <div className="section-header" style={{textAlign: 'left', marginBottom: '2rem'}}>
          <span className="section-eyebrow">Frequently Asked Questions</span>
          <h2 className="section-title" style={{fontSize: '1.8rem'}}>Common Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="contact-section">
          <h2>Contact Us</h2>
          <p className="contact-subtitle">
            Didn't find what you were looking for? Send us a message and we'll get back to you within 1–2 business days.
          </p>

          <form
            action="mailto:privacy@theoracleapp.com"
            method="post"
            encType="text/plain"
            onSubmit={(e) => {
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement)?.value || '';
              const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
              const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '';
              const subject = encodeURIComponent(`Oracle App Support — ${name}`);
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
              window.location.href = `mailto:privacy@theoracleapp.com?subject=${subject}&body=${body}`;
              e.preventDefault();
            }}
          >
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Jane Smith"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="jane@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                name="message"
                className="form-textarea"
                placeholder="Please describe your question or issue in as much detail as possible..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Send Message
            </button>

            <p className="form-note">
              Your message will open in your default email client. Alternatively, you can email us directly at{" "}
              <a href="mailto:privacy@theoracleapp.com" style={{color: 'var(--gold)'}}>
                privacy@theoracleapp.com
              </a>
            </p>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

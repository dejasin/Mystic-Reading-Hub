import "../styles.css";
import { StarsBg } from "../components/StarsBg";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="page-wrapper">
      <StarsBg />
      <Nav current="privacy" />

      <div className="container-narrow" style={{paddingTop: '2rem', paddingBottom: '5rem'}}>
        <div className="page-hero">
          <h1 className="page-hero-title">Privacy Policy</h1>
          <p className="page-hero-subtitle">Your trust is the foundation of everything we do.</p>
        </div>

        <div className="prose">
          <span className="effective-date">Effective Date: January 1, 2025</span>

          <p>
            Welcome to The Oracle ("we", "our", or "us"). This Privacy Policy explains how we collect, use, and protect information when you use The Oracle mobile application (the "App"). By using the App, you agree to the practices described in this policy.
          </p>
          <p>
            We take your privacy seriously — especially when it involves sensitive data such as photographs of your face, eyes, and hands. Please read this policy carefully.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Information You Provide</h3>
          <p>
            When you use the App, you voluntarily provide photographs and images for the purpose of generating personalised readings. Specifically:
          </p>
          <ul>
            <li><strong>Palm images:</strong> Photos of your hand or palm, used to analyse lines and features for palmistry readings.</li>
            <li><strong>Iris images:</strong> Close-up photos of your eye, used to analyse iris patterns for iridology readings.</li>
            <li><strong>Face images:</strong> Photos of your face, used to analyse facial features for physiognomy readings.</li>
          </ul>
          <p>
            You may also provide optional account information (such as a display name) if you create an account within the App.
          </p>

          <h3>1.2 Automatically Collected Information</h3>
          <p>
            We may automatically collect certain technical information, including:
          </p>
          <ul>
            <li>Device type, operating system version, and App version</li>
            <li>Crash reports and diagnostic data (collected via Apple's standard frameworks)</li>
            <li>General, non-identifiable usage patterns (e.g. which reading types are most used)</li>
          </ul>
          <p>
            We do not collect precise geolocation data. We do not use advertising SDKs or behavioural tracking tools.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information collected solely to operate and improve the App:</p>
          <ul>
            <li><strong>To generate readings:</strong> Images you submit are sent to our AI processing pipeline to produce your palmistry, iridology, or face reading.</li>
            <li><strong>To provide and improve the service:</strong> We use anonymised, aggregated usage data to understand how to make the App better.</li>
            <li><strong>To ensure security and prevent abuse:</strong> We monitor for fraud, abuse, and technical issues.</li>
            <li><strong>To communicate with you:</strong> If you contact us for support, we use the information you provide solely to respond to your inquiry.</li>
          </ul>
          <p>We do not use your data for advertising, profiling, or sale to third parties.</p>

          <h2>3. Photo &amp; Biometric Data Handling</h2>

          <h3>3.1 Transient Processing Only</h3>
          <p>
            <strong>We do not store the photographs or images you submit for readings.</strong> When you submit a photo, it is transmitted securely (via HTTPS/TLS) to our AI processing service for analysis. Once the reading is generated and returned to your device, the image is discarded from our servers. We do not retain copies of your photos in any persistent storage or database.
          </p>

          <h3>3.2 Biometric Identifiers</h3>
          <p>
            The images you submit (palm, iris, face) may constitute biometric information under certain privacy laws. We do not derive or store biometric identifiers (such as facial recognition templates, fingerprint mappings, or iris codes) from your images. The analysis performed is descriptive in nature (e.g. line patterns, colour observations) and is not used to uniquely identify you as an individual.
          </p>

          <h3>3.3 On-Device Processing</h3>
          <p>
            Where technically possible, preliminary image processing (such as crop guidance and quality checks) is performed on-device and the processed image is transmitted rather than the raw photo. No raw image data is cached outside your device.
          </p>

          <h2>4. Third-Party Services</h2>

          <h3>4.1 Anthropic</h3>
          <p>
            The Oracle uses the Anthropic Claude API to power AI-generated readings. When you submit an image for a reading, that image (along with a textual prompt) is transmitted to Anthropic's servers for processing. Anthropic processes this data in accordance with their own privacy policy and API usage terms. Anthropic does not use API inputs to train their models without explicit consent. We encourage you to review Anthropic's Privacy Policy at <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>.
          </p>

          <h3>4.2 Apple</h3>
          <p>
            The App is distributed via the Apple App Store and uses standard Apple frameworks. Apple may collect certain information in accordance with their own privacy policy. This includes App Store analytics and crash report data submitted through Apple's platform. Please refer to Apple's Privacy Policy at <a href="https://www.apple.com/privacy" target="_blank" rel="noopener noreferrer">apple.com/privacy</a> for details.
          </p>

          <h3>4.3 RevenueCat</h3>
          <p>
            We use RevenueCat to manage in-app purchases and subscriptions. RevenueCat may collect device identifiers and purchase transaction data for the purpose of subscription management. No photos or biometric data are shared with RevenueCat. See RevenueCat's privacy policy at <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">revenuecat.com/privacy</a>.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            As described above, image data submitted for readings is not retained after processing. Reading results (the text of your reading) may be stored locally on your device within the App, and may optionally be stored in your account if you have created one, so that you can review past readings. You may delete individual readings or your entire account at any time through the App's settings.
          </p>
          <p>
            Anonymised usage and diagnostic data may be retained for up to 12 months to help us identify trends and technical issues, after which it is deleted or further anonymised.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights with respect to your personal data:
          </p>
          <ul>
            <li><strong>Access:</strong> Request a copy of personal data we hold about you.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate personal data.</li>
            <li><strong>Portability:</strong> Request an export of your data in a portable format.</li>
            <li><strong>Objection:</strong> Object to certain processing of your data.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at <a href="mailto:privacy@theoracleapp.com">privacy@theoracleapp.com</a>. We will respond within 30 days. Please note that because we do not retain your image data after processing, we cannot retrieve or delete image data that was submitted in past sessions.
          </p>

          <h2>7. Children's Privacy</h2>
          <p>
            The Oracle is not intended for use by children under the age of 13 (or under the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately at <a href="mailto:privacy@theoracleapp.com">privacy@theoracleapp.com</a> and we will take steps to delete such information.
          </p>

          <h2>8. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including TLS encryption for all data transmitted between the App and our servers. However, no method of transmission over the internet or electronic storage is 100% secure. We encourage you to use the App on trusted networks.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. If we make material changes, we will notify you by updating the effective date at the top of this policy and, where appropriate, by in-app notification. Your continued use of the App after such changes constitutes acceptance of the updated policy.
          </p>

          <h2>10. Contact Information</h2>
          <p>
            If you have questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:privacy@theoracleapp.com">privacy@theoracleapp.com</a>
          </p>
          <p>
            We take privacy concerns seriously and will respond promptly to all inquiries.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

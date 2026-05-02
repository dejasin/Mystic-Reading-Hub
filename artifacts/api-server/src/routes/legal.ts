import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const htmlPage = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — The Oracle</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #0d0c14;
      color: #e8e0cc;
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 24px 80px;
      line-height: 1.8;
    }
    h1 {
      font-family: serif;
      font-size: 2rem;
      color: #c9a84c;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 1.15rem;
      color: #c9a84c;
      margin-top: 2.5rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.02em;
    }
    p, li { font-size: 1rem; opacity: 0.9; margin-bottom: 0.75rem; }
    ul { padding-left: 1.5rem; }
    a { color: #c9a84c; }
    .subtitle { font-style: italic; opacity: 0.6; margin-bottom: 3rem; }
    .divider { color: #c9a84c; opacity: 0.4; text-align: center; margin: 2rem 0; letter-spacing: 0.4em; }
  </style>
</head>
<body>
  <h1>The Oracle</h1>
  <p class="subtitle">${title}</p>
  <div class="divider">─── ✦ ───</div>
  ${body}
</body>
</html>`;

router.get("/privacy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(htmlPage("Privacy Policy", `
    <p><strong>Effective date:</strong> March 26, 2026</p>

    <h2>1. Who We Are</h2>
    <p>The Oracle is a mobile application that acts as a personal AI life advisor, generating personalised guidance from palm imagery and birth-data inputs you provide. References to "we", "us", or "our" refer to the developers and operators of The Oracle app.</p>

    <h2>2. What Information We Collect</h2>
    <ul>
      <li><strong>Images you provide.</strong> When you begin a reading, you may submit photographs of your palm, iris, or face. These images are transmitted securely to our AI analysis service solely to generate your reading and are never stored on our servers beyond the duration of your session. We do not retain, share, or sell your images.</li>
      <li><strong>Profile data stored on your device.</strong> Any reading profiles you save (names, dates of birth, and reading results) are stored locally on your device only. We do not have access to this data.</li>
      <li><strong>Purchase information.</strong> In-app purchases are processed through Apple's App Store. We use RevenueCat to verify your purchase entitlements. RevenueCat may associate your purchase record with your Apple ID or an anonymous identifier for the purpose of restoring purchases across devices. RevenueCat's privacy policy is available at <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a>.</li>
      <li><strong>Usage and analytics.</strong> We collect anonymous, non-personally-identifiable usage analytics to understand how the app is used and to improve the experience. This includes events such as which screens are viewed, which features are used, and aggregate conversion metrics. No names, dates of birth, photos, or other personally identifiable information is included in analytics data. Each device is assigned a random anonymous identifier that cannot be linked back to you. You may opt out of analytics collection by disabling network access for the app.</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <ul>
      <li>To generate your Oracle reading in response to a direct request.</li>
      <li>To verify that you have an active purchase entitlement when you request paid content.</li>
    </ul>
    <p>We do not use your information for advertising, sell it to third parties, or share it with any party other than those described in this policy.</p>

    <h2>4. Image Transmission and AI Processing</h2>
    <p>Images you submit are sent over an encrypted HTTPS connection to our backend server, which forwards them to Anthropic's Claude API for visual analysis. Anthropic processes these images in accordance with their own privacy and data handling policies, available at <a href="https://www.anthropic.com/privacy">anthropic.com/privacy</a>. We do not store the images on our servers after the analysis response is returned.</p>

    <h2>5. Data Retention</h2>
    <p>Because we do not store your images or personal data on our servers, there is no long-term retention of your reading inputs. Your session data (such as a temporary session ID used to link your reading request to the continuation request) is held only in server memory for the duration of your session and is discarded when the session ends or the server restarts.</p>

    <h2>6. Your Rights</h2>
    <p>Because we do not store identifiable personal data on our servers, there is no personal data record for us to access, modify, or delete on your behalf. If you wish to remove locally saved profiles, you can do so within the app or by deleting the app from your device.</p>

    <h2>7. Children</h2>
    <p>The Oracle is not directed at children under the age of 13. We do not knowingly collect information from children.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. The effective date at the top of this page will reflect when changes were last made. Continued use of the app after any update constitutes acceptance of the revised policy.</p>

    <h2>9. Contact</h2>
    <p>If you have questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:privacy@theoracle.app">privacy@theoracle.app</a></p>
  `));
});

router.get("/terms", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(htmlPage("Terms of Use", `
    <p><strong>Effective date:</strong> March 26, 2026</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By downloading, installing, or using The Oracle app, you agree to be bound by these Terms of Use. If you do not agree, do not use the app.</p>

    <h2>2. Description of Service</h2>
    <p>The Oracle is an entertainment application that generates readings based on images and personal data you provide, drawing on symbolic systems including palmistry, facial analysis, numerology, and archetypal psychology. The readings are provided for entertainment and personal reflection purposes only. They do not constitute professional advice of any kind — medical, legal, financial, psychological, or otherwise.</p>

    <h2>3. In-App Purchases</h2>
    <ul>
      <li>Certain content within The Oracle requires a one-time purchase ("Full Reading").</li>
      <li>All purchases are processed through the Apple App Store and are subject to Apple's payment terms.</li>
      <li>You may restore a previous purchase using the "Restore Purchase" option in the app if you reinstall the app or switch to a new device.</li>
      <li>All sales are final except where required by applicable law or Apple's standard refund policy.</li>
    </ul>

    <h2>4. User Conduct</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use the app for any unlawful purpose.</li>
      <li>Attempt to reverse engineer, decompile, or extract source code from the app.</li>
      <li>Submit images of other individuals without their consent.</li>
    </ul>

    <h2>5. Disclaimer of Warranties</h2>
    <p>The Oracle is provided "as is" without warranties of any kind, express or implied. We do not warrant that the app will be error-free, uninterrupted, or that any reading will be accurate, meaningful, or suited to your particular circumstances. The readings are generated by an artificial intelligence and are entirely for entertainment purposes.</p>

    <h2>6. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app, even if advised of the possibility of such damages.</p>

    <h2>7. Intellectual Property</h2>
    <p>All content, design, and software within The Oracle app is the property of its developers and is protected by applicable intellectual property laws. You may not reproduce or distribute any part of the app without our express written permission.</p>

    <h2>8. Changes to These Terms</h2>
    <p>We reserve the right to update these Terms of Use at any time. The effective date at the top of this page indicates when the terms were last revised. Continued use of the app constitutes acceptance of the updated terms.</p>

    <h2>9. Governing Law</h2>
    <p>These terms are governed by applicable law without regard to conflict of law principles.</p>

    <h2>10. Contact</h2>
    <p>For questions about these Terms of Use, please contact us at: <a href="mailto:legal@theoracle.app">legal@theoracle.app</a></p>
  `));
});

export default router;

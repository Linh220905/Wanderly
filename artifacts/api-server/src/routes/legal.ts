import { Router, type Request, type Response } from "express";

const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wanderly - Privacy Policy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 24px 16px; background-color: #071B1C; color: #F1F5F9; }
    h1, h2, h3 { color: #FC5200; }
    .card { background: #0F2D2F; padding: 24px; border-radius: 12px; border: 1px solid #1E4446; margin-bottom: 24px; }
    a { color: #FC5200; }
    p, li { color: #CBD5E1; }
  </style>
</head>
<body>
  <h1>Wanderly - Privacy Policy</h1>
  <p><strong>Last updated:</strong> September 2026</p>

  <div class="card">
    <h2>1. Information We Collect</h2>
    <p>Wanderly collects location data when you use the app to track your outdoor exploration journeys, calculate distance, and reveal fog of war on the map.</p>
    <ul>
      <li><strong>Location Data:</strong> Foreground and background location coordinates while active sessions are running.</li>
      <li><strong>Exploration Metrics:</strong> Distance traveled, duration, speed, checkpoints discovered, and level progress.</li>
      <li><strong>Account Details:</strong> Display name and authentication provider if you choose to sign in.</li>
    </ul>
  </div>

  <div class="card">
    <h2>2. How We Use Your Data</h2>
    <p>We use the collected information solely to provide, maintain, and gamify your exploration experience:</p>
    <ul>
      <li>Drawing your personal fog of war map and calculating explored territory percentage.</li>
      <li>Awarding XP, coins, streak days, and achievement badges.</li>
      <li>Backing up your adventure progress securely across your devices.</li>
    </ul>
  </div>

  <div class="card">
    <h2>3. Data Deletion & Privacy Controls</h2>
    <p>You have full control over your data. You can export or permanently delete your account and all associated GPS records directly inside the app settings under <em>Profile &gt; Delete Account</em>.</p>
  </div>

  <div class="card">
    <h2>4. Contact Us</h2>
    <p>If you have any questions regarding this Privacy Policy, please contact our support team at <a href="mailto:support@wanderly.app">support@wanderly.app</a>.</p>
  </div>
</body>
</html>`;

const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wanderly - Terms of Service</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 24px 16px; background-color: #071B1C; color: #F1F5F9; }
    h1, h2, h3 { color: #FC5200; }
    .card { background: #0F2D2F; padding: 24px; border-radius: 12px; border: 1px solid #1E4446; margin-bottom: 24px; }
    a { color: #FC5200; }
    p, li { color: #CBD5E1; }
  </style>
</head>
<body>
  <h1>Wanderly - Terms of Service</h1>
  <p><strong>Last updated:</strong> September 2026</p>

  <div class="card">
    <h2>1. Outdoor Exploration & Safety</h2>
    <p>Wanderly is designed to encourage outdoor walking, running, and exploration. Always remain aware of your surroundings, adhere to traffic laws, avoid hazardous areas, and respect private property boundaries while exploring.</p>
  </div>

  <div class="card">
    <h2>2. Subscription & Premium Access</h2>
    <p>Wanderly offers optional Premium subscriptions. Subscriptions are billed and managed via Apple App Store / Google Play and will auto-renew unless cancelled at least 24 hours prior to the end of the billing period.</p>
  </div>

  <div class="card">
    <h2>3. Contact</h2>
    <p>For inquiries regarding these Terms, contact <a href="mailto:support@wanderly.app">support@wanderly.app</a>.</p>
  </div>
</body>
</html>`;

const legalRouter = Router();

legalRouter.get("/privacy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(privacyHtml);
});

legalRouter.get("/terms", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(termsHtml);
});

export default legalRouter;

import crypto from 'crypto';

const TO_EMAIL  = 'moses.ww@gmail.com';
const SECRET    = process.env.RESET_SECRET || 'usability-lab-reset-secret-2026';
const RESEND_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Generate 8-char uppercase OTP  e.g. "A3F2C1B4"
  const otp     = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expires = Date.now() + 15 * 60 * 1000; // valid for 15 minutes

  // Sign with HMAC so it can be verified later without storage
  const payload = `${otp}:${expires}`;
  const sig     = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const token   = Buffer.from(`${payload}:${sig}`).toString('base64url');

  // Send email via Resend
  let emailSent = false;
  if (RESEND_KEY) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    'Usability Lab <onboarding@resend.dev>',
          to:      [TO_EMAIL],
          subject: '🔑 Admin Panel — Temporary Password',
          html: `
            <div style="font-family: 'Courier New', monospace; max-width: 440px; margin: 0 auto; padding: 32px; background: #0d1117; color: #c9d1d9; border-radius: 12px; border: 1px solid #30363d;">
              <p style="color: #58a6ff; font-size: 13px; letter-spacing: 3px; margin: 0 0 4px;">USABILITY LAB</p>
              <p style="color: #f0f6fc; font-size: 15px; font-weight: 700; letter-spacing: 2px; margin: 0 0 24px;">// ADMIN PASSWORD RESET</p>
              <p style="color: #8b949e; margin: 0 0 16px;">Your one-time temporary password:</p>
              <div style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #3fb950; padding: 20px; background: #161b22; border-radius: 8px; text-align: center; border: 1px solid #30363d; margin-bottom: 20px;">
                ${otp}
              </div>
              <p style="color: #8b949e; font-size: 12px; line-height: 1.6; margin: 0;">
                ⏱ Valid for <strong style="color: #c9d1d9;">15 minutes</strong> only.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      });
      emailSent = emailRes.ok;
    } catch {
      // Email failed — still return token so UI can show status
    }
  }

  return res.status(200).json({
    token,
    emailSent,
    maskedEmail: TO_EMAIL.replace(/(.{2}).+(@.+)/, '$1***$2'),
    // In local dev without RESEND_API_KEY, return OTP directly for testing
    ...((!RESEND_KEY) ? { devOtp: otp } : {}),
  });
}

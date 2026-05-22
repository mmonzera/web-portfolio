import crypto from 'crypto';

const SECRET = process.env.RESET_SECRET || 'usability-lab-reset-secret-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { otp, token } = req.body;

  if (!otp || !token) {
    return res.status(400).json({ error: 'Missing otp or token.' });
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts   = decoded.split(':');

    if (parts.length < 3) throw new Error('Invalid token structure');

    // Hex HMAC has no ':', so the sig is always the last 64 chars (sha256 = 64 hex chars)
    const storedOtp = parts[0];
    const expires   = parseInt(parts[1], 10);
    const sig       = parts.slice(2).join(':');

    // Check expiry
    if (Date.now() > expires) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Verify HMAC signature
    const payload     = `${storedOtp}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    // Verify OTP (case-insensitive)
    if (otp.trim().toUpperCase() !== storedOtp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(400).json({ error: 'Invalid or corrupted token.' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.RAZORPAY_KEY_ID;

  if (!key) {
    return res.status(404).json({
      error: 'Razorpay Key ID not configured. Please add RAZORPAY_KEY_ID to your Vercel environment variables.'
    });
  }

  res.status(200).json({ key });
}

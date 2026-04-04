import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Razorpay Lazy Initialization
  let razorpayInstance: Razorpay | null = null;
  const getRazorpay = () => {
    if (!razorpayInstance) {
      // Fallback to hardcoded keys if environment variables are missing
      const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_SVLkwivB34TWIi";
      const key_secret = process.env.RAZORPAY_KEY_SECRET || "x6ckMkX9JSmTK81lPJx28XEz";
      
      razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    }
    return razorpayInstance;
  };

  // API: Get Razorpay Key
  app.get("/api/payment/key", (req, res) => {
    const key = process.env.RAZORPAY_KEY_ID || "rzp_test_SVLkwivB34TWIi";
    res.json({ key });
  });

  // API: Verify Razorpay Config
  app.get("/api/payment/verify-config", async (req, res) => {
    try {
      const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_SVLkwivB34TWIi";
      const key_secret = process.env.RAZORPAY_KEY_SECRET || "x6ckMkX9JSmTK81lPJx28XEz";
      
      const isHardcoded = !process.env.RAZORPAY_KEY_ID;

      // Try to list payments to verify the key
      const razorpay = getRazorpay();
      await razorpay.payments.all({ count: 1 });
      
      res.json({ 
        status: "ok", 
        message: "Razorpay configuration is valid and working" + (isHardcoded ? " (using hardcoded fallback)." : "."),
        key_id_preview: `${key_id.substring(0, 8)}...`
      });
    } catch (error) {
      console.error("Razorpay Config Verification Error:", error);
      res.status(500).json({ 
        status: "error", 
        message: error instanceof Error ? error.message : "Failed to verify Razorpay configuration" 
      });
    }
  });

  // API: Create Order
  app.post("/api/payment/order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const options = {
        amount: amount * 100, // amount in smallest currency unit (paise for INR)
        currency,
        receipt,
      };

      const order = await getRazorpay().orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create payment order" });
    }
  });

  // API: Verify Payment
  app.post("/api/payment/verify", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        res.json({ status: "ok", message: "Payment verified successfully" });
      } else {
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (error) {
      console.error("Payment Verification Error:", error);
      res.status(500).json({ error: "Internal server error during verification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

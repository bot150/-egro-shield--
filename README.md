# Egro Shield: Weather-Based Income Protection

Egro Shield is a next-generation weather-based income protection platform built specifically for gig workers. It combines real-time weather intelligence, AI-powered risk assessment, and an automated compensation engine to ensure that when the weather forces a worker off the road — they still get paid.

## Features
- **Weather Intelligence:** Real-time monitoring of weather conditions to assess risk.
- **AI Risk Assessment:** Personalized risk scoring for gig workers based on location and profile.
- **Instant Payouts:** Automated compensation system powered by Razorpay.
- **Gig Worker Focused:** Designed specifically for delivery partners and ride-share drivers.

## Setup Instructions for GitHub

### 1. Environment Variables
Do **NOT** commit your actual API keys to GitHub. Instead, set these variables in your deployment platform (e.g., Cloud Run, Vercel, or GitHub Secrets):

- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `RAZORPAY_KEY_ID`: Your Razorpay Test/Live Key ID.
- `RAZORPAY_KEY_SECRET`: Your Razorpay Test/Live Key Secret.
- `VITE_OPENWEATHER_API_KEY`: For location-based weather risk analysis.

### 2. Local Development
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example`.
4. Run `npm run dev`.

### 3. Deployment
This project is configured for **Cloud Run** or **Vercel**. 
- The backend is powered by **Express** (`server.ts`).
- The frontend is built with **React + Vite**.
- **Firestore** is used for the database.

## Razorpay Integration
The app is fully integrated with Razorpay. To test:
1. Use the `rzp_test_...` keys provided in your dashboard.
2. Use the "Success" payment method in the checkout popup.

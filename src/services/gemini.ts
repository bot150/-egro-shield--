//import { GoogleGenAI } from "@google/genai";

//const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function verifyAadhar(aadharNumber: string, base64Image: string, mimeType: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      {
        text: `
          Verify if the Aadhar number "${aadharNumber}" is present and clearly visible in this document.
          Check for:
          1. Exact match of the 12-digit number.
          2. Document authenticity (does it look like an Aadhar card?).
          
          Return a JSON object with:
          "verified" (boolean),
          "confidence" (number 0-1),
          "reason" (string explaining why it passed or failed).
        `
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse verification response", e);
    return { verified: false, confidence: 0, reason: "Verification system error." };
  }
}

export async function verifyBankAccount(accountNumber: string, base64Image: string, mimeType: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      {
        text: `
          Verify if the bank account number "${accountNumber}" is present and clearly visible in this bank document (passbook or cancelled cheque).
          Check for:
          1. Exact match of the account number.
          2. Document authenticity (does it look like a bank document?).
          
          Return a JSON object with:
          "verified" (boolean),
          "confidence" (number 0-1),
          "reason" (string explaining why it passed or failed).
        `
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse bank verification response", e);
    return { verified: false, confidence: 0, reason: "Verification system error." };
  }
}

export async function calculateRiskScore(location: string, weatherData: any) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Analyze the risk for a delivery worker in ${location} based on the following data:
      Weather: ${JSON.stringify(weatherData)}
      
      Provide a risk score from 0 to 100 and a suggested weekly premium in INR (30, 50, or 70).
      Return the result as a JSON object with keys: "score" (number), "premium" (number), and "reasoning" (string).
    `,
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { score: 50, premium: 50, reasoning: "Default risk assessment due to analysis failure." };
  }
}

export async function getRiskInsights(riskScore: number, category: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      As a risk analyst for ErgoShield, explain why a ${category} delivery worker has a risk score of ${riskScore}/100.
      Provide 3 actionable safety tips for this worker.
      Return the result as a JSON object with keys: "explanation" (string) and "tips" (array of strings).
    `,
    config: {
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { 
      explanation: "Your risk score is calculated based on historical disruption data and your delivery category.",
      tips: ["Stay alert during peak hours", "Check weather updates regularly", "Maintain your vehicle"]
    };
  }
}

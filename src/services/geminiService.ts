import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AadharData {
  aadharNumber: string;
  dob: string; // YYYY-MM-DD
  fullName: string;
}

export interface BankData {
  ifscCode: string;
  accountNumber: string;
}

export const extractAadharData = async (base64Image: string, mimeType: string): Promise<AadharData> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: "Extract the Aadhar Number (12 digits), Full Name, and Date of Birth (DOB) from this Aadhar card. Return as JSON.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aadharNumber: { type: Type.STRING },
          dob: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
          fullName: { type: Type.STRING },
        },
        required: ["aadharNumber", "dob", "fullName"],
      },
    },
  });

  return JSON.parse(response.text);
};

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  summary: string;
}

export const getAIRiskAssessment = async (userData: any, weatherData: any): Promise<RiskAssessment> => {
  const prompt = `Assess the insurance risk for a gig worker with the following data:
  User Data: ${JSON.stringify(userData)}
  Current Weather/Environmental Data: ${JSON.stringify(weatherData)}
  
  Consider factors like:
  - Location-specific historical risks (e.g., coastal cities like Visakhapatnam/Vizag or Mumbai have higher rain/cyclone risks compared to inland cities like Bangalore).
  - Delivery category (food, ecommerce, quick commerce).
  - Current weather (AQI, temperature, rain).
  - Synergistic risks (e.g., rain in a coastal city is more dangerous than rain in an inland city).
  
  Return a risk score (0-100), risk level (low, medium, high), specific recommendations, and a brief summary.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
        },
        required: ["riskScore", "riskLevel", "recommendations", "summary"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const extractBankData = async (base64Image: string, mimeType: string): Promise<BankData> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: "Extract the IFSC Code and Bank Account Number from this bank passbook. Return as JSON.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ifscCode: { type: Type.STRING },
          accountNumber: { type: Type.STRING },
        },
        required: ["ifscCode", "accountNumber"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const getSupportChatResponse = async (
  message: string, 
  history: { role: string, text: string }[],
  imageData?: { data: string, mimeType: string }
): Promise<string> => {
  const systemInstruction = `You are a helpful AI assistant for ErgoShield, an insurance platform for gig workers.
  Your goal is to answer customer questions about insurance plans, claims, and general support.
  
  If the customer provides an image (like a payment receipt), analyze it to help with their query.
  
  EMAIL SUPPORT:
  If a customer needs more help or wants to send a formal request, tell them to use the "Send Email" button on the Support page. 
  Inform them that they will receive responses at their registered email address: sreenandasai24@gmail.com.
  
  CRITICAL INSTRUCTION:
  If the customer asks about a claim status, specifically if they mention losing work hours (e.g., "I lost work for 3 hours") and waiting for a payout (e.g., "I have been waiting for 3-4 hours"), you MUST answer exactly with:
  "We are working on your request so please check your balance after sometime"
  
  For all other questions, be helpful, concise, and professional.`;

  const contents: any[] = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const userParts: any[] = [{ text: message }];
  if (imageData) {
    userParts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  contents.push({
    role: 'user',
    parts: userParts
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return response.text || "I'm sorry, I couldn't process that request.";
};

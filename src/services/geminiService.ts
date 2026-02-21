import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async getVocabularyRecommendations(nativeLanguage: string, level: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 5 high-frequency Chinese words for a ${nativeLanguage} speaker at ${level} level. 
      Include pinyin, English meaning, and a brief cultural note if applicable. 
      Format as JSON array of objects with keys: word, pinyin, meaning, culturalNote, proficiency (random 0-100).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              meaning: { type: Type.STRING },
              culturalNote: { type: Type.STRING },
              proficiency: { type: Type.NUMBER }
            },
            required: ["word", "pinyin", "meaning", "proficiency"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async getEtymology(word: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Deconstruct the Chinese character "${word}". 
      Provide the components (radicals), their meanings, and the historical/cultural origin of the character.
      Format as JSON object with keys: components (array of {char, meaning}), culturalContext.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  char: { type: Type.STRING },
                  meaning: { type: Type.STRING }
                }
              }
            },
            culturalContext: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async getDialogueResponse(history: { role: string, text: string }[], userInput: string) {
    const contents = history.map(h => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));
    contents.push({ role: "user", parts: [{ text: userInput }] });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: "You are a helpful Chinese language tutor. Engage in a natural conversation. Provide the Chinese response, Pinyin, and English translation."
      }
    });
    return response.text;
  },

  async analyzeImage(base64Image: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: "Identify any Chinese text in this image. Provide the Chinese characters, Pinyin, and English translation. Also explain the context (e.g., street sign, menu)." }
        ]
      }
    });
    return response.text;
  }
};

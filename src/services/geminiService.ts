import { GoogleGenAI, Type } from "@google/genai";
import { Word } from "../types";

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
    const data = JSON.parse(response.text || "{}");
    
    // For each component, generate a pictographic image
    if (data.components) {
      for (const comp of data.components) {
        try {
          const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: `A simple, elegant pictographic illustration of the Chinese radical "${comp.char}" which means "${comp.meaning}". The style should be like a traditional ink wash painting or a clean modern icon that clearly shows the connection between the character's shape and its meaning.` }]
            }
          });
          for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              comp.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (e) {
          console.error("Failed to generate image for radical", comp.char, e);
        }
      }
    }
    return data;
  },

  async getReviewDialogue(selectedWords: Word[]) {
    const wordList = selectedWords.map(w => w.word).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a dialogue scenario between a virtual assistant named "小通" (Xiao Tong) and the user. 
      The scenario should be a specific situation (e.g., at a restaurant, airport, or office).
      The user's lines MUST contain blanks for these words: ${wordList}.
      Format as JSON object with keys: 
      - scenario: string (description of the scene)
      - dialogue: array of { speaker: "Xiao Tong" | "User", text: string, pinyin?: string, translation?: string, blankWord?: string, hintImagePrompt?: string }
      
      For User lines with blanks, use "____" and specify the 'blankWord'. 
      Also provide a 'hintImagePrompt' for each blank word to help the user remember it.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  blankWord: { type: Type.STRING },
                  hintImagePrompt: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    
    // Generate hint images for blanks
    for (const line of data.dialogue) {
      if (line.blankWord && line.hintImagePrompt) {
        try {
          const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: line.hintImagePrompt }]
            }
          });
          for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              line.hintImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (e) {
          console.error("Failed to generate hint image", e);
        }
      }
    }
    return data;
  },

  async generateSpeech(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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

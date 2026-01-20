
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getLevelNarration = async (levelName: string, levelTheme: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The player "Beat" (a cute white robot-kid with a yellow shirt and black headphones) is starting a new level called "${levelName}" with a "${levelTheme}" theme. Provide a short, 1-sentence encouraging tip or quote for the loading screen that fits the music/tech theme. Keep it under 15 words.`,
        });
        return response.text?.trim() || "Stay in the groove, Beat!";
    } catch (error) {
        console.error("Gemini narration error:", error);
        return "Keep the rhythm going!";
    }
};

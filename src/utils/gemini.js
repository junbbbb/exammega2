import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiSolver {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("API Key is required");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async solveProblem(imageBase64) {
        try {
            // Remove header if present (data:image/jpeg;base64,)
            const base64Data = imageBase64.split(',')[1] || imageBase64;

            const prompt = `
        You are an expert exam solver. 
        Analyze the image provided. It contains a multiple choice question.
        1. Identify the question and the choices.
        2. Solve the problem accurately.
        3. Return the correct option (A, B, C, D, or E). If the options are numbers (1, 2, 3, 4, 5), map them to A, B, C, D, E.
        4. Provide a very short, one-sentence explanation.
        
        Output strictly in JSON format:
        {
          "found": boolean, // true if a question is detected
          "answer": "A" | "B" | "C" | "D" | "E",
          "explanation": "string"
        }
        
        If no question is visible, set "found" to false.
      `;

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Gemini Error:", error);
            return { found: false, error: error.message };
        }
    }
}

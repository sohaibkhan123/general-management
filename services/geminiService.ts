import { GoogleGenAI, Type } from "@google/genai";
import { Project, AIAnalysisResult, ProjectField } from "../types";

const apiKey = process.env.API_KEY || 'AIzaSyDZNh0_bBLNXPd-IXKTKrDpp0YeCjReEB4';
const ai = new GoogleGenAI({ apiKey });

// Suggest fields based on industry and description
export const suggestWorkflowStages = async (industry: string, description: string): Promise<ProjectField[]> => {
  try {
    const prompt = `
      I am creating a project tracking workflow for the "${industry}" industry.
      Project Description: "${description}".
      
      Suggest 6-10 tracking columns (fields). 
      - Include standard items like UID/ID, Description (Text).
      - Include numeric metrics like Weight, Quantity, Length (Number).
      - Include 3-5 sequential workflow steps as Dates (e.g., "Cutting Date", "Welding Date", "Inspection Date").
      
      Return a JSON array of objects with 'name' and 'type' ('text', 'number', or 'date').
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                 name: { type: Type.STRING },
                 type: { type: Type.STRING }
             }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    const fields = JSON.parse(text);
    // Validate types
    return fields.map((f: any) => ({
        name: f.name,
        type: ['text', 'number', 'date'].includes(f.type) ? f.type : 'text'
    }));
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [
        { name: 'UID', type: 'text' },
        { name: 'Description', type: 'text' },
        { name: 'Quantity', type: 'number' },
        { name: 'Start Date', type: 'date' },
        { name: 'End Date', type: 'date' }
    ];
  }
};

// Analyze project progress
export const analyzeProjectProgress = async (project: Project): Promise<AIAnalysisResult> => {
  try {
    const dateFields = project.fields.filter(f => f.type === 'date');
    const numberFields = project.fields.filter(f => f.type === 'number');
    
    // Stats calculation
    const totalItems = project.items.length;
    const stageStats: Record<string, any> = {};

    dateFields.forEach(dField => {
        let count = 0;
        let sums: Record<string, number> = {};
        numberFields.forEach(nf => sums[nf.name] = 0);

        project.items.forEach(item => {
            if (item[dField.name]) {
                count++;
                numberFields.forEach(nf => {
                    sums[nf.name] += (parseFloat(item[nf.name]) || 0);
                });
            }
        });
        stageStats[dField.name] = { count, sums };
    });

    const prompt = `
      Analyze the progress of this project.
      
      Project: ${project.name} (${project.industry})
      Total Items: ${totalItems}
      
      Workflow Progress (Items completed per stage/date-column):
      ${JSON.stringify(stageStats, null, 2)}
      
      Provide a structured analysis in JSON format with:
      - summary: Executive summary.
      - risks: Potential risks (e.g. gaps between stages).
      - recommendations: Actionable advice.
      - estimatedCompletion: Rough prediction.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedCompletion: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Unable to generate analysis at this time.",
      risks: ["Check internet connection", "Verify API Key"],
      recommendations: [],
      estimatedCompletion: "Unknown"
    };
  }
};

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ApiKeyManager } from '../auth/api-key-manager.js';
import { CRITIC_SYSTEM_PROMPT, CRITIC_USER_TEMPLATE } from '../prompts/critic-system.js';

const InputSchema = z.object({
  plan: z.string().describe('검토할 계획 내용'),
  context: z.string().optional().describe('추가 컨텍스트'),
});

const OutputSchema = z.object({
  verdict: z.enum(['OKAY', 'REJECT']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  suggestions: z.array(z.string()),
  risk_assessment: z.object({
    level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    factors: z.array(z.string()),
  }),
});

export type GeminiCritiqueInput = z.infer<typeof InputSchema>;
export type GeminiCritiqueOutput = z.infer<typeof OutputSchema>;

export const geminiCritiqueTool = {
  name: 'gemini_critique',
  description: 'Gemini Pro를 사용하여 계획/설계를 검토합니다. Claude와 독립적인 교차검증용.',
  inputSchema: InputSchema,

  async execute(input: GeminiCritiqueInput, apiKeyManager: ApiKeyManager): Promise<GeminiCritiqueOutput> {
    const apiKey = await apiKeyManager.getApiKey();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const prompt = `${CRITIC_SYSTEM_PROMPT}\n\n${CRITIC_USER_TEMPLATE(input.plan, input.context)}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      const parsed = JSON.parse(text);
      return OutputSchema.parse(parsed);
    } catch (e) {
      // JSON 파싱 실패 시 기본 응답
      return {
        verdict: 'REJECT',
        confidence: 0.5,
        summary: text.slice(0, 200),
        strengths: [],
        concerns: ['응답 파싱 실패'],
        suggestions: ['다시 시도해주세요'],
        risk_assessment: { level: 'MEDIUM', factors: ['파싱 오류'] },
      };
    }
  },
};

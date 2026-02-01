import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ApiKeyManager } from '../auth/api-key-manager.js';
import { CODE_REVIEWER_SYSTEM_PROMPT, CODE_REVIEWER_USER_TEMPLATE } from '../prompts/code-reviewer-system.js';

const InputSchema = z.object({
  code: z.string().describe('검토할 코드'),
  file_path: z.string().optional().describe('파일 경로'),
  language: z.string().optional().describe('프로그래밍 언어'),
  context: z.string().optional().describe('추가 컨텍스트'),
});

const IssueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
  line: z.number().optional(),
  message: z.string(),
  suggestion: z.string().optional(),
});

const OutputSchema = z.object({
  verdict: z.enum(['APPROVE', 'REQUEST_CHANGES']),
  overall_score: z.number().min(1).max(10),
  summary: z.string(),
  issues: z.array(IssueSchema),
  highlights: z.array(z.string()),
  security_concerns: z.array(z.string()).optional(),
  performance_notes: z.array(z.string()).optional(),
});

export type GeminiReviewInput = z.infer<typeof InputSchema>;
export type GeminiReviewOutput = z.infer<typeof OutputSchema>;

export const geminiReviewTool = {
  name: 'gemini_review',
  description: 'Gemini Pro를 사용하여 코드 품질을 검토합니다. Claude와 독립적인 교차검증용.',
  inputSchema: InputSchema,

  async execute(input: GeminiReviewInput, apiKeyManager: ApiKeyManager): Promise<GeminiReviewOutput> {
    const apiKey = await apiKeyManager.getApiKey();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',  // Claude Opus급 성능
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const prompt = `${CODE_REVIEWER_SYSTEM_PROMPT}\n\n${CODE_REVIEWER_USER_TEMPLATE(input.code, input.file_path, input.language, input.context)}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      const parsed = JSON.parse(text);
      return OutputSchema.parse(parsed);
    } catch (e) {
      return {
        verdict: 'REQUEST_CHANGES',
        overall_score: 5,
        summary: text.slice(0, 200),
        issues: [{ severity: 'minor', message: '응답 파싱 실패' }],
        highlights: [],
      };
    }
  },
};

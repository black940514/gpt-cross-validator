import OpenAI from 'openai';
import { z } from 'zod';
import { OAuthManager } from '../auth/oauth-manager.js';
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

export type GptReviewInput = z.infer<typeof InputSchema>;
export type GptReviewOutput = z.infer<typeof OutputSchema>;

export const gptReviewTool = {
  name: 'gpt_review',
  description: 'GPT-5.2를 사용하여 코드 품질을 검토합니다. Claude와 독립적인 교차검증용.',
  inputSchema: InputSchema,

  async execute(input: GptReviewInput, oauthManager: OAuthManager): Promise<GptReviewOutput> {
    const accessToken = await oauthManager.getAccessToken();

    const openai = new OpenAI({
      apiKey: accessToken,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: CODE_REVIEWER_SYSTEM_PROMPT },
        { role: 'user', content: CODE_REVIEWER_USER_TEMPLATE(input.code, input.file_path, input.language, input.context) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 비어있습니다.');
    }

    const parsed = JSON.parse(content);
    return OutputSchema.parse(parsed);
  },
};

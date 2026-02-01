import OpenAI from 'openai';
import { z } from 'zod';
import { OAuthManager } from '../auth/oauth-manager.js';
import { CRITIC_SYSTEM_PROMPT, CRITIC_USER_TEMPLATE } from '../prompts/critic-system.js';

const InputSchema = z.object({
  plan: z.string().describe('검토할 계획 내용'),
  context: z.string().optional().describe('추가 컨텍스트 (프로젝트 정보 등)'),
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

export type GptCritiqueInput = z.infer<typeof InputSchema>;
export type GptCritiqueOutput = z.infer<typeof OutputSchema>;

export const gptCritiqueTool = {
  name: 'gpt_critique',
  description: 'GPT-5.2를 사용하여 계획/설계를 검토합니다. Claude와 독립적인 교차검증용.',
  inputSchema: InputSchema,

  async execute(input: GptCritiqueInput, oauthManager: OAuthManager): Promise<GptCritiqueOutput> {
    const accessToken = await oauthManager.getAccessToken();

    const openai = new OpenAI({
      apiKey: accessToken,
      // OAuth 사용 시 다른 base URL이 필요할 수 있음
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2', // 또는 gpt-4.5-preview 등 실제 모델명
      messages: [
        { role: 'system', content: CRITIC_SYSTEM_PROMPT },
        { role: 'user', content: CRITIC_USER_TEMPLATE(input.plan, input.context) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 비어있습니다.');
    }

    const parsed = JSON.parse(content);
    return OutputSchema.parse(parsed);
  },
};

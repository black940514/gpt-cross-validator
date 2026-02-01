#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OAuthManager } from './auth/oauth-manager.js';
import { gptCritiqueTool } from './tools/gpt-critique.js';
import { gptReviewTool } from './tools/gpt-review.js';

const oauthManager = new OAuthManager();

const server = new Server(
  {
    name: 'gpt-cross-validator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: gptCritiqueTool.name,
      description: gptCritiqueTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          plan: { type: 'string', description: '검토할 계획 내용' },
          context: { type: 'string', description: '추가 컨텍스트' },
        },
        required: ['plan'],
      },
    },
    {
      name: gptReviewTool.name,
      description: gptReviewTool.description,
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '검토할 코드' },
          file_path: { type: 'string', description: '파일 경로' },
          language: { type: 'string', description: '프로그래밍 언어' },
          context: { type: 'string', description: '추가 컨텍스트' },
        },
        required: ['code'],
      },
    },
  ],
}));

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === gptCritiqueTool.name) {
      const input = gptCritiqueTool.inputSchema.parse(args);
      const result = await gptCritiqueTool.execute(input, oauthManager);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === gptReviewTool.name) {
      const input = gptReviewTool.inputSchema.parse(args);
      const result = await gptReviewTool.execute(input, oauthManager);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GPT Cross Validator MCP Server running on stdio');
}

main().catch(console.error);

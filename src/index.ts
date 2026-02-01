#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiKeyManager } from './auth/api-key-manager.js';
import { geminiCritiqueTool } from './tools/gemini-critique.js';
import { geminiReviewTool } from './tools/gemini-review.js';

const apiKeyManager = new ApiKeyManager();

const server = new Server(
  {
    name: 'gemini-cross-validator',
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
      name: geminiCritiqueTool.name,
      description: geminiCritiqueTool.description,
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
      name: geminiReviewTool.name,
      description: geminiReviewTool.description,
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
    if (name === geminiCritiqueTool.name) {
      const input = geminiCritiqueTool.inputSchema.parse(args);
      const result = await geminiCritiqueTool.execute(input, apiKeyManager);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === geminiReviewTool.name) {
      const input = geminiReviewTool.inputSchema.parse(args);
      const result = await geminiReviewTool.execute(input, apiKeyManager);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gemini Cross Validator MCP Server running on stdio');
}

main().catch(console.error);

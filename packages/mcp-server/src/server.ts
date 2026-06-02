import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getVersion } from '@ls-apis/shared/data';
import {
  getListToolsResult,
  handleCallTool,
  getListResourcesResult,
  handleReadResource,
} from './handlers';
import type { CallToolParams } from './handlers';
import { ResourceUri } from './types';

const SERVER_NAME = 'ls-apis-mcp';

export async function startServer(): Promise<void> {
  const version = await getVersion(import.meta.url);
  const server = new Server(
    {
      name: SERVER_NAME,
      version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, getListToolsResult);
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleCallTool(request.params as CallToolParams)
  );
  server.setRequestHandler(ListResourcesRequestSchema, getListResourcesResult);
  server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
    handleReadResource(request.params.uri as ResourceUri)
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

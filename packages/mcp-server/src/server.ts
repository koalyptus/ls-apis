import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { getVersion } from '@ls-apis/shared/data';
import { registerTools, registerResources } from './handlers';

const SERVER_NAME = 'ls-apis-mcp';

export async function startServer(): Promise<void> {
  const version = await getVersion(import.meta.url);
  const server = new McpServer({ name: SERVER_NAME, version });

  // Registration must happen before connect() — v2 rejects late registration.
  registerTools(server);
  registerResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

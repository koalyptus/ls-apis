import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { McpServer } from '@modelcontextprotocol/server';
import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/server';

/**
 * Create a real in-process MCP client/server pair wired over
 * `InMemoryTransport.createLinkedPair()`.
 *
 * @param register - Callback that registers tools/resources on the server.
 *   Must run before `connect()` — the v2 SDK rejects capability registration
 *   once the transport is attached.
 */
export async function createTestServer(
  register?: (server: McpServer) => void
): Promise<{ client: Client; server: McpServer }> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = new McpServer({ name: 'ls-apis-mcp-test', version: '0.0.0' });
  register?.(server);
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(clientTransport);
  return { client, server };
}

/** Extract the first text block from a tool result, throwing on non-text content. */
export function getTextContent(result: CallToolResult): string {
  const block = result.content?.[0];
  if (!block || block.type !== 'text') {
    throw new Error('expected text tool content');
  }
  return block.text;
}

/** Extract the first text body from a resource read result. */
export function getResourceText(result: ReadResourceResult): string {
  const content = result.contents?.[0] as { text?: unknown } | undefined;
  if (typeof content?.text !== 'string') {
    throw new Error('expected text resource content');
  }
  return content.text;
}

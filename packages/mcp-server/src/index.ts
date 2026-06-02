import { startServer } from './server';

startServer().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});

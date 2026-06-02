import { ToolName } from '../types';

export interface CallToolParams {
  name: ToolName;
  arguments?: Record<string, unknown>;
}

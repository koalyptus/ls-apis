import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export async function runQa(descriptionMaxLength: number, outputFile?: string): Promise<void> {
  const currentDir = dirname(realpathSync(fileURLToPath(import.meta.url)));
  const projectRoot = join(currentDir, '../../..');
  const script = join(projectRoot, 'packages/aggregator/src/qa/index.ts');

  const args = ['npx', 'tsx', script];
  if (outputFile) {
    args.push('--output', outputFile);
  }

  execSync(args.join(' '), { cwd: projectRoot, stdio: 'inherit' });
}

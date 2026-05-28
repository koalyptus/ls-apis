import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { projectRoot } from '@ls-apis/shared/paths';

export async function runQa(descriptionMaxLength: number, outputFile?: string): Promise<void> {
  const root = projectRoot(import.meta.url);
  const script = join(root, 'packages/aggregator/src/qa/index.ts');

  const args = ['npx', 'tsx', script];
  if (outputFile) {
    args.push('--output', outputFile);
  }

  execSync(args.join(' '), { cwd: root, stdio: 'inherit' });
}

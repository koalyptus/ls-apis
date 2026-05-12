import console from 'node:console';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_README = resolve(ROOT_DIR, 'README.md');
const CLI_README = resolve(ROOT_DIR, 'packages/cli/README.md');

function buildCliReadme(rootReadme) {
  return rootReadme
    .replace(/### Via npm link \(local development\)[\s\S]*?(?=## Usage)/, '')
    .replace(/npm run ls-apis --\s+/g, 'npx ls-apis ')
    .replace(/\n## Project Structure[\s\S]*$/s, '\n');
}

async function writeCliReadme() {
  const rootReadme = await readFile(ROOT_README, 'utf8');
  const cliReadme = buildCliReadme(rootReadme);
  await writeFile(CLI_README, cliReadme);
}

async function cleanCliReadme() {
  try {
    await unlink(CLI_README);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

const action = process.argv[2];

if (action === 'write') {
  await writeCliReadme();
} else if (action === 'clean') {
  await cleanCliReadme();
} else {
  console.error('Usage: node scripts/package-readme.mjs <write|clean>');
  process.exit(1);
}

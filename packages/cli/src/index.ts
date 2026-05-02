import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ApiEntry {
  name: string;
  description?: string;
  link: string;
  auth?: string;
  https?: boolean;
  cors?: string;
  categories: string[];
  openapiSpec?: string;
  sources: string[];
}

interface SearchOptions {
  query?: string;
  category?: string;
  auth?: string;
}

async function search(options: SearchOptions): Promise<void> {
  const dataFile = join(dirname(fileURLToPath(import.meta.url)), '../../data/apis.json');
  const data = await readFile(dataFile, 'utf-8');
  const apis: ApiEntry[] = JSON.parse(data);

  let results = apis;

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (api) => api.name.toLowerCase().includes(q) || api.description?.toLowerCase().includes(q)
    );
  }

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((api) => api.categories.some((c) => c.toLowerCase().includes(cat)));
  }

  if (options.auth) {
    const auth = options.auth.toLowerCase();
    results = results.filter((api) => {
      if (auth === 'no') {
        return !api.auth;
      }
      return api.auth?.toLowerCase().includes(auth);
    });
  }

  console.log(`Found ${results.length} APIs:`);
  for (const api of results.slice(0, 20)) {
    console.log(`  ${api.name}`);
    console.log(`    ${api.description || 'No description'}`);
    console.log(`    ${api.link}`);
    if (api.auth) console.log(`    Auth: ${api.auth}`);
    console.log();
  }

  if (results.length > 20) {
    console.log(`... and ${results.length - 20} more`);
  }
}

const args = process.argv.slice(2);
const options: SearchOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-q' || args[i] === '--query') {
    options.query = args[i + 1];
    i++;
  } else if (args[i] === '-c' || args[i] === '--category') {
    options.category = args[i + 1];
    i++;
  } else if (args[i] === '-a' || args[i] === '--auth') {
    options.auth = args[i + 1];
    i++;
  }
}

search(options).catch(console.error);

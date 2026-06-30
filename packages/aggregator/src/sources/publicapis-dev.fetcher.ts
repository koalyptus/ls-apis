import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import type { Element } from 'domhandler';
import { normalizeCategory, normalizeHref } from '../normalize';
import type { ApiEntry, AuthType, SourceFetcher } from '../types';

const BASE_URL = 'https://publicapis.dev';
const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false });
const REQUEST_TIMEOUT = 10000;
const MIN_DESCRIPTION_LENGTH = 16;
const MAX_AUTH_LENGTH = 20;

function getApiItems($: cheerio.CheerioAPI): cheerio.Cheerio<Element> {
  const legacyItems = $('li[role="group"]');
  if (legacyItems.length > 0) {
    return legacyItems;
  }

  return $('li').filter((_i, el) => {
    const $el = $(el);
    return $el.find('a[href^="/resource/"]').length > 0 && $el.find('h2').length > 0;
  });
}

async function fetchCategories(): Promise<string[]> {
  const res = await axios.get(BASE_URL, {
    timeout: REQUEST_TIMEOUT,
    httpsAgent: HTTPS_AGENT,
    headers: {
      'User-Agent': 'ls-apis/1.0 (aggregator)',
    },
  });

  const $ = cheerio.load(res.data);
  const categories: string[] = [];

  $('a[href*="/category/"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/\/category\/([^/?]+)/);
    if (match && match[1]) {
      categories.push(match[1]);
    }
  });

  if (categories.length === 0) {
    throw new Error('Could not discover categories from page');
  }

  return [...new Set(categories)];
}

const fetcher: SourceFetcher = {
  name: 'publicapis-dev',
  sourceUrl: BASE_URL,

  async fetchApis(): Promise<ApiEntry[]> {
    const allApis: ApiEntry[] = [];
    const categories = await fetchCategories();

    console.log(`Found ${categories.length} categories from ${BASE_URL}`);

    for (const category of categories) {
      try {
        const url = `${BASE_URL}/category/${category}`;
        const res = await axios.get(url, {
          timeout: REQUEST_TIMEOUT,
          httpsAgent: HTTPS_AGENT,
          headers: {
            'User-Agent': 'ls-apis/1.0 (aggregator)',
          },
        });

        const $ = cheerio.load(res.data);
        const categoryName = normalizeCategory(category);

        const items = getApiItems($);

        items.each((_i, el) => {
          const $item = $(el);
          const $anchor = $item.find('a').first();
          const apiLink = normalizeHref($anchor.attr('href'), BASE_URL);

          if (!apiLink || apiLink.includes('github.com/marcelscruz')) {
            return;
          }

          const name = $item.find('h2').first().text().trim();
          if (!name) {
            return;
          }

          const descriptions = $item
            .find('p')
            .map((_j, pEl) => $(pEl).text().trim())
            .get();
          const description = descriptions.find((d) => d.length > MIN_DESCRIPTION_LENGTH) || null;

          let auth: AuthType = null;
          let cors: string | null = null;

          const itemText = $item.text().toLowerCase();
          const hasApiKey = itemText.includes('api key');
          const hasOAuth = itemText.includes('oauth');

          if (hasApiKey && hasOAuth) {
            auth = 'apiKey|OAuth';
          } else if (hasApiKey) {
            auth = 'apiKey';
          } else if (hasOAuth) {
            auth = 'OAuth';
          } else if (itemText.length > 0 && itemText.length <= MAX_AUTH_LENGTH) {
            auth = itemText;
          }

          if (itemText.includes('cors') && (itemText.includes('yes') || itemText.includes('✓'))) {
            cors = 'yes';
          }

          allApis.push({
            name,
            description,
            link: apiLink,
            auth,
            cors,
            categories: [categoryName],
            openapiSpec: null,
            sources: [fetcher.name],
          });
        });
      } catch (error) {
        console.error(`Failed to fetch ${category}: ${error}`);
      }
    }

    return allApis;
  },
};

export default fetcher;

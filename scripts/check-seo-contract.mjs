#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const indexPath = path.join(repoRoot, 'index.html');
const sitemapPath = path.join(repoRoot, 'sitemap.xml');

const [html, sitemap] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(sitemapPath, 'utf8')
]);

const failures = [];

function requireMatch(label, pattern, source) {
  if (!pattern.test(source)) {
    failures.push(label);
  }
}

requireMatch(
  'title must preserve the primary query「インターホン 男性の声 アプリ 無料」',
  /<title>[^<]*インターホン 男性の声 アプリ 無料[^<]*<\/title>/,
  html
);
requireMatch(
  'H1 must describe the service as an app and a site',
  /<h1>インターホン 男性の声 アプリ・サイト（無料）<\/h1>/,
  html
);
requireMatch(
  'hero copy must preserve the free Web app/site positioning',
  /無料Webアプリ・サイトです。/,
  html
);
requireMatch(
  'canonical URL must remain the production homepage',
  /<link rel="canonical" href="https:\/\/voiceguardhitoribouhan\.pages\.dev\/"\s*\/?>/,
  html
);
requireMatch(
  'robots noindex must not be present on the homepage',
  /^(?![\s\S]*<meta[^>]+(?:name=["']robots["'][^>]+content=["'][^"']*noindex|content=["'][^"']*noindex[^>]+name=["']robots["']))[\s\S]*$/i,
  html
);

const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
const jsonLd = [];

for (const [index, block] of jsonLdBlocks.entries()) {
  try {
    jsonLd.push(JSON.parse(block[1]));
  } catch (error) {
    failures.push(`JSON-LD block ${index + 1} must be valid JSON: ${error.message}`);
  }
}

const softwareApplication = jsonLd.find((item) => item['@type'] === 'SoftwareApplication');
if (!softwareApplication) {
  failures.push('SoftwareApplication structured data must be present');
} else if (!softwareApplication.description?.includes('Webアプリ・サイト')) {
  failures.push('SoftwareApplication description must preserve「Webアプリ・サイト」');
}

const website = jsonLd.find((item) => item['@type'] === 'WebSite');
if (!website) {
  failures.push('WebSite structured data must be present');
} else if (!website.description?.includes('Webアプリ・サイト')) {
  failures.push('WebSite description must preserve「Webアプリ・サイト」');
}

const faq = jsonLd.find((item) => item['@type'] === 'FAQPage');
if (!faq || !Array.isArray(faq.mainEntity)) {
  failures.push('FAQPage structured data must contain mainEntity');
} else {
  const names = faq.mainEntity.map((item) => item.name).filter(Boolean);
  if (new Set(names).size !== names.length) {
    failures.push('FAQPage questions must not contain duplicates');
  }
}

requireMatch(
  'sitemap must include the production homepage',
  /<loc>https:\/\/voiceguardhitoribouhan\.pages\.dev\/<\/loc>/,
  sitemap
);

if (failures.length > 0) {
  console.error('SEO contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SEO contract check passed (${jsonLd.length} JSON-LD blocks validated).`);

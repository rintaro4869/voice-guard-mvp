#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const linksPath = path.join(repoRoot, 'assets', 'affiliate-links.json');
const reportDir = path.join(repoRoot, 'reports');
const jsonReportPath = path.join(reportDir, 'affiliate-health.json');
const mdReportPath = path.join(reportDir, 'affiliate-health.md');

const args = new Set(process.argv.slice(2));
const writeMode = args.has('--write');
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_CONFIGURED_BODY_BYTES = 10 * 1024 * 1024;
const ALLOWED_AFFILIATE_HOSTS = new Set([
  'a.r10.to',
  'search.rakuten.co.jp',
  'item.rakuten.co.jp',
  'www.rakuten.co.jp',
  'hb.afl.rakuten.co.jp'
]);
const timeoutMs = parsePositiveInteger(
  process.env.AFFILIATE_CHECK_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
  120000
);
const maxBodyBytes = parsePositiveInteger(
  process.env.AFFILIATE_CHECK_MAX_BODY_BYTES,
  DEFAULT_MAX_BODY_BYTES,
  MAX_CONFIGURED_BODY_BYTES
);
const defaultUnavailablePatterns = [
  '売り切れ',
  '在庫切れ',
  '在庫なし',
  '品切れ',
  '販売終了',
  '現在ご購入できません',
  '商品が見つかりません',
  'ページが見つかりません',
  '入荷待ち'
];

export class BodyTooLargeError extends Error {
  constructor(limit) {
    super('Response body exceeds ' + limit + ' bytes');
    this.name = 'BodyTooLargeError';
  }
}

export function parsePositiveInteger(rawValue, fallback, maximum) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new Error('Expected an integer between 1 and ' + maximum);
  }

  return parsed;
}

export function validateAffiliateUrl(value, fieldName = 'url') {
  if (!value) {
    return '';
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(fieldName + ' must be an absolute URL');
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_AFFILIATE_HOSTS.has(parsed.hostname)) {
    throw new Error(fieldName + ' is not an approved HTTPS affiliate URL');
  }

  return value;
}

export async function readResponseText(response, limit = maxBodyBytes) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > limit) {
    throw new BodyTooLargeError(limit);
  }

  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      received += value.byteLength;
      if (received > limit) {
        await reader.cancel();
        throw new BodyTooLargeError(limit);
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}

function normalizeEntry(key, value) {
  const rawEntry = typeof value === 'string' ? { url: value, primaryUrl: value } : (value || {});
  const primaryUrl = typeof rawEntry.primaryUrl === 'string' && rawEntry.primaryUrl
    ? rawEntry.primaryUrl
    : (typeof rawEntry.url === 'string' ? rawEntry.url : '');
  const fallbackUrl = validateAffiliateUrl(
    typeof rawEntry.fallbackUrl === 'string' ? rawEntry.fallbackUrl : '',
    key + '.fallbackUrl'
  );
  const url = validateAffiliateUrl(
    typeof rawEntry.url === 'string' && rawEntry.url ? rawEntry.url : primaryUrl,
    key + '.url'
  );
  const status = typeof rawEntry.status === 'string' && rawEntry.status ? rawEntry.status : 'ok';
  const unavailablePatterns = Array.isArray(rawEntry.unavailablePatterns)
    ? rawEntry.unavailablePatterns.filter(function (pattern) {
        return typeof pattern === 'string' && pattern.trim();
      })
    : [];

  return {
    ...rawEntry,
    key,
    label: typeof rawEntry.label === 'string' && rawEntry.label ? rawEntry.label : key,
    network: typeof rawEntry.network === 'string' ? rawEntry.network : '',
    url,
    primaryUrl: validateAffiliateUrl(primaryUrl, key + '.primaryUrl'),
    fallbackUrl,
    status,
    unavailablePatterns
  };
}

function serializeEntry(entry) {
  const nextEntry = {
    label: entry.label,
    network: entry.network,
    status: entry.status,
    url: entry.url,
    primaryUrl: entry.primaryUrl,
    fallbackUrl: entry.fallbackUrl
  };

  if (entry.unavailablePatterns.length > 0) {
    nextEntry.unavailablePatterns = entry.unavailablePatterns;
  }

  return nextEntry;
}

function buildSearchText(url, body) {
  return [url, body]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function findMatchedPattern(text, patterns) {
  return patterns.find(function (pattern) {
    return text.includes(pattern.toLowerCase());
  }) || '';
}

async function fetchPage(url, patterns) {
  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'VoiceGuardAffiliateChecker/1.0 (+https://voiceguardhitoribouhan.pages.dev)',
        'accept-language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });

    const body = await readResponseText(response);
    const text = buildSearchText(response.url, body);
    const matchedPattern = findMatchedPattern(text, patterns);

    return {
      ok: response.ok && !matchedPattern,
      httpStatus: response.status,
      finalUrl: response.url,
      matchedPattern,
      reason: !response.ok
        ? 'http_' + response.status
        : (matchedPattern ? 'matched_pattern:' + matchedPattern : 'ok')
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      finalUrl: url,
      matchedPattern: '',
      reason: error && error.name === 'AbortError'
        ? 'timeout'
        : (error instanceof BodyTooLargeError ? 'body_too_large' : 'fetch_error')
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function inspectEntry(entry) {
  if (!entry.primaryUrl) {
    return {
      key: entry.key,
      label: entry.label,
      network: entry.network,
      status: 'error',
      activeUrl: entry.url,
      primaryUrl: '',
      fallbackUrl: entry.fallbackUrl,
      finalUrl: '',
      httpStatus: null,
      reason: 'missing_primary_url',
      matchedPattern: '',
      nextUrl: entry.url,
      nextStatus: 'error'
    };
  }

  const patterns = defaultUnavailablePatterns.concat(entry.unavailablePatterns);
  const primaryResult = await fetchPage(entry.primaryUrl, patterns);

  if (primaryResult.ok) {
    return {
      key: entry.key,
      label: entry.label,
      network: entry.network,
      status: 'ok',
      activeUrl: entry.primaryUrl,
      primaryUrl: entry.primaryUrl,
      fallbackUrl: entry.fallbackUrl,
      finalUrl: primaryResult.finalUrl,
      httpStatus: primaryResult.httpStatus,
      reason: primaryResult.reason,
      matchedPattern: primaryResult.matchedPattern,
      nextUrl: entry.primaryUrl,
      nextStatus: 'ok'
    };
  }

  if (!entry.fallbackUrl) {
    return {
      key: entry.key,
      label: entry.label,
      network: entry.network,
      status: 'error',
      activeUrl: entry.url || entry.primaryUrl,
      primaryUrl: entry.primaryUrl,
      fallbackUrl: '',
      finalUrl: primaryResult.finalUrl,
      httpStatus: primaryResult.httpStatus,
      reason: primaryResult.reason,
      matchedPattern: primaryResult.matchedPattern,
      nextUrl: entry.url || entry.primaryUrl,
      nextStatus: 'error'
    };
  }

  const fallbackResult = await fetchPage(entry.fallbackUrl, []);
  if (!fallbackResult.ok) {
    return {
      key: entry.key,
      label: entry.label,
      network: entry.network,
      status: 'error',
      activeUrl: entry.url || entry.primaryUrl,
      primaryUrl: entry.primaryUrl,
      fallbackUrl: entry.fallbackUrl,
      finalUrl: primaryResult.finalUrl,
      httpStatus: primaryResult.httpStatus,
      reason: primaryResult.reason + ' / fallback_' + fallbackResult.reason,
      matchedPattern: primaryResult.matchedPattern,
      nextUrl: entry.url || entry.primaryUrl,
      nextStatus: 'error'
    };
  }

  return {
    key: entry.key,
    label: entry.label,
    network: entry.network,
    status: 'using_fallback',
    activeUrl: entry.fallbackUrl,
    primaryUrl: entry.primaryUrl,
    fallbackUrl: entry.fallbackUrl,
    finalUrl: primaryResult.finalUrl,
    httpStatus: primaryResult.httpStatus,
    reason: primaryResult.reason,
    matchedPattern: primaryResult.matchedPattern,
    nextUrl: entry.fallbackUrl,
    nextStatus: 'using_fallback'
  };
}

function countStatuses(results) {
  return results.reduce(function (summary, result) {
    summary.total += 1;
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, { total: 0, ok: 0, using_fallback: 0, error: 0 });
}

function toMarkdown(report) {
  const lines = [
    '# Affiliate Health Report',
    '',
    'Generated at: ' + report.generatedAt,
    '',
    'Summary:',
    '- Total: ' + report.summary.total,
    '- OK: ' + report.summary.ok,
    '- Using fallback: ' + report.summary.using_fallback,
    '- Error: ' + report.summary.error,
    '',
    '| Key | Status | Active URL | Reason |',
    '| --- | --- | --- | --- |'
  ];

  report.results.forEach(function (result) {
    lines.push(
      '| ' + result.key +
      ' | ' + result.status +
      ' | ' + result.activeUrl +
      ' | ' + result.reason +
      ' |'
    );
  });

  return lines.join('\n') + '\n';
}

function printSummary(report) {
  console.log('Affiliate check finished.');
  console.log(
    'total=' + report.summary.total +
    ' ok=' + report.summary.ok +
    ' fallback=' + report.summary.using_fallback +
    ' error=' + report.summary.error
  );

  report.results.forEach(function (result) {
    console.log(
      '- ' + result.key +
      ': ' + result.status +
      ' (' + result.reason + ')'
    );
  });
}

async function main() {
  const raw = JSON.parse(await readFile(linksPath, 'utf8'));
  const keys = Object.keys(raw);
  const entries = keys.map(function (key) {
    return normalizeEntry(key, raw[key]);
  });

  const results = [];
  const nextLinks = {};
  let configChanged = false;

  for (const entry of entries) {
    const result = await inspectEntry(entry);
    results.push(result);

    const nextEntry = {
      ...entry,
      url: result.nextUrl,
      status: result.nextStatus
    };

    if (nextEntry.url !== entry.url || nextEntry.status !== entry.status) {
      configChanged = true;
    }

    nextLinks[entry.key] = serializeEntry(nextEntry);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: countStatuses(results),
    results
  };

  await mkdir(reportDir, { recursive: true });
  await writeFile(jsonReportPath, JSON.stringify(report, null, 2) + '\n');
  await writeFile(mdReportPath, toMarkdown(report));

  if (writeMode && configChanged) {
    await writeFile(linksPath, JSON.stringify(nextLinks, null, 2) + '\n');
  }

  printSummary(report);
}

const isMainModule = Boolean(
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
);

if (isMainModule) {
  if (args.has('--help')) {
    console.log('Usage: node scripts/check-affiliates.mjs [--write]');
    console.log('');
    console.log('--write  assets/affiliate-links.json の url/status を更新する');
  } else {
    if (typeof fetch !== 'function') {
      throw new Error('Global fetch is not available. Use Node.js 18+.');
    }

    main().catch(function (error) {
      console.error(error);
      process.exit(1);
    });
  }
}

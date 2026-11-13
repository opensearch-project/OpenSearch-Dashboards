/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFileSync } from 'child_process';
import { parseLegacyUrl } from './url';

// Compares parseLegacyUrl with Node's own url.parse() on generated URLs. url.parse() still
// exists, it only warns, so it runs in a child with --no-deprecation where the warning
// can't reach this process. The seed is fixed so a failure reproduces.

const SEED = 0x5eed13;
const COUNT = 3000;

// Park-Miller minimal standard generator: deterministic and needs no bitwise operators
const seeded = (seed: number) => () => {
  seed = (seed * 48271) % 2147483647;
  return (seed - 1) / 2147483646;
};
const rand = seeded(SEED);
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const repeat = (max: number, next: () => string) =>
  Array.from({ length: Math.floor(rand() * (max + 1)) }, next).join('');

// Every character url.parse() escapes, plus the ones state URLs and paths commonly carry
const TEXT = [
  ...'abcXYZ019-_.~!$&()*+,;=:@[]',
  ...` "'<>\\^\`{|}\t\n`,
  'é',
  '✓',
  '%20',
  '%27',
  '%2e',
  '%2F',
  '%E0%A4',
  "(query:'a b')",
];
const SEGMENT = ['.', '..', '%2e%2e', 'app', 'x y', "it's", ''];
const SCHEMES = ['http:', 'https:', 'HTTP:', 'ws:', 'ftp:', 'file:'];
const HOSTS = ['localhost', 'example.com', 'osd.example.com', 'Example.COM', '127.0.0.1', 'h'];
const LABEL = ['h', 'example', 'Example', 'osd-1', 'localhost', 'bücher', 'a_b', '127'];

const host = () => {
  const kind = rand();
  if (kind < 0.1) return pick(['[::1]', '[2001:db8::1]', '[::FFFF:127.0.0.1]']);
  if (kind < 0.7) return pick(HOSTS);
  return Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(LABEL)).join('.');
};
const auth = () =>
  rand() < 0.15
    ? `${pick(['u', 'user', 'a%40b', "o'k"])}${rand() < 0.5 ? `:${pick(['p', 'p%3Ass', ''])}` : ''}@`
    : '';
const port = () => (rand() < 0.3 ? `:${pick(['80', '443', '5601', '0', '65535'])}` : '');
const path = () =>
  repeat(
    4,
    () => `${pick(['/', '/', '/', '\\'])}${pick([...SEGMENT, repeat(6, () => pick(TEXT))])}`
  );
const query = () =>
  rand() < 0.5 ? `?${repeat(8, () => pick([...TEXT, '/', '?', '=', '&']))}` : '';
const hash = () => (rand() < 0.4 ? `#${repeat(10, () => pick([...TEXT, '/', '?', '#']))}` : '');
const space = () => (rand() < 0.05 ? ' ' : '');

const generate = () => {
  const tail = `${path()}${query()}${hash()}`;
  const shape = rand();
  let url: string;
  if (shape < 0.45) {
    url = `${pick(SCHEMES)}//${auth()}${host()}${port()}${tail}`;
  } else if (shape < 0.55) {
    url = `//${auth()}${host()}${port()}${tail}`;
  } else if (shape < 0.6) {
    url = `javascript:${repeat(8, () => pick(TEXT))}`;
  } else {
    url = rand() < 0.7 ? tail : tail.replace(/^[/\\]/, '');
  }
  return `${space()}${url}${space()}`;
};

const MODES = {
  default: [false, false],
  parseQueryString: [true, false],
  slashesDenoteHost: [false, true],
} as const;
type Mode = keyof typeof MODES;

const inputs = Array.from(new Set(Array.from({ length: COUNT }, generate)));

const legacy: Record<Mode, Array<Record<string, unknown> | { error: string }>> = JSON.parse(
  execFileSync(
    process.execPath,
    [
      '--no-deprecation',
      '-e',
      `
      const url = require('url');
      const inputs = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      const modes = ${JSON.stringify(MODES)};
      const out = {};
      for (const [mode, [qs, slashes]] of Object.entries(modes)) {
        out[mode] = inputs.map((input) => {
          try {
            const { protocol, slashes: s, auth, host, port, hostname, hash, search, query, pathname, path, href } =
              url.parse(input, qs, slashes);
            return { protocol, slashes: s, auth, host, port, hostname, hash, search,
              query: query && typeof query === 'object' ? { ...query } : query, pathname, path, href };
          } catch (e) {
            return { error: e.name };
          }
        });
      }
      process.stdout.write(JSON.stringify(out));
      `,
    ],
    { input: JSON.stringify(inputs), maxBuffer: 256 * 1024 * 1024 }
  ).toString()
);

const shape = (parsed: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [
      key,
      key === 'query' && value && typeof value === 'object' ? { ...value } : (value ?? null),
    ])
  );

const AUTHORITY_RE = /^\s*(?:[a-zA-Z][a-zA-Z\d+.-]*:)?[/\\]{2}([^/\\?#]*)/;
// url.parse() cuts a host short at these and moves the rest into the path; browsers keep them
const LEGACY_NON_HOST_RE = /[\s"%';<>\\^`{|}]/;

// The documented differences from url.parse(), each covered by its own test in url.test.ts.
// Host checks drop tabs and newlines and read an empty authority (`///evil.com`) the way
// browsers do, and a host url.parse() would have cut short is kept whole.
const isDocumentedDifference = (mode: Mode, input: string) => {
  if (mode === 'slashesDenoteHost' && (/[\t\n\r]/.test(input) || /^\s*[/\\]{3}/.test(input))) {
    return true;
  }
  // A malformed escape in the query decodes like URLSearchParams, without mangling its neighbours
  if (mode === 'parseQueryString') {
    try {
      decodeURIComponent(input.split('#')[0].split('?').slice(1).join('?'));
    } catch {
      return true;
    }
  }
  const authority = AUTHORITY_RE.exec(input)?.[1];
  return (
    authority !== undefined &&
    LEGACY_NON_HOST_RE.test(authority.slice(authority.lastIndexOf('@') + 1))
  );
};

// Hosts are normalized the way browsers do (`[::FFFF:127.0.0.1]` is `[::ffff:7f00:1]`), so
// url.parse()'s host is put through the same normalization before comparing
const normalizeHost = (expected: Record<string, unknown>) => {
  const hostname = expected.hostname as string | null;
  if (!hostname) return expected;
  const bracketed = hostname.includes(':') ? `[${hostname}]` : hostname;
  const normalized = new URL(`http://${bracketed}/`).hostname;
  const hostPort = (expected.host as string).replace(bracketed, normalized);
  return {
    ...expected,
    hostname: normalized.replace(/^\[(.*)\]$/, '$1'),
    host: hostPort,
    href: (expected.href as string).replace(expected.host as string, hostPort),
  };
};

describe('parseLegacyUrl() against url.parse() on generated URLs', () => {
  it('generates enough distinct inputs', () => {
    expect(inputs.length).toBeGreaterThan(COUNT * 0.9);
  });

  it.each(Object.keys(MODES) as Mode[])('matches url.parse() in %s mode', (mode) => {
    const mismatches: string[] = [];
    let threw = 0;
    inputs.forEach((input, i) => {
      if (isDocumentedDifference(mode, input)) return;
      const expected = legacy[mode][i];
      let actual: Record<string, unknown> | { error: string };
      try {
        actual = shape(parseLegacyUrl(input, ...MODES[mode]) as any);
      } catch (e) {
        actual = { error: (e as Error).name };
      }
      if ('error' in actual && !('error' in expected)) {
        // A host or port WHATWG rejects throws; that is the only place a throw is allowed
        if (AUTHORITY_RE.test(input)) {
          threw++;
          return;
        }
      }
      const comparable = 'error' in expected ? expected : normalizeHost(expected);
      if (JSON.stringify(actual) !== JSON.stringify(comparable)) {
        mismatches.push(
          `${JSON.stringify(input)}\n  expected ${JSON.stringify(comparable)}\n  received ${JSON.stringify(actual)}`
        );
      }
    });
    expect(mismatches.slice(0, 5)).toEqual([]);
    // Inputs that throw are rare; a jump means a parser change started rejecting valid URLs
    expect(threw).toBeLessThan(inputs.length * 0.03);
  });
});

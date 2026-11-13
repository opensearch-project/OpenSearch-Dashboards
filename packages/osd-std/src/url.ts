/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { format as formatUrl, UrlObject } from 'url';
import type { ParsedQuery } from 'query-string';
import type { ParsedUrlQuery } from 'querystring';

/**
 * The object shape returned by Node's legacy `url.parse()`.
 *
 * @public
 */
export interface ParsedUrl {
  protocol: string | null;
  slashes: boolean | null;
  auth: string | null;
  host: string | null;
  port: string | null;
  hostname: string | null;
  hash: string | null;
  search: string | null;
  query: ParsedUrlQuery | string | null;
  pathname: string | null;
  path: string | null;
  href: string;
}

// `//host` inputs are parsed against this origin, then only the authority is kept.
// `.invalid` is reserved (RFC 2606), so it can never collide with a real host.
const PLACEHOLDER_ORIGIN = 'http://osd-placeholder.invalid';
const SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
// Same pattern `url.parse()` uses for its fast path: a plain path and query, nothing to escape
const SIMPLE_PATH_RE = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;
// Characters `url.parse()` percent-encodes in the path, query and hash
const AUTO_ESCAPE: Record<string, string> = {
  '\t': '%09',
  '\n': '%0A',
  '\r': '%0D',
  ' ': '%20',
  '"': '%22',
  "'": '%27',
  '<': '%3C',
  '>': '%3E',
  '\\': '%5C',
  '^': '%5E',
  '`': '%60',
  '{': '%7B',
  '|': '%7C',
  '}': '%7D',
};
const AUTO_ESCAPE_RE = /[\t\n\r "'<>\\^`{|}]/g;
// `url.parse()` leaves `javascript:` URLs unescaped
const NO_ESCAPE_SCHEMES = new Set(['javascript:']); // eslint-disable-line no-script-url
const SLASHED_SCHEMES = new Set(['http:', 'https:', 'ftp:', 'gopher:', 'file:', 'ws:', 'wss:']);

const parseQuery = (search: string): ParsedUrlQuery => {
  const query: ParsedUrlQuery = Object.create(null);
  for (const [key, value] of new URLSearchParams(search)) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing as string, value];
    }
  }
  return query;
};

/**
 * Parses `url` and returns it in the shape of Node's deprecated
 * `url.parse(url, parseQueryString, slashesDenoteHost)`.
 *
 * The authority (credentials, host and port) is parsed by the WHATWG URL parser, as browsers
 * do: hosts are normalized and an invalid host or port throws instead of being reinterpreted.
 * The path, query and hash are split and percent-encoded exactly as `url.parse()` did, so
 * URLs built from the result keep their previous form. With `slashesDenoteHost`, tabs and
 * newlines are dropped as browsers drop them, so `/\t/evil.com` reads as host `evil.com`.
 *
 * @public
 */
export function parseUrl(
  url: string,
  parseQueryString = false,
  slashesDenoteHost = false
): ParsedUrl {
  // Trim like `url.parse()`; host checks also drop tabs and newlines the way browsers do
  let input = url.replace(/^[\u0000-\u0020\u00a0\ufeff]+|[\u0000-\u0020\u00a0\ufeff]+$/g, '');
  if (slashesDenoteHost) {
    input = input.replace(/[\t\n\r]/g, '');
  }
  // Backslashes before the query or hash become slashes, as in browsers and `url.parse()`
  const split = input.search(/[?#]/);
  const head = split === -1 ? input : input.slice(0, split);
  input = head.replace(/\\/g, '/') + (split === -1 ? '' : input.slice(split));

  const result: ParsedUrl = {
    protocol: null,
    slashes: null,
    auth: null,
    host: null,
    port: null,
    hostname: null,
    hash: null,
    search: null,
    query: null,
    pathname: null,
    path: null,
    href: '',
  };

  const finish = (rest: string) => {
    const hashIdx = rest.indexOf('#');
    if (hashIdx !== -1) {
      result.hash = rest.slice(hashIdx);
      rest = rest.slice(0, hashIdx);
    }
    const questionIdx = rest.indexOf('?');
    if (questionIdx !== -1) {
      result.search = rest.slice(questionIdx);
      rest = rest.slice(0, questionIdx);
    }
    if (rest) {
      result.pathname = rest;
    } else if (result.hostname !== null && SLASHED_SCHEMES.has(result.protocol ?? '')) {
      result.pathname = '/';
    }
    result.query = parseQueryString
      ? parseQuery(result.search ?? '')
      : result.search === null
        ? null
        : result.search.slice(1);
    if (result.pathname !== null || result.search !== null) {
      result.path = `${result.pathname ?? ''}${result.search ?? ''}`;
    }
    result.href = formatUrl(result as UrlObject);
    return result;
  };

  // A plain path with no hash or credentials is returned as written, like `url.parse()`
  if (!slashesDenoteHost && !input.includes('#') && !input.includes('@')) {
    const simple = SIMPLE_PATH_RE.exec(input);
    if (simple) {
      return finish(input);
    }
  }

  let rest = input;
  const scheme = SCHEME_RE.exec(rest)?.[0];
  if (scheme) {
    result.protocol = scheme.toLowerCase();
    rest = rest.slice(scheme.length);
  }

  // Only `//authority` (or `scheme://authority`) has a host; `http:evil.com` is a path on the
  // current host to a browser resolving it inside a page, so like `url.parse()` it gets none
  if (rest.startsWith('//') && (scheme || slashesDenoteHost)) {
    const authorityEnd = rest.slice(2).search(/[/?#]/);
    let authority = authorityEnd === -1 ? rest.slice(2) : rest.slice(2, authorityEnd + 2);
    rest = authorityEnd === -1 ? '' : rest.slice(authorityEnd + 2);
    result.slashes = true;

    if (!authority && !scheme) {
      // `///evil.com` is host evil.com to a browser; host checks must see it that way
      const resolved = new URL(`//${rest.replace(/^\/+/, '')}`, PLACEHOLDER_ORIGIN);
      authority = resolved.host;
      rest = rest.replace(/^\/+[^/?#]*/, '');
    }
    if (!authority) {
      result.hostname = '';
      result.host = '';
      return finish(rest.replace(AUTO_ESCAPE_RE, (char) => AUTO_ESCAPE[char]));
    }

    const parsed = scheme
      ? new URL(`${result.protocol}//${authority}/`)
      : new URL(`//${authority}/`, PLACEHOLDER_ORIGIN);
    // WHATWG drops a default port (`:80` for http); keep it when the input spelled it out
    const explicitPort = /^(?:\[[^\]]*\]|[^:]*):(\d+)$/.exec(authority.replace(/^.*@/, ''))?.[1];
    const port = explicitPort ?? (parsed.port || null);
    result.hostname = parsed.hostname.replace(/^\[(.*)\]$/, '$1');
    result.port = port;
    result.host = `${parsed.hostname}${port ? `:${port}` : ''}`;
    // Malformed percent-encoding in the credentials throws, as with `url.parse()`
    if (parsed.username || parsed.password) {
      result.auth = `${decodeURIComponent(parsed.username)}${
        parsed.password ? `:${decodeURIComponent(parsed.password)}` : ''
      }`;
    }
  }

  if (!NO_ESCAPE_SCHEMES.has(result.protocol ?? '')) {
    rest = rest.replace(AUTO_ESCAPE_RE, (char) => AUTO_ESCAPE[char]);
  }
  return finish(rest);
}

/**
 * We define our own typings because the current version of @types/node
 * declares properties to be optional "hostname?: string".
 * Although, parse call returns "hostname: null | string".
 *
 * @public
 */
export interface URLMeaningfulParts {
  auth?: string | null;
  hash?: string | null;
  hostname?: string | null;
  pathname?: string | null;
  protocol?: string | null;
  slashes?: boolean | null;
  port?: string | null;
  query: ParsedQuery;
}

/**
 *  Takes a URL and a function that takes the meaningful parts
 *  of the URL as a key-value object, modifies some or all of
 *  the parts, and returns the modified parts formatted again
 *  as a url.
 *
 *  Url Parts sent:
 *    - protocol
 *    - slashes (does the url have the //)
 *    - auth
 *    - hostname (just the name of the host, no port or auth information)
 *    - port
 *    - pathname (the path after the hostname, no query or hash, starts
 *        with a slash if there was a path)
 *    - query (always an object, even when no query on original url)
 *    - hash
 *
 *  Why?
 *    - The default url library in node produces several conflicting
 *      properties on the "parsed" output. Modifying any of these might
 *      lead to the modifications being ignored (depending on which
 *      property was modified)
 *    - It's not always clear whether to use path/pathname, host/hostname,
 *      so this tries to add helpful constraints
 *
 *  @param url The string url to parse.
 *  @param urlModifier A function that will modify the parsed url, or return a new one.
 *  @returns The modified and reformatted url
 *  @public
 */
export function modifyUrl(
  url: string,
  urlModifier: (urlParts: URLMeaningfulParts) => Partial<URLMeaningfulParts> | void
) {
  try {
    const parsed = parseUrl(url, true) as URLMeaningfulParts;

    // Copy over the most specific version of each property. By default, the parsed url includes several
    // conflicting properties (like path and pathname + search, or search and query) and keeping track
    // of which property is actually used when they are formatted is harder than necessary.
    const meaningfulParts: URLMeaningfulParts = {
      auth: parsed.auth,
      hash: parsed.hash,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      port: parsed.port,
      protocol: parsed.protocol,
      query: parsed.query || {},
      slashes: parsed.slashes,
    };

    // The urlModifier modifies the meaningfulParts object, or returns a new one.
    const modifiedParts = urlModifier(meaningfulParts) || meaningfulParts;

    // Format the modified/replaced meaningfulParts back into a url.
    return formatUrl({
      auth: modifiedParts.auth,
      hash: modifiedParts.hash,
      hostname: modifiedParts.hostname,
      pathname: modifiedParts.pathname,
      port: modifiedParts.port,
      protocol: modifiedParts.protocol,
      query: modifiedParts.query,
      slashes: modifiedParts.slashes,
    } as UrlObject);
  } catch {
    return url; // Safe fallback to original url
  }
}

/**
 * Determine if a url is relative. Any url including a protocol, hostname, or
 * port is not considered relative. This means that absolute *paths* are considered
 * to be relative *urls*
 * @public
 */
export function isRelativeUrl(candidatePath: string) {
  try {
    // validate that `candidatePath` is not attempting a redirect to somewhere
    // outside of this OpenSearch Dashboards install
    const all = parseUrl(candidatePath, false /* parseQueryString */, true /* slashesDenoteHost */);
    const { protocol, hostname, port } = all;
    // We should explicitly compare `protocol`, `port` and `hostname` to null to make sure these are not
    // detected in the URL at all. For example `hostname` can be empty string for Node URL parser, but
    // browser (because of various bwc reasons) processes URL differently (e.g. `///abc.com` - for browser
    // hostname is `abc.com`, but for Node hostname is an empty string i.e. everything between schema (`//`)
    // and the first slash that belongs to path.
    if (protocol !== null || hostname !== null || port !== null) {
      return false;
    }
    return true;
  } catch {
    return false; // Safe fallback to "not relative"
  }
}

/**
 * Returns the origin (protocol + host + port) from given `url` if `url` is a valid absolute url, or null otherwise
 */
export function getUrlOrigin(url: string): string | null {
  try {
    const obj = parseUrl(url);
    if (!obj.protocol && !obj.hostname) {
      return null;
    }
    return `${obj.protocol}//${obj.hostname}${obj.port ? `:${obj.port}` : ''}`;
  } catch {
    return null; // Safe fallback to null
  }
}

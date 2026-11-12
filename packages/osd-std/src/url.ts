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

// Relative inputs are resolved against this origin and it is then stripped again.
// `.invalid` is reserved (RFC 2606), so it can never collide with a real host.
const PLACEHOLDER_ORIGIN = 'http://osd-placeholder.invalid';
const SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const SPECIAL_SCHEME_RE = /^(?:https?|wss?|ftp|file):/i;
// WHATWG treats `.`, `..` and their `%2e` spellings as dot segments
const DOT_SEGMENT_RE = /^(?:\.|%2e)(?:\.|%2e)?$/i;
// Stand-in for dot segments the parser must not resolve; ASCII so it passes through unencoded
const DOT_SENTINEL = 'osd-dot-segment-a7f3-';

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
 * Parses `url` with the WHATWG URL parser and returns it in the shape of Node's
 * deprecated `url.parse(url, parseQueryString, slashesDenoteHost)`.
 *
 * Relative URLs come back as `url.parse()` returned them. Absolute URLs follow the WHATWG
 * standard, as browsers do: their dot segments are resolved and the path is percent-encoded.
 * With `slashesDenoteHost`, tabs and newlines are dropped as browsers drop them, so
 * `/\t/evil.com` reads as host `evil.com`. An invalid host or port throws instead of being
 * reinterpreted.
 *
 * @public
 */
export function parseUrl(
  url: string,
  parseQueryString = false,
  slashesDenoteHost = false
): ParsedUrl {
  return parse(url, parseQueryString, slashesDenoteHost, false);
}

function parse(
  url: string,
  parseQueryString: boolean,
  slashesDenoteHost: boolean,
  forceRelative: boolean
): ParsedUrl {
  // The WHATWG parser trims leading/trailing C0 controls and spaces and drops tabs/newlines
  // anywhere. Host checks (`slashesDenoteHost`) must see the URL the way a browser does, but
  // elsewhere a dropped tab could turn `/\t/evil.com` into the network path `//evil.com`, so
  // they are percent-encoded instead, as `url.parse()` did.
  const trimmed = url.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
  const input = slashesDenoteHost
    ? trimmed.replace(/[\t\n\r]/g, '')
    : trimmed.replace(/[\t\n\r]/g, encodeURIComponent);
  const hasScheme = !forceRelative && SCHEME_RE.test(input);
  const isNetworkPath = !hasScheme && slashesDenoteHost && /^[\\/]{2}/.test(input);
  const isRelative = !hasScheme && !isNetworkPath;
  const hasAuthority = !isRelative && /^(?:[a-zA-Z][a-zA-Z\d+.-]*:)?[\\/]{2}/.test(input);

  // `http:evil.com` is a path on the current host to a browser resolving it inside a page,
  // but a host to a standalone parser. Like `url.parse()`, keep the scheme and treat the
  // rest as a path rather than guess a host.
  if (hasScheme && !hasAuthority && SPECIAL_SCHEME_RE.test(input)) {
    const protocol = SCHEME_RE.exec(input)![0].toLowerCase();
    const rest = parse(input.slice(protocol.length), parseQueryString, false, true);
    const result = { ...rest, protocol, href: '' };
    result.href = formatUrl(result as UrlObject);
    return result;
  }

  // Relative paths keep their dot segments, as with `url.parse()`: resolving `../foo` against
  // the placeholder root would turn it into `foo`, and `BasePath.prepend('/../x')` must stay
  // `/base/../x` rather than become `/base/x`.
  const rootRelative = /^[\\/]/.test(input);
  const dotSegments: string[] = [];
  const protectedInput = isRelative
    ? input.replace(/^[^?#]*/, (path) =>
        path
          .split(/([\\/])/)
          .map((seg) => {
            if (!DOT_SEGMENT_RE.test(seg)) return seg;
            dotSegments.push(seg);
            return `${DOT_SENTINEL}${dotSegments.length - 1}x`;
          })
          .join('')
      )
    : input;

  let parsed: URL;
  if (hasScheme) {
    parsed = new URL(input);
  } else if (isNetworkPath) {
    parsed = new URL(input, PLACEHOLDER_ORIGIN);
  } else {
    // Concatenate rather than resolve so a leading `//` stays part of the path.
    parsed = new URL(`${PLACEHOLDER_ORIGIN}${rootRelative ? '' : '/'}${protectedInput}`);
  }

  const beforeHash = input.split('#')[0];
  const hasHash = input.includes('#');
  const hasSearch = beforeHash.includes('?');

  let pathname: string | null = parsed.pathname;
  if (isRelative && !rootRelative) {
    pathname = pathname.slice(1);
  }
  if (dotSegments.length) {
    pathname = pathname.replace(
      new RegExp(`${DOT_SENTINEL}(\\d+)x`, 'g'),
      (_, i) => dotSegments[Number(i)]
    );
  }
  if (pathname === '' || (isRelative && !rootRelative && /^[?#]|^$/.test(input))) {
    pathname = null;
  }

  const hasHost = !isRelative && (parsed.host !== '' || hasAuthority);
  const hostname = hasHost ? parsed.hostname.replace(/^\[(.*)\]$/, '$1') : null;
  // WHATWG drops a default port (`:80` for http); keep it when the input spelled it out.
  const rawHostPort = hasAuthority
    ? /^(?:[a-zA-Z][a-zA-Z\d+.-]*:)?[\\/]{2}([^\\/?#]*)/.exec(input)![1].replace(/^.*@/, '')
    : '';
  const explicitPort = /^(?:\[[^\]]*\]|[^:]*):(\d+)$/.exec(rawHostPort)?.[1];
  const port = hasHost ? (explicitPort ?? (parsed.port || null)) : null;
  // Malformed percent-encoding in the credentials throws, as with `url.parse()`.
  const auth =
    hasHost && (parsed.username || parsed.password)
      ? `${decodeURIComponent(parsed.username)}${
          parsed.password ? `:${decodeURIComponent(parsed.password)}` : ''
        }`
      : null;
  const search = hasSearch ? parsed.search || '?' : null;
  const query = parseQueryString
    ? parseQuery(search ?? '')
    : hasSearch
      ? (search as string).slice(1)
      : null;

  const result: ParsedUrl = {
    protocol: hasScheme ? parsed.protocol : null,
    slashes: hasAuthority || null,
    auth,
    host: hasHost ? `${parsed.hostname}${port ? `:${port}` : ''}` : null,
    port,
    hostname,
    hash: hasHash ? parsed.hash || '#' : null,
    search,
    query,
    pathname,
    path: pathname === null && !search ? null : `${pathname ?? ''}${search ?? ''}`,
    href: '',
  };
  result.href = formatUrl(result as UrlObject);
  return result;
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

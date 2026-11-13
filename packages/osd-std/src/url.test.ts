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

import { modifyUrl, isRelativeUrl, getUrlOrigin, parseUrl } from './url';
import legacyUrlParse from './__fixtures__/legacy_url_parse.json';

describe('modifyUrl()', () => {
  test('supports returning a new url spec', () => {
    expect(modifyUrl('http://localhost', () => ({}))).toEqual('');
  });

  test('supports modifying the passed object', () => {
    expect(
      modifyUrl('http://localhost', (parsed) => {
        parsed.port = '9999';
        parsed.auth = 'foo:bar';
        return parsed;
      })
    ).toEqual('http://foo:bar@localhost:9999/');
  });

  test('supports changing pathname', () => {
    expect(
      modifyUrl('http://localhost/some/path', (parsed) => {
        parsed.pathname += '/subpath';
        return parsed;
      })
    ).toEqual('http://localhost/some/path/subpath');
  });

  test('supports changing port', () => {
    expect(
      modifyUrl('http://localhost:5601', (parsed) => {
        parsed.port = (Number(parsed.port!) + 1).toString();
        return parsed;
      })
    ).toEqual('http://localhost:5602/');
  });

  test('supports changing protocol', () => {
    expect(
      modifyUrl('http://localhost', (parsed) => {
        parsed.protocol = 'mail';
        parsed.slashes = false;
        parsed.pathname = null;
        return parsed;
      })
    ).toEqual('mail:localhost');
  });

  test('does not throw URIError for malformed urls', () => {
    expect(() => {
      modifyUrl('http://user:%E0%A4@example.com', () => {});
    }).not.toThrow();
  });
});

describe('isRelativeUrl()', () => {
  test('returns "true" for a relative URL', () => {
    expect(isRelativeUrl('good')).toBe(true);
    expect(isRelativeUrl('/good')).toBe(true);
    expect(isRelativeUrl('/good/even/better')).toBe(true);
  });
  test('returns "false" for a non-relative URL', () => {
    expect(isRelativeUrl('http://evil.com')).toBe(false);
    expect(isRelativeUrl('//evil.com')).toBe(false);
    expect(isRelativeUrl('///evil.com')).toBe(false);
    expect(isRelativeUrl(' //evil.com')).toBe(false);
  });
  test('does not throw URIError for malformed urls', () => {
    expect(() => {
      isRelativeUrl('http://user:%E0%A4@example.com');
    }).not.toThrow();
  });
});

describe('getOrigin', () => {
  describe('when passing an absolute url', () => {
    it('return origin without port when the url does not have a port', () => {
      expect(getUrlOrigin('https://example.com/file/to/path?example')).toEqual(
        'https://example.com'
      );
    });
    it('return origin with port when the url does have a port', () => {
      expect(getUrlOrigin('http://example.com:80/path/to/file')).toEqual('http://example.com:80');
    });
    it('does not throw URIError for malformed urls', () => {
      expect(() => {
        getUrlOrigin('http://user:%E0%A4@example.com');
      }).not.toThrow();
    });
  });
  describe('when passing a non absolute url', () => {
    it('returns null for relative url', () => {
      expect(getUrlOrigin('./path/to/file')).toBeNull();
    });
    it('returns null for absolute path', () => {
      expect(getUrlOrigin('/path/to/file')).toBeNull();
    });
    it('returns null for empty url', () => {
      expect(getUrlOrigin('')).toBeNull();
    });
  });
});

describe('parseUrl', () => {
  // `__fixtures__/legacy_url_parse.json` holds Node's deprecated `url.parse()` output, captured
  // on Node 22.23.4, for every input below in the three ways OSD called it. Rows are
  // `[input, mode, fieldsThatAreNotNull]`; a mode is only stored when it differs from `default`.
  const MODES: Record<string, [boolean, boolean]> = {
    default: [false, false],
    parseQueryString: [true, false],
    slashesDenoteHost: [false, true],
  };
  const ALL = Object.keys(MODES);
  const HOST_CHECKS = ['slashesDenoteHost'];

  // Every input/mode where `parseUrl` deliberately differs from `url.parse()`; each one has
  // its own test under "differs from url.parse()".
  const DIFFERENCES: Record<string, string[]> = {
    '//': HOST_CHECKS,
    '///': HOST_CHECKS,
    '/app/x\ty': HOST_CHECKS,
    '/app/x\ny': HOST_CHECKS,
    '///evil.com': HOST_CHECKS,
    '////evil.com': HOST_CHECKS,
    '/\t/evil.com': HOST_CHECKS,
    'java\tscript:alert(1)': HOST_CHECKS,
    'data:text/html,<b>x</b>': ALL,
    'mailto:a@b.com': ALL,
    'localhost:5601/app': ALL,
    'http://h:abc/x': ALL,
    'http://h:99999/x': ALL,
    'HTTP:/Evil.com/A?B#C': ALL,
  };

  const legacy: Record<string, Record<string, Record<string, unknown>>> = {};
  for (const [input, mode, fields] of legacyUrlParse as Array<[string, string, any]>) {
    (legacy[input] = legacy[input] || {})[mode] = fields;
  }

  const nonNull = (parsed: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => [
          key,
          key === 'query' && typeof value === 'object' ? { ...value } : value,
        ])
    );

  const sameAsLegacy = Object.entries(legacy).flatMap(([input, modes]) =>
    ALL.filter((mode) => !DIFFERENCES[input]?.includes(mode)).map(
      (mode) => [JSON.stringify(input), mode, input, modes[mode] ?? modes.default] as const
    )
  );

  it.each(sameAsLegacy)('matches url.parse() for %s (%s)', (_, mode, input, expected) => {
    expect(nonNull(parseUrl(input, ...MODES[mode]) as any)).toEqual(expected);
  });

  it('documents differences only for inputs in the fixture', () => {
    expect(Object.keys(DIFFERENCES).filter((input) => !legacy[input])).toEqual([]);
  });

  it('percent-encodes the path, query and hash as url.parse() did', () => {
    // State URLs are matched and rewritten in their encoded form, so `'` must stay `%27`
    expect(parseUrl("http://h/x#/view?q='a'").hash).toBe('#/view?q=%27a%27');
    expect(
      parseUrl("/app/discover#/?_a=(query:(language:kuery,query:'a b'))&_g=(time:(from:now-1h))")
        .hash
    ).toBe('#/?_a=(query:(language:kuery,query:%27a%20b%27))&_g=(time:(from:now-1h))');
    expect(parseUrl('http://h/a|b^c`d{e}?x="y"').path).toBe('/a%7Cb%5Ec%60d%7Be%7D?x=%22y%22');
    // A plain path and query with no whitespace is returned as written, like url.parse()
    expect(parseUrl('/app/<script>?x="y"').path).toBe('/app/<script>?x="y"');
    expect(parseUrl('/app/caf\u00e9').pathname).toBe('/app/caf\u00e9');
    expect(parseUrl('/app/x?q=a b').search).toBe('?q=a%20b');
  });

  it('keeps dot segments, as url.parse() did', () => {
    expect(parseUrl('http://h/a/../b').pathname).toBe('/a/../b');
    expect(parseUrl('/a/./b/../c').pathname).toBe('/a/./b/../c');
    expect(parseUrl('%2e%2e/foo').pathname).toBe('%2e%2e/foo');
  });

  it('percent-encodes tabs and newlines without slashesDenoteHost, as url.parse() did', () => {
    expect(parseUrl('/\t/evil.com')).toMatchObject({ hostname: null, pathname: '/%09/evil.com' });
    expect(parseUrl('/app/x\ny').pathname).toBe('/app/x%0Ay');
  });

  describe('differs from url.parse()', () => {
    it('gives non-hierarchical URLs no host', () => {
      expect(parseUrl('mailto:a@b.com')).toMatchObject({
        protocol: 'mailto:',
        auth: null,
        hostname: null,
        pathname: 'a@b.com',
      });
      expect(parseUrl('data:text/html,<b>x</b>')).toMatchObject({
        hostname: null,
        pathname: 'text/html,%3Cb%3Ex%3C/b%3E',
      });
      expect(parseUrl('localhost:5601/app')).toMatchObject({
        protocol: 'localhost:',
        hostname: null,
        pathname: '5601/app',
      });
      expect(parseUrl('HTTP:/Evil.com/A?B#C')).toMatchObject({
        protocol: 'http:',
        hostname: null,
        pathname: '/Evil.com/A',
      });
    });

    it('throws for an invalid port instead of reinterpreting it', () => {
      expect(() => parseUrl('http://h:abc/x')).toThrow('Invalid URL');
      expect(() => parseUrl('http://h:99999/x')).toThrow('Invalid URL');
    });

    it('reads hosts the way browsers do when slashesDenoteHost is set', () => {
      // Browsers drop tabs and newlines and treat `\` as `/`, so these all point at evil.com
      for (const input of [
        '//evil.com',
        ' //evil.com',
        '\\\\evil.com',
        '/\\evil.com',
        '\\/evil.com',
        '///evil.com',
        '////evil.com',
        '/\t/evil.com',
      ]) {
        expect(parseUrl(input, false, true)).toMatchObject({
          protocol: null,
          hostname: 'evil.com',
        });
      }
      expect(parseUrl('java\tscript:alert(1)', false, true).protocol).toBe('javascript:'); // eslint-disable-line no-script-url
      expect(parseUrl('/app/x\ty', false, true).pathname).toBe('/app/xy');
      expect(parseUrl('/app/x\ny', false, true).pathname).toBe('/app/xy');
      expect(() => parseUrl('//', false, true)).toThrow('Invalid URL');
      expect(() => parseUrl('///', false, true)).toThrow('Invalid URL');
    });
  });

  it('keeps an explicit default port', () => {
    expect(parseUrl('http://localhost:80/x')).toMatchObject({ host: 'localhost:80', port: '80' });
    expect(parseUrl('https://[::1]:443/x')).toMatchObject({ hostname: '::1', port: '443' });
  });

  it('decodes credentials and throws on malformed ones, as url.parse() did', () => {
    expect(parseUrl('http://user%40corp:p%3Ass@h/x').auth).toBe('user@corp:p:ss');
    expect(() => parseUrl('http://user:%E0%A4@example.com')).toThrow('URI malformed');
    expect(() => parseUrl('http://%E0%A4:pass@example.com')).toThrow('URI malformed');
  });

  it('returns a query object without a prototype', () => {
    const { query } = parseUrl('/x?__proto__=a&constructor=b', true);
    expect(Object.getPrototypeOf(query)).toBe(null);
    expect(Object.entries(query as object)).toEqual([
      ['__proto__', 'a'],
      ['constructor', 'b'],
    ]);
  });
});

describe('isRelativeUrl() over the parseUrl fixture', () => {
  // Inputs `isRelativeUrl()` accepted when it was built on `url.parse()` (Node 22.23.4)
  const RELATIVE_BEFORE = [
    '',
    ' ',
    '/',
    '/app/home',
    '/app/home/',
    'app/home',
    'foo',
    './foo',
    '../foo',
    '/a/./b/../c',
    '/a/b/..',
    '/app/dashboards#/view/abc',
    '/app/dashboards#/view/abc?_g=(filters:!(),time:(from:now-15m,to:now))',
    "/app/discover#/?_a=(query:(language:kuery,query:'a b'))&_g=(time:(from:now-1h))",
    '/app/discover?foo=bar&foo=baz#/x?y=1',
    '/app/x?q=a+b&r=%20c&s=%E2%9C%93&t=&u',
    '/app/x?=a&b=1=2&&c',
    '/app/x?a[]=1&a[]=2',
    '/app/x?bad=%E0%A4%A&ok=1',
    '/app/x?#',
    '/app/x?',
    '/app/x#',
    '?a=1',
    '#hash',
    '#/view/a?b=c',
    '/w/abc123/app/dashboards#/view/1',
    '/s/space/app/kibana',
    '/app/x y',
    "/app/it's",
    '/app/a|b^c`d{e}',
    '/app/%2Fencoded%20path',
    '/app/caf\u00e9',
    '/app/<script>',
    '/app/x\ty',
    '/app/x\ny',
    '/\t/evil.com',
    '/%2F/evil.com',
    'java\tscript:alert(1)',
    ':5601/app',
    '/../x',
    '/base/../../x',
    'a/../../b',
    '%2e%2e/foo',
    '.%2e/x',
    '/a/%2E/b',
    '\\..\\x',
    'foo/./bar?x=1#y',
  ];
  // A browser drops the tab, turning these into `//evil.com` and a `javascript:` URL
  const NO_LONGER_RELATIVE = ['/\t/evil.com', 'java\tscript:alert(1)'];

  it.each(
    (legacyUrlParse as Array<[string, string]>)
      .filter(([, mode]) => mode === 'default')
      .map(([input]) => [JSON.stringify(input), input] as const)
  )('decides %s as before, apart from tab smuggling', (_, input) => {
    const expected = RELATIVE_BEFORE.includes(input) && !NO_LONGER_RELATIVE.includes(input);
    expect(isRelativeUrl(input)).toBe(expected);
  });
});

describe('modifyUrl() with a base path', () => {
  const prepend = (url: string) =>
    modifyUrl(url, (parts) => {
      if (!parts.hostname && parts.pathname && parts.pathname.startsWith('/')) {
        parts.pathname = `/base${parts.pathname}`;
      }
    });

  it('keeps dot segments, so the base path is not collapsed', () => {
    expect(prepend('/../x')).toBe('/base/../x');
    expect(prepend('/a/./b/../c?x=1#y')).toBe('/base/a/./b/../c?x=1#y');
  });

  it('keeps an explicit default port', () => {
    expect(prepend('http://localhost:80/x')).toBe('http://localhost:80/x');
  });

  it('returns the url unchanged when it cannot be parsed', () => {
    expect(prepend('http://h:abc/x')).toBe('http://h:abc/x');
    expect(prepend('http://user:%E0%A4@example.com')).toBe('http://user:%E0%A4@example.com');
  });

  it('round-trips state URLs', () => {
    const url =
      '/app/data-explorer/discover#?_a=(discover:(columns:!(_source)),metadata:(indexPattern:%27ff95%27,view:discover))&_g=(time:(from:now-15m,to:now))';
    expect(prepend(url)).toBe(`/base${url}`);
  });
});

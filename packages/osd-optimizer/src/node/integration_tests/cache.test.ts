/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Path from 'path';
import { Writable } from 'stream';
import del from 'del';
import { Cache } from '../cache';

const DIR = Path.resolve(__dirname, '../__tmp__/cache');
const caches: Cache[] = [];
const getTestLog = () => {
  const log = Object.assign(
    new Writable({
      write(chunk, _enc, cb) {
        log.output += chunk;
        cb();
      },
    }),
    {
      output: '',
    }
  );
  return log;
};
const getTestCache = (...options: ConstructorParameters<typeof Cache>) => {
  const cache = new Cache(...options);
  caches.push(cache);
  return cache;
};

beforeEach(async () => await del(DIR));
afterEach(async () => {
  await del(DIR);
  for (const cache of caches) {
    cache.close();
  }
  caches.length = 0;
});

it('cache returns undefined until values are set', async () => {
  const log = getTestLog();
  const cache = getTestCache({
    dir: DIR,
    log,
    pathRoot: '/testPathRoot',
    prefix: 'testPrefix',
  });
  const mtime = new Date().toJSON();
  const path = '/testPathRoot/testFile.js';

  expect(cache.getMtime(path)).toBe(undefined);
  expect(cache.getCode(path)).toBe(undefined);
  expect(cache.getSourceMap(path)).toBe(undefined);

  await cache.update(path, {
    mtime,
    code: 'var answer = 42',
    map: { testPathRoot: 'testFile' },
  });

  expect(cache.getMtime(path)).toBe(mtime);
  expect(cache.getCode(path)).toBe('var answer = 42');
  expect(cache.getSourceMap(path)).toEqual({ testPathRoot: 'testFile' });
  expect(log.output).toMatchInlineSnapshot(`
  "
    MISS   [codes]   testPrefix:testFile.js
    MISS   [mtimes]   testPrefix:testFile.js
    MISS   [sourceMaps]   testPrefix:testFile.js
    PUT   [atimes]   testPrefix:testFile.js
    PUT   [codes]   testPrefix:testFile.js
    PUT   [mtimes]   testPrefix:testFile.js
    PUT   [sourceMaps]   testPrefix:testFile.js
    HIT   [codes]   testPrefix:testFile.js
    HIT   [mtimes]   testPrefix:testFile.js
    HIT   [sourceMaps]   testPrefix:testFile.js
    "
  `);
});

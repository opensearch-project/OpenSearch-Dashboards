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

import { resolve, sep } from 'path';

import { File } from './file';

const HERE = resolve(__dirname, __filename);

describe('dev/File', () => {
  describe('constructor', () => {
    it('throws if path is not a string', () => {
      // @ts-ignore to test wrong args
      expect(() => new File()).toThrowError();
      // @ts-ignore to test wrong args
      expect(() => new File(1)).toThrowError();
      // @ts-ignore to test wrong args
      expect(() => new File(false)).toThrowError();
      // @ts-ignore to test wrong args
      expect(() => new File(null)).toThrowError();
    });
  });

  describe('#getRelativePath()', () => {
    it('returns the path relative to the repo root', () => {
      const file = new File(HERE);
      expect(file.getRelativePath()).toEqual(['src', 'dev', 'file.test.ts'].join(sep));
    });
  });

  describe('#isJs()', () => {
    it('returns true if extension is .js', () => {
      const file = new File('file.js');
      expect(file.isJs()).toEqual(true);
    });
    it('returns false if extension is .xml', () => {
      const file = new File('file.xml');
      expect(file.isJs()).toEqual(false);
    });
    it('returns false if extension is .css', () => {
      const file = new File('file.css');
      expect(file.isJs()).toEqual(false);
    });
    it('returns false if extension is .html', () => {
      const file = new File('file.html');
      expect(file.isJs()).toEqual(false);
    });
    it('returns false if file has no extension', () => {
      const file = new File('file');
      expect(file.isJs()).toEqual(false);
    });
  });

  describe('#getRelativeParentDirs()', () => {
    it('returns the parents of a file, stopping at the repo root, in descending order', () => {
      const file = new File(HERE);
      expect(file.getRelativeParentDirs()).toEqual([
        ['src', 'dev'].join(sep), // src/dev
        'src',
      ]);
    });
  });

  describe('#toString()', () => {
    it('returns the relativePath', () => {
      const file = new File(HERE);
      expect(file.toString()).toEqual(file.getRelativePath());
    });
  });

  describe('#toJSON()', () => {
    it('returns the relativePath', () => {
      const file = new File(HERE);
      expect(file.toJSON()).toEqual(file.getRelativePath());
    });
  });
});

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

import { mockMakeDirAsync, mockWriteFileAsync } from './integrate_locale_files.test.mocks';

import { resolve, join } from 'path';
import { integrateLocaleFiles, verifyMessages } from './integrate_locale_files';
import { relativeToRepoRoot, standardize } from '@osd/cross-platform';

const currentDir = relativeToRepoRoot(__dirname)!;
const testPath = resolve(currentDir, '__fixtures__', 'integrate_locale_files');

const localePathA = join(testPath, 'fr.json');

const localePathB = join(testPath, 'tr.json');
const targetPathB = join(testPath, 'destination', 'tr.json');

const missingMessagesPath = join(testPath, 'missing_messages.json');
// Non-existing path
const missingMessagesTargetPath = join(testPath, 'destination', 'missing_messages.json');

const missingFormatsPath = join(testPath, 'missing_formats.json');
// Non-existing path
const missingFormatsTargetPath = join(testPath, 'destination', 'missing_formats.json');

const mockDefaultMessagesMapA = new Map([
  ['plugin-1.message-id-1', { message: 'Message text 1' }],
  ['plugin-1.message-id-2', { message: 'Message text 2' }],
  ['plugin-2.message-id', { message: 'Message text' }],
]);
const mockDefaultMessagesMapB = new Map([
  ['plugin-1.message-id-1', { message: 'Message text 1' }],
  ['plugin-1.message-id-2', { message: 'Message text 2' }],
  ['plugin-2.message-id-1', { message: 'Message text 1' }],
  ['plugin-2.message-id-2', { message: 'Message text 2' }],
  ['plugin-3.message-id-1', { message: 'Message text 1' }],
  ['plugin-4.message-id-1', { message: 'Message text 1' }],
]);

const defaultIntegrateOptions = {
  sourceFileName: localePathA,
  dryRun: false,
  ignoreIncompatible: false,
  ignoreMalformed: false,
  ignoreMissing: false,
  ignoreUnused: false,
  config: {
    paths: {
      'plugin-1': ['src/dev/i18n/__fixtures__/integrate_locale_files/test_plugin_1'],
      'plugin-2': ['src/dev/i18n/__fixtures__/integrate_locale_files/test_plugin_2'],
      'plugin-3': ['src/dev/i18n/__fixtures__/integrate_locale_files/test_plugin_3'],
      'plugin-4': ['src/dev/i18n/__fixtures__/integrate_locale_files/test_plugin_4'],
    },
    exclude: [],
    translations: [],
  },
  log: { success: jest.fn(), warning: jest.fn() } as any,
};

describe('dev/i18n/integrate_locale_files', () => {
  describe('verifyMessages', () => {
    test('validates localized messages', () => {
      const localizedMessagesMap = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-1.message-id-2', 'Translated text 2'],
        ['plugin-2.message-id', 'Translated text'],
      ]);

      expect(() =>
        verifyMessages(localizedMessagesMap, mockDefaultMessagesMapA, defaultIntegrateOptions)
      ).not.toThrow();
    });

    test('throws an error for unused id, missing id or the incompatible ones', () => {
      const localizedMessagesMapWithMissingMessage = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-2.message-id', 'Translated text'],
      ]);

      const localizedMessagesMapWithUnusedMessage = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-1.message-id-2', 'Translated text 2'],
        ['plugin-1.message-id-3', 'Translated text 3'],
        ['plugin-2.message-id', 'Translated text'],
      ]);

      const localizedMessagesMapWithIdTypo = new Map([
        ['plugin-1.message-id-1', 'Message text 1'],
        ['plugin-1.message-id-2', 'Message text 2'],
        ['plugin-2.message', 'Message text'],
      ]);

      const localizedMessagesMapWithUnknownValues = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-1.message-id-2', 'Translated text 2 with some unknown {value}'],
        ['plugin-2.message-id', 'Translated text'],
      ]);

      expect(() =>
        verifyMessages(
          localizedMessagesMapWithMissingMessage,
          mockDefaultMessagesMapA,
          defaultIntegrateOptions
        )
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        verifyMessages(
          localizedMessagesMapWithUnusedMessage,
          mockDefaultMessagesMapA,
          defaultIntegrateOptions
        )
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        verifyMessages(
          localizedMessagesMapWithIdTypo,
          mockDefaultMessagesMapA,
          defaultIntegrateOptions
        )
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        verifyMessages(
          localizedMessagesMapWithUnknownValues,
          mockDefaultMessagesMapA,
          defaultIntegrateOptions
        )
      ).toThrowErrorMatchingSnapshot();
    });

    test('removes unused ids if `ignoreUnused` is set', () => {
      const localizedMessagesMapWithUnusedMessage = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-1.message-id-2', 'Translated text 2'],
        ['plugin-1.message-id-3', 'Some old translated text 3'],
        ['plugin-2.message-id', 'Translated text'],
        ['plugin-2.message', 'Some old translated text'],
      ]);

      verifyMessages(localizedMessagesMapWithUnusedMessage, mockDefaultMessagesMapA, {
        ...defaultIntegrateOptions,
        ignoreUnused: true,
      });

      expect(localizedMessagesMapWithUnusedMessage).toMatchInlineSnapshot(`
Map {
  "plugin-1.message-id-1" => "Translated text 1",
  "plugin-1.message-id-2" => "Translated text 2",
  "plugin-2.message-id" => "Translated text",
}
`);
    });

    test('removes ids with incompatible ICU structure if `ignoreIncompatible` is set', () => {
      const localizedMessagesMapWithIncompatibleMessage = new Map([
        ['plugin-1.message-id-1', 'Translated text 1'],
        ['plugin-1.message-id-2', 'Translated text 2 with some unknown {value}'],
        ['plugin-2.message-id', 'Translated text'],
      ]);

      verifyMessages(localizedMessagesMapWithIncompatibleMessage, mockDefaultMessagesMapA, {
        ...defaultIntegrateOptions,
        ignoreIncompatible: true,
      });

      expect(localizedMessagesMapWithIncompatibleMessage).toMatchInlineSnapshot(`
Map {
  "plugin-1.message-id-1" => "Translated text 1",
  "plugin-2.message-id" => "Translated text",
}
`);
    });
  });

  describe('integrateLocaleFiles', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('splits locale file by plugins and writes them into the right folders', async () => {
      await integrateLocaleFiles(mockDefaultMessagesMapA, defaultIntegrateOptions);

      const [[path1, json1], [path2, json2]] = mockWriteFileAsync.mock.calls;
      const [[dirPath1], [dirPath2]] = mockMakeDirAsync.mock.calls;

      expect([standardize(relativeToRepoRoot(path1)!), json1]).toMatchSnapshot();
      expect([standardize(relativeToRepoRoot(path2)!), json2]).toMatchSnapshot();
      expect([
        standardize(relativeToRepoRoot(dirPath1)!),
        standardize(relativeToRepoRoot(dirPath2)!),
      ]).toMatchSnapshot();
    });

    test('updates existing translations', async () => {
      await integrateLocaleFiles(mockDefaultMessagesMapB, {
        ...defaultIntegrateOptions,
        sourceFileName: localePathB,
        targetFileName: targetPathB,
        update: true,
        ignoreUnused: true,
        ignoreMissing: true,
      });

      const [[path1, json1]] = mockWriteFileAsync.mock.calls;

      expect([standardize(relativeToRepoRoot(path1)!), json1]).toMatchSnapshot();
      expect(mockMakeDirAsync).not.toHaveBeenCalled();
    });

    test('fails on locale files missing formats object', async () => {
      const action = async () => {
        await integrateLocaleFiles(mockDefaultMessagesMapB, {
          ...defaultIntegrateOptions,
          sourceFileName: missingFormatsPath,
          targetFileName: missingFormatsTargetPath,
          ignoreUnused: true,
          ignoreMissing: true,
        });
      };

      expect(mockWriteFileAsync).not.toHaveBeenCalled();
      expect(mockMakeDirAsync).not.toHaveBeenCalled();
      await expect(action()).rejects.toThrowError('Locale file should contain a "formats" object.');
    });

    test('adds translations despite missing formats object', async () => {
      await integrateLocaleFiles(mockDefaultMessagesMapB, {
        ...defaultIntegrateOptions,
        sourceFileName: missingFormatsPath,
        targetFileName: missingFormatsTargetPath,
        ignoreUnused: true,
        ignoreMissing: true,
        ignoreMissingFormats: true,
      });

      const [[path1, json1]] = mockWriteFileAsync.mock.calls;

      expect([standardize(relativeToRepoRoot(path1)!), json1]).toMatchSnapshot();
      expect(mockMakeDirAsync).not.toHaveBeenCalled();
    });

    test('fails on locale files missing messages object', async () => {
      const action = async () => {
        await integrateLocaleFiles(mockDefaultMessagesMapB, {
          ...defaultIntegrateOptions,
          sourceFileName: missingMessagesPath,
          targetFileName: missingMessagesTargetPath,
          ignoreUnused: true,
          ignoreMissing: true,
        });
      };

      expect(mockWriteFileAsync).not.toHaveBeenCalled();
      expect(mockMakeDirAsync).not.toHaveBeenCalled();
      await expect(action()).rejects.toThrowError(
        'Locale file should contain a "messages" object.'
      );
    });
  });
});

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

import { SavedObjectsImportUnknownError } from 'src/core/public';
import { httpServiceMock } from '../../../../core/public/mocks';
import { resolveImportErrors } from './resolve_import_errors';

function getFormData(form: Map<string, any>) {
  const formData: Record<string, any> = {};
  for (const [key, val] of form.entries()) {
    if (key === 'retries') {
      formData[key] = JSON.parse(val);
      continue;
    }
    formData[key] = val;
  }
  return formData;
}

describe('resolveImportErrors', () => {
  const getConflictResolutions = jest.fn();
  let httpMock: ReturnType<typeof httpServiceMock.createSetupContract>;

  beforeEach(() => {
    httpMock = httpServiceMock.createSetupContract();
    jest.resetAllMocks();
  });

  const extractBodyFromCall = (index: number): Map<string, any> => {
    return (httpMock.post.mock.calls[index] as any)[1].body;
  };

  test('works with empty import failures', async () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const result = await resolveImportErrors({
      http: httpMock,
      getConflictResolutions,
      state: { importCount: 0, importMode: { createNewCopies: false, overwrite: false } },
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failedImports": Array [],
        "importCount": 0,
        "status": "success",
        "successfulImports": Array [],
      }
    `);
  });

  test(`doesn't retry if only unknown failures are passed in`, async () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const result = await resolveImportErrors({
      http: httpMock,
      getConflictResolutions,
      state: {
        importCount: 0,
        failedImports: [
          {
            obj: {
              type: 'a',
              id: '1',
              meta: {},
            },
            error: { type: 'unknown' } as SavedObjectsImportUnknownError,
          },
        ],
        importMode: { createNewCopies: false, overwrite: false },
      },
    });
    expect(httpMock.post).not.toHaveBeenCalled();
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failedImports": Array [
          Object {
            "error": Object {
              "type": "unknown",
            },
            "obj": Object {
              "id": "1",
              "meta": Object {},
              "type": "a",
            },
          },
        ],
        "importCount": 0,
        "status": "success",
        "successfulImports": Array [],
      }
    `);
  });

  test('resolves conflicts', async () => {
    httpMock.post.mockResolvedValueOnce({
      success: true,
      successCount: 2,
      successResults: [
        { type: 'a', id: '1' },
        { type: 'a', id: '2', destinationId: 'x' },
      ],
    });
    getConflictResolutions.mockReturnValueOnce({
      'a:1': { retry: true, options: { overwrite: true } },
      'a:2': { retry: true, options: { overwrite: true, destinationId: 'x' } },
      'a:3': { retry: false },
    });
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const result = await resolveImportErrors({
      http: httpMock,
      getConflictResolutions,
      state: {
        importCount: 0,
        failedImports: [
          { obj: { type: 'a', id: '1', meta: {} }, error: { type: 'conflict' } },
          {
            obj: { type: 'a', id: '2', meta: {} },
            error: { type: 'conflict', destinationId: 'x' },
          },
          { obj: { type: 'a', id: '3', meta: {} }, error: { type: 'conflict' } },
        ],
        importMode: { createNewCopies: false, overwrite: false },
      },
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failedImports": Array [],
        "importCount": 2,
        "status": "success",
        "successfulImports": Array [
          Object {
            "id": "1",
            "type": "a",
          },
          Object {
            "destinationId": "x",
            "id": "2",
            "type": "a",
          },
        ],
      }
    `);

    const formData = getFormData(extractBodyFromCall(0));
    expect(formData).toMatchInlineSnapshot(`
      Object {
        "file": "undefined",
        "retries": Array [
          Object {
            "id": "1",
            "overwrite": true,
            "type": "a",
          },
          Object {
            "destinationId": "x",
            "id": "2",
            "overwrite": true,
            "type": "a",
          },
        ],
      }
    `);
  });

  test(`doesn't resolve missing references if newIndexPatternId isn't defined`, async () => {
    getConflictResolutions.mockResolvedValueOnce({});
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const result = await resolveImportErrors({
      http: httpMock,
      getConflictResolutions,
      state: {
        importCount: 0,
        unmatchedReferences: [
          { existingIndexPatternId: '2', newIndexPatternId: undefined, list: [] },
        ],
        failedImports: [
          {
            obj: {
              type: 'a',
              id: '1',
              meta: {},
            },
            error: {
              type: 'missing_references',
              references: [{ type: 'index-pattern', id: '2' }],
            },
          },
        ],
        importMode: { createNewCopies: false, overwrite: false },
      },
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failedImports": Array [],
        "importCount": 0,
        "status": "success",
        "successfulImports": Array [],
      }
    `);
  });

  test('handles missing references then conflicts on the same errored objects', async () => {
    httpMock.post.mockResolvedValueOnce({
      success: false,
      successCount: 0,
      errors: [{ type: 'a', id: '1', error: { type: 'conflict' } }],
    });
    httpMock.post.mockResolvedValueOnce({
      success: true,
      successCount: 1,
      successResults: [{ type: 'a', id: '1' }],
    });
    getConflictResolutions.mockResolvedValueOnce({});
    getConflictResolutions.mockResolvedValueOnce({
      'a:1': { retry: true, options: { overwrite: true } },
    });
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const result = await resolveImportErrors({
      http: httpMock,
      getConflictResolutions,
      state: {
        importCount: 0,
        unmatchedReferences: [{ existingIndexPatternId: '2', newIndexPatternId: '3', list: [] }],
        failedImports: [
          {
            obj: { type: 'a', id: '1', meta: {} },
            error: { type: 'missing_references', references: [{ type: 'index-pattern', id: '2' }] },
          },
        ],
        importMode: { createNewCopies: false, overwrite: false },
      },
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failedImports": Array [],
        "importCount": 1,
        "status": "success",
        "successfulImports": Array [
          Object {
            "id": "1",
            "type": "a",
          },
        ],
      }
    `);
    const formData1 = getFormData(extractBodyFromCall(0));
    expect(formData1).toMatchInlineSnapshot(`
      Object {
        "file": "undefined",
        "retries": Array [
          Object {
            "id": "1",
            "replaceReferences": Array [
              Object {
                "from": "2",
                "to": "3",
                "type": "index-pattern",
              },
            ],
            "type": "a",
          },
        ],
      }
    `);
    const formData2 = getFormData(extractBodyFromCall(1));
    expect(formData2).toMatchInlineSnapshot(`
      Object {
        "file": "undefined",
        "retries": Array [
          Object {
            "id": "1",
            "overwrite": true,
            "replaceReferences": Array [
              Object {
                "from": "2",
                "to": "3",
                "type": "index-pattern",
              },
            ],
            "type": "a",
          },
        ],
      }
    `);
  });
});

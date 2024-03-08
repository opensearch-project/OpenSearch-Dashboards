/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchExportByTypeAndSearch } from './fetch_export_by_type_and_search';
import { httpServiceMock } from '../../../../core/public/mocks';

describe('fetchExportByTypeAndSearch', () => {
  it('make http call with body provided', async () => {
    const httpClient = httpServiceMock.createStartContract();
    await fetchExportByTypeAndSearch(httpClient, [], undefined, undefined, {
      workspaces: ['foo'],
    });
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/saved_objects/_export",
            Object {
              "body": "{\\"workspaces\\":[\\"foo\\"],\\"type\\":[],\\"includeReferencesDeep\\":false}",
            },
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });
});

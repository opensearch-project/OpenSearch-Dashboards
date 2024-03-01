/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchExportObjects } from './fetch_export_objects';
import { httpServiceMock } from '../../../../core/public/mocks';

describe('fetchExportObjects', () => {
  it('make http call with body provided', async () => {
    const httpClient = httpServiceMock.createStartContract();
    await fetchExportObjects(httpClient, [], false, {
      workspaces: ['foo'],
    });
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/saved_objects/_export",
            Object {
              "body": "{\\"workspaces\\":[\\"foo\\"],\\"objects\\":[],\\"includeReferencesDeep\\":false}",
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

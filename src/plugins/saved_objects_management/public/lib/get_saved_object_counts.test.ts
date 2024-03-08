/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSavedObjectCounts } from './get_saved_object_counts';
import { httpServiceMock } from '../../../../core/public/mocks';

describe('getSavedObjectCounts', () => {
  it('make http call with body provided', async () => {
    const httpClient = httpServiceMock.createStartContract();
    await getSavedObjectCounts(httpClient, {
      typesToInclude: [],
      workspaces: ['foo'],
    });
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/opensearch-dashboards/management/saved_objects/scroll/counts",
            Object {
              "body": "{\\"typesToInclude\\":[],\\"workspaces\\":[\\"foo\\"]}",
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

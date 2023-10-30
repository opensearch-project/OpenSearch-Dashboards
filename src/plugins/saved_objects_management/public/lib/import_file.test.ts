/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { importFile } from './import_file';
import { httpServiceMock } from '../../../../core/public/mocks';

describe('importFile', () => {
  it('make http call with body provided', async () => {
    const httpClient = httpServiceMock.createStartContract();
    const blob = new Blob(['']);
    await importFile(httpClient, new File([blob], 'foo.ndjson'), {
      overwrite: true,
      createNewCopies: false,
      workspaces: ['foo'],
    });
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/saved_objects/_import",
            Object {
              "body": FormData {},
              "headers": Object {
                "Content-Type": undefined,
              },
              "query": Object {
                "overwrite": true,
                "workspaces": Array [
                  "foo",
                ],
              },
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

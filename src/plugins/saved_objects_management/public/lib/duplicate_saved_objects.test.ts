/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { duplicateSavedObjects } from './duplicate_saved_objects';

describe('copy saved objects', () => {
  const httpClient = httpServiceMock.createStartContract();
  const objects = [
    { type: 'dashboard', id: '1' },
    { type: 'visualization', id: '2' },
  ];
  const targetWorkspace = '1';

  it('make http call with all parameter provided', async () => {
    const includeReferencesDeep = true;
    await duplicateSavedObjects(httpClient, objects, targetWorkspace, includeReferencesDeep);
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/workspaces/_duplicate_saved_objects",
            Object {
              "body": "{\\"objects\\":[{\\"type\\":\\"dashboard\\",\\"id\\":\\"1\\"},{\\"type\\":\\"visualization\\",\\"id\\":\\"2\\"}],\\"includeReferencesDeep\\":true,\\"targetWorkspace\\":\\"1\\"}",
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

  it('make http call without includeReferencesDeep parameter provided', async () => {
    await duplicateSavedObjects(httpClient, objects, targetWorkspace);
    expect(httpClient.post).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "/api/workspaces/_duplicate_saved_objects",
            Object {
              "body": "{\\"objects\\":[{\\"type\\":\\"dashboard\\",\\"id\\":\\"1\\"},{\\"type\\":\\"visualization\\",\\"id\\":\\"2\\"}],\\"includeReferencesDeep\\":true,\\"targetWorkspace\\":\\"1\\"}",
            },
          ],
          Array [
            "/api/workspaces/_duplicate_saved_objects",
            Object {
              "body": "{\\"objects\\":[{\\"type\\":\\"dashboard\\",\\"id\\":\\"1\\"},{\\"type\\":\\"visualization\\",\\"id\\":\\"2\\"}],\\"includeReferencesDeep\\":true,\\"targetWorkspace\\":\\"1\\"}",
            },
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });
});

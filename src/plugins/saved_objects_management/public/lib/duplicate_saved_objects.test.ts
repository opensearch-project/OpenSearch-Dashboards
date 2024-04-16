/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { duplicateSavedObjects } from './duplicate_saved_objects';

describe('copy saved objects', () => {
  it('make http call with body provided', async () => {
    const httpClient = httpServiceMock.createStartContract();
    const objects = [
      { type: 'dashboard', id: '1' },
      { type: 'visualization', id: '2' },
    ];
    const includeReferencesDeep = true;
    const targetWorkspace = '1';
    await duplicateSavedObjects(httpClient, objects, includeReferencesDeep, targetWorkspace);
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

    await duplicateSavedObjects(httpClient, objects, undefined, targetWorkspace);
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

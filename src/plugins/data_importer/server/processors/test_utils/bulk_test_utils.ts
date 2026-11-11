/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { opensearchServiceMock } from '../../../../../core/server/mocks';

type ClientMock = ReturnType<typeof opensearchServiceMock.createOpenSearchClient>;

export const MAPPER_PARSING_REASON =
  "failed to parse field [age] of type [integer] in document with id 'x'. Preview of field's value: 'abc'";

/**
 * Mock `client.bulk` with the verified `_bulk` response shape: always HTTP 200, `errors: true` if
 * any item failed, per-item `index.status` + `index.error.{type,reason}`.
 *
 * @param failingDocs 1-based positions (in send order, across all bulk calls) that should fail
 *   with a mapper_parsing_exception
 */
export const mockBulk = (client: ClientMock, failingDocs: number[] = []) => {
  let sent = 0;
  client.bulk.mockImplementation(((params: { body: unknown[] }) => {
    const items = Array.from({ length: params.body.length / 2 }, () => {
      sent++;
      return failingDocs.includes(sent)
        ? {
            index: {
              status: 400,
              error: { type: 'mapper_parsing_exception', reason: MAPPER_PARSING_REASON },
            },
          }
        : { index: { status: 201 } };
    });
    return Promise.resolve(
      opensearchServiceMock.createApiResponse({
        statusCode: 200,
        body: { took: 1, errors: items.some((i) => i.index.status >= 300), items },
      })
    );
  }) as unknown as ClientMock['bulk']);
};

/**
 * All documents sent through `client.bulk`, in order (action lines stripped)
 */
export const bulkDocs = (client: ClientMock): Array<Record<string, unknown>> =>
  client.bulk.mock.calls.flatMap((call: unknown[]) => {
    const body = (call[0] as { body: Array<Record<string, unknown>> }).body;
    return body.filter((_, i) => i % 2 === 1);
  });

/**
 * All bulk action lines sent, in order
 */
export const bulkActions = (client: ClientMock): Array<Record<string, unknown>> =>
  client.bulk.mock.calls.flatMap((call: unknown[]) => {
    const body = (call[0] as { body: Array<Record<string, unknown>> }).body;
    return body.filter((_, i) => i % 2 === 0);
  });

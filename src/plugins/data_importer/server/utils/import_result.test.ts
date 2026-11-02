/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { finishImport } from './import_result';
import { pointLookupAlias } from './lookup_alias';

jest.mock('./lookup_alias', () => ({
  ...jest.requireActual('./lookup_alias'),
  pointLookupAlias: jest.fn(),
}));

const mockPointLookupAlias = pointLookupAlias as jest.Mock;

describe('finishImport', () => {
  const client = {} as any;
  const logger = { error: jest.fn() };
  const params = {
    client,
    indexName: 'idx',
    importIdentifier: 'my-lookup',
    lookupId: 'uuid',
    logger,
  };
  const allOk = { total: 3, message: 'Indexed 3 documents', failedRows: [] };
  const someFailed = { total: 3, message: 'Indexed 1 documents', failedRows: [2, 3] };
  const allFailed = { total: 2, message: 'Indexed 0 documents', failedRows: [1, 2] };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPointLookupAlias.mockResolvedValue(true);
  });

  it('reports success without alias fields when no import identifier was requested', async () => {
    const body = await finishImport(allOk, { client, indexName: 'idx', logger });
    expect(body).toEqual({ message: allOk, success: true, partial: false });
    expect(mockPointLookupAlias).not.toHaveBeenCalled();
  });

  it('points the alias at this import when rows landed', async () => {
    const body = await finishImport(allOk, params);
    expect(body).toEqual({ message: allOk, success: true, partial: false, aliasCreated: true });
    expect(mockPointLookupAlias).toHaveBeenCalledWith(client, {
      indexName: 'idx',
      alias: 'my-lookup',
      lookupId: 'uuid',
      lookupField: '__lookup',
      filterField: '__lookup',
      keepExisting: false,
    });
  });

  it('moves an existing lookup on a full import (keepExisting=false)', async () => {
    await finishImport(allOk, params);
    expect(mockPointLookupAlias.mock.calls[0][1]).toMatchObject({ keepExisting: false });
  });

  it('creates the alias on partial failure when no previous lookup binding exists', async () => {
    const body = await finishImport(someFailed, params);
    expect(mockPointLookupAlias.mock.calls[0][1]).toMatchObject({ keepExisting: true });
    expect(body).toEqual({
      message: someFailed,
      success: false,
      partial: true,
      aliasCreated: true,
    });
  });

  it('keeps an existing lookup on its previous import when this import is partial', async () => {
    // Moving the alias onto incomplete data would silently break a working lookup
    mockPointLookupAlias.mockResolvedValue(false);

    const body = await finishImport(someFailed, params);

    expect(body).toEqual({
      message: someFailed,
      success: false,
      partial: true,
      aliasCreated: false,
      aliasError:
        "2 of 3 rows failed, so lookup 'my-lookup' still points at the previous import. " +
        'Fix the failed rows and re-import to update it.',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('passes the lookup filter field through to the alias', async () => {
    await finishImport(allOk, { ...params, lookupFilterField: '__lookup.keyword' });
    expect(mockPointLookupAlias.mock.calls[0][1]).toMatchObject({
      lookupField: '__lookup',
      filterField: '__lookup.keyword',
    });
  });

  it('surfaces a name collision with a non-importer alias as aliasError', async () => {
    mockPointLookupAlias.mockRejectedValue(
      new Error(
        'The name "my-lookup" is already used by an alias not managed by the importer. ' +
          'Choose another import identifier.'
      )
    );
    const body = await finishImport(allOk, params);
    expect(body.aliasCreated).toBe(false);
    expect(body.aliasError).toBe(
      'The name "my-lookup" is already used by an alias not managed by the importer. ' +
        'Choose another import identifier.'
    );
  });

  it('skips the alias when no rows landed', async () => {
    const body = await finishImport(allFailed, params);
    expect(body).toEqual({
      message: allFailed,
      success: false,
      partial: false,
      aliasCreated: false,
    });
    expect(mockPointLookupAlias).not.toHaveBeenCalled();
  });

  it('returns a user-facing aliasError and logs when the alias cannot be created', async () => {
    mockPointLookupAlias.mockRejectedValue(
      Object.assign(new Error('security_exception'), { statusCode: 403 })
    );
    const body = await finishImport(allOk, params);
    expect(body).toEqual({
      message: allOk,
      success: true,
      partial: false,
      aliasCreated: false,
      aliasError: 'You do not have permission to manage aliases. Try creating an index directly.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create alias my-lookup')
    );
  });
});

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
    mockPointLookupAlias.mockResolvedValue(undefined);
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
    });
  });

  it('still creates the alias on partial failure so landed rows stay addressable', async () => {
    const body = await finishImport(someFailed, params);
    expect(body).toEqual({
      message: someFailed,
      success: false,
      partial: true,
      aliasCreated: true,
    });
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

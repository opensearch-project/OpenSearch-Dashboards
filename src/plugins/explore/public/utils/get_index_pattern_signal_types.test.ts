/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { getIndexPatternSignalTypes } from './get_index_pattern_signal_types';

describe('getIndexPatternSignalTypes', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;

  beforeEach(() => {
    mockSavedObjectsClient = { find: jest.fn() } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('projects to signalType only in the find request', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [{ id: 'a', attributes: { signalType: 'logs' }, references: [] }],
      total: 1,
    } as any);

    await getIndexPatternSignalTypes(mockSavedObjectsClient);

    expect(mockSavedObjectsClient.find).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'index-pattern', fields: ['signalType'] })
    );
  });

  it('resolves the data source id from references and id-encoded formats', async () => {
    const uuid = '12345678-1234-1234-1234-123456789012';
    mockSavedObjectsClient.find.mockResolvedValue({
      savedObjects: [
        {
          id: 'via-references',
          attributes: { signalType: 'traces' },
          references: [{ id: 'ds-ref', type: 'data-source', name: 'dataSource' }],
        },
        // <dataSourceId>_<...> encoded id where the data source id is a UUID prefix
        { id: `${uuid}_index-pattern-id`, attributes: { signalType: 'traces' }, references: [] },
        // <dataSourceId>::<...> encoded id, no references
        { id: 'ds-colon::index-pattern-id', attributes: { signalType: 'logs' }, references: [] },
        // local cluster (no data source anywhere)
        { id: 'local-pattern', attributes: { signalType: 'logs' }, references: [] },
      ],
      total: 4,
    } as any);

    const result = await getIndexPatternSignalTypes(mockSavedObjectsClient);

    expect(result).toEqual([
      { id: 'via-references', signalType: 'traces', dataSourceId: 'ds-ref' },
      { id: `${uuid}_index-pattern-id`, signalType: 'traces', dataSourceId: uuid },
      { id: 'ds-colon::index-pattern-id', signalType: 'logs', dataSourceId: 'ds-colon' },
      { id: 'local-pattern', signalType: 'logs', dataSourceId: undefined },
    ]);
  });

  it('paginates until every index pattern has been read', async () => {
    mockSavedObjectsClient.find
      .mockResolvedValueOnce({
        savedObjects: [
          { id: 'p1', attributes: { signalType: 'logs' }, references: [] },
          { id: 'p2', attributes: { signalType: 'traces' }, references: [] },
        ],
        total: 3,
      } as any)
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'p3', attributes: { signalType: 'metrics' }, references: [] }],
        total: 3,
      } as any);

    const result = await getIndexPatternSignalTypes(mockSavedObjectsClient);

    expect(result.map((r) => r.id)).toEqual(['p1', 'p2', 'p3']);
    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
    expect(mockSavedObjectsClient.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1 })
    );
    expect(mockSavedObjectsClient.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2 })
    );
  });

  it('stops when a page returns no results even if total is missing', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] } as any);

    const result = await getIndexPatternSignalTypes(mockSavedObjectsClient);

    expect(result).toEqual([]);
    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(1);
  });

  it('returns the patterns already read when a later page lookup fails', async () => {
    mockSavedObjectsClient.find
      .mockResolvedValueOnce({
        savedObjects: [{ id: 'p1', attributes: { signalType: 'logs' }, references: [] }],
        total: 2,
      } as any)
      .mockRejectedValueOnce(new Error('lookup failed'));

    const result = await getIndexPatternSignalTypes(mockSavedObjectsClient);

    expect(result.map((r) => r.id)).toEqual(['p1']);
    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
  });
});

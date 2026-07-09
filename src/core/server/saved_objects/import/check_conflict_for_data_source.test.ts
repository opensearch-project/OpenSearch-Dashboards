/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockUuidv4 } from './__mocks__';
import { SavedObjectReference, SavedObjectsImportRetry } from 'opensearch-dashboards/public';
import { SavedObject, SavedObjectsClientContract } from '../types';
import { SavedObjectsErrorHelpers } from '..';
import {
  checkConflictsForDataSource,
  ConflictsForDataSourceParams,
} from './check_conflict_for_data_source';
import { VisualizationObject } from './types';

type SavedObjectType = SavedObject<{ title?: string }>;

/**
 * Function to create a realistic-looking import object given a type and ID
 */
const createObject = (type: string, id: string): SavedObjectType => ({
  type,
  id,
  attributes: { title: 'some-title' },
  references: (Symbol() as unknown) as SavedObjectReference[],
});

const createVegaVisualizationObject = (id: string): SavedObjectType => {
  const visState =
    id.split('_').length > 1
      ? '{"title":"some-title","type":"vega","aggs":[],"params":{"spec":"{\\n  data: {\\n    url: {\\n      index: example_index\\n      data_source_name: old-datasource-title\\n    }\\n  }\\n}"}}'
      : '{"title":"some-title","type":"vega","aggs":[],"params":{"spec":"{\\n  data: {\\n    url: {\\n      index: example_index\\n    }\\n  }\\n}"}}';
  return {
    type: 'visualization',
    id,
    attributes: { title: 'some-title', visState },
    references:
      id.split('_').length > 1
        ? [{ id: id.split('_')[0], type: 'data-source', name: 'dataSource' }]
        : [],
  } as SavedObjectType;
};

const createTSVBVisualizationObject = (id: string): VisualizationObject => {
  const idParse = id.split('_');
  const params = idParse.length > 1 ? { data_source_id: idParse[1] } : {};
  const visState = {
    type: 'metrics',
    params,
  };

  return {
    type: 'visualization',
    id,
    attributes: { title: 'some-title', visState: JSON.stringify(visState) },
    references:
      idParse.length > 1 ? [{ id: idParse[1], type: 'data-source', name: 'dataSource' }] : [],
  } as VisualizationObject;
};

const getSavedObjectClient = (): SavedObjectsClientContract => {
  const savedObject = {} as SavedObjectsClientContract;
  savedObject.get = jest.fn().mockImplementation((type, id) => {
    if (type === 'data-source' && id === 'old-datasource-id') {
      return Promise.resolve({
        attributes: {
          title: 'old-datasource-title',
        },
      });
    } else if (type === 'data-source') {
      return Promise.resolve({
        attributes: {
          title: 'some-datasource-title',
        },
      });
    }

    return Promise.resolve(undefined);
  });

  return savedObject;
};

const getResultMock = {
  conflict: (type: string, id: string) => {
    const error = SavedObjectsErrorHelpers.createConflictError(type, id).output.payload;
    return { type, id, error };
  },
  unresolvableConflict: (type: string, id: string) => {
    const conflictMock = getResultMock.conflict(type, id);
    const metadata = { isNotOverwritable: true };
    return { ...conflictMock, error: { ...conflictMock.error, metadata } };
  },
  invalidType: (type: string, id: string) => {
    const error = SavedObjectsErrorHelpers.createUnsupportedTypeError(type).output.payload;
    return { type, id, error };
  },
};

/**
 * Create a variety of different objects to exercise different import / result scenarios
 */
const dataSourceObj = createObject('data-source', 'data-source-id-1'); // -> data-source type, no need to add in the filteredObjects
const dataSourceObj1 = createObject('type-1', 'ds_id-1'); // -> object with data source id
const dataSourceObj2 = createObject('type-2', 'ds_id-2'); // -> object with data source id
const objectsWithDataSource = [dataSourceObj, dataSourceObj1, dataSourceObj2];
const dataSourceObj1Error = getResultMock.conflict(dataSourceObj1.type, dataSourceObj1.id);

describe('#checkConflictsForDataSource', () => {
  const setupParams = (partial: {
    objects: SavedObjectType[];
    ignoreRegularConflicts?: boolean;
    retries?: SavedObjectsImportRetry[];
    createNewCopies?: boolean;
    dataSourceId?: string;
    savedObjectsClient?: SavedObjectsClientContract;
  }): ConflictsForDataSourceParams => {
    return { ...partial };
  };

  beforeEach(() => {
    mockUuidv4.mockReset();
    mockUuidv4.mockReturnValueOnce(`new-object-id`);
  });

  it('exits early if there are no objects to check', async () => {
    const params = setupParams({ objects: [] });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [],
      errors: [],
      importIdMap: new Map(),
    });
  });

  it('return obj if it is not data source obj and there is no conflict of the data source id', async () => {
    const params = setupParams({ objects: objectsWithDataSource, dataSourceId: 'ds' });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [dataSourceObj1, dataSourceObj2],
      errors: [],
      importIdMap: new Map(),
    });
  });

  it('can resolve the data source id conflict when the ds it not match when ignoreRegularConflicts=true', async () => {
    const params = setupParams({
      objects: objectsWithDataSource,
      ignoreRegularConflicts: true,
      dataSourceId: 'currentDsId',
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...dataSourceObj1,
            id: 'currentDsId_id-1',
          },
          {
            ...dataSourceObj2,
            id: 'currentDsId_id-2',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `${dataSourceObj1.type}:${dataSourceObj1.id}`,
            { id: 'currentDsId_id-1', omitOriginId: true },
          ],
          [
            `${dataSourceObj2.type}:${dataSourceObj2.id}`,
            { id: 'currentDsId_id-2', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  it('can push error when do not override with data source conflict', async () => {
    const params = setupParams({
      objects: [dataSourceObj1],
      ignoreRegularConflicts: false,
      dataSourceId: 'currentDs',
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [],
      errors: [
        {
          ...dataSourceObj1Error,
          title: dataSourceObj1.attributes.title,
          meta: { title: dataSourceObj1.attributes.title },
          error: { type: 'conflict' },
        },
      ],
      importIdMap: new Map(),
    });
  });

  /*
  Vega test cases
  */
  it('will attach datasource name to Vega spec when importing from local to datasource', async () => {
    const vegaSavedObject = createVegaVisualizationObject('some-object-id');
    const params = setupParams({
      objects: [vegaSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(params.savedObjectsClient?.get).toHaveBeenCalledWith(
      'data-source',
      'some-datasource-id'
    );
    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...vegaSavedObject,
            attributes: {
              title: 'some-title',
              visState:
                '{"title":"some-title","type":"vega","aggs":[],"params":{"spec":"{\\n  data: {\\n    url: {\\n      index: example_index\\n      data_source_name: some-datasource-title\\n    }\\n  }\\n}"}}',
            },
            id: 'some-datasource-id_some-object-id',
            references: [
              {
                id: 'some-datasource-id',
                type: 'data-source',
                name: 'dataSource',
              },
            ],
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  it('will not change Vega spec when importing from datasource to different datasource', async () => {
    const vegaSavedObject = createVegaVisualizationObject('old-datasource-id_some-object-id');
    const params = setupParams({
      objects: [vegaSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(params.savedObjectsClient?.get).toHaveBeenCalledWith(
      'data-source',
      'some-datasource-id'
    );
    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...vegaSavedObject,
            attributes: {
              title: 'some-title',
              visState:
                '{"title":"some-title","type":"vega","aggs":[],"params":{"spec":"{\\n  data: {\\n    url: {\\n      index: example_index\\n      data_source_name: old-datasource-title\\n    }\\n  }\\n}"}}',
            },
            id: 'some-datasource-id_some-object-id',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  it('will not change Vega spec when dataSourceTitle is undefined', async () => {
    const vegaSavedObject = createVegaVisualizationObject('old-datasource-id_some-object-id');
    const params = setupParams({
      objects: [vegaSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'nonexistent-datasource-title-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(params.savedObjectsClient?.get).toHaveBeenCalledWith(
      'data-source',
      'nonexistent-datasource-title-id'
    );
    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...vegaSavedObject,
            id: 'nonexistent-datasource-title-id_some-object-id',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:some-object-id`,
            { id: 'nonexistent-datasource-title-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  /*
   * Timeline test cases
   */
  it('will not change timeline expression when importing from datasource to different datasource', async () => {
    const timelineSavedObject = createObject('visualization', 'old-datasource-id_some-object-id');
    // @ts-expect-error
    timelineSavedObject.attributes.visState =
      '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name=newDataSource).lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}';
    const params = setupParams({
      objects: [timelineSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...timelineSavedObject,
            attributes: {
              title: 'some-title',
              visState:
                '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name=newDataSource).lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}',
            },
            id: 'some-datasource-id_some-object-id',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:old-datasource-id_some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  it('will change timeline expression when importing expression does not have a datasource name', async () => {
    const timelineSavedObject = createObject('visualization', 'old-datasource-id_some-object-id');
    // @ts-expect-error
    timelineSavedObject.attributes.visState =
      '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}';
    const params = setupParams({
      objects: [timelineSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...timelineSavedObject,
            attributes: {
              title: 'some-title',
              visState:
                '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name=\\"some-datasource-title\\").lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}',
            },
            id: 'some-datasource-id_some-object-id',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:old-datasource-id_some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  it('When there are multiple opensearch queries in the expression, it would go through each query and add data source name if it does not have any.', async () => {
    const timelineSavedObject = createObject('visualization', 'old-datasource-id_some-object-id');
    // @ts-expect-error
    timelineSavedObject.attributes.visState =
      '{"title":"some-other-title","type":"timelion","params":{"expression":".es(index=old-datasource-title, timefield=@timestamp, data_source_name=\\"aos 211\\"), .elasticsearch(index=old-datasource-title, timefield=@timestamp)"},"aggs":[]}';
    const params = setupParams({
      objects: [timelineSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...timelineSavedObject,
            attributes: {
              title: 'some-title',
              visState:
                '{"title":"some-other-title","type":"timelion","params":{"expression":".es(index=old-datasource-title, timefield=@timestamp, data_source_name=\\"aos 211\\"), .elasticsearch(index=old-datasource-title, timefield=@timestamp, data_source_name=\\"some-datasource-title\\")"},"aggs":[]}',
            },
            id: 'some-datasource-id_some-object-id',
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:old-datasource-id_some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });

  /**
   * TSVB test cases
   */
  it.each([
    {
      id: 'some-object-id',
    },
    {
      id: 'old-datasource-id_some-object-id',
    },
  ])('will update datasource reference + visState of TSVB visualization', async ({ id }) => {
    const tsvbSavedObject = createTSVBVisualizationObject(id);
    const expectedVisState = JSON.parse(tsvbSavedObject.attributes.visState);
    expectedVisState.params.data_source_id = 'some-datasource-id';
    const newVisState = JSON.stringify(expectedVisState);
    const params = setupParams({
      objects: [tsvbSavedObject],
      ignoreRegularConflicts: true,
      dataSourceId: 'some-datasource-id',
      savedObjectsClient: getSavedObjectClient(),
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
            ...tsvbSavedObject,
            attributes: {
              title: 'some-title',
              visState: newVisState,
            },
            id: 'some-datasource-id_some-object-id',
            references: [
              {
                id: 'some-datasource-id',
                name: 'dataSource',
                type: 'data-source',
              },
            ],
          },
        ],
        errors: [],
        importIdMap: new Map([
          [
            `visualization:some-object-id`,
            { id: 'some-datasource-id_some-object-id', omitOriginId: true },
          ],
        ]),
      })
    );
  });
});

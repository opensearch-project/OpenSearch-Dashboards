/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

import { SavedObjectReference, SavedObjectsClientWrapperOptions } from '../../../../core/server';
import testParams from './test_utils/test_params.json';
import { timeSeriesVisualizationClientWrapper } from './timeseries_visualization_client_wrapper';
import { savedObjectsClientMock } from '../../../../core/server/mocks';

jest.mock('./services', () => ({
  getDataSourceEnabled: jest
    .fn()
    .mockReturnValueOnce({ enabled: false })
    .mockReturnValue({ enabled: true }),
}));

describe('timeseriesVisualizationClientWrapper()', () => {
  const client = savedObjectsClientMock.create();
  client.get = jest.fn().mockImplementation((type: string, id: string) => {
    if (type === 'data-source' && id === 'non-existent-id') {
      return Promise.resolve({
        id,
        errors: {},
      });
    }
    return Promise.resolve({
      id,
      attributes: {
        title: `${id} DataSource`,
      },
    });
  });
  const mockedWrapperOptions = {} as SavedObjectsClientWrapperOptions;
  mockedWrapperOptions.client = client;

  const getAttributesWithParams = (params: any) => {
    return {
      title: 'Some TSVB Visualization',
      visState: JSON.stringify({
        title: 'Some TSVB Visualization',
        type: 'metrics',
        aggs: [],
        params,
      }),
    };
  };

  beforeEach(() => {
    client.create.mockClear();
  });

  const testClientCreate = (
    attributes: any,
    references: SavedObjectReference[],
    savedObjectType = 'visualization'
  ) => {
    expect(client.create).toBeCalledWith(
      savedObjectType,
      attributes,
      expect.objectContaining({ references: expect.arrayContaining(references) })
    );
  };

  test('if MDS is disabled, do not update the datasource references', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldEmpty);
    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: [] });

    testClientCreate(attributes, []);
  });

  test('non-visualization saved object should pass through', async () => {
    const attributes = {
      title: 'some-dashboard',
    };
    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('dashboard', attributes, { references: [] });

    testClientCreate(attributes, [], 'dashboard');
  });

  test('non-metrics saved object should pass through', async () => {
    const attributes = {
      title: 'some-other-visualization',
      visState: JSON.stringify({
        title: 'Some other visualization',
        type: 'vega',
        aggs: [],
        params: {},
      }),
    };
    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: [] });

    testClientCreate(attributes, []);
  });

  test('if a non-existent datasource id is in the params, remove all datasource references and the field name', async () => {
    const params = _.clone(testParams.withDataSourceFieldNonEmpty);
    params.data_source_id = 'non-existent-id';
    const references = [
      {
        id: 'non-existent-id',
        name: 'dataSource',
        type: 'data-source',
      },
    ];
    const attributes = getAttributesWithParams(params);
    const newAttributes = getAttributesWithParams(testParams.withNoDataSourceField);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references });

    testClientCreate(newAttributes, []);
  });

  test('if a datasource reference is empty and the data_source_id field is an empty string, do not change the object', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldEmpty);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: [] });

    testClientCreate(attributes, []);
  });

  test('if a datasource reference is empty and the data_source_id field is not present, do not change the object', async () => {
    const attributes = getAttributesWithParams(testParams.withNoDataSourceField);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: [] });

    testClientCreate(attributes, []);
  });

  test('if a datasource reference is outdated and the data_source_id field has an empty string, remove the datasource reference', async () => {
    const attributes = getAttributesWithParams(testParams.withNoDataSourceField);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, {
      references: testParams.referenceWithOutdatedDataSource,
    });

    const newReferences = [{ id: 'some-dashboard-id', name: 'some-dashboard', type: 'dashboard' }];
    testClientCreate(attributes, newReferences);
  });

  test('if a datasource reference is outdated and the data_source_id field is not present, remove the datasource reference', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldEmpty);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, {
      references: testParams.referenceWithOutdatedDataSource,
    });

    const newReferences = [{ id: 'some-dashboard-id', name: 'some-dashboard', type: 'dashboard' }];
    testClientCreate(attributes, newReferences);
  });

  test('if the datasource reference is empty and the data_source_id is present, add the datasource reference', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldNonEmpty);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, {
      references: [{ id: 'some-dashboard-id', name: 'some-dashboard', type: 'dashboard' }],
    });

    testClientCreate(attributes, testParams.referenceWithValidDataSource);
  });

  test('if the datasource reference is different from the data_source_id, update the datasource reference', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldNonEmpty);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, {
      references: testParams.referenceWithOutdatedDataSource,
    });

    testClientCreate(attributes, testParams.referenceWithValidDataSource);
  });

  test('if the datasource reference is identical to the data_source_id, do not change anything', async () => {
    const attributes = getAttributesWithParams(testParams.withDataSourceFieldNonEmpty);

    const wrapper = timeSeriesVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, {
      references: testParams.referenceWithValidDataSource,
    });

    testClientCreate(attributes, testParams.referenceWithValidDataSource);
  });
});

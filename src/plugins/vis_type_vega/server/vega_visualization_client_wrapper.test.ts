/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { SavedObjectsClientWrapperOptions, SavedObjectsFindOptions } from 'src/core/server';
import { savedObjectsClientMock } from '../../../core/server/mocks';
import { vegaVisualizationClientWrapper } from './vega_visualization_client_wrapper';

jest.mock('./services', () => ({
  getDataSourceEnabled: jest
    .fn()
    .mockReturnValueOnce({ enabled: false })
    .mockReturnValue({ enabled: true }),
}));

describe('vegaVisualizationClientWrapper()', () => {
  const loadHJSONStringFromFile = (filepath: string) => {
    return readFileSync(join(__dirname, filepath)).toString();
  };

  const getAttributesGivenSpec = (spec: string) => {
    return {
      title: 'Some Spec',
      visState: JSON.stringify({
        title: 'Some Spec',
        type: 'vega',
        aggs: [],
        params: {
          spec,
        },
      }),
    };
  };

  const client = savedObjectsClientMock.create();
  client.bulkGet = jest
    .fn()
    .mockImplementation((dataSourceIds: Array<{ id: string; type: string }>) => {
      return Promise.resolve({
        saved_objects: dataSourceIds.map((request) => {
          if (request.type === 'data-source' && request.id === 'id-a') {
            return {
              id: 'id-a',
              attributes: {
                title: 'a-title',
              },
            };
          } else if (request.type === 'data-source' && request.id === 'id-b') {
            return {
              id: 'id-b',
              attributes: {
                title: 'b-title',
              },
            };
          } else if (request.type === 'data-source' && request.id === 'id-z') {
            return {
              id: 'id-z',
              attributes: {
                title: 'z-title',
              },
            };
          }

          return {
            id: request.id,
            attributes: undefined,
          };
        }),
      });
    });
  client.find = jest.fn().mockImplementation((query: SavedObjectsFindOptions) => {
    if (query.search === `"c-title"`) {
      return Promise.resolve({
        total: 1,
        saved_objects: [{ id: 'id-c', attributes: { title: 'c-title' } }],
      });
    } else if (query.search === `"d-title"`) {
      return Promise.resolve({
        total: 1,
        saved_objects: [{ id: 'id-d', attributes: { title: 'd-title' } }],
      });
    } else {
      return Promise.resolve({
        total: 0,
        saved_objects: [],
      });
    }
  });
  const mockedWrapperOptions = {} as SavedObjectsClientWrapperOptions;
  mockedWrapperOptions.client = client;

  beforeEach(() => {
    client.create.mockClear();
  });

  test('Should just call create as usual if MDS is disabled', async () => {
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', {}, { references: [] });
    expect(client.create).toBeCalledWith(
      'visualization',
      {},
      expect.objectContaining({ references: [] })
    );
  });

  test('Should just call create as usual if object type is not visualization type', async () => {
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('dashboard', {}, { references: [] });
    expect(client.create).toBeCalledWith(
      'dashboard',
      {},
      expect.objectContaining({ references: [] })
    );
  });

  test('Should just call create as usual if object type is not vega type', async () => {
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    // Avoids whitespacing issues by letting stringify format the string
    const visState = JSON.stringify(
      JSON.parse('{"type": "area", "params": {"spec": "no-spec-here"}}')
    );
    await wrapper.create('visualization', { visState }, { references: [] });
    expect(client.create).toBeCalledWith(
      'visualization',
      { visState },
      expect.objectContaining({ references: [] })
    );
  });

  test('Should not update anything if the spec does not specify any data_source_name', async () => {
    const spec = loadHJSONStringFromFile('/test_utils/vega_spec_with_multiple_urls.hjson');
    const attributes = getAttributesGivenSpec(spec);
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: [] });
    expect(client.create).toBeCalledWith(
      'visualization',
      attributes,
      expect.objectContaining({ references: [] })
    );
  });

  test('Should not update anything if the references is still up-to-date', async () => {
    const spec = loadHJSONStringFromFile('/test_utils/vega_spec_up_to_date_urls_mds.hjson');
    const attributes = getAttributesGivenSpec(spec);
    const references = [
      {
        id: 'id-a',
        type: 'data-source',
        name: 'dataSource',
      },
      {
        id: 'id-b',
        type: 'data-source',
        name: 'dataSource',
      },
    ];
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references });
    expect(client.create).toBeCalledWith(
      'visualization',
      attributes,
      expect.objectContaining({ references })
    );
  });

  test('Should throw an error if the Vega spec has invalid data_source_name field(s)', () => {
    const spec = loadHJSONStringFromFile('/test_utils/vega_spec_with_multiple_urls_mds.hjson');
    const visState = {
      title: 'Some Spec',
      type: 'vega',
      aggs: [],
      params: {
        spec,
      },
    };
    const attributes = {
      title: 'Some Spec',
      visState: JSON.stringify(visState),
    };
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    expect(wrapper.create('visualization', attributes, { references: [] })).rejects.toThrowError(
      `Expected exactly 1 result for data_source_name`
    );
  });

  test('Should update only the references section', async () => {
    const spec = loadHJSONStringFromFile('/test_utils/vega_outdated_references_mds.hjson');
    const attributes = getAttributesGivenSpec(spec);
    const commonReferences = [
      {
        id: 'some-dashboard',
        type: 'dashboard',
        name: 'someDashboard',
      },
      {
        id: 'id-a',
        type: 'data-source',
        name: 'dataSource',
      },
      {
        id: 'id-b',
        type: 'data-source',
        name: 'dataSource',
      },
    ];
    const oldReferences = [
      ...commonReferences,
      {
        id: 'id-z',
        type: 'data-source',
        name: 'dataSource',
      },
      {
        id: 'non-existent-id',
        type: 'data-source',
        name: 'dataSource',
      },
    ];
    const newReferences = [
      ...commonReferences,
      {
        id: 'id-c',
        type: 'data-source',
        name: 'dataSource',
      },
      {
        id: 'id-d',
        type: 'data-source',
        name: 'dataSource',
      },
    ];
    const wrapper = vegaVisualizationClientWrapper(mockedWrapperOptions);
    await wrapper.create('visualization', attributes, { references: oldReferences });
    expect(client.create).toBeCalledWith(
      'visualization',
      attributes,
      expect.objectContaining({ references: newReferences })
    );
  });
});

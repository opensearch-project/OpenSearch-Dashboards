/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { RegionMapOptions } from './region_map_options';
// @ts-expect-error TS7016 TODO(ts-error): fixme
import renderer, { act } from 'react-test-renderer';

describe('region_map_options', () => {
  it('renders the RegionMapOptions with default option if no custom vector maps are found', async () => {
    const props = jest.mock;
    const vis = {
      type: {
        editorConfig: {
          collections: {
            colorSchemas: [],
            customVectorLayers: [],
            tmsLayers: [],
            vectorLayers: [
              {
                attribution:
                  '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
                created_at: '2017-04-26T17:12:15.978370',
                format: 'geojson',
                fields: [],
                id: 'sample',
                meta: undefined,
                name: 'sample',
                origin: 'user-upload',
              },
            ],
          },
        },
      },
    };
    const stateParams = {
      colorSchema: {},
      outlineWeight: {},
      wms: {},
      selectedJoinField: {
        name: 'randomId',
      },
      selectedLayer: {
        layerId: 'name',
        fields: [
          {
            name: 'name',
            type: 'name',
            property: 'name',
          },
        ],
      },
    };

    let tree;
    await act(async () => {
      // @ts-expect-error TS2740 TODO(ts-error): fixme
      tree = renderer.create(<RegionMapOptions stateParams={stateParams} vis={vis} {...props} />);
    });
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON().props.id).toBe('defaultMapOption');
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('renders the RegionMapOptions with custom option if custom vector maps are found', async () => {
    const props = jest.mock;
    const vis = {
      type: {
        editorConfig: {
          collections: {
            colorSchemas: [],
            customVectorLayers: [
              {
                attribution:
                  '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
                created_at: '2017-04-26T17:12:15.978370',
                format: 'geojson',
                fields: [],
                id: 'sample',
                meta: undefined,
                name: 'sample',
                origin: 'user-upload',
              },
            ],
            tmsLayers: [],
            vectorLayers: [],
          },
        },
      },
    };
    const stateParams = {
      colorSchema: {},
      outlineWeight: {},
      wms: {},
      selectedJoinField: {
        name: 'randomId',
      },
      selectedCustomLayer: {
        fields: [
          {
            name: 'name',
            property: 'name',
            type: 'name',
          },
        ],
        layerId: 'sample',
      },
    };

    let tree;
    await act(async () => {
      // @ts-expect-error TS2740 TODO(ts-error): fixme
      tree = renderer.create(<RegionMapOptions stateParams={stateParams} vis={vis} {...props} />);
    });
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON().props.id).toBe('customMapOption');
    // @ts-expect-error TS2532 TODO(ts-error): fixme
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

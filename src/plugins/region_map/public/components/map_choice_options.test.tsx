/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { I18nProvider } from '@osd/i18n/react';
import { MapChoiceOptions } from './map_choice_options';
import { screen, render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { act } from 'react';

describe('map_choice_options', () => {
  const setValue = jest.fn();
  const getServiceSettings = jest.fn().mockResolvedValue({
    getEMSHotLink: jest.fn().mockResolvedValue(''),
  });
  it('renders the MapChoiceOptions based on the props provided', async () => {
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
                fields: [
                  {
                    name: 'name',
                    type: 'id',
                    description: 'description',
                  },
                ],
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
      selectedLayer: {
        attribution:
          '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
        created_at: '2017-04-26T17:12:15.978370',
        format: 'geojson',
        fields: [
          {
            name: 'name',
            type: 'id',
            description: 'description',
          },
        ],
        id: 'sample',
        meta: undefined,
        name: 'sample',
        origin: 'user-upload',
      },
      selectedJoinField: {
        name: 'name',
        type: 'id',
        description: 'description',
      },
    };

    render(
      <I18nProvider>
        <MapChoiceOptions
          // @ts-expect-error - Test mock stateParams is missing some required RegionMapVisParams properties
          stateParams={stateParams}
          vis={vis as any}
          setValue={setValue}
          getServiceSettings={getServiceSettings}
        />
      </I18nProvider>
    );
    const defaultVectorSelection = screen.getByTestId('defaultVectorMap');
    const customVectorSelection = screen.getByTestId('customVectorMap');
    await act(async () => {
      fireEvent.click(defaultVectorSelection);
    });
    await expect(defaultVectorSelection).toBeChecked;
    await expect(customVectorSelection).not.toBeChecked;
  });

  it('renders the MapChoiceOptions based on the props provided for custom selection', async () => {
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
                fields: [
                  {
                    name: 'name',
                    type: 'id',
                    description: 'description',
                  },
                ],
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
      selectedCustomLayer: {
        attribution:
          '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
        created_at: '2017-04-26T17:12:15.978370',
        format: 'geojson',
        fields: [
          {
            name: 'name',
            type: 'id',
            description: 'description',
          },
        ],
        id: 'sample',
        meta: undefined,
        name: 'sample',
        origin: 'user-upload',
      },
      selectedCustomJoinField: {
        name: 'name',
        type: 'id',
        description: 'description',
      },
    };

    render(
      <I18nProvider>
        <MapChoiceOptions
          // @ts-expect-error - Test mock stateParams is missing some required RegionMapVisParams properties
          stateParams={stateParams}
          vis={vis as any}
          setValue={setValue}
          getServiceSettings={getServiceSettings}
        />
      </I18nProvider>
    );
    const defaultVectorSelection = screen.getByTestId('defaultVectorMap');
    const customVectorSelection = screen.getByTestId('customVectorMap');
    await act(async () => {
      fireEvent.click(customVectorSelection);
    });
    await expect(customVectorSelection).toBeChecked;
    await expect(defaultVectorSelection).not.toBeChecked;
  });
});

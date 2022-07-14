/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { mapToLayerWithId } from './util';
import { createRegionMapVisualization } from './region_map_visualization';
import { RegionMapOptions } from './components/region_map_options';
import { truncatedColorSchemas } from '../../charts/public';
import { Schemas } from '../../vis_default_editor/public';
import { ORIGIN } from '../../maps_legacy/public';
import { getServices } from './services';
import { DEFAULT_MAP_CHOICE } from '../common';

export function createRegionMapTypeDefinition(dependencies) {
  const {
    http,
    uiSettings,
    regionmapsConfig,
    getServiceSettings,
    additionalOptions,
  } = dependencies;

  const services = getServices(http);
  const visualization = createRegionMapVisualization(dependencies);

  const diffArray = (arr1, arr2) => {
    return arr1.concat(arr2).filter((item) => !arr1.includes(item) || !arr2.includes(item));
  };

  const getCustomIndices = async () => {
    try {
      const result = await services.getCustomIndices();
      return result.resp;
    } catch (e) {
      return false;
    }
  };

  const getJoinFields = async (indexName) => {
    try {
      const result = await services.getIndexMapping(indexName);
      const properties = diffArray(Object.keys(result.resp[indexName].mappings.properties), [
        'location',
      ]);
      return properties.map(function (property) {
        return {
          type: 'id',
          name: property,
          description: property,
        };
      });
    } catch (e) {
      return false;
    }
  };

  const addSchemaToCustomLayer = async (customlayer) => {
    const joinFields = await getJoinFields(customlayer.index);
    const customLayerWithSchema = {
      attribution:
        '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
      created_at: '2017-04-26T17:12:15.978370',
      format: 'geojson',
      fields: joinFields,
      id: customlayer.index,
      meta: undefined,
      name: customlayer.index,
      origin: 'user-upload',
    };

    return customLayerWithSchema;
  };

  return {
    name: 'region_map',
    title: i18n.translate('regionMap.mapVis.regionMapTitle', { defaultMessage: 'Region Map' }),
    description: i18n.translate('regionMap.mapVis.regionMapDescription', {
      defaultMessage:
        'Show metrics on a thematic map. Use one of the \
provided base maps, or add your own. Darker colors represent higher values.',
    }),
    icon: 'visMapRegion',
    visConfig: {
      defaults: {
        layerChosenByUser: DEFAULT_MAP_CHOICE,
        legendPosition: 'bottomright',
        addTooltip: true,
        colorSchema: 'Yellow to Red',
        emsHotLink: '',
        isDisplayWarning: true,
        wms: uiSettings.get('visualization:tileMap:WMSdefaults'),
        mapZoom: 2,
        mapCenter: [0, 0],
        outlineWeight: 1,
        showAllShapes: true, //still under consideration
      },
    },
    visualization,
    editorConfig: {
      optionTabs: () => {
        return [
          {
            name: 'options',
            title: i18n.translate(
              'regionMap.mapVis.regionMapEditorConfig.optionTabs.optionsTitle',
              {
                defaultMessage: 'Layer Options',
              }
            ),
            editor: (props) => (
              <RegionMapOptions {...props} getServiceSettings={getServiceSettings} />
            ),
          },
          ...additionalOptions,
        ];
      },
      collections: {
        colorSchemas: truncatedColorSchemas,
        vectorLayers: [],
        customVectorLayers: [],
        tmsLayers: [],
      },
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: i18n.translate('regionMap.mapVis.regionMapEditorConfig.schemas.metricTitle', {
            defaultMessage: 'Value',
          }),
          min: 1,
          max: 1,
          aggFilter: [
            'count',
            'avg',
            'sum',
            'min',
            'max',
            'cardinality',
            'top_hits',
            'sum_bucket',
            'min_bucket',
            'max_bucket',
            'avg_bucket',
          ],
          defaults: [{ schema: 'metric', type: 'count' }],
        },
        {
          group: 'buckets',
          name: 'segment',
          title: i18n.translate('regionMap.mapVis.regionMapEditorConfig.schemas.segmentTitle', {
            defaultMessage: 'Shape field',
          }),
          min: 1,
          max: 1,
          aggFilter: ['terms'],
        },
      ]),
    },
    setup: async (vis) => {
      const serviceSettings = await getServiceSettings();
      const tmsLayers = await serviceSettings.getTMSServices();

      vis.type.editorConfig.collections.tmsLayers = tmsLayers;
      if (!vis.params.wms.selectedTmsLayer && tmsLayers.length) {
        vis.params.wms.selectedTmsLayer = tmsLayers[0];
      }

      const vectorLayers = regionmapsConfig.layers.map(
        mapToLayerWithId.bind(null, ORIGIN.OPENSEARCH_DASHBOARDS_YML)
      );
      const customVectorLayers = regionmapsConfig.layers.map(
        mapToLayerWithId.bind(null, ORIGIN.OPENSEARCH_DASHBOARDS_YML)
      );
      const customIndices = await getCustomIndices();

      let selectedLayer = vectorLayers[0];
      let selectedJoinField = selectedLayer ? selectedLayer.fields[0] : null;

      let selectedCustomLayer = customVectorLayers[0];
      let selectedCustomJoinField = selectedCustomLayer ? selectedCustomLayer.fields[0] : null;

      if (regionmapsConfig.includeOpenSearchMapsService) {
        const layers = await serviceSettings.getFileLayers();
        const newLayers = layers
          .map(mapToLayerWithId.bind(null, ORIGIN.EMS))
          .filter(
            (layer) => !vectorLayers.some((vectorLayer) => vectorLayer.layerId === layer.layerId)
          );
        const promises = customIndices.map(addSchemaToCustomLayer);
        const newCustomLayers = await Promise.all(promises);

        // backfill v1 manifest for now
        newLayers.forEach((layer) => {
          if (layer.format === 'geojson') {
            layer.format = {
              type: 'geojson',
            };
          }
        });

        newCustomLayers.forEach((layer) => {
          if (layer.format === 'geojson') {
            layer.format = {
              type: 'geojson',
            };
            layer.isEMS = false;
            layer.layerId = layer.origin + '.' + layer.name;
          }
        });

        vis.type.editorConfig.collections.vectorLayers = [...vectorLayers, ...newLayers];
        vis.type.editorConfig.collections.customVectorLayers = [
          ...customVectorLayers,
          ...newCustomLayers,
        ];

        [selectedLayer] = vis.type.editorConfig.collections.vectorLayers;
        selectedJoinField = selectedLayer ? selectedLayer.fields[0] : null;
        [selectedCustomLayer] = vis.type.editorConfig.collections.customVectorLayers;
        selectedCustomJoinField = selectedCustomLayer ? selectedCustomLayer.fields[0] : null;

        if (selectedLayer && !vis.params.selectedLayer && selectedLayer.isEMS) {
          vis.params.emsHotLink = await serviceSettings.getEMSHotLink(selectedLayer);
        }
      }

      if (!vis.params.selectedLayer) {
        vis.params.selectedLayer = selectedLayer;
        vis.params.selectedJoinField = selectedJoinField;
      }

      if (!vis.params.selectedCustomLayer) {
        vis.params.selectedCustomLayer = selectedCustomLayer;
        vis.params.selectedCustomJoinField = selectedCustomJoinField;
      }

      vis.params.layerChosenByUser = vis.params.layerChosenByUser
        ? vis.params.layerChosenByUser
        : DEFAULT_MAP_CHOICE;

      return vis;
    },
  };
}

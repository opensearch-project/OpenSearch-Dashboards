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
import { CustomVectorUpload } from './components/custom_vector_upload';
import { truncatedColorSchemas } from '../../charts/public';
import { Schemas } from '../../vis_default_editor/public';
import { ORIGIN } from '../../maps_legacy/public';

export function createRegionMapTypeDefinition(dependencies) {
  const { http, uiSettings, notifications, regionmapsConfig, getServiceSettings } = dependencies;
  const visualization = createRegionMapVisualization(dependencies);

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
      optionTabs: [
        {
          name: 'options',
          title: i18n.translate('regionMap.mapVis.regionMapEditorConfig.optionTabs.optionsTitle', {
            defaultMessage: 'Layer Options',
          }),
          editor: (props) => (
            <RegionMapOptions {...props} getServiceSettings={getServiceSettings} />
          ),
        },
        {
          name: 'controls',
          title: i18n.translate(
            'regionMap.mapVis.regionMapEditorConfig.controlTabs.controlsTitle',
            {
              defaultMessage: 'Import Vector Map',
            }
          ),
          editor: CustomVectorUpload,
        },
      ],
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
      console.log('tmslayers: ');
      console.log(tmsLayers);
      vis.http = http;
      vis.notifications = notifications;
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
      console.log('vectorLayers');
      console.log(vectorLayers);
      console.log('customVectorLayers');
      console.log(customVectorLayers);

      let selectedLayer = vectorLayers[0];
      let selectedCustomLayer = customVectorLayers[0];
      let selectedJoinField = selectedLayer ? selectedLayer.fields[0] : null;
      if (regionmapsConfig.includeOpenSearchMapsService) {
        const layers = await serviceSettings.getFileLayers();
        console.log('layers');
        console.log(layers);
        const newLayers = layers
          .map(mapToLayerWithId.bind(null, ORIGIN.EMS))
          .filter(
            (layer) => !vectorLayers.some((vectorLayer) => vectorLayer.layerId === layer.layerId)
          );
        console.log('newLayers');
        console.log(newLayers);

        const customLayers = [
          {
            attribution:
              '<a rel="noreferrer noopener" href="http://www.naturalearthdata.com/about/terms-of-use">Made with NaturalEarth</a>',
            created_at: '2017-04-26T17:12:15.978370',
            fields: [
              { type: 'id', name: 'iso2', description: 'ISO 3166-1 alpha-2 Code' },
              { type: 'name', name: 'label_en', description: 'Name (en)' },
            ],
            format: 'geojson',
            id: 'usa-county-map',
            meta: undefined,
            name: 'usa-county-map',
            origin: 'user-upload',
          },
        ];
        console.log('customLayers');
        console.log(customLayers);
        const newCustomLayers = customLayers;
        // .map(mapToLayerWithId.bind(null, ORIGIN.EMS))
        // .filter(
        //   (layer) => !vectorLayers.some((vectorLayer) => vectorLayer.layerId === layer.layerId)
        // );
        console.log('newCustomLayers');
        console.log(newCustomLayers);

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
            layer.layerId = 'custom_upload.usa-county-map';
          }
        });

        vis.type.editorConfig.collections.vectorLayers = [...vectorLayers, ...newLayers];
        vis.type.editorConfig.collections.customVectorLayers = [
          ...customVectorLayers,
          ...newCustomLayers,
        ];

        [selectedLayer] = vis.type.editorConfig.collections.vectorLayers;
        [selectedCustomLayer] = vis.type.editorConfig.collections.customVectorLayers;

        vis.params.selectedCustomLayer = selectedCustomLayer;
        console.log(vis.params);

        selectedJoinField = selectedLayer ? selectedLayer.fields[0] : null;

        if (selectedLayer && !vis.params.selectedLayer && selectedLayer.isEMS) {
          vis.params.emsHotLink = await serviceSettings.getEMSHotLink(selectedLayer);
        }
      }

      if (!vis.params.selectedLayer) {
        vis.params.selectedLayer = selectedLayer;
        vis.params.selectedJoinField = selectedJoinField;
      }
      vis.params.layerChosenByUser = 'default';

      return vis;
    },
  };
}

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

import React, { useMemo } from 'react';
import { EuiSpacer } from '@elastic/eui';
import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { VectorLayer, IServiceSettings } from '../../../maps_legacy/public';
import { RegionMapVisParams, WmsOptions } from '../../../maps_legacy/public';
import { DefaultMapOptions } from './default_map_options';
import { MapChoiceOptions } from './map_choice_options';
import { StyleOptions } from './style_options';

const mapLayerForOption = ({ layerId, name }: VectorLayer) => ({
  text: name,
  value: layerId,
});

export type RegionMapOptionsProps = {
  getServiceSettings: () => Promise<IServiceSettings>;
} & VisOptionsProps<RegionMapVisParams>;

function RegionMapOptions(props: RegionMapOptionsProps) {
  const customVectorLayers = props.vis.type.editorConfig.collections.customVectorLayers;
  const customVectorLayerOptions = useMemo(() => customVectorLayers.map(mapLayerForOption), [
    customVectorLayers,
  ]);

  if (customVectorLayerOptions.length === 0) {
    return (
      <div id="defaultMapOption">
        <DefaultMapOptions {...props} />
        <EuiSpacer size="s" />
        <StyleOptions {...props} />
        <EuiSpacer size="s" />
        <WmsOptions {...props} />
      </div>
    );
  } else {
    return (
      <div id="customMapOption">
        <MapChoiceOptions {...props} />
        <EuiSpacer size="s" />
        <StyleOptions {...props} />
        <EuiSpacer size="s" />
        <WmsOptions {...props} />
      </div>
    );
  }
}

export { RegionMapOptions };

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

import _ from 'lodash';
import Color from 'color';

import { CoreSetup } from 'opensearch-dashboards/public';

import { euiPaletteColorBlind } from '@elastic/eui';
import { COLOR_MAPPING_SETTING } from '../../../common';

const standardizeColor = (color: string) => new Color(color).hex().toLowerCase();

/**
 * Maintains a lookup table that associates the value (key) with a hex color (value)
 * across the visualizations.
 * Provides functions to interact with the lookup table
 */
export class MappedColors {
  private _oldMap: any;
  private _mapping: any;

  constructor(private uiSettings: CoreSetup['uiSettings']) {
    this._oldMap = {};
    this._mapping = {};
  }

  private getConfigColorMapping() {
    return _.mapValues(this.uiSettings.get(COLOR_MAPPING_SETTING), standardizeColor);
  }

  public get oldMap(): any {
    return this._oldMap;
  }

  public get mapping(): any {
    return this._mapping;
  }

  get(key: string | number) {
    return this.getConfigColorMapping()[key as any] || this._mapping[key];
  }

  flush() {
    this._oldMap = _.clone(this._mapping);
    this._mapping = {};
  }

  purge() {
    this._oldMap = {};
    this._mapping = {};
  }

  mapKeys(keys: Array<string | number>) {
    const configMapping = this.getConfigColorMapping();
    const configColors = _.values(configMapping);
    const oldColors = _.values(this._oldMap);

    const alreadyUsedColors: string[] = [];
    const keysToMap: Array<string | number> = [];
    _.each(keys, (key) => {
      // If this key is mapped in the config, it's unnecessary to have it mapped here
      if (configMapping[key as any]) {
        delete this._mapping[key];
        alreadyUsedColors.push(configMapping[key]);
      }

      // If this key is mapped to a color used by the config color mapping, we need to remap it
      if (_.includes(configColors, this._mapping[key])) keysToMap.push(key);

      // if key exist in oldMap, move it to mapping
      if (this._oldMap[key]) {
        this._mapping[key] = this._oldMap[key];
        alreadyUsedColors.push(this._mapping[key]);
      }

      // If this key isn't mapped, we need to map it
      if (this.get(key) == null) keysToMap.push(key);
    });

    // Choose colors from euiPaletteColorBlind and filter out any already assigned to keys
    const colorPalette = euiPaletteColorBlind({
      rotations: Math.ceil(keys.length / 10),
      direction: 'both',
    })
      .filter((color) => !alreadyUsedColors.includes(color.toLowerCase()))
      .slice(0, keysToMap.length);

    _.merge(this._mapping, _.zipObject(keysToMap, colorPalette));
  }
}

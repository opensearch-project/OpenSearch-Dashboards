/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Config } from '../types/config_types';
import { TAU } from '../../../partition_chart/layout/utils/math';
import { configMap } from '../../../partition_chart/layout/config/config';

export const configMetadata = {
  angleStart: { dflt: Math.PI + Math.PI / 4, min: -TAU, max: TAU, type: 'number' },
  angleEnd: { dflt: -Math.PI / 4, min: -TAU, max: TAU, type: 'number' },

  // shape geometry
  width: { dflt: 300, min: 0, max: 1024, type: 'number', reconfigurable: false },
  height: { dflt: 150, min: 0, max: 1024, type: 'number', reconfigurable: false },
  margin: {
    type: 'group',
    values: {
      left: { dflt: 0, min: -0.25, max: 0.25, type: 'number' },
      right: { dflt: 0, min: -0.25, max: 0.25, type: 'number' },
      top: { dflt: 0, min: -0.25, max: 0.25, type: 'number' },
      bottom: { dflt: 0, min: -0.25, max: 0.25, type: 'number' },
    },
  },

  // general text config
  fontFamily: {
    dflt: 'Sans-Serif',
    type: 'string',
  },

  // fill text config
  minFontSize: { dflt: 8, min: 0.1, max: 8, type: 'number', reconfigurable: true },
  maxFontSize: { dflt: 64, min: 0.1, max: 64, type: 'number' },

  backgroundColor: { dflt: '#ffffff', type: 'color' },
  sectorLineWidth: { dflt: 1, min: 0, max: 4, type: 'number' },
};

export const config: Config = configMap<Config>((item: any) => item.dflt, configMetadata);

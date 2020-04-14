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

import { Pixels, SizeRatio } from '../../../partition_chart/layout/types/geometry_types';
import { FontFamily } from '../../../partition_chart/layout/types/types';
import { Color } from '../../../../utils/commons';

// todo switch to `io-ts` style, generic way of combining static and runtime type info
export interface Config {
  angleStart: number;
  angleEnd: number;

  // shape geometry
  width: number;
  height: number;
  margin: { left: SizeRatio; right: SizeRatio; top: SizeRatio; bottom: SizeRatio };

  // general text config
  fontFamily: FontFamily;

  // fill text config
  minFontSize: Pixels;
  maxFontSize: Pixels;

  // other
  backgroundColor: Color;
  sectorLineWidth: Pixels;
}

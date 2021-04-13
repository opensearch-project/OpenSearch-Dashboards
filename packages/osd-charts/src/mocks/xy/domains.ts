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
 * under the License.
 */

import { XDomain, YDomain } from '../../chart_types/xy_chart/domains/types';
import {
  getXNiceFromSpec,
  getXScaleTypeFromSpec,
  getYNiceFromSpec,
  getYScaleTypeFromSpec,
} from '../../chart_types/xy_chart/scales/get_api_scales';
import { X_SCALE_DEFAULT, Y_SCALE_DEFAULT } from '../../chart_types/xy_chart/scales/scale_defaults';
import { DEFAULT_GLOBAL_ID, XScaleType } from '../../chart_types/xy_chart/utils/specs';
import { ScaleContinuousType } from '../../scales';
import { ScaleType } from '../../scales/constants';
import { mergePartial, RecursivePartial } from '../../utils/common';

/** @internal */
export class MockXDomain {
  private static readonly base: XDomain = {
    ...X_SCALE_DEFAULT,
    isBandScale: X_SCALE_DEFAULT.type !== ScaleType.Ordinal,
    minInterval: 0,
    timeZone: undefined,
    domain: [0, 1],
  };

  static default(partial?: RecursivePartial<XDomain>) {
    return mergePartial<XDomain>(MockXDomain.base, partial, { mergeOptionalPartialValues: true });
  }

  static fromScaleType(scaleType: XScaleType, partial?: RecursivePartial<XDomain>) {
    return mergePartial<XDomain>(MockXDomain.base, partial, { mergeOptionalPartialValues: true }, [
      {
        type: getXScaleTypeFromSpec(scaleType),
        nice: getXNiceFromSpec(),
      },
    ]);
  }
}

/** @internal */
export class MockYDomain {
  private static readonly base: YDomain = {
    ...Y_SCALE_DEFAULT,
    isBandScale: false,
    groupId: DEFAULT_GLOBAL_ID,
    domain: [0, 1],
  };

  static default(partial?: RecursivePartial<YDomain>) {
    return mergePartial<YDomain>(MockYDomain.base, partial, { mergeOptionalPartialValues: true });
  }

  static fromScaleType(scaleType: ScaleContinuousType, partial?: RecursivePartial<YDomain>) {
    return mergePartial<YDomain>(MockYDomain.base, partial, { mergeOptionalPartialValues: true }, [
      {
        type: getYScaleTypeFromSpec(scaleType),
        nice: getYNiceFromSpec(),
      },
    ]);
  }
}

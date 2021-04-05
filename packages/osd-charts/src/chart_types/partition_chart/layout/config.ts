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

import { ConfigItem, configMap, Numeric } from '../../../common/config_objects';
import { GOLDEN_RATIO, TAU } from '../../../common/constants';
import { FONT_STYLES, FONT_VARIANTS } from '../../../common/text_utils';
import { Config, PartitionLayout } from './types/config_types';
import { ShapeTreeNode } from './types/viewmodel_types';
import { AGGREGATE_KEY, STATISTICS_KEY } from './utils/group_by_rollup';

const LOG_10 = Math.log(10);

function significantDigitCount(d: number): number {
  let n = Math.abs(parseFloat(String(d).replace('.', '')));
  if (n === 0) {
    return 0;
  }
  while (n !== 0 && n % 10 === 0) {
    n /= 10;
  }
  return Math.floor(Math.log(n) / LOG_10) + 1;
}

/** @internal */
export function sumValueGetter(node: ShapeTreeNode): number {
  return node[AGGREGATE_KEY];
}

/*
 * It's an unfortunate accident that 'parent' is used both
 *   - for linking an ArrayNode to a QuadViewModel, and
 *   - for recursively linking the parent ArrayNode to an ArrayNode (child) in the tree
 *
 * By extracting out the 'MODEL_KEY', we make the distinction clear, while the API, which depends on this, doesn't
 * change. This makes an eventual API change a single-line change, assuming `[MODEL_KEY]` is used where needed, and just there
 *
 *  Todo:
 *   - replace users' use of `s.parent` with `s[MODEL_KEY]` for the ShapeTreeNode -> ArrayNode access
 *   - change MODEL_KEY to something other than 'parent' when it's done (might still be breaking change)
 */
/** @public */
export const MODEL_KEY = 'parent';

/** @public */
export function percentValueGetter(node: ShapeTreeNode): number {
  return (100 * node[AGGREGATE_KEY]) / node[MODEL_KEY][STATISTICS_KEY].globalAggregate;
}

/** @public */
export function ratioValueGetter(node: ShapeTreeNode): number {
  return node[AGGREGATE_KEY] / node[MODEL_KEY][STATISTICS_KEY].globalAggregate;
}

/** @public */
export const VALUE_GETTERS = Object.freeze({ percent: percentValueGetter, ratio: ratioValueGetter } as const);
/** @public */
export type ValueGetterName = keyof typeof VALUE_GETTERS;

function defaultFormatter(d: number): string {
  return Math.abs(d) >= 10000000 || Math.abs(d) < 0.001
    ? d.toExponential(Math.min(2, Math.max(0, significantDigitCount(d) - 1)))
    : d.toLocaleString(void 0, {
        maximumSignificantDigits: 4,
        maximumFractionDigits: 3,
        useGrouping: true,
      });
}

/** @internal */
export function percentFormatter(d: number): string {
  return `${Math.round(d)}%`;
}

const fontSettings = {
  fontFamily: {
    dflt: 'Sans-Serif',
    type: 'string',
  },
  fontSize: { dflt: 12, min: 4, max: 32, type: 'number' },
  fontStyle: {
    dflt: 'normal',
    type: 'string',
    values: FONT_STYLES,
  },
  fontVariant: {
    dflt: 'normal',
    type: 'string',
    values: FONT_VARIANTS,
  },
  fontWeight: { dflt: 400, min: 100, max: 900, type: 'number' },
};

const valueFont = {
  type: 'group',
  values: {
    /*
     * Object.assign interprets the extant `undefined` as legit, so commenting it out till moving away from Object.assign in `const valueFont = ...`
     * fontFamily: {
     *   dflt: undefined,
     *   type: 'string',
     * },
     */
    fontWeight: fontSettings.fontWeight,
    fontStyle: fontSettings.fontStyle,
    fontVariant: fontSettings.fontVariant,
  },
};

/** @internal */
export const configMetadata: Record<string, ConfigItem> = {
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
  outerSizeRatio: new Numeric({
    dflt: 1 / GOLDEN_RATIO,
    min: 0.25,
    max: 1,
    reconfigurable: true,
    documentation:
      'The diameter of the entire circle, relative to the smaller of the usable rectangular size (smaller of width/height minus the margins)',
  }), // todo switch to `io-ts` style, generic way of combining static and runtime type info
  emptySizeRatio: new Numeric({
    dflt: 0,
    min: 0,
    max: 0.8,
    reconfigurable: true,
    documentation: 'The diameter of the inner circle, relative to `outerSizeRatio`',
  }), // todo switch to `io-ts` style, generic way of combining static and runtime type info
  clockwiseSectors: {
    dflt: true,
    type: 'boolean',
    documentation: 'Largest to smallest sectors are positioned in a clockwise order',
  },
  specialFirstInnermostSector: {
    dflt: true,
    type: 'boolean',
    documentation: 'Starts placement with the second largest slice, for the innermost pie/ring',
  },

  // general text config
  fontFamily: {
    dflt: 'Sans-Serif',
    type: 'string',
  },

  // fill text config
  minFontSize: { dflt: 8, min: 0.1, max: 8, type: 'number', reconfigurable: true },
  maxFontSize: { dflt: 64, min: 0.1, max: 64, type: 'number' },
  idealFontSizeJump: {
    dflt: 1.05, // Math.pow(goldenRatio, 1 / 3),
    min: 1.05,
    max: GOLDEN_RATIO,
    type: 'number',
    reconfigurable: false, // there's no real reason to reconfigure it; finding the largest possible font is good for readability
  },
  maximizeFontSize: {
    dflt: false,
    type: 'boolean',
  },
  partitionLayout: {
    dflt: PartitionLayout.sunburst,
    type: 'string',
    values: Object.keys(PartitionLayout),
  },
  drilldown: {
    dflt: false,
    type: 'boolean',
  },

  // fill text layout config
  circlePadding: { dflt: 2, min: 0.0, max: 8, type: 'number' },
  radialPadding: { dflt: TAU / 360, min: 0, max: 0.035, type: 'number' },
  horizontalTextAngleThreshold: { dflt: TAU / 12, min: 0, max: TAU, type: 'number' },
  horizontalTextEnforcer: { dflt: 1, min: 0, max: 1, type: 'number' },
  maxRowCount: { dflt: 12, min: 1, max: 16, type: 'number' },
  fillOutside: { dflt: false, type: 'boolean' },
  radiusOutside: { dflt: 128, min: 0, max: 1024, type: 'number' },
  fillRectangleWidth: { dflt: Infinity, reconfigurable: false, type: 'number' },
  fillRectangleHeight: { dflt: Infinity, reconfigurable: false, type: 'number' },
  fillLabel: {
    type: 'group',
    values: {
      textColor: { type: 'color', dflt: '#000000' },
      textInvertible: { dflt: false, type: 'boolean' },
      textContrast: { dflt: false, type: 'boolean' || 'number' },
      ...fontSettings,
      valueGetter: {
        dflt: sumValueGetter,
        type: 'function',
      },
      valueFormatter: {
        dflt: defaultFormatter,
        type: 'function',
      },
      valueFont,
      padding: {
        type: 'group',
        values: {
          top: {
            dflt: 2,
            min: 0,
            max: 20,
            type: 'number',
            reconfigurable: true,
            documentation: 'Top padding for fill text',
          },
          bottom: {
            dflt: 2,
            min: 0,
            max: 20,
            type: 'number',
            reconfigurable: true,
            documentation: 'Bottom padding for fill text',
          },
          left: {
            dflt: 2,
            min: 0,
            max: 20,
            type: 'number',
            reconfigurable: true,
            documentation: 'Left padding for fill text',
          },
          right: {
            dflt: 2,
            min: 0,
            max: 20,
            type: 'number',
            reconfigurable: true,
            documentation: 'Right padding for fill text',
          },
        },
      },
      clipText: {
        type: 'boolean',
        dflt: false,
        documentation: "Renders, but clips, text that's longer than what would fit in a box entirely",
      },
    },
  },

  // linked labels (primarily: single-line)
  linkLabel: {
    type: 'group',
    values: {
      maximumSection: {
        dflt: 10,
        min: 0,
        max: 10000,
        type: 'number',
        reconfigurable: true,
        documentation: 'Uses linked labels below this limit of the outer sector arc length (in pixels)',
      },
      ...fontSettings,
      gap: { dflt: 10, min: 6, max: 16, type: 'number' },
      spacing: { dflt: 2, min: 0, max: 16, type: 'number' },
      horizontalStemLength: { dflt: 10, min: 6, max: 16, type: 'number' },
      radiusPadding: { dflt: 10, min: 6, max: 16, type: 'number' },
      lineWidth: { dflt: 1, min: 0.1, max: 2, type: 'number' },
      maxCount: {
        dflt: 36,
        min: 2,
        max: 64,
        type: 'number',
        documentation: 'Limits the total count of linked labels. The first N largest slices are kept.',
      },
      maxTextLength: {
        dflt: 100,
        min: 2,
        max: 200,
        documentation: 'Limits the total number of characters in linked labels.',
      },
      textColor: { dflt: '#000000', type: 'color' },
      textInvertible: { dflt: false, type: 'boolean' },
      textContrast: { dflt: false, type: 'boolean' || 'number' },
      textOpacity: { dflt: 1, min: 0, max: 1, type: 'number' },
      minimumStemLength: {
        dflt: 0,
        min: 0,
        max: 16,
        type: 'number',
        reconfigurable: false, // currently only 0 is reliable
      },
      stemAngle: {
        dflt: TAU / 8,
        min: 0,
        max: TAU,
        type: 'number',
        reconfigurable: false, // currently only tau / 8 is reliable
      },
      valueFont,
    },
  },

  // other
  backgroundColor: { dflt: '#ffffff', type: 'color' },
  sectorLineWidth: { dflt: 1, min: 0, max: 4, type: 'number' },
  sectorLineStroke: { dflt: 'white', type: 'string' },
  animation: { type: 'group', values: { duration: { dflt: 0, min: 0, max: 3000, type: 'number' } } },
};

/** @internal */
export const config: Config = configMap<Config>((item: ConfigItem) => item.dflt, configMetadata);

/**
 * Part-to-whole visualizations such as treemap, sunburst, pie hinge on an aggregation
 * function such that the value is independent of the order of how the constituents are aggregated
 * https://en.wikipedia.org/wiki/Associative_property
 * Hierarchical, space-filling part-to-whole visualizations also need that the
 * the value of a node is equal to the sum of the values of its children
 * https://mboehm7.github.io/teaching/ss19_dbs/04_RelationalAlgebra.pdf p21
 * It's now `count` and `sum` but subject to change
 *
 * potential internal, or removable
 * @internal
 */
export type AdditiveAggregation = 'count' | 'sum';

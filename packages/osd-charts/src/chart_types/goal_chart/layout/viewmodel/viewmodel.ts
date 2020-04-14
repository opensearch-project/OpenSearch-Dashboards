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

import { TextMeasure } from '../../../partition_chart/layout/types/types';
import { Config } from '../types/config_types';
import { BulletViewModel, PickFunction, ShapeViewModel } from '../types/viewmodel_types';
import { GoalSpec } from '../../specs/index';

/** @internal */
export function shapeViewModel(textMeasure: TextMeasure, spec: GoalSpec, config: Config): ShapeViewModel {
  const { width, height, margin } = config;

  const innerWidth = width * (1 - Math.min(1, margin.left + margin.right));
  const innerHeight = height * (1 - Math.min(1, margin.top + margin.bottom));

  const chartCenter = {
    x: width * margin.left + innerWidth / 2,
    y: height * margin.top + innerHeight / 2,
  };

  const pickQuads: PickFunction = (x, y) => {
    return -innerWidth / 2 <= x && x <= innerWidth / 2 && -innerHeight / 2 <= y && y <= innerHeight / 2
      ? [bulletViewModel]
      : [];
  };

  const {
    subtype,
    base,
    target,
    actual,
    bands,
    ticks,
    bandFillColor,
    tickValueFormatter,
    labelMajor,
    labelMinor,
    centralMajor,
    centralMinor,
  } = spec;

  const [lowestValue, highestValue] = [base, target, actual, ...bands, ...ticks].reduce(
    ([min, max], value) => [Math.min(min, value), Math.max(max, value)],
    [Infinity, -Infinity],
  );

  const aboveBaseCount = bands.filter((b: number) => b > base).length;
  const belowBaseCount = bands.filter((b: number) => b <= base).length;

  const callbackArgs = {
    base,
    target,
    actual,
    highestValue,
    lowestValue,
    aboveBaseCount,
    belowBaseCount,
  };

  const bulletViewModel: BulletViewModel = {
    subtype,
    base,
    target,
    actual,
    bands: bands.map((value: number, index: number) => ({
      value,
      fillColor: bandFillColor({ value, index, ...callbackArgs }),
    })),
    ticks: ticks.map((value: number, index: number) => ({
      value,
      text: tickValueFormatter({ value, index, ...callbackArgs }),
    })),
    labelMajor: typeof labelMajor === 'string' ? labelMajor : labelMajor({ value: NaN, index: 0, ...callbackArgs }),
    labelMinor: typeof labelMinor === 'string' ? labelMinor : labelMinor({ value: NaN, index: 0, ...callbackArgs }),
    centralMajor:
      typeof centralMajor === 'string' ? centralMajor : centralMajor({ value: NaN, index: 0, ...callbackArgs }),
    centralMinor:
      typeof centralMinor === 'string' ? centralMinor : centralMinor({ value: NaN, index: 0, ...callbackArgs }),
    highestValue,
    lowestValue,
    aboveBaseCount,
    belowBaseCount,
  };

  // combined viewModel
  return {
    config,
    chartCenter,
    bulletViewModel,
    pickQuads,
  };
}

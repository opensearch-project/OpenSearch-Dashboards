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

import { ChartType } from '../..';
import { SpecType } from '../../../specs/constants';
import { Position, RecursivePartial } from '../../../utils/common';
import { AxisId } from '../../../utils/ids';
import { AxisStyle } from '../../../utils/themes/theme';
import { AxisViewModel, hasDuplicateAxis } from '../utils/axis_utils';
import { AxisSpec } from '../utils/specs';

const style: RecursivePartial<AxisStyle> = {
  tickLine: {
    size: 30,
    padding: 10,
  },
};
describe('isDuplicateAxis', () => {
  const AXIS_1_ID = 'spec_1';
  const AXIS_2_ID = 'spec_1';
  const axis1: AxisSpec = {
    chartType: ChartType.XYAxis,
    specType: SpecType.Axis,
    id: AXIS_1_ID,
    groupId: 'group_1',
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    style,
    tickFormat: (value: any) => `${value}%`,
  };
  const axis2: AxisSpec = {
    ...axis1,
    id: AXIS_2_ID,
    groupId: 'group_2',
  };
  const axisTicksDimensions: AxisViewModel = {
    tickValues: [],
    tickLabels: ['10', '20', '30'],
    maxLabelBboxWidth: 1,
    maxLabelBboxHeight: 1,
    maxLabelTextWidth: 1,
    maxLabelTextHeight: 1,
    isHidden: false,
  };
  let tickMap: Map<AxisId, AxisViewModel>;
  let specMap: AxisSpec[];

  beforeEach(() => {
    tickMap = new Map<AxisId, AxisViewModel>();
    specMap = [];
  });

  it('should return true if axisSpecs and ticks match', () => {
    tickMap.set(AXIS_2_ID, axisTicksDimensions);
    specMap.push(axis2);
    const result = hasDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

    expect(result).toBe(true);
  });

  it('should return false if axisSpecs, ticks AND title match', () => {
    tickMap.set(AXIS_2_ID, axisTicksDimensions);
    specMap.push({
      ...axis2,
      title: 'TESTING',
    });
    const result = hasDuplicateAxis(
      {
        ...axis1,
        title: 'TESTING',
      },
      axisTicksDimensions,
      tickMap,
      specMap,
    );

    expect(result).toBe(true);
  });

  it('should return true with single tick', () => {
    const newAxisTicksDimensions = {
      ...axisTicksDimensions,
      tickLabels: ['10'],
    };
    tickMap.set(AXIS_2_ID, newAxisTicksDimensions);
    specMap.push(axis2);

    const result = hasDuplicateAxis(axis1, newAxisTicksDimensions, tickMap, specMap);

    expect(result).toBe(true);
  });

  it('should return false if axisSpecs and ticks match but title is different', () => {
    tickMap.set(AXIS_2_ID, axisTicksDimensions);
    specMap.push({
      ...axis2,
      title: 'TESTING',
    });
    const result = hasDuplicateAxis(
      {
        ...axis1,
        title: 'NOT TESTING',
      },
      axisTicksDimensions,
      tickMap,
      specMap,
    );

    expect(result).toBe(false);
  });

  it('should return false if axisSpecs and ticks match but position is different', () => {
    tickMap.set(AXIS_2_ID, axisTicksDimensions);
    specMap.push(axis2);
    const result = hasDuplicateAxis(
      {
        ...axis1,
        position: Position.Top,
      },
      axisTicksDimensions,
      tickMap,
      specMap,
    );

    expect(result).toBe(false);
  });

  it('should return false if tickFormat is different', () => {
    tickMap.set(AXIS_2_ID, {
      ...axisTicksDimensions,
      tickLabels: ['10%', '20%', '30%'],
    });
    specMap.push(axis2);

    const result = hasDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

    expect(result).toBe(false);
  });

  it('should return false if tick label count is different', () => {
    tickMap.set(AXIS_2_ID, {
      ...axisTicksDimensions,
      tickLabels: ['10', '20', '25', '30'],
    });
    specMap.push(axis2);

    const result = hasDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

    expect(result).toBe(false);
  });

  it("should return false if can't find spec", () => {
    tickMap.set(AXIS_2_ID, axisTicksDimensions);
    const result = hasDuplicateAxis(axis1, axisTicksDimensions, tickMap, specMap);

    expect(result).toBe(false);
  });
});

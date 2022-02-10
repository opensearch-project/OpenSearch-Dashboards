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

import { BasicSeriesSpec, DEFAULT_GLOBAL_ID, Spec } from '../../../../specs';
import { GroupId } from '../../../../utils/ids';
import { isVerticalAxis } from '../../utils/axis_type_utils';
import { AxisSpec } from '../../utils/specs';

/** @internal */
export function getSpecsById<T extends Spec>(specs: T[], id: string): T | undefined {
  return specs.find((spec) => spec.id === id);
}

/** @internal */
export function getAxesSpecForSpecId(axesSpecs: AxisSpec[], groupId: GroupId) {
  let xAxis: AxisSpec | undefined;
  let yAxis: AxisSpec | undefined;
  // eslint-disable-next-line no-restricted-syntax
  for (const axisSpec of axesSpecs) {
    if (axisSpec.groupId !== groupId) {
      continue;
    }
    if (isVerticalAxis(axisSpec.position)) {
      yAxis = axisSpec;
    } else {
      xAxis = axisSpec;
    }
  }

  return {
    xAxis,
    yAxis,
  };
}

/** @internal */
export function getSpecDomainGroupId(spec: BasicSeriesSpec): string {
  if (!spec.useDefaultGroupDomain) {
    return spec.groupId;
  }
  return typeof spec.useDefaultGroupDomain === 'boolean' ? DEFAULT_GLOBAL_ID : spec.useDefaultGroupDomain;
}

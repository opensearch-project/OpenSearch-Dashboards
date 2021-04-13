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

import { Rotation } from '../../../../utils/common';
import { GroupId } from '../../../../utils/ids';
import { isCompleteBound, isLowerBound, isUpperBound, isBounded } from '../../utils/axis_type_utils';
import { isYDomain } from '../../utils/axis_utils';
import { AxisSpec, YDomainRange } from '../../utils/specs';

/** @internal */
export function mergeYCustomDomainsByGroupId(
  axesSpecs: AxisSpec[],
  chartRotation: Rotation,
): Map<GroupId, YDomainRange> {
  const domainsByGroupId = new Map<GroupId, YDomainRange>();

  axesSpecs.forEach((spec: AxisSpec) => {
    const { id, groupId, domain } = spec;

    if (!domain) {
      return;
    }

    const isAxisYDomain = isYDomain(spec.position, chartRotation);

    if (!isAxisYDomain) {
      const errorMessage = `[Axis ${id}]: custom domain for xDomain should be defined in Settings`;
      throw new Error(errorMessage);
    }

    if (isCompleteBound(domain) && domain.min > domain.max) {
      const errorMessage = `[Axis ${id}]: custom domain is invalid, min is greater than max`;
      throw new Error(errorMessage);
    }

    const prevGroupDomain = domainsByGroupId.get(groupId);

    if (prevGroupDomain) {
      const prevDomain = prevGroupDomain;
      const prevMin = isLowerBound(prevDomain) ? prevDomain.min : undefined;
      const prevMax = isUpperBound(prevDomain) ? prevDomain.max : undefined;

      let max = prevMax;
      let min = prevMin;

      if (isCompleteBound(domain)) {
        min = prevMin != null ? Math.min(domain.min, prevMin) : domain.min;
        max = prevMax != null ? Math.max(domain.max, prevMax) : domain.max;
      } else if (isLowerBound(domain)) {
        min = prevMin != null ? Math.min(domain.min, prevMin) : domain.min;
      } else if (isUpperBound(domain)) {
        max = prevMax != null ? Math.max(domain.max, prevMax) : domain.max;
      }

      const mergedDomain = {
        min,
        max,
      };

      if (isBounded(mergedDomain)) {
        domainsByGroupId.set(groupId, mergedDomain);
      }
    } else {
      domainsByGroupId.set(groupId, domain);
    }
  });
  return domainsByGroupId;
}

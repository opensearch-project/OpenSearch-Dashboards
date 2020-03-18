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

import { Dimensions } from '../../../utils/dimensions';

/** @internal */
export function getFinalAnnotationTooltipPosition(
  /** the dimensions of the chart parent container */
  container: Dimensions,
  chartDimensions: Dimensions,
  /** the dimensions of the tooltip container */
  tooltip: Dimensions,
  /** the tooltip computed position not adjusted within chart bounds */
  tooltipAnchor: { top: number; left: number },
  padding = 10,
): {
  left: string | null;
  top: string | null;
} {
  let left = 0;

  const annotationXOffset = window.pageXOffset + container.left + chartDimensions.left + tooltipAnchor.left;
  if (chartDimensions.left + tooltipAnchor.left + tooltip.width + padding >= container.width) {
    left = annotationXOffset - tooltip.width - padding;
  } else {
    left = annotationXOffset + padding;
  }
  let top = window.pageYOffset + container.top + chartDimensions.top + tooltipAnchor.top;
  if (chartDimensions.top + tooltipAnchor.top + tooltip.height + padding >= container.height) {
    top -= tooltip.height + padding;
  } else {
    top += padding;
  }

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}

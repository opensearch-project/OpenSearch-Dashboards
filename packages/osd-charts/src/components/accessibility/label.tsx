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

import React from 'react';

import { GoalChartLabels } from '../../chart_types/goal_chart/state/selectors/get_goal_chart_data';
import { A11ySettings } from '../../state/selectors/get_accessibility_config';

interface ScreenReaderLabelProps {
  goalChartLabels?: GoalChartLabels;
}

/** @internal */
export function ScreenReaderLabel({
  label,
  labelHeadingLevel,
  labelId,
  goalChartLabels,
}: A11ySettings & ScreenReaderLabelProps) {
  const Heading = labelHeadingLevel;

  if (!label && !goalChartLabels?.majorLabel && !goalChartLabels?.minorLabel) return null;

  let unifiedLabel = '';
  if (!label && goalChartLabels?.majorLabel) {
    unifiedLabel = goalChartLabels?.majorLabel;
  } else if (label && !goalChartLabels?.majorLabel) {
    unifiedLabel = label;
  } else if (label && goalChartLabels?.majorLabel && label !== goalChartLabels?.majorLabel) {
    unifiedLabel = `${label}; Chart visible label: ${goalChartLabels?.majorLabel}`;
  }

  return (
    <>
      {unifiedLabel && <Heading id={labelId}>{unifiedLabel}</Heading>}
      {goalChartLabels?.minorLabel && <p>{goalChartLabels?.minorLabel}</p>}
    </>
  );
}

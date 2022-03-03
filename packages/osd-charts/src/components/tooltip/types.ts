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

import { ComponentType } from 'react';

import { TooltipValue } from '../../specs';

/**
 * The set of info used to render the a tooltip.
 * @public
 */
export interface TooltipInfo {
  /**
   * The TooltipValue for the header. On XYAxis chart the x value
   */
  header: TooltipValue | null;
  /**
   * The array of {@link TooltipValue}s to show on the tooltip.
   * On XYAxis chart correspond to the set of y values for each series
   */
  values: TooltipValue[];
}

/**
 * The react component used to render a custom tooltip
 * with the {@link TooltipInfo} props
 * @public
 */
export type CustomTooltip = ComponentType<TooltipInfo>;

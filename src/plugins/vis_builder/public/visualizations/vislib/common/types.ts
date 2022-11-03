/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Positions } from '../../../../../vis_type_vislib/public';
import { RenderState } from '../../../application/utils/state_management';

export interface BasicOptionsDefaults {
  addTooltip: boolean;
  addLegend: boolean;
  legendPosition: Positions;
  type: string;
}

export interface VislibRootState<T extends BasicOptionsDefaults> extends RenderState {
  style: T;
}

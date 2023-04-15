/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from '@reduxjs/toolkit';
import { CreateAggConfigParams } from '../../../../../data/common';
import { VisualizationType } from '../../../services/type_service/visualization_type';

export interface ActiveVisPayload {
  name: VisualizationType['name'];
  style: VisualizationType['ui']['containerConfig']['style']['defaults'];
  aggConfigParams: CreateAggConfigParams[];
}

export const setActiveVisualization = createAction<ActiveVisPayload>('setActiveVisualzation');

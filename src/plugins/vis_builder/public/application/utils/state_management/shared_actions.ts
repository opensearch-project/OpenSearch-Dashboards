/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAction } from '@reduxjs/toolkit';
import { VisualizationType } from '../../../services/type_service/visualization_type';

interface ActiveVisPayload {
  name: VisualizationType['name'];
  style: VisualizationType['ui']['containerConfig']['style']['defaults'];
}

export const setActiveVisualization = createAction<ActiveVisPayload>('setActiveVisualzation');

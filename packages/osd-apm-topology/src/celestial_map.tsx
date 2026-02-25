/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ReactFlowProvider } from '@xyflow/react';

import { Celestial } from './celestial';
import type { CelestialMapProps } from './types';
import { CelestialStateProvider } from './shared/contexts/celestial_state_context';

export const CelestialMap = (props: CelestialMapProps) => (
  <ReactFlowProvider>
    <CelestialStateProvider layoutOptions={props.layoutOptions}>
      <Celestial {...props} />
    </CelestialStateProvider>
  </ReactFlowProvider>
);

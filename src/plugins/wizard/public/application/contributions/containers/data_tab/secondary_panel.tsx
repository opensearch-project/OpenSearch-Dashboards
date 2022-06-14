/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTypedSelector } from '../../../utils/state_management';
import { Title } from './items';

export function SecondaryPanel() {
  const activeAgg = useTypedSelector((state) => state.visualization.activeVisualization?.activeAgg);

  return (
    <div className="wizConfig__section wizConfig--secondary">
      <Title title="Test" isSecondary />
      <div>{JSON.stringify(activeAgg)}</div>
    </div>
  );
}

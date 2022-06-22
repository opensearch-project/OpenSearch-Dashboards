/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm } from '@elastic/eui';
import React from 'react';
import { useVisualizationType } from '../../../utils/use';
import { useTypedSelector } from '../../../utils/state_management';
import './config_panel.scss';
import { mapSchemaToAggPanel } from './utils/schema_to_dropbox';
import { SecondaryPanel } from './secondary_panel';

export function ConfigPanel() {
  const vizType = useVisualizationType();
  const draftAgg = useTypedSelector((state) => state.visualization.activeVisualization?.draftAgg);
  const schemas = vizType.ui.containerConfig.data.schemas;

  if (!schemas) return null;

  const mainPanel = mapSchemaToAggPanel(schemas);

  return (
    <EuiForm className={`wizConfig ${draftAgg ? 'showSecondary' : ''}`}>
      <div className="wizConfig__section">{mainPanel}</div>
      <SecondaryPanel />
    </EuiForm>
  );
}

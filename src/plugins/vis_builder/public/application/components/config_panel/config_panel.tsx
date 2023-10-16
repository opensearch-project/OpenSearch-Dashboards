/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm } from '@elastic/eui';
import React from 'react';
import { useVisualizationType } from '../../utils/use';
import { mapSchemaToAggPanel } from './schema_to_dropbox';
import { SecondaryPanel } from './secondary_panel';

import './config_panel.scss';
import '../side_nav.scss';
import { useVisBuilderContext } from '../../view_components/context';

export function ConfigPanel() {
  const vizType = useVisualizationType();
  const { rootState } = useVisBuilderContext();
  const editingState = rootState.visualization.activeVisualization?.draftAgg;
  const schemas = vizType.ui.containerConfig.data.schemas;

  if (!schemas) return null;

  const mainPanel = mapSchemaToAggPanel(schemas);

  return (
    <section className="vbSidenav config">
      <EuiForm className={`vbConfig ${editingState ? 'showSecondary' : ''}`}>
        <div className="vbConfig__section">{mainPanel}</div>
        <SecondaryPanel />
      </EuiForm>
    </section>
  );
}

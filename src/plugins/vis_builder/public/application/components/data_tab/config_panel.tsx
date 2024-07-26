/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm } from '@elastic/eui';
import React from 'react';

import './config_panel.scss';
import { mapSchemaToAggPanel } from './schema_to_dropbox';
import { SecondaryPanel } from './secondary_panel';
import { Schemas } from '../../../../../vis_default_editor/public';
import {
  AggConfig,
  AggConfigs,
  CreateAggConfigParams,
} from '../../../../../data/common/search/aggs';
import { IndexPattern, TimeRange } from '../../../../../data/public';
import { SchemaDisplayStates } from '.';

export interface AggProps {
  indexPattern: IndexPattern | undefined;
  aggConfigs: AggConfigs | undefined;
  aggs: AggConfig[];
  timeRange: TimeRange;
}

export interface ConfigPanelProps {
  schemas: Schemas;
  editingState?: CreateAggConfigParams;
  aggProps: AggProps;
  activeSchemaFields: SchemaDisplayStates;
  setActiveSchemaFields: React.Dispatch<React.SetStateAction<SchemaDisplayStates>>;
  isDragging: boolean;
}

export function ConfigPanel({
  schemas,
  editingState,
  aggProps,
  activeSchemaFields,
  setActiveSchemaFields,
  isDragging,
}: ConfigPanelProps) {
  if (!schemas) return null;

  const mainPanel = mapSchemaToAggPanel(
    schemas,
    aggProps,
    activeSchemaFields,
    setActiveSchemaFields,
    isDragging
  );

  return (
    <EuiForm className={`vbConfig ${editingState ? 'showSecondary' : ''}`}>
      <div className="vbConfig__section">{mainPanel}</div>
      <SecondaryPanel />
    </EuiForm>
  );
}

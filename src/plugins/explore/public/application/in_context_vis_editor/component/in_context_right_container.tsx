/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiPanel, EuiEmptyPrompt, EuiIcon } from '@elastic/eui';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';

import '../in_context_editor.scss';

export const RightStyleOptionsPanel = () => {
  const { queryEditorState } = useQueryBuilderState();

  const queryStatus = queryEditorState.queryStatus;

  const visualizationBuilder = getVisualizationBuilder();
  const displayEmptyState =
    queryStatus.status === QueryExecutionStatus.UNINITIALIZED ||
    queryStatus.status === QueryExecutionStatus.NO_RESULTS;

  if (displayEmptyState) {
    return (
      <EuiPanel
        paddingSize="s"
        style={{ height: '100%' }}
        borderRadius="none"
        hasShadow={false}
        color="transparent"
      >
        <StylePanelEmptyState />
      </EuiPanel>
    );
  }
  return (
    <EuiPanel paddingSize="s" style={{ height: '100%' }} borderRadius="none" hasShadow={false}>
      {visualizationBuilder.renderStylePanel({ className: 'visStylePanelBody' })}
    </EuiPanel>
  );
};

export const StylePanelEmptyState = () => {
  return (
    <EuiEmptyPrompt
      icon={<EuiIcon type="visualizeApp" size="xl" />}
      title={
        <h2>
          <FormattedMessage
            id="explore.stylePanel.emptyState.uninitializedTitle"
            defaultMessage="Visualize"
          />
        </h2>
      }
      body={
        <p>
          <FormattedMessage
            id="explore.stylePanel.emptyState.uninitializedText"
            defaultMessage="Run a query to start seeing suggested visualizations"
          />
        </p>
      }
    />
  );
};

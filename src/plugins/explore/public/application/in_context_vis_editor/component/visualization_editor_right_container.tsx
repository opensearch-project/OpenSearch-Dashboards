/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiPanel, EuiEmptyPrompt, EuiIcon, EuiLoadingSpinner } from '@elastic/eui';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import '../visualization_editor.scss';

export const RightStyleOptionsPanel = () => {
  const { queryEditorState } = useQueryBuilderState();
  const queryStatus = queryEditorState.queryStatus;
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();

  const displayEmptyState =
    queryStatus.status === QueryExecutionStatus.UNINITIALIZED ||
    queryStatus.status === QueryExecutionStatus.NO_RESULTS;

  // Unmount the style panel to ensure outdated component state doesn't override current styles
  if (queryStatus.status === QueryExecutionStatus.LOADING)
    return (
      <EuiPanel paddingSize="s" style={{ height: '100%' }} borderRadius="none" hasShadow={false}>
        <StylePanelLoadingState />
      </EuiPanel>
    );

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
    <EuiPanel
      paddingSize="s"
      style={{ height: '100%', overflow: 'auto' }}
      borderRadius="none"
      hasShadow={false}
    >
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

export const StylePanelLoadingState = () => {
  return <EuiEmptyPrompt icon={<EuiLoadingSpinner data-test-subj="loadingSpinner" size="xl" />} />;
};

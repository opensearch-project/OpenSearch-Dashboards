/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiText,
  EuiPanel,
  EuiMarkdownFormat,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import './results_summary.scss';
import { isEmpty } from 'lodash';

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}

interface ResultsSummaryContentProps {
  summary: string;
  loading: boolean;
}

export const ResultsSummaryContent: React.FC<ResultsSummaryContentProps> = ({
  summary,
  loading,
}) => {
  const getPanelContent = () => {
    if (loading) {
      return (
        <EuiEmptyPrompt
          icon={<EuiLoadingSpinner size="xl" />}
          title={
            <EuiText color="subdued" size="m" style={{ fontWeight: 600 }}>
              {i18n.translate('explore.resultsSummary.summary.generating', {
                defaultMessage: 'Generating summary',
              })}
            </EuiText>
          }
        />
      );
    } else if (isEmpty(summary)) {
      return (
        <EuiEmptyPrompt
          icon={<EuiIcon type="generateContent" size="xl" />}
          title={
            <EuiText color="subdued" size="m" style={{ fontWeight: 600 }}>
              {i18n.translate('explore.resultsSummary.summary.placeholder', {
                defaultMessage: 'Run a query to generate summary',
              })}
            </EuiText>
          }
        />
      );
    } else {
      return (
        <>
          <EuiText size="s" data-test-subj="exploreResultsSummary_summary_result">
            <EuiMarkdownFormat>{summary}</EuiMarkdownFormat>
          </EuiText>
        </>
      );
    }
  };

  return (
    <EuiPanel
      className="exploreResultsSummary__summaryContent"
      paddingSize="s"
      borderRadius="none"
      hasShadow={false}
      style={{ maxHeight: 160, overflowY: 'auto' }}
    >
      {getPanelContent()}
    </EuiPanel>
  );
};

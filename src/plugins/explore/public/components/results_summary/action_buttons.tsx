/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { EuiCopy, EuiFlexGroup, EuiSmallButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isEmpty } from 'lodash';
import { DiscoverChartToggleId } from '../chart/utils/use_persist_chart_state';

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}

interface ActionButtonsProps {
  toggleIdSelected: DiscoverChartToggleId;
  summary: string;
  reportMetric: (metric: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  toggleIdSelected,
  summary,
  reportMetric,
}) => {
  const [feedback, setFeedback] = useState(FeedbackStatus.NONE);

  const onFeedback = useCallback(
    (satisfied: boolean) => {
      if (feedback !== FeedbackStatus.NONE) return;
      const feedbackStatus = satisfied ? FeedbackStatus.THUMB_UP : FeedbackStatus.THUMB_DOWN;
      setFeedback(feedbackStatus);
      reportMetric(feedbackStatus);
    },
    [feedback, reportMetric]
  );

  const afterFeedbackTip = i18n.translate('explore.resultsSummary.summary.afterFeedback', {
    defaultMessage:
      'Thank you for the feedback. Try again by adjusting your question so that I have the opportunity to better assist you.',
  });

  if (toggleIdSelected !== 'summary' || isEmpty(summary)) {
    return null;
  }

  return (
    <EuiFlexGroup
      gutterSize="none"
      alignItems="center"
      style={{ marginInlineEnd: 8, justifyContent: 'end' }}
    >
      {feedback !== FeedbackStatus.THUMB_DOWN && (
        <EuiSmallButtonIcon
          aria-label="feedback thumbs up"
          color={feedback === FeedbackStatus.THUMB_UP ? 'primary' : 'text'}
          iconType="thumbsUp"
          title={
            !feedback
              ? i18n.translate('explore.resultsSummary.summary.goodResponse', {
                  defaultMessage: `Good response`,
                })
              : afterFeedbackTip
          }
          onClick={() => onFeedback(true)}
          data-test-subj="exploreResultsSummary_summary_buttons_thumbup"
        />
      )}
      {feedback !== FeedbackStatus.THUMB_UP && (
        <EuiSmallButtonIcon
          aria-label="feedback thumbs down"
          color={feedback === FeedbackStatus.THUMB_DOWN ? 'primary' : 'text'}
          title={
            !feedback
              ? i18n.translate('explore.resultsSummary.summary.badResponse', {
                  defaultMessage: `Bad response`,
                })
              : afterFeedbackTip
          }
          iconType="thumbsDown"
          onClick={() => onFeedback(false)}
          data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"
        />
      )}
      <div className="exploreResultsSummary__verticalSeparator" />
      <EuiCopy textToCopy={summary ?? ''}>
        {(copy) => (
          <EuiSmallButtonIcon
            aria-label="Copy to clipboard"
            title={i18n.translate('explore.resultsSummary.summary.copy', {
              defaultMessage: `Copy to clipboard`,
            })}
            onClick={copy}
            color="text"
            iconType="copy"
            data-test-subj="exploreResultsSummary_summary_buttons_copy"
          />
        )}
      </EuiCopy>
    </EuiFlexGroup>
  );
};

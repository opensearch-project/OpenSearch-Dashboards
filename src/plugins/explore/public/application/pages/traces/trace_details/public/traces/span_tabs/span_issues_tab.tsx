/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiText, EuiSpacer, EuiCodeBlock, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isEmpty } from '../../utils/helper_functions';
import { extractSpanIssues, SpanIssue } from '../../utils/span_data_utils';
import './span_tabs.scss';

export interface SpanIssuesTabProps {
  selectedSpan?: any;
}

export const SpanIssuesTab: React.FC<SpanIssuesTabProps> = ({ selectedSpan }) => {
  const issues = useMemo(() => {
    return selectedSpan ? extractSpanIssues(selectedSpan) : [];
  }, [selectedSpan]);

  const renderIssue = (issue: SpanIssue, index: number) => {
    return (
      <EuiPanel key={`issue-${index}`} paddingSize="s" color="subdued">
        <EuiText size="s">
          <strong>{issue.message}</strong>
        </EuiText>
        {issue.timestamp && (
          <EuiText size="xs" color="subdued">
            {new Date(parseInt(issue.timestamp, 10) / 1000000).toLocaleString()}
          </EuiText>
        )}
        {issue.details && (
          <>
            <EuiSpacer size="xs" />
            <div className="exploreSpanTabs__issuesContainer">
              <EuiCodeBlock
                language="json"
                paddingSize="s"
                isCopyable
                className="exploreSpanTabs__codeBlock"
              >
                {JSON.stringify(issue.details, null, 2)}
              </EuiCodeBlock>
            </div>
          </>
        )}
      </EuiPanel>
    );
  };

  if (!selectedSpan || isEmpty(selectedSpan)) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanIssuesTab.noSpanSelected', {
          defaultMessage: 'No span selected',
        })}
      </EuiText>
    );
  }

  if (issues.length === 0) {
    return (
      <EuiText color="subdued" textAlign="center">
        {i18n.translate('explore.spanIssuesTab.noIssues', {
          defaultMessage: 'No issues found for this span',
        })}
      </EuiText>
    );
  }

  return (
    <>
      {issues.length > 0 && (
        <>
          <EuiSpacer size="s" />
          {issues.map((issue, index) => (
            <React.Fragment key={`issue-fragment-${index}`}>
              {renderIssue(issue, index)}
              {index < issues.length - 1 && <EuiSpacer size="s" />}
            </React.Fragment>
          ))}
        </>
      )}
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ShowFieldToggle } from './show_field';
import { SaveQueryButton } from './save_query';
import { Actions } from './actions';
import { DateTimeRangePicker } from './date_time_selector';
import { RunQueryButton } from './run_query';
import { ShowInputType } from './show_input_type';
import { LanguageType } from '../../types';
import { QueryError } from './query_error';
import { ResultStatus } from '../../types';

import './index.scss';

const RECENT_QUERIES_LABEL = i18n.translate('explore.queryPanel.recentQueryLabel', {
  defaultMessage: 'Recent Queries',
});

interface QueryPanelFooterProps {
  languageType: LanguageType;
  onRunClick: () => void;
  onRecentClick: () => void;
  isDualEditor: boolean;
  isLoading: boolean;
  noInput: boolean;
  lineCount: number | undefined;
}

export const QueryPanelFooter: React.FC<QueryPanelFooterProps> = ({
  languageType,
  onRunClick,
  onRecentClick,
  isDualEditor,
  isLoading,
  noInput,
  lineCount,
}) => {
  const showLineCount =
    typeof lineCount === 'number' &&
    lineCount > 0 &&
    (languageType !== LanguageType.Natural || isDualEditor); // Show line number only for ppl or dual
  return (
    <div className="queryPanel__footer">
      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="center"
        gutterSize="xs"
        responsive={true}
        wrap
      >
        {/* Left Section */}
        <EuiFlexItem grow={1} style={{ minWidth: 0 }}>
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            <EuiFlexItem grow={false}>
              <ShowFieldToggle
                isEnabled={true}
                onToggle={(enabled) => {
                  // Todo: Dispatch query action to update toggle value which can be used by field sidebar
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={onRecentClick}
                iconType="clock"
                className="queryPanel__footer__recentQueriesButton"
                data-test-subj="queryPanelFooterRecentQueriesButton"
              >
                {RECENT_QUERIES_LABEL}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <SaveQueryButton />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div className="queryPanel__footer__verticalSeparator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <QueryError
                // TODO: Update query error with query slice object and remove below mocked string
                queryStatus={{
                  status: ResultStatus.ERROR,
                  body: {
                    error: {
                      error: 'An error occurred while processing the query.', // This is mocked error string
                    },
                  },
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} className="queryPanel__footer__showInputTypeWrapper">
              <ShowInputType
                languageType={languageType}
                isDualEditor={isDualEditor}
                noInput={noInput}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {showLineCount && (
                <EuiText
                  size="xs"
                  color="subdued"
                  className="queryPanel__footer__lineCount"
                  data-test-subj="queryPanelFooterLineCount"
                >
                  {i18n.translate('explore.queryPanel.lineCountLabel', {
                    defaultMessage: '{lineCount, plural, one {# line} other {# lines}}',
                    values: { lineCount },
                  })}
                </EuiText>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Right Section */}
        <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
              <Actions />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
              <DateTimeRangePicker />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 0 }}>
              <RunQueryButton onClick={onRunClick} isDisabled={noInput} isLoading={isLoading} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

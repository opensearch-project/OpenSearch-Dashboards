/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { SavedQuery } from 'src/plugins/data/public';
import { ShowFieldToggle } from './show_field';
import { SaveQueryButton } from './save_query';
import { Actions } from './actions';
import { DateTimeRangePicker } from './date_time_selector';
import { RunQueryButton } from './run_query';
import { ShowInputType } from './show_input_type';
import { LanguageType, Query } from '../../types';
import { QueryError } from './query_error';
import { ResultStatus } from '../../types';
import { ExploreServices } from '../../../../types';

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
  query: Query;
  showDatasetFields: boolean;
  showDatePicker: boolean;
  datePickerRef?: React.RefObject<HTMLDivElement>;
  services: ExploreServices;
  timefilter: any;
  onTimeChange: (time: { start: string; end: string }) => void;
  onRunQuery: () => void;
  onClearQuery: () => void;
  onLoadSavedQuery: (savedQuery: SavedQuery) => void;
  onRefreshChange: (refresh: { isPaused: boolean; refreshInterval: number }) => void;
  onShowFieldsToggle: (enabled: boolean) => void;
  onSavedQuery: (newSavedQueryId: string | undefined) => void;
}

export const QueryPanelFooter: React.FC<QueryPanelFooterProps> = ({
  languageType,
  onRunClick,
  onRecentClick,
  isDualEditor,
  isLoading,
  showDatasetFields,
  showDatePicker,
  noInput,
  query,
  datePickerRef,
  services,
  timefilter,
  onClearQuery,
  onLoadSavedQuery,
  onSavedQuery,
  onTimeChange,
  onRunQuery,
  onRefreshChange,
  onShowFieldsToggle,
}) => {
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
        <EuiFlexItem grow={1} className="queryPanel__footer__minWidth0">
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            <EuiFlexItem grow={false}>
              <ShowFieldToggle isEnabled={showDatasetFields} onToggle={onShowFieldsToggle} />
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
              <SaveQueryButton
                services={services}
                showDatePicker={showDatePicker}
                timeFilter={timefilter}
                query={query}
                onClearQuery={onClearQuery}
                onLoadSavedQuery={onLoadSavedQuery}
                onSavedQuery={onSavedQuery}
              />
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
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Right Section */}
        <EuiFlexItem grow={false} className="queryPanel__footer__minWidth0">
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={true} wrap>
            <EuiFlexItem grow={false} className="queryPanel__footer__minWidth0">
              <Actions />
            </EuiFlexItem>
            {showDatePicker && (
              <EuiFlexItem grow={false} className="queryPanel__footer__dateTimeRangePickerWrapper">
                <DateTimeRangePicker
                  datePickerRef={datePickerRef}
                  services={services}
                  timefilter={timefilter}
                  onTimeChange={onTimeChange}
                  onRunQuery={onRunQuery}
                  onRefreshChange={onRefreshChange}
                />
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false} className="queryPanel__footer__minWidth0">
              <RunQueryButton onClick={onRunClick} isDisabled={noInput} isLoading={isLoading} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

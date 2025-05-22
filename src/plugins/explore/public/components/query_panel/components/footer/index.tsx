/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
// import { SwitchLanguage } from './switch_language';
import { ShowFieldToggle } from './show_field';
import { SaveQueryButton } from './save_query';
import { Actions } from './actions';
import { DateTimeRangePicker } from './date_time_selector';
import { RunQueryButton } from './run_query';
import { ShowInputType } from './show_input_type';
import { LanguageType } from '../editor_stack/shared';
import { ErrorDisplay } from './error_display';

interface QueryEditorFooterProps {
  languageType: LanguageType;
  handleRunClick: () => void;
  handleRecentClick: () => void;
  isDualEditor: boolean;
  isLoading: boolean;
  noInput: boolean;
}

export const QueryEditorFooter: React.FC<QueryEditorFooterProps> = ({
  languageType,
  handleRunClick,
  handleRecentClick,
  isDualEditor,
  isLoading,
  noInput,
}) => {
  return (
    <div className="query-editor-footer">
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="xs">
        {/* Left Section */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <ShowFieldToggle
                isEnabled={true}
                onToggle={(enabled) => {
                  // console.log('Show Fields toggled:', enabled)
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiHorizontalRule margin="xs" className="vertical-separator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={handleRecentClick}
                iconType="clock"
                style={{ padding: '0px' }}
                data-test-subj="recentQueriesButton"
              >
                Recent Queries
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiHorizontalRule margin="xs" className="vertical-separator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <SaveQueryButton />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiHorizontalRule margin="xs" className="vertical-separator" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <ErrorDisplay
                errorDetails={{
                  statusCode: 500,
                  message:
                    'PPL Compilation Error: Unknown field [timestam]. Did you mean [timestamp]?',
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: '10px' }}>
              <ShowInputType
                languageType={languageType}
                isDualEditor={isDualEditor}
                noInput={noInput}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        {/* Right Section */}
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <Actions />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <DateTimeRangePicker />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RunQueryButton onClick={handleRunClick} isDisabled={noInput} isLoading={isLoading} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

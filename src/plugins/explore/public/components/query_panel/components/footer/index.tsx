/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
// import { SwitchLanguage } from './switch_language';
import { ShowFieldToggle } from './show_field';
import { RecentQueries } from './recent_queries';
import { SaveQueryButton } from './save_query';
import { Actions } from './actions';
import { DateTimeRangePicker } from './date_time_selector';
import { RunQueryButton } from './run_query';
import { ShowInputType } from './show_input_type';
import { LanguageType } from '../editor_stack/shared';
import { ErrorDisplay } from './error_display';

interface QueryEditorFooterProps {
  languageType: LanguageType;
  handleQueryRun: () => void;
  isDualEditor: Boolean;
}

export const QueryEditorFooter: React.FC<QueryEditorFooterProps> = ({
  languageType,
  handleQueryRun,
  isDualEditor,
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
              <RecentQueries />
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
              <ErrorDisplay errorDetails="error Details" />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: '10px' }}>
              <ShowInputType languageType={languageType} isDualEditor={isDualEditor} />
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
              <RunQueryButton onClick={handleQueryRun} isDisabled={false} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

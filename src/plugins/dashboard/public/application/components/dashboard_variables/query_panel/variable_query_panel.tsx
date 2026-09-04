/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { EuiSmallButton, EuiSpacer, EuiFormRow, EuiButtonGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IVariableInterpolationService } from '../../../../variables/variable_interpolation_service';
import { PromQLResourceQuery } from '../../../../variables/types';
import { QueryEditorModal, QueryEditorModalApplyResult } from './query_editor_modal';
import './variable_query_panel.scss';
import { Dataset } from '../../../../../../data/common';

export interface VariableQueryPanelProps {
  query: string;
  language: string;
  dataset: Dataset | undefined;
  onQueryChange: (query: string) => void;
  onLanguageChange: (language: string) => void;
  onDatasetChange: (dataset: Dataset | undefined) => void;
  existingVariableNames?: string[];
  interpolationService?: IVariableInterpolationService;
  regex?: string;
  onRegexChange?: (regex: string) => void;
  useTimeFilter?: boolean;
  onUseTimeFilterChange?: (useTimeFilter: boolean) => void;
  valueField?: string;
  onValueFieldChange?: (valueField: string) => void;
  labelField?: string;
  onLabelFieldChange?: (labelField: string) => void;
  currentVariableName?: string;
  promQLResourceQuery?: PromQLResourceQuery;
  onResourceQueryChange?: (queryType: PromQLResourceQuery | undefined) => void;
  /** Called once, after a successful Apply inside QueryEditorModal. */
  onApplied?: () => void;
}

export const VariableQueryPanel: React.FC<VariableQueryPanelProps> = ({
  query,
  language,
  dataset,
  onQueryChange,
  onLanguageChange,
  onDatasetChange,
  existingVariableNames = [],
  interpolationService,
  regex = '',
  onRegexChange,
  useTimeFilter = false,
  onUseTimeFilterChange,
  valueField = '',
  onValueFieldChange,
  labelField = '',
  onLabelFieldChange,
  currentVariableName,
  promQLResourceQuery,
  onResourceQueryChange,
  onApplied,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleApply = useCallback(
    (result: QueryEditorModalApplyResult) => {
      onQueryChange(result.query);
      onLanguageChange(result.language);
      onDatasetChange(result.dataset);
      onValueFieldChange?.(result.valueField);
      onLabelFieldChange?.(result.labelField);
      onRegexChange?.(result.regex);
      onResourceQueryChange?.(result.promQLResourceQuery);
      onApplied?.();
      setIsEditorOpen(false);
    },
    [
      onQueryChange,
      onLanguageChange,
      onDatasetChange,
      onValueFieldChange,
      onLabelFieldChange,
      onRegexChange,
      onResourceQueryChange,
      onApplied,
    ]
  );

  return (
    <>
      <EuiSmallButton
        onClick={() => setIsEditorOpen(true)}
        data-test-subj="variableQueryPanelOpenEditor"
        iconType="pencil"
        fullWidth
        fill
      >
        {i18n.translate('dashboard.variableQueryPanel.openVariableEditor', {
          defaultMessage: 'Open variable editor',
        })}
      </EuiSmallButton>

      <EuiSpacer size="m" />
      <EuiFormRow
        label={i18n.translate('dashboard.variableQueryPanel.refreshLabel', {
          defaultMessage: 'Refresh',
        })}
        helpText={i18n.translate('dashboard.variableQueryPanel.refreshHelp', {
          defaultMessage: 'When to update the options of this variable',
        })}
      >
        <EuiButtonGroup
          legend={i18n.translate('dashboard.variableQueryPanel.refreshLegend', {
            defaultMessage: 'Variable refresh options',
          })}
          options={[
            {
              id: 'onDashboardLoad',
              label: i18n.translate('dashboard.variableQueryPanel.onDashboardLoad', {
                defaultMessage: 'On dashboard load',
              }),
            },
            {
              id: 'onTimeRangeChange',
              label: i18n.translate('dashboard.variableQueryPanel.onTimeRangeChange', {
                defaultMessage: 'On time range change',
              }),
            },
          ]}
          idSelected={useTimeFilter ? 'onTimeRangeChange' : 'onDashboardLoad'}
          onChange={(id) => onUseTimeFilterChange?.(id === 'onTimeRangeChange')}
          buttonSize="compressed"
          data-test-subj="variableEditorUseTimeFilter"
        />
      </EuiFormRow>

      {isEditorOpen && (
        <QueryEditorModal
          query={query}
          language={language}
          dataset={dataset}
          existingVariableNames={existingVariableNames}
          interpolationService={interpolationService}
          regex={regex}
          useTimeFilter={useTimeFilter}
          valueField={valueField}
          labelField={labelField}
          currentVariableName={currentVariableName}
          promQLResourceQuery={promQLResourceQuery}
          onApply={handleApply}
          onDiscard={() => setIsEditorOpen(false)}
        />
      )}
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiLoadingSpinner, EuiSelect, EuiText } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDispatch, useSelector } from 'react-redux';
import { DataView } from 'src/plugins/data/common/data_views';
import { IndexPatternField } from 'src/plugins/data/common';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { selectPatternsField } from '../../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../../application/context/dataset_context/dataset_context';
import './patterns_settings_popover_content.scss';

export interface PatternsSettingsPopoverContentProps {
  fieldChange?: () => void;
}

const gatherOptions = (dataset?: DataView) => {
  if (!dataset || !dataset.fields) {
    return [];
  }

  const fields = dataset.fields.getAll();

  // Filter out fields that are not suitable for patterns
  // For example, exclude scripted fields or meta fields
  const filteredFields = fields.filter((field: IndexPatternField) => {
    return (
      !field.scripted &&
      !dataset.metaFields.includes(field.name) &&
      !field.subType &&
      field.type === 'string'
    );
  });

  return filteredFields
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((field) => ({
      value: field.name,
      text: field.name,
      description: field.type, // Show field type as description
    }));
};

export const PatternsSettingsPopoverContent = ({
  fieldChange,
}: PatternsSettingsPopoverContentProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const patternsField = useSelector(selectPatternsField);
  const { dataset, isLoading, error } = useDatasetContext();
  // Get log tab results to sample and find longest value fields

  // Generate options from dataset fields if available
  const options = gatherOptions(dataset);

  // Use the value from Redux state if available and exists in options, otherwise default to an option w/ longest length
  const chosenPatternsField = (() => {
    if (patternsField && options.some((option) => option.value === patternsField)) {
      return patternsField;
    }

    return options.length > 0 ? options[0].value : '';
  })();

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;

    dispatch(setPatternsField(newValue));

    // Wait for the pattern field being set to be propagated
    // Using Promise.resolve().then() to ensure state update completes
    Promise.resolve().then(() => {
      // Trigger query execution to reload the patterns tab
      if (services) {
        dispatch(executeQueries({ services }));
      }

      if (fieldChange) fieldChange(); // Run logic from whoever calls the content here
    });
  };

  if (isLoading) {
    return <EuiLoadingSpinner />;
  }

  if (error) {
    return (
      <EuiCallOut title="Error loading dataset" color="danger" iconType="alert">
        {error}
      </EuiCallOut>
    );
  }

  return (
    <div className="patternsSettingsPopoverContent" data-test-subj="patternsSettingsPopoverContent">
      <div className="patternsSettingsPopoverContent__titleWrapper">
        <EuiText data-test-subj="dscDownloadCsvTitle" size="m">
          <strong>
            <FormattedMessage
              id="explore.discover.patterns.settings.fieldName"
              defaultMessage="Patterns Field"
            />
          </strong>
        </EuiText>
      </div>
      <div className="patternsSettingsPopoverContent__form">
        <EuiSelect options={options} value={chosenPatternsField} onChange={handleFieldChange} />
      </div>
    </div>
  );
};

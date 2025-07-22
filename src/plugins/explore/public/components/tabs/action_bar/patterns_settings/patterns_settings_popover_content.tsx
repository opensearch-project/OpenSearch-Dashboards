/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiLoadingSpinner, EuiSelect, EuiText } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDispatch, useSelector } from 'react-redux';
import { DataView } from 'src/plugins/data/common';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { selectPatternsField } from '../../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../../application/context/dataset_context/dataset_context';

export interface PatternsSettingsPopoverContentProps {
  fieldChange?: () => void;
}

const gatherOptions = (dataset?: DataView) => {
  if (!dataset || !dataset.fields) {
    return [];
  }

  // Get all fields from the dataset
  const fields = dataset.fields.getAll();

  // Filter out fields that are not suitable for patterns
  // For example, exclude scripted fields or meta fields
  const filteredFields = fields.filter((field) => {
    return (
      !field.scripted &&
      !dataset.metaFields.includes(field.name) &&
      !field.subType &&
      ['text', 'keyword'].includes(field?.esTypes?.[0] ?? '')
    );
  });

  // Sort fields alphabetically
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
  // get log tab results to sample and find longest value fields

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

      // setValue(newValue);

      if (fieldChange) fieldChange(); // run logic from whoever calls the content here
    });
  };

  // Show loading indicator if dataset is loading
  if (isLoading) {
    return <EuiLoadingSpinner />;
  }

  // Show error message if there was an error loading the dataset
  if (error) {
    return (
      <EuiCallOut title="Error loading dataset" color="danger" iconType="alert">
        {error}
      </EuiCallOut>
    );
  }

  return (
    <div className="dscDownloadCsvPopoverContent" data-test-subj="dscDownloadCsvPopoverContent">
      <div className="dscDownloadCsvPopoverContent__titleWrapper">
        <EuiText data-test-subj="dscDownloadCsvTitle" size="m">
          <strong>
            <FormattedMessage
              id="explore.discover.downloadCsvTitle"
              defaultMessage="Patterns Field"
            />
          </strong>
        </EuiText>
      </div>
      <div className="dscDownloadCsvPopoverContent__form">
        <EuiSelect options={options} value={chosenPatternsField} onChange={handleFieldChange} />
      </div>
    </div>
  );
};

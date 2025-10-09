/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiComboBox, EuiFlexItem, EuiText, EuiIconTip } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { DataViewField } from '../../../../data/common';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { RootState } from '../../application/utils/state_management/store';
import { setBreakdownField } from '../../application/utils/state_management/slices/query_editor';
import {
  clearResultsByKey,
  clearQueryStatusMapByKey,
} from '../../application/utils/state_management/slices';
import {
  executeHistogramQuery,
  defaultPrepareQueryString,
  prepareHistogramCacheKey,
} from '../../application/utils/state_management/actions/query_actions';
import { ExploreServices } from '../../types';

export interface BreakdownFieldSelectorProps {
  services: ExploreServices;
}

export const BreakdownFieldSelector: React.FC<BreakdownFieldSelectorProps> = ({ services }) => {
  const dispatch = useDispatch();
  const { dataset, isLoading } = useDatasetContext();

  // Read breakdown field from Redux state
  const breakdownField = useSelector((state: RootState) => state.queryEditor.breakdownField);
  const query = useSelector((state: RootState) => state.query);
  const interval = useSelector((state: RootState) => state.legacy.interval);
  const [error, setError] = useState<string | undefined>(undefined);

  // Get available fields from the dataset
  const availableFields = ((dataset?.fields?.getAll() || []) as unknown) as DataViewField[];

  // Filter for string-type, aggregatable, non-scripted fields
  const stringFields = availableFields.filter(
    (field) => field.type === 'string' && !field.scripted
  );

  const options = stringFields.map((field) => ({
    label: field.displayName || field.name,
    value: field.name,
  }));

  const selectedOptions = breakdownField
    ? options.filter((option) => option.value === breakdownField)
    : [];

  const handleFieldChange = (selected: Array<{ label: string; value?: string }>) => {
    const newField = selected.length > 0 && selected[0].value ? selected[0].value : undefined;
    dispatch(setBreakdownField(newField));

    // Clear cache and trigger new histogram query with the breakdown field
    const histogramCacheKey = prepareHistogramCacheKey(query);
    const queryString = defaultPrepareQueryString(query);
    dispatch(clearResultsByKey(histogramCacheKey));
    dispatch(clearQueryStatusMapByKey(histogramCacheKey));
    dispatch(
      executeHistogramQuery({ services, cacheKey: histogramCacheKey, queryString, interval })
    );
  };

  return (
    <EuiFlexItem grow={false} className="exploreChart__TimechartHeader__breakdown__container">
      <EuiComboBox
        className="exploreChart__TimechartHeader__breakdown"
        prepend={
          <EuiText className="exploreChart__TimechartHeader__breakdown__prependText" size="s">
            {i18n.translate('explore.discover.timechartHeader.breakdown', {
              defaultMessage: 'Breakdown',
            })}
          </EuiText>
        }
        placeholder={i18n.translate('explore.discover.timechartHeader.breakdown.selectField', {
          defaultMessage: 'Select a field',
        })}
        singleSelection={{ asPlainText: true }}
        options={options}
        selectedOptions={selectedOptions}
        onChange={handleFieldChange}
        isLoading={isLoading || false}
        isClearable={true}
        compressed
        data-test-subj="histogramBreakdownFieldSelector"
        append={
          error ? (
            <EuiIconTip
              id="breakdownFieldError"
              content={error}
              color="danger"
              size="s"
              type="alert"
            />
          ) : undefined
        }
      />
    </EuiFlexItem>
  );
};

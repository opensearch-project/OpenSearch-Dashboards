/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiComboBox, EuiFlexItem, EuiText, EuiIconTip, EuiFlexGroup } from '@elastic/eui';
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

  const breakdownField = useSelector((state: RootState) => state.queryEditor.breakdownField);
  const query = useSelector((state: RootState) => state.query);
  const interval = useSelector((state: RootState) => state.legacy.interval);
  const queryStatusMap = useSelector((state: RootState) => state.queryEditor.queryStatusMap);

  const breakdownCacheKey = breakdownField ? prepareHistogramCacheKey(query, true) : undefined;
  const standardCacheKey = prepareHistogramCacheKey(query, false);
  const breakdownQueryStatus = breakdownCacheKey ? queryStatusMap[breakdownCacheKey] : undefined;
  const standardQueryStatus = queryStatusMap[standardCacheKey];

  // Breakdown error: breakdown has error AND standard histogram exists without error
  const error =
    breakdownQueryStatus?.error && !standardQueryStatus?.error
      ? breakdownQueryStatus.error.message.details || 'Breakdown query failed'
      : undefined;

  const availableFields = ((dataset?.fields?.getAll() || []) as unknown) as DataViewField[];
  const stringFields = availableFields.filter(
    (field) =>
      field.type === 'string' &&
      !field.scripted &&
      !field.subType && // Filters out both multi-fields (.keyword) and nested fields
      !dataset?.metaFields?.includes(field.name) // Filters out meta fields like _id, _index
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

    const histogramCacheKey = prepareHistogramCacheKey(query, !!newField);
    const queryString = defaultPrepareQueryString(query);
    dispatch(clearResultsByKey(histogramCacheKey));
    dispatch(clearQueryStatusMapByKey(histogramCacheKey));
    dispatch(
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      executeHistogramQuery({
        services,
        cacheKey: histogramCacheKey,
        queryString,
        interval,
      })
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
            <EuiFlexGroup
              gutterSize="none"
              className="exploreChart__TimechartHeader__breakdown__errorIcon"
            >
              <EuiFlexItem grow={false}>
                <EuiIconTip id="breakdownFieldError" content={error} color="danger" type="alert" />
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : undefined
        }
      />
    </EuiFlexItem>
  );
};

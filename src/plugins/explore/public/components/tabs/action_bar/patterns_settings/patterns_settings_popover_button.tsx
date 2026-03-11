/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiComboBox } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { gatherOptions } from './patterns_settings_popover_content';
import { selectPatternsField } from '../../../../application/utils/state_management/selectors';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { useDatasetContext } from '../../../../application/context/dataset_context/dataset_context';

export const PatternsSettingsPopoverButton = () => {
  const patternsField = useSelector(selectPatternsField);
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();

  const rawOptions = gatherOptions(dataset);
  const comboBoxOptions = rawOptions.map((opt) => ({ label: opt.value }));

  const selectedOptions = patternsField
    ? comboBoxOptions.filter((opt) => opt.label === patternsField)
    : [];

  const handleChange = (selected: Array<{ label: string }>) => {
    if (selected.length === 0) return;
    const newValue = selected[0].label;
    dispatch(setPatternsField(newValue));
    Promise.resolve().then(() => {
      if (services) {
        dispatch(executeQueries({ services }));
      }
    });
  };

  return (
    <EuiComboBox
      compressed
      singleSelection={{ asPlainText: true }}
      options={comboBoxOptions}
      selectedOptions={selectedOptions}
      isClearable={false}
      onChange={handleChange}
      data-test-subj="patternsFieldComboBox"
      style={{ minWidth: 300 }}
      prepend={i18n.translate('explore.discover.patterns.settings.fieldLabel', {
        defaultMessage: 'Patterns field',
      })}
      aria-label={i18n.translate('explore.discover.patterns.settings.fieldComboBoxAriaLabel', {
        defaultMessage: 'Select patterns field',
      })}
    />
  );
};

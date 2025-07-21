/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import { setShowFilterPanel } from '../../../../application/utils/state_management/slices';
import { selectShowDatasetFields } from '../../../../application/utils/state_management/selectors';
import './filter_panel_toggle.scss';

const hideFieldsText = i18n.translate('explore.queryPanel.showFieldToggle.hideFieldsLabel', {
  defaultMessage: 'Hide Fields',
});
const showFieldsText = i18n.translate('explore.queryPanel.showFieldToggle.showFieldsLabel', {
  defaultMessage: 'Show Fields',
});

export const FilterPanelToggle = () => {
  const showDatasetFields = useSelector(selectShowDatasetFields);
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(setShowFilterPanel(!showDatasetFields));
  };

  const buttonLabel = showDatasetFields ? hideFieldsText : showFieldsText;

  return (
    <EuiButtonEmpty
      className="exploreFilterPanelToggle"
      size="xs"
      onClick={handleToggle}
      data-test-subj="exploreQueryPanelFooterShowFields"
    >
      <div className="exploreFilterPanelToggle__buttonTextWrapper">
        <EuiIcon type={showDatasetFields ? 'menuLeft' : 'menuRight'} size="s" />
        <EuiText size="xs">{buttonLabel}</EuiText>
      </div>
    </EuiButtonEmpty>
  );
};

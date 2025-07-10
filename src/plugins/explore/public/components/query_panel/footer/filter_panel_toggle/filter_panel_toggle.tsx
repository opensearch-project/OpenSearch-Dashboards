/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { setShowFilterPanel } from '../../../../application/utils/state_management/slices';
import { selectShowDataSetFields } from '../../../../application/utils/state_management/selectors';

const hideFieldsText = i18n.translate('explore.queryPanel.showFieldToggle.hideFieldsLabel', {
  defaultMessage: 'Hide Fields',
});
const showFieldsText = i18n.translate('explore.queryPanel.showFieldToggle.showFieldsLabel', {
  defaultMessage: 'Show Fields',
});

export const FilterPanelToggle = () => {
  const showDatasetFields = useSelector(selectShowDataSetFields);
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(setShowFilterPanel(!showDatasetFields));
  };

  const buttonLabel = showDatasetFields ? hideFieldsText : showFieldsText;

  return (
    <EuiButtonEmpty
      onClick={handleToggle}
      iconType={showDatasetFields ? 'menuLeft' : 'menuRight'}
      data-test-subj="exploreQueryPanelFooterShowFields"
      className="exploreQueryPanelFooterShowFields"
    >
      {buttonLabel}
    </EuiButtonEmpty>
  );
};

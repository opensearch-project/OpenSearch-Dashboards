/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiPopover, EuiSelect, EuiText } from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDispatch, useSelector } from 'react-redux';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { selectPatternsField } from '../../../../application/utils/state_management/selectors';

export const PatternsSettingsPopoverButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const patternsField = useSelector(selectPatternsField);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const openPopover = () => setIsPopoverOpen(true);
  const closePopover = () => setIsPopoverOpen(false);

  const options = [
    { value: 'products.product_name', text: 'products.product_name' },
    { value: 'message', text: 'message' },
    { value: 'Dest', text: 'Dest' },
  ];

  // Use the value from Redux state if available, otherwise use the first option
  const [value, setValue] = useState(patternsField || options[0].value);

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    dispatch(setPatternsField(newValue));

    // Trigger query execution to reload the patterns tab
    if (services) {
      dispatch(executeQueries({ services }));
    }
    setValue(newValue);

    closePopover();
  };

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          size="s"
          data-test-subj="patternsSettingButton"
          // disabled={isLoading}
          iconType="gear"
          onClick={openPopover}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      ownFocus={false}
    >
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
          <EuiSelect options={options} value={value} onChange={handleFieldChange} />
        </div>
      </div>
    </EuiPopover>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIconProps, EuiSmallButtonIcon, EuiToolTip, EuiToolTipProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';

interface IDataSelectorRefresherProps {
  tooltipText: string;
  onRefresh: () => void;
  buttonProps?: Partial<EuiButtonIconProps>;
  toolTipProps?: Partial<EuiToolTipProps>;
}

export const DataSelectorRefresher: React.FC<IDataSelectorRefresherProps> = React.memo(
  ({ tooltipText, onRefresh, buttonProps, toolTipProps }) => {
    return (
      <EuiToolTip
        position="right"
        content={i18n.translate('data.datasource.selector.refreshDataSources', {
          defaultMessage: tooltipText,
        })}
        display="block"
        data-test-subj="sourceRefreshButtonToolTip"
        {...toolTipProps}
      >
        <EuiSmallButtonIcon
          onClick={onRefresh}
          iconType="refresh"
          aria-label="sourceRefresh"
          className="sourceRefreshButton"
          data-test-subj="sourceRefreshButton"
          {...buttonProps}
        />
      </EuiToolTip>
    );
  }
);

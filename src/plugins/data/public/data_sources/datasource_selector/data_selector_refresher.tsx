/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiButtonIconProps,
  EuiText,
  EuiToolTip,
  EuiToolTipProps,
} from '@elastic/eui';

interface IDataSelectorRefresherProps {
  tooltipText: string;
  onRefresh: () => void;
  buttonProps?: Partial<EuiButtonIconProps>;
  toolTipProps?: Partial<EuiToolTipProps>;
}

export const DataSelectorRefresher: React.FC<IDataSelectorRefresherProps> = React.memo(
  ({ tooltipText, onRefresh, buttonProps, toolTipProps }) => {
    return (
      <EuiText size="s">
        <EuiToolTip
          position="right"
          content={i18n.translate('data.datasource.selector.refreshDataSources', {
            defaultMessage: tooltipText,
          })}
          display="block"
          data-test-subj="sourceRefreshButtonToolTip"
          {...toolTipProps}
        >
          <EuiButtonIcon
            size="s"
            onClick={onRefresh}
            iconType="refresh"
            aria-label="sourceRefresh"
            data-test-subj="sourceRefreshButton"
            {...buttonProps}
          />
        </EuiToolTip>
      </EuiText>
    );
  }
);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
  EuiPopoverFooter,
  EuiText,
} from '@elastic/eui';
import { ErrorIcon } from '../custom_database_icon';
import { DataSourceDropDownHeader } from '../drop_down_header';

interface DataSourceViewErrorProps {
  dataSourceId: string;
  showSwitchButton: boolean;
  handleSwitchDefaultDatasource?: () => void;
  application?: ApplicationStart;
}

export const DataSourceViewError = ({
  application,
  dataSourceId,
  showSwitchButton,
  handleSwitchDefaultDatasource,
}: DataSourceViewErrorProps) => {
  const [showPopover, setShowPopover] = useState<boolean>(false);

  const switchButton = (
    <EuiButton
      data-test-subj="dataSourceViewErrorSwitchButton"
      fill={false}
      size="s"
      onClick={handleSwitchDefaultDatasource}
    >
      {i18n.translate('dataSourcesManagement.dataSourceViewError.switchToDefaultDataSource', {
        defaultMessage: 'Switch to default data source',
      })}
    </EuiButton>
  );

  const iconButton = (
    <EuiButtonIcon
      className="dataSourceViewErrorHeaderLink"
      data-test-subj="dataSourceViewErrorHeaderLink"
      aria-label={i18n.translate('dataSourceError.dataSourceViewErrorHeaderLink', {
        defaultMessage: 'dataSourceViewErrorHeaderLink',
      })}
      iconType={() => <ErrorIcon />}
      size="s"
      onClick={() => setShowPopover(!showPopover)}
    />
  );

  return (
    <>
      <EuiPopover
        id={'dataSourceViewErrorPopover'}
        button={iconButton}
        isOpen={showPopover}
        closePopover={() => setShowPopover(false)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
        data-test-subj={'dataSourceViewErrorPopover'}
      >
        <DataSourceDropDownHeader totalDataSourceCount={0} application={application} />
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          className="datasourceViewErrorPanel"
          data-test-subj="datasourceViewErrorPanel"
        >
          <EuiText size="s" textAlign="center">
            {i18n.translate('dataSourcesManagement.dataSourceViewError.text', {
              defaultMessage: `Data source ${dataSourceId} is not available`,
            })}
          </EuiText>
        </EuiPanel>
        {showSwitchButton && (
          <EuiPopoverFooter>
            <EuiFlexGroup justifyContent="spaceAround">
              <EuiFlexItem>{switchButton}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopoverFooter>
        )}
      </EuiPopover>
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiCodeBlock,
} from '@elastic/eui';
import type { MountPoint } from 'opensearch-dashboards/public';
import { TopNavMenu } from '../../../../../../../navigation/public';
import type { TopNavMenuData } from '../../../../../../../navigation/public';

export interface TraceTopNavMenuProps {
  payloadData: any[];
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
}

export const TraceTopNavMenu: React.FC<TraceTopNavMenuProps> = ({
  payloadData,
  setMenuMountPoint,
}) => {
  const [isRawModalOpen, setRawModalOpen] = useState(false);

  const menuActions: TopNavMenuData[] = [
    {
      id: 'viewRawData',
      label: i18n.translate('explore.traceDetails.topNav.viewRawData', {
        defaultMessage: 'View raw trace',
      }),
      run: () => setRawModalOpen(true),
      testId: 'viewRawDataBtn',
      emphasize: true,
    },
  ];

  return (
    <>
      <TopNavMenu
        config={menuActions}
        setMenuMountPoint={setMenuMountPoint}
        showSearchBar={false}
        showQueryBar={false}
        showQueryInput={false}
        showDatePicker={false}
        showFilterBar={false}
        showDataSourceMenu={false}
        appName={'TraceDetails'}
      />
      {isRawModalOpen && (
        <EuiOverlayMask>
          <EuiModal onClose={() => setRawModalOpen(false)}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                {i18n.translate('explore.traceDetails.modal.rawDataTitle', {
                  defaultMessage: 'Raw data',
                })}
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              {payloadData && payloadData.length > 0 && (
                <EuiCodeBlock language="json" paddingSize="s" isCopyable overflowHeight={500}>
                  {JSON.stringify(payloadData, null, 2)}
                </EuiCodeBlock>
              )}
            </EuiModalBody>
            <EuiModalFooter>
              <EuiButton onClick={() => setRawModalOpen(false)} fill>
                {i18n.translate('explore.traceDetails.modal.closeButton', {
                  defaultMessage: 'Close',
                })}
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </>
  );
};

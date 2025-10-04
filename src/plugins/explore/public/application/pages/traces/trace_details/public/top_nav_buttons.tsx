/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  EuiBadge,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import type { MountPoint } from 'opensearch-dashboards/public';

export interface TraceTopNavMenuProps {
  payloadData: any[];
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
  traceId?: string;
}

export const TraceTopNavMenu: React.FC<TraceTopNavMenuProps> = ({
  payloadData,
  setMenuMountPoint,
  traceId,
}) => {
  const [isRawModalOpen, setRawModalOpen] = useState(false);

  const copyTraceId = async () => {
    if (traceId) {
      try {
        await navigator.clipboard.writeText(traceId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy trace ID to clipboard:', error);
      }
    }
  };

  const HeaderContent: React.FC = () => (
    <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
      {traceId && (
        <EuiFlexItem grow={false}>
          <EuiToolTip content="Click to copy Trace ID">
            <EuiBadge
              color="hollow"
              onClick={copyTraceId}
              onClickAriaLabel="Copy Trace ID"
              style={{ cursor: 'pointer' }}
            >
              {i18n.translate('explore.traceDetails.topNav.traceIdLabel', {
                defaultMessage: 'Trace ID: {traceId}',
                values: { traceId },
              })}
            </EuiBadge>
          </EuiToolTip>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <EuiButton size="s" onClick={() => setRawModalOpen(true)} data-test-subj="viewRawDataBtn">
          {i18n.translate('explore.traceDetails.topNav.viewRawData', {
            defaultMessage: 'View raw trace',
          })}
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  useEffect(() => {
    if (setMenuMountPoint) {
      const mount: MountPoint = (element) => {
        ReactDOM.render(<HeaderContent />, element);
        return () => ReactDOM.unmountComponentAtNode(element);
      };
      setMenuMountPoint(mount);

      return () => {
        setMenuMountPoint(undefined);
      };
    }
  }, [setMenuMountPoint, traceId, setRawModalOpen]);

  return (
    <>
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

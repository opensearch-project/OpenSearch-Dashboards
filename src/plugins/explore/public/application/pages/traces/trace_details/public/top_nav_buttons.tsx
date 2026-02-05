/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { createRoot, Root } from 'react-dom/client';
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
  EuiTitle,
  EuiLink,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import type { MountPoint } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../../../../../../data_explorer/public';

export interface TraceTopNavMenuProps {
  payloadData: any[];
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
  traceId?: string;
  isFlyout: boolean;
  title: string;
  traceDetailsLink: string;
}

export const TraceTopNavMenu: React.FC<TraceTopNavMenuProps> = ({
  payloadData,
  setMenuMountPoint,
  traceId,
  isFlyout,
  title,
  traceDetailsLink,
}) => {
  const [isRawModalOpen, setRawModalOpen] = useState(false);
  const {
    services: { chrome },
  } = useOpenSearchDashboards<DataExplorerServices>();

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
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap={true}>
          {isFlyout && (
            <EuiFlexItem grow={false}>
              <EuiTitle data-test-subj="traceDetailsTitle">
                <h2>{title}</h2>
              </EuiTitle>
            </EuiFlexItem>
          )}
          {traceId && (
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Click to copy Trace ID">
                <EuiBadge
                  color="hollow"
                  onClick={copyTraceId}
                  onClickAriaLabel="Copy Trace ID"
                  style={{ cursor: 'pointer' }}
                  data-test-subj="traceIdBadge"
                >
                  <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s">
                        {i18n.translate('explore.traceDetails.topNav.traceIdLabel', {
                          defaultMessage: 'Trace ID: {traceId}',
                          values: { traceId },
                        })}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiIcon
                        type="copy"
                        size="s"
                        style={{
                          marginLeft: '4px',
                        }}
                        aria-label="Copy Trace ID"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiBadge>
              </EuiToolTip>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton size="s" onClick={() => setRawModalOpen(true)} data-test-subj="viewRawDataBtn">
          {i18n.translate('explore.traceDetails.topNav.viewRawData', {
            defaultMessage: 'View raw trace',
          })}
        </EuiButton>
      </EuiFlexItem>
      {isFlyout && (
        <EuiFlexItem grow={false}>
          <EuiLink
            href={traceDetailsLink}
            data-test-subj="traceDetailsLink"
            external
            target="blank"
          >
            {i18n.translate('explore.traceDetails.topNav.openFullPage', {
              defaultMessage: 'Open full page',
            })}
          </EuiLink>
        </EuiFlexItem>
      )}
      <EuiFlexItem />
    </EuiFlexGroup>
  );

  useEffect(() => {
    if (setMenuMountPoint && !isFlyout) {
      const mount: MountPoint = (element) => {
        const root = createRoot(element);
        root.render(<HeaderContent />);
        return () => root.unmount();
      };
      setMenuMountPoint(mount);

      return () => {
        setMenuMountPoint(undefined);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMenuMountPoint, traceId, setRawModalOpen, isFlyout]);

  const RawModal: React.FC = () =>
    isRawModalOpen ? (
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
    ) : null;

  // Set breadcrumb with service name from root span
  useEffect(() => {
    if (!isFlyout) {
      chrome?.setBreadcrumbs([
        {
          text: title,
        },
      ]);
    }
  }, [chrome, title, traceId, isFlyout]);

  return (
    <>
      {isFlyout ? (
        <>
          <HeaderContent />
          <RawModal />
        </>
      ) : (
        <RawModal />
      )}
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButton,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiModalHeader,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiModalHeaderTitle,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface ConfigNoticeModalProps {
  onClose: () => void;
}

export const ExperienceSelectionModal = ({ onClose }: ConfigNoticeModalProps) => {
  const handleDismiss = () => {
    onClose();
  };
  return (
    <EuiModal onClose={onClose} maxWidth={800}>
      <EuiModalBody>
        <EuiEmptyPrompt
          iconType="cheer"
          title={
            <h2>
              {i18n.translate('home.enhancedDiscover.modal.emptyPrompt.title', {
                defaultMessage: 'New! Enhanced Discover experience available',
              })}
            </h2>
          }
          body={
            <p>
              {i18n.translate('home.enhancedDiscover.modal.emptyPrompt.bodyPrefix', {
                defaultMessage:
                  'To use the enhanced experience, you need to enable Workspaces, Datasources, and Explore. You can try out the new experience by enabling the following configurations in your ',
              })}
              <code>opensearch_dashboards.yml</code>
              {i18n.translate('home.enhancedDiscover.modal.emptyPrompt.bodySuffix', {
                defaultMessage: ' file and restarting OpenSearch Dashboards to apply the changes.',
              })}
            </p>
          }
        />

        <EuiSpacer size="m" />

        <EuiCodeBlock language="yaml" fontSize="m" paddingSize="m" isCopyable>
          {i18n.translate('home.enhancedDiscover.modal.configBlock', {
            defaultMessage: `# Set the value to true to enable multiple data source feature
data_source.enabled: true

# Set the value to true to enable workspace feature
workspace.enabled: true

# Set the value to true to enable explore feature
explore.enabled: true`,
          })}
        </EuiCodeBlock>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={handleDismiss} fill data-test-subj="dismissEnhancedDiscoverModal">
              {i18n.translate('home.enhancedDiscover.modal.dismissButton', {
                defaultMessage: 'Dismiss',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalFooter>
    </EuiModal>
  );
};

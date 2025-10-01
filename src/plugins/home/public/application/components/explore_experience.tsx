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
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
} from '@elastic/eui';

interface ConfigNoticeModalProps {
  onClose: () => void;
}

export const ExperienceSelectionModal = ({ onClose }: ConfigNoticeModalProps) => {
  return (
    <EuiModal onClose={onClose} maxWidth={800}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Enhanced Discover Experience</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiEmptyPrompt
          iconType="cheer"
          title={<h2>New! Enhanced Discover experience available</h2>}
          body={
            <p>
              To use the enhanced experience, you need to enable Workspaces, Datasources, and
              Explore. You can try out the new experience by enabling the following configurations
              in your <code>opensearch_dashboards.yml</code> file and restarting OpenSearch
              Dashboards to apply the changes.
            </p>
          }
        />

        <EuiSpacer size="m" />

        <EuiCodeBlock language="yaml" fontSize="m" paddingSize="m" isCopyable>
          {`# Set the value to true to enable multiple data source feature
data_source.enabled: true

# Set the value to true to enable workspace feature
workspace.enabled: true

# Set the value to true to enable explore feature
explore.enabled: true`}
        </EuiCodeBlock>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={onClose} fill data-test-subj="dismissEnhancedDiscoverModal">
              Dismiss
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalFooter>
    </EuiModal>
  );
};

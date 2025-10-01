/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';

interface ConfigNoticeModalProps {
  onClose: () => void;
}

export const ExperienceSelectionModal = ({ onClose }: ConfigNoticeModalProps) => {
  return (
    <EuiModal onClose={onClose} maxWidth={800}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>OpenSearch Dashboards Configuration Notice</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiCallOut
          title="Configuration Required for Enhanced Experience"
          color="primary"
          iconType="iInCircle"
        >
          <p>
            To use the enhanced explore experience with workspaces and advanced query capabilities,
            you need to enable the following configurations in your opensearch_dashboards.yml file:
          </p>
        </EuiCallOut>

        <EuiSpacer size="m" />

        <EuiCodeBlock language="yaml" fontSize="m" paddingSize="m">
          {`# Enable data source feature
data_source.enabled: true

# Enable workspace feature
workspace.enabled: true

# Enable explore plugin
explore.enabled: true`}
        </EuiCodeBlock>

        <EuiSpacer size="m" />

        <EuiText>
          <p>
            After updating your configuration file, restart OpenSearch Dashboards to apply the
            changes.
          </p>
        </EuiText>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={onClose} fill data-test-subj="closeConfigNotice">
              Got it
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalFooter>
    </EuiModal>
  );
};

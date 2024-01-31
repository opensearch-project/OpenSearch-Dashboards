/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';

interface TableFeedbacksPanelProps {
  onClose: () => void;
  onTurnOff: () => Promise<void>;
}

export const TableFeedbacksPanel = ({ onClose, onTurnOff }: TableFeedbacksPanelProps) => (
  <EuiModal onClose={onClose} maxWidth={600}>
    <EuiModalHeader>
      <EuiModalHeaderTitle>
        <h4>Share your thoughts on the latest Discover features</h4>
      </EuiModalHeaderTitle>
    </EuiModalHeader>

    <EuiModalBody>
      <EuiText>
        <p>
          Event tables: Documents are now expanded through a flyout. Density, column order, and
          sorting controls have been improved.{' '}
          <a href="https://survey.opensearch.org" target="_blank" rel="noopener noreferrer">
            Provide feedbacks
          </a>
        </p>
      </EuiText>
    </EuiModalBody>

    <EuiModalFooter>
      <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
      <EuiButton onClick={onTurnOff} fill>
        Turn off new features
      </EuiButton>
    </EuiModalFooter>
  </EuiModal>
);

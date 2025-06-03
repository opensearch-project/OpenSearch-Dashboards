/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt } from '@elastic/eui';
import React from 'react';

interface AssociatedObjectsTabFailureProps {
  type: string;
}

export const AssociatedObjectsTabFailure = (props: AssociatedObjectsTabFailureProps) => {
  const { type } = props;
  return (
    <EuiEmptyPrompt iconType="alert" title={<h3>Error</h3>} body={<p>Error loading {type}</p>} />
  );
};

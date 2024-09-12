/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiLoadingSpinner } from '@elastic/eui';
import React from 'react';

interface AssociatedObjectsTabLoadingProps {
  objectType: string;
  warningMessage: boolean;
}

export const AssociatedObjectsTabLoading: React.FC<AssociatedObjectsTabLoadingProps> = (props) => {
  const { objectType, warningMessage } = props;

  const BodyText = (
    <>
      <p>Loading {objectType}</p>
      {warningMessage ? <p>This may take a moment.</p> : <></>}
    </>
  );

  return <EuiEmptyPrompt icon={<EuiLoadingSpinner size="xl" />} body={BodyText} />;
};

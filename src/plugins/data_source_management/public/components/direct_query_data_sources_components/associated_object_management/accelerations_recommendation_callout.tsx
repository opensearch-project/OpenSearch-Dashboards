/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut } from '@elastic/eui';
import React from 'react';

export const AccelerationsRecommendationCallout = () => {
  return (
    <EuiCallOut
      title="Accelerations recommended for tables. Setup acceleration or configure integrations"
      iconType="iInCircle"
    />
  );
};

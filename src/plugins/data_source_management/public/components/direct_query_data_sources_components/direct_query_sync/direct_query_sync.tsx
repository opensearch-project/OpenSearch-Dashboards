/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText } from '@elastic/eui';

export const DashboardDirectQuerySync: React.FC = () => {
  return (
    <EuiText size="m">
      Data scheduled to sync every x mins. Last sync: 3 minutes ago. Synchronize Now
    </EuiText>
  );
};

// https://ed-logs-application-df543b56-fnk44ziwj1bj9ut9rxs9.us-west-2.opensearch.amazonaws.com/w/z5pMl4/app/dashboards?locale=en&themeTag=v9light#/view/fbda9d1f-baf5-487e-8a13-beb9c185710e?embed=true&_g=(time:(from:'2025-05-14T20:58:43.558Z',to:now))

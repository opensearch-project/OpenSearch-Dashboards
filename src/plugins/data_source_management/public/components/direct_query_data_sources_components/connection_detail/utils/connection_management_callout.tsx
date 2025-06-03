/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut } from '@elastic/eui';
import React from 'react';

export const ConnectionManagementCallout = () => {
  return (
    <EuiCallOut title="Configurations may be managed elsewhere." iconType="iInCircle">
      Access to data may be managed in other systems outside of OpenSearch. Check with your
      administrator for additional configurations.
    </EuiCallOut>
  );
};

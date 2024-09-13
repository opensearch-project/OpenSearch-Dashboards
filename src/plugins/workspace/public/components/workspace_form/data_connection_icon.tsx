/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';

export const DataConnectionIcon = ({ type }: { type?: string }) => {
  switch (type) {
    default:
      return <EuiIcon type="wrench" />;
  }
};

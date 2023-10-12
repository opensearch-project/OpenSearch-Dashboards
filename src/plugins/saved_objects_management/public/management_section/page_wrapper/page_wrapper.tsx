/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiPageContent } from '@elastic/eui';
import React from 'react';

export const PageWrapper = (props: { children?: React.ReactChild }) => {
  return (
    <EuiPageContent
      style={{ maxWidth: '75%', marginTop: '20px' }}
      hasShadow={false}
      hasBorder={false}
      panelPaddingSize="none"
      horizontalPosition="center"
      color="transparent"
      {...props}
    />
  );
};

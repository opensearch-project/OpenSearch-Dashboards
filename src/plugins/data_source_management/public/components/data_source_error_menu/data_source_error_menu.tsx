/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon, EuiText } from '@elastic/eui';
import React from 'react';

export const DataSourceErrorMenu = () => {
  return (
    <>
      <EuiIcon type={'crossInCircleFilled'} color={'danger'} />
      <EuiText color={'danger'}>Error</EuiText>
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';

import prometheusLogo from '../../assets/prometheus_logo.svg';
import s3Logo from '../../assets/s3_logo.svg';

export const DirectQueryConnectionIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case 'Amazon S3':
      return <EuiIcon type={s3Logo} />;
    case 'Prometheus':
      return <EuiIcon type={prometheusLogo} />;
    default:
      return null;
  }
};

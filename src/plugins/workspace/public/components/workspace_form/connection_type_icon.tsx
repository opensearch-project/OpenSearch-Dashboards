/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';

import prometheusLogo from '../../assets/prometheus_logo.svg';
import s3Logo from '../../assets/s3_logo.svg';
import cloudWatchLogo from '../../assets/cloudwatch_logo.svg';
import securityLakeLogo from '../../assets/security_lake_logo.svg';
import { DataConnectionType } from '../../../../data_source/common/';

// Direct query connection and data connection both have different types, each type has a corresponding icon
export const ConnectionTypeIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case 'Amazon S3':
      return <EuiIcon type={s3Logo} />;
    case 'Prometheus':
      return <EuiIcon type={prometheusLogo} />;
    case DataConnectionType.CloudWatch:
      return <EuiIcon type={cloudWatchLogo} />;
    case DataConnectionType.SecurityLake:
      return <EuiIcon type={securityLakeLogo} />;
    default:
      return null;
  }
};

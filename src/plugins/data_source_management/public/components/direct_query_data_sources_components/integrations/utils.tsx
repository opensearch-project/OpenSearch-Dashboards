/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHealth } from '@elastic/eui';
import React from 'react';

export const ASSET_FILTER_OPTIONS = [
  'index-pattern',
  'search',
  'visualization',
  'dashboard',
  'observability-search',
];

export const VALID_INDEX_NAME = /^[a-z\d\.][a-z\d\._\-\*]*$/;

export type Color = 'success' | 'primary' | 'warning' | 'danger' | undefined;

export const IntegrationHealthBadge = ({ status }: { status?: string }) => {
  switch (status) {
    case undefined:
      return <EuiHealth color="warning">Unknown</EuiHealth>;
    case 'available':
      return <EuiHealth color="success">Active</EuiHealth>;
    case 'partially-available':
      return <EuiHealth color="warning">Partially Available</EuiHealth>;
    default:
      return <EuiHealth color="danger">Critical</EuiHealth>;
  }
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { CredentialManagementPlugin } from './plugin';

export { CredentialForm } from './components/common';
export { CreateCredentialItem } from './components/types';
// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new CredentialManagementPlugin();
}

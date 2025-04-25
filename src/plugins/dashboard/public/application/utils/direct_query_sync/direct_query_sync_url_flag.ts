/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function isDirectQuerySyncEnabledByUrl(): boolean | undefined {
  const hash = window.location.hash;
  const queryString = hash.includes('?') ? hash.substring(hash.indexOf('?')) : '';
  const urlParams = new URLSearchParams(queryString);

  const param = urlParams.get('dashboard.directQueryConnectionSync');
  console.log('Direct Query Sync URL param:', param);

  if (param === 'true') return true;
  if (param === 'false') return false;
  return undefined;
}

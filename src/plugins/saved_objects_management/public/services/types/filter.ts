/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

interface SavedObjectsManagementFilterOption {
  value: string;
  name: string;
  view: string;
}

export interface SavedObjectsManagementFilter {
  id: string;
  type: string;
  field: string;
  name: string;
  multiSelect: string;
  options: SavedObjectsManagementFilterOption;
}

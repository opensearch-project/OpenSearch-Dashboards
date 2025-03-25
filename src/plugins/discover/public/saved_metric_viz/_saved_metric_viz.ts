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

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export const SAVED_OBJECT_TYPE = 'metric';

export function createSavedMetricClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedMetric extends SavedObjectClass {
    public static type: string = 'metric';
    public static mapping = {
      title: 'text',
      expression: 'text',
      searchContext: 'text',
    };

    public static searchSource = false;

    public id: string;
    public showInRecentlyAccessed: boolean;

    constructor(id: string) {
      super({
        id,
        type: 'metric',
        mapping: {
          title: 'text',
          expression: 'text',
          searchContext: 'text',
        },
        searchSource: false,
        defaults: {
          title: '',
          expression: '',
          searchContext: '',
        },
      });
      this.showInRecentlyAccessed = false;
      this.id = id;
      this.getFullPath = () => `/app/discover#/view/${String(this.id)}`;
    }
  }

  return SavedMetric as new (id: string) => SavedObject;
}

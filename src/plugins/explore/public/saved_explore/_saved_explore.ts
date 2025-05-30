/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LOGS_VIEW_ID } from '../../common';
import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../saved_objects/public';

export const SAVED_OBJECT_TYPE = 'explore';

export function createSavedExploreClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedExplore extends SavedObjectClass {
    public static type: string = 'explore';
    public static mapping = {
      title: 'text',
      description: 'text',
      hits: 'integer',
      columns: 'keyword',
      sort: 'keyword',
      version: 'integer',
    };
    // Order these fields to the top, the rest are alphabetical
    public static fieldOrder = ['title', 'description'];
    public static searchSource = true;

    public id: string;
    public showInRecentlyAccessed: boolean;

    constructor(id: string) {
      super({
        id,
        type: 'explore',
        mapping: {
          title: 'text',
          description: 'text',
          hits: 'integer',
          columns: 'keyword',
          sort: 'keyword',
          version: 'integer',
        },
        searchSource: true,
        defaults: {
          title: '',
          description: '',
          columns: [],
          hits: 0,
          sort: [],
          version: 1,
        },
      });
      this.showInRecentlyAccessed = true;
      this.id = id;
      this.getFullPath = () => `/app/explore/${LOGS_VIEW_ID}#/view/${String(this.id)}`;
    }
  }

  return SavedExplore as new (id: string) => SavedObject;
}

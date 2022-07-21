/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObject,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../../saved_objects/public';
import { extractReferences, injectReferences } from './saved_index_pattern_references';

export function createSavedIndexPatternClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class SavedIndexPattern extends SavedObjectClass {
    public static type: string = 'index-pattern';
    public static mapping = {
      title: 'text',
      version: 'integer',
      timeFieldName: 'text',
      intervalName: 'text',
      sourceFilters: 'text',
      fields: 'text',
      fieldFormatMap: 'text',
      type: 'text',
      typeMeta: 'text',
      dataSourcesJSON: 'text',
      // todo
    };

    public static defaultMapping = {
      title: 'dummy',
      version: 1,
      // todo
    };

    public id: string;

    constructor(id: string) {
      super({
        type: SavedIndexPattern.type,
        mapping: SavedIndexPattern.mapping,
        extractReferences,
        injectReferences,
        id,
        searchSource: false, // todo: witf? -- kibanaSavedObjectMeta
        defaults: SavedIndexPattern.defaultMapping,
      });

      this.id = id;
      this.getFullPath = () =>
        `/app/management/opensearch-dashboards/indexPatterns/patterns/${this.id}`; // todo: not needed? not an existing behavior
    }
  }

  return SavedIndexPattern as new (id: string) => SavedObject;
}

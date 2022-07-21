/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'src/plugins/saved_objects/public';
import { IndexPatternFieldMap, SourceFilter, TypeMeta } from '../../common';

export interface IndexPatternObject {
  id?: string;
  version?: string;
  title: string;
  intervalName?: string;
  timeFieldName?: string;
  sourceFilters?: string;
  fields?: string;
  typeMeta?: string;
  type?: string;
  fieldFormatMap?: string;
  dataSourcesJSON?: string;
}

export interface IndexPatternSavedObject extends IndexPatternObject, SavedObject {}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OsdFieldType, getOsdFieldOverrides, getOsdFieldType } from '../../osd_field_types';
import { OSD_FIELD_TYPES } from '../../osd_field_types/types';
import { IDataViewFieldType } from './types';
import { DataViewFieldSpec, DataView } from '../../data_views';

export class DataViewField implements IDataViewFieldType {
  readonly spec: DataViewFieldSpec;
  // not writable or serialized
  readonly displayName: string;
  private readonly osdFieldType: OsdFieldType;

  constructor(spec: DataViewFieldSpec, displayName: string) {
    this.spec = { ...spec, type: spec.name === '_source' ? '_source' : spec.type };
    this.displayName = displayName;

    this.osdFieldType = getOsdFieldType(spec.type);
  }

  // writable attrs
  /**
   * Count is used for field popularity
   */
  public get count() {
    return this.spec.count || 0;
  }

  public set count(count) {
    this.spec.count = count;
  }

  /**
   * Script field code
   */
  public get script() {
    return this.spec.script;
  }

  public set script(script) {
    this.spec.script = script;
  }

  /**
   * Script field language
   */
  public get lang() {
    return this.spec.lang;
  }

  public set lang(lang) {
    this.spec.lang = lang;
  }

  /**
   * Description of field type conflicts across different indices in the same index pattern
   */
  public get conflictDescriptions() {
    return this.spec.conflictDescriptions;
  }

  public set conflictDescriptions(conflictDescriptions) {
    this.spec.conflictDescriptions = conflictDescriptions;
  }

  // read only attrs
  public get name() {
    return this.spec.name;
  }

  public get type() {
    return this.spec.type;
  }

  public get esTypes() {
    return this.spec.esTypes;
  }

  public get scripted() {
    return !!this.spec.scripted;
  }

  public get searchable() {
    return !!(this.spec.searchable || this.scripted);
  }

  public get aggregatable() {
    return !!(this.spec.aggregatable || this.scripted);
  }

  public get readFromDocValues() {
    return !!(this.spec.readFromDocValues && !this.scripted);
  }

  public get subType() {
    return this.spec.subType;
  }

  // not writable, not serialized
  public get sortable() {
    return (
      this.name === '_score' ||
      ((this.spec.indexed || this.aggregatable) && this.osdFieldType.sortable)
    );
  }

  public get filterable() {
    if (getOsdFieldOverrides().filterable !== undefined) return !!getOsdFieldOverrides().filterable;
    return (
      this.name === '_id' ||
      this.scripted ||
      ((this.spec.indexed || this.searchable) && this.osdFieldType.filterable)
    );
  }

  public get visualizable() {
    if (getOsdFieldOverrides().visualizable !== undefined)
      return !!getOsdFieldOverrides().visualizable;
    const notVisualizableFieldTypes: string[] = [OSD_FIELD_TYPES.UNKNOWN, OSD_FIELD_TYPES.CONFLICT];
    return this.aggregatable && !notVisualizableFieldTypes.includes(this.spec.type);
  }

  public toJSON() {
    return {
      count: this.count,
      script: this.script,
      lang: this.lang,
      conflictDescriptions: this.conflictDescriptions,

      name: this.name,
      type: this.type,
      esTypes: this.esTypes,
      scripted: this.scripted,
      searchable: this.searchable,
      aggregatable: this.aggregatable,
      readFromDocValues: this.readFromDocValues,
      subType: this.subType,
    };
  }

  public toSpec({
    getFormatterForField,
  }: {
    getFormatterForField?: DataView['getFormatterForField'];
  } = {}): DataViewFieldSpec {
    return {
      count: this.count,
      script: this.script,
      lang: this.lang,
      conflictDescriptions: this.conflictDescriptions,
      name: this.name,
      type: this.type,
      esTypes: this.esTypes,
      scripted: this.scripted,
      searchable: this.searchable,
      aggregatable: this.aggregatable,
      readFromDocValues: this.readFromDocValues,
      subType: this.subType,
      format: getFormatterForField ? getFormatterForField(this).toJSON() : undefined,
    };
  }
}

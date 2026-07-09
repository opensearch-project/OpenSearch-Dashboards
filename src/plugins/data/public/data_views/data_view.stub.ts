/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sinon from 'sinon';

import { CoreSetup } from 'src/core/public';
import { FieldFormat as FieldFormatImpl } from '../../common/field_formats';
import {
  IDataViewFieldType as IFieldType,
  DataViewFieldSpec as FieldSpec,
} from '../../common/data_views';
import { FieldFormatsStart } from '../field_formats';
import { DataView, dataViews, OSD_FIELD_TYPES, fieldList } from '..';
import { getFieldFormatsRegistry } from '../test_utils';
import { setFieldFormats } from '../services';

setFieldFormats(({
  getDefaultInstance: () =>
    ({
      getConverterFor: () => (value: any) => value,
      convert: (value: any) => JSON.stringify(value),
    } as FieldFormatImpl),
} as unknown) as FieldFormatsStart);

export function getStubDataView(
  pattern: string,
  getConfig: (cfg: any) => any,
  timeField: string | null,
  fields: FieldSpec[] | IFieldType[],
  core: CoreSetup
): DataView {
  return (new StubDataView(pattern, getConfig, timeField, fields, core) as unknown) as DataView;
}

export class StubDataView {
  id: string;
  title: string;
  popularizeField: Function;
  timeFieldName: string | null;
  isTimeBased: () => boolean;
  getConfig: (cfg: any) => any;
  getNonScriptedFields: Function;
  getScriptedFields: Function;
  getFieldByName: Function;
  getSourceFiltering: Function;
  metaFields: string[];
  fieldFormatMap: Record<string, any>;
  getComputedFields: Function;
  flattenHit: Function;
  formatHit: Record<string, any>;
  fieldsFetcher: Record<string, any>;
  formatField: Function;
  getFormatterForField: () => { convert: Function };
  _reindexFields: Function;
  stubSetFieldFormat: Function;
  fields?: FieldSpec[];

  constructor(
    pattern: string,
    getConfig: (cfg: any) => any,
    timeField: string | null,
    fields: FieldSpec[] | IFieldType[],
    core: CoreSetup
  ) {
    const registeredFieldFormats = getFieldFormatsRegistry(core);

    this.id = pattern;
    this.title = pattern;
    this.popularizeField = sinon.stub();
    this.timeFieldName = timeField;
    this.isTimeBased = () => Boolean(this.timeFieldName);
    this.getConfig = getConfig;
    this.getNonScriptedFields = sinon.spy(DataView.prototype.getNonScriptedFields);
    this.getScriptedFields = sinon.spy(DataView.prototype.getScriptedFields);
    this.getFieldByName = sinon.spy(DataView.prototype.getFieldByName);
    this.getSourceFiltering = sinon.stub();
    this.metaFields = ['_id', '_type', '_source'];
    this.fieldFormatMap = {};

    this.getComputedFields = DataView.prototype.getComputedFields.bind(this);
    this.flattenHit = dataViews.flattenHitWrapper((this as unknown) as DataView, this.metaFields);
    this.formatHit = dataViews.formatHitProvider(
      (this as unknown) as DataView,
      registeredFieldFormats.getDefaultInstance(OSD_FIELD_TYPES.STRING)
    );
    this.fieldsFetcher = { apiClient: { baseUrl: '' } };
    this.formatField = this.formatHit.formatField;
    this.getFormatterForField = () => ({
      convert: () => '',
    });

    this._reindexFields = function () {
      this.fields = fieldList((this.fields || fields) as FieldSpec[], false);
    };

    this.stubSetFieldFormat = function (
      fieldName: string,
      id: string,
      params: Record<string, any>
    ) {
      const FieldFormat = registeredFieldFormats.getType(id);
      this.fieldFormatMap[fieldName] = new FieldFormat!(params);
      this._reindexFields();
    };

    this._reindexFields();

    return this;
  }
}

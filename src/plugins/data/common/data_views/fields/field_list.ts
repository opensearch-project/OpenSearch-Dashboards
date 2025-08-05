/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findIndex } from 'lodash';
import { IDataViewFieldType } from './types';
import { DataViewField } from './data_view_field';
import { DataViewFieldSpec, DataViewFieldMap } from '../types';
import { DataView } from '../data_views';
import { shortenDottedString } from '../../utils';

type FieldMap = Map<DataViewField['name'], DataViewField>;

export interface IDataViewFieldList extends Array<DataViewField> {
  add(field: DataViewFieldSpec): void;
  getAll(): DataViewField[];
  getByName(name: DataViewField['name']): DataViewField | undefined;
  getByType(type: DataViewField['type']): DataViewField[];
  remove(field: IDataViewFieldType): void;
  removeAll(): void;
  replaceAll(specs: DataViewFieldSpec[]): void;
  update(field: DataViewFieldSpec): void;
  toSpec(options?: { getFormatterForField?: DataView['getFormatterForField'] }): DataViewFieldMap;
}

// extending the array class and using a constructor doesn't work well
// when calling filter and similar so wrapping in a callback.
// to be removed in the future
export const dataViewFieldList = (
  specs: DataViewFieldSpec[] = [],
  shortDotsEnable = false
): IDataViewFieldList => {
  class FldList extends Array<DataViewField> implements IDataViewFieldList {
    private byName: FieldMap = new Map();
    private groups: Map<DataViewField['type'], FieldMap> = new Map();
    private setByName = (field: DataViewField) => this.byName.set(field.name, field);
    private setByGroup = (field: DataViewField) => {
      if (typeof this.groups.get(field.type) === 'undefined') {
        this.groups.set(field.type, new Map());
      }
      this.groups.get(field.type)!.set(field.name, field);
    };
    private removeByGroup = (field: IDataViewFieldType) =>
      this.groups.get(field.type)!.delete(field.name);
    private calcDisplayName = (name: string) =>
      shortDotsEnable ? shortenDottedString(name) : name;
    constructor() {
      super();
      specs.map((field) => this.add(field));
    }

    public readonly getAll = () => [...this.byName.values()];
    public readonly getByName = (name: DataViewField['name']) => this.byName.get(name);
    public readonly getByType = (type: DataViewField['type']) => [
      ...(this.groups.get(type) || new Map()).values(),
    ];
    public readonly add = (field: DataViewFieldSpec) => {
      const newField = new DataViewField(field, this.calcDisplayName(field.name));
      this.push(newField);
      this.setByName(newField);
      this.setByGroup(newField);
    };

    public readonly remove = (field: IDataViewFieldType) => {
      this.removeByGroup(field);
      this.byName.delete(field.name);

      const fieldIndex = findIndex(this, { name: field.name });
      this.splice(fieldIndex, 1);
    };

    public readonly update = (field: DataViewFieldSpec) => {
      const newField = new DataViewField(field, this.calcDisplayName(field.name));
      const index = this.findIndex((f) => f.name === newField.name);
      this.splice(index, 1, newField);
      this.setByName(newField);
      this.removeByGroup(newField);
      this.setByGroup(newField);
    };

    public readonly removeAll = () => {
      this.length = 0;
      this.byName.clear();
      this.groups.clear();
    };

    public readonly replaceAll = (spcs: DataViewFieldSpec[] = []) => {
      this.removeAll();
      spcs.forEach(this.add);
    };

    public toSpec({
      getFormatterForField,
    }: {
      getFormatterForField?: DataView['getFormatterForField'];
    } = {}) {
      return {
        ...this.reduce<DataViewFieldMap>((collector, field) => {
          collector[field.name] = field.toSpec({ getFormatterForField });
          return collector;
        }, {}),
      };
    }
  }

  return new FldList();
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findIndex } from 'lodash';
import { IDatasetFieldType } from './types';
import { DatasetField } from './dataset_field';
import { DatasetFieldSpec, DatasetFieldMap } from '../types';
import { Dataset } from '../datasets';
import { shortenDottedString } from '../../utils';

type FieldMap = Map<DatasetField['name'], DatasetField>;

export interface IDatasetFieldList extends Array<DatasetField> {
  add(field: DatasetFieldSpec): void;
  getAll(): DatasetField[];
  getByName(name: DatasetField['name']): DatasetField | undefined;
  getByType(type: DatasetField['type']): DatasetField[];
  remove(field: IDatasetFieldType): void;
  removeAll(): void;
  replaceAll(specs: DatasetFieldSpec[]): void;
  update(field: DatasetFieldSpec): void;
  toSpec(options?: { getFormatterForField?: Dataset['getFormatterForField'] }): DatasetFieldMap;
}

// extending the array class and using a constructor doesn't work well
// when calling filter and similar so wrapping in a callback.
// to be removed in the future
export const datasetFieldList = (
  specs: DatasetFieldSpec[] = [],
  shortDotsEnable = false
): IDatasetFieldList => {
  class FldList extends Array<DatasetField> implements IDatasetFieldList {
    private byName: FieldMap = new Map();
    private groups: Map<DatasetField['type'], FieldMap> = new Map();
    private setByName = (field: DatasetField) => this.byName.set(field.name, field);
    private setByGroup = (field: DatasetField) => {
      if (typeof this.groups.get(field.type) === 'undefined') {
        this.groups.set(field.type, new Map());
      }
      this.groups.get(field.type)!.set(field.name, field);
    };
    private removeByGroup = (field: IDatasetFieldType) =>
      this.groups.get(field.type)!.delete(field.name);
    private calcDisplayName = (name: string) =>
      shortDotsEnable ? shortenDottedString(name) : name;
    constructor() {
      super();
      specs.map((field) => this.add(field));
    }

    public readonly getAll = () => [...this.byName.values()];
    public readonly getByName = (name: DatasetField['name']) => this.byName.get(name);
    public readonly getByType = (type: DatasetField['type']) => [
      ...(this.groups.get(type) || new Map()).values(),
    ];
    public readonly add = (field: DatasetFieldSpec) => {
      const newField = new DatasetField(field, this.calcDisplayName(field.name));
      this.push(newField);
      this.setByName(newField);
      this.setByGroup(newField);
    };

    public readonly remove = (field: IDatasetFieldType) => {
      this.removeByGroup(field);
      this.byName.delete(field.name);

      const fieldIndex = findIndex(this, { name: field.name });
      this.splice(fieldIndex, 1);
    };

    public readonly update = (field: DatasetFieldSpec) => {
      const newField = new DatasetField(field, this.calcDisplayName(field.name));
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

    public readonly replaceAll = (spcs: DatasetFieldSpec[] = []) => {
      this.removeAll();
      spcs.forEach(this.add);
    };

    public toSpec({
      getFormatterForField,
    }: {
      getFormatterForField?: Dataset['getFormatterForField'];
    } = {}) {
      return {
        ...this.reduce<DatasetFieldMap>((collector, field) => {
          collector[field.name] = field.toSpec({ getFormatterForField });
          return collector;
        }, {}),
      };
    }
  }

  return new FldList();
};

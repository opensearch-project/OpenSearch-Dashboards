/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Component } from 'react';
import { createSelector } from 'reselect';
import { IndexPatternField, DataView, IFieldType } from '../../../../../../plugins/data/public';
import { Table } from './components/table';
import { getFieldFormat } from './lib';
import { IndexedFieldItem } from './types';

interface IndexedFieldsTableProps {
  fields: IndexPatternField[];
  dataset: DataView;
  fieldFilter?: string;
  indexedFieldTypeFilter?: string;
  helpers: {
    redirectToRoute: (obj: any) => void;
    getFieldInfo: (dataset: DataView, field: IFieldType) => string[];
  };
  fieldWildcardMatcher: (filters: any[]) => (val: any) => boolean;
}

interface IndexedFieldsTableState {
  fields: IndexedFieldItem[];
}

export class IndexedFieldsTable extends Component<
  IndexedFieldsTableProps,
  IndexedFieldsTableState
> {
  constructor(props: IndexedFieldsTableProps) {
    super(props);

    this.state = {
      fields: this.mapFields(this.props.fields),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: IndexedFieldsTableProps) {
    if (nextProps.fields !== this.props.fields) {
      this.setState({
        fields: this.mapFields(nextProps.fields),
      });
    }
  }

  mapFields(fields: IndexPatternField[]): IndexedFieldItem[] {
    const { dataset, fieldWildcardMatcher, helpers } = this.props;
    const sourceFilters =
      dataset.sourceFilters && dataset.sourceFilters.map((f: Record<string, any>) => f.value);
    const fieldWildcardMatch = fieldWildcardMatcher(sourceFilters || []);

    return (
      (fields &&
        fields.map((field) => {
          return {
            ...field.spec,
            displayName: field.displayName,
            format: getFieldFormat(dataset, field.name),
            excluded: fieldWildcardMatch ? fieldWildcardMatch(field.name) : false,
            info: helpers.getFieldInfo && helpers.getFieldInfo(dataset, field),
          };
        })) ||
      []
    );
  }

  getFilteredFields = createSelector(
    (state: IndexedFieldsTableState) => state.fields,
    (state: IndexedFieldsTableState, props: IndexedFieldsTableProps) => props.fieldFilter,
    (state: IndexedFieldsTableState, props: IndexedFieldsTableProps) =>
      props.indexedFieldTypeFilter,
    (fields, fieldFilter, indexedFieldTypeFilter) => {
      if (fieldFilter) {
        const normalizedFieldFilter = fieldFilter.toLowerCase();
        fields = fields.filter((field) => field.name.toLowerCase().includes(normalizedFieldFilter));
      }

      if (indexedFieldTypeFilter) {
        fields = fields.filter((field) => field.type === indexedFieldTypeFilter);
      }

      return fields;
    }
  );

  render() {
    const { dataset } = this.props;
    const fields = this.getFilteredFields(this.state, this.props);

    return (
      <div>
        <Table
          dataset={dataset}
          items={fields}
          editField={(field) => this.props.helpers.redirectToRoute(field)}
        />
      </div>
    );
  }
}

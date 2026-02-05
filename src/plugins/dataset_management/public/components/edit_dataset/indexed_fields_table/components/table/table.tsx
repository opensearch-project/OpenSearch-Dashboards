/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { PureComponent } from 'react';

import { EuiIcon, EuiInMemoryTable, EuiIconTip, EuiBasicTableColumn } from '@elastic/eui';

import { i18n } from '@osd/i18n';

// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from '../../../../../../../data/public';
import { IndexedFieldItem } from '../../types';

// localized labels
const additionalInfoAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.additionalInfoAriaLabel',
  { defaultMessage: 'Additional field information' }
);

const primaryTimeAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.primaryTimeAriaLabel',
  { defaultMessage: 'Primary time field' }
);

const primaryTimeTooltip = i18n.translate(
  'datasetManagement.editDataset.fields.table.primaryTimeTooltip',
  { defaultMessage: 'This field represents the time that events occurred.' }
);

const multiTypeAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.multiTypeAria',
  {
    defaultMessage: 'Multiple type field',
  }
);

const multiTypeTooltip = i18n.translate(
  'datasetManagement.editDataset.fields.table.multiTypeTooltip',
  {
    defaultMessage:
      'The type of this field changes across indices. It is unavailable for many analysis functions.',
  }
);

const nameHeader = i18n.translate('datasetManagement.editDataset.fields.table.nameHeader', {
  defaultMessage: 'Name',
});

const typeHeader = i18n.translate('datasetManagement.editDataset.fields.table.typeHeader', {
  defaultMessage: 'Type',
});

const formatHeader = i18n.translate('datasetManagement.editDataset.fields.table.formatHeader', {
  defaultMessage: 'Format',
});

const searchableHeader = i18n.translate(
  'datasetManagement.editDataset.fields.table.searchableHeader',
  {
    defaultMessage: 'Searchable',
  }
);

const searchableDescription = i18n.translate(
  'datasetManagement.editDataset.fields.table.searchableDescription',
  { defaultMessage: 'These fields can be used in the filter bar' }
);

const isSearchableAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.isSearchableAria',
  {
    defaultMessage: 'Is searchable',
  }
);

const aggregatableLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.aggregatableLabel',
  {
    defaultMessage: 'Aggregatable',
  }
);

const aggregatableDescription = i18n.translate(
  'datasetManagement.editDataset.fields.table.aggregatableDescription',
  { defaultMessage: 'These fields can be used in visualization aggregations' }
);

const isAggregatableAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.isAggregatableAria',
  {
    defaultMessage: 'Is aggregatable',
  }
);

const excludedLabel = i18n.translate('datasetManagement.editDataset.fields.table.excludedLabel', {
  defaultMessage: 'Excluded',
});

const excludedDescription = i18n.translate(
  'datasetManagement.editDataset.fields.table.excludedDescription',
  { defaultMessage: 'Fields that are excluded from _source when it is fetched' }
);

const isExcludedAriaLabel = i18n.translate(
  'datasetManagement.editDataset.fields.table.isExcludedAria',
  {
    defaultMessage: 'Is excluded',
  }
);

const editLabel = i18n.translate('datasetManagement.editDataset.fields.table.editLabel', {
  defaultMessage: 'Edit',
});

const editDescription = i18n.translate(
  'datasetManagement.editDataset.fields.table.editDescription',
  { defaultMessage: 'Edit' }
);

interface IndexedFieldProps {
  dataset: IDataset;
  items: IndexedFieldItem[];
  editField: (field: IndexedFieldItem) => void;
}

export class Table extends PureComponent<IndexedFieldProps> {
  renderBooleanTemplate(value: string, arialLabel: string) {
    return value ? <EuiIcon type="dot" color="secondary" aria-label={arialLabel} /> : <span />;
  }

  renderFieldName(name: string, field: IndexedFieldItem) {
    const { dataset } = this.props;

    return (
      <span>
        {name}
        {field.info && field.info.length ? (
          <span>
            &nbsp;
            <EuiIconTip
              type="questionInCircle"
              color="primary"
              aria-label={additionalInfoAriaLabel}
              content={field.info.map((info: string, i: number) => (
                <div key={i}>{info}</div>
              ))}
            />
          </span>
        ) : null}
        {dataset.timeFieldName === name ? (
          <span>
            &nbsp;
            <EuiIconTip
              type="clock"
              color="primary"
              aria-label={primaryTimeAriaLabel}
              content={primaryTimeTooltip}
            />
          </span>
        ) : null}
      </span>
    );
  }

  renderFieldType(type: string, isConflict: boolean) {
    return (
      <span>
        {type}
        {isConflict ? (
          <span>
            &nbsp;
            <EuiIconTip
              type="alert"
              color="warning"
              aria-label={multiTypeAriaLabel}
              content={multiTypeTooltip}
            />
          </span>
        ) : (
          ''
        )}
      </span>
    );
  }

  render() {
    const { items, editField } = this.props;

    const pagination = {
      initialPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
    };

    const columns: Array<EuiBasicTableColumn<IndexedFieldItem>> = [
      {
        field: 'displayName',
        name: nameHeader,
        dataType: 'string',
        sortable: true,
        render: (value: string, field: IndexedFieldItem) => {
          return this.renderFieldName(value, field);
        },
        width: '38%',
        'data-test-subj': 'indexedFieldName',
      },
      {
        field: 'type',
        name: typeHeader,
        dataType: 'string',
        sortable: true,
        render: (value: string) => {
          return this.renderFieldType(value, value === 'conflict');
        },
        'data-test-subj': 'indexedFieldType',
      },
      {
        field: 'format',
        name: formatHeader,
        dataType: 'string',
        sortable: true,
      },
      {
        field: 'searchable',
        name: searchableHeader,
        description: searchableDescription,
        dataType: 'boolean',
        sortable: true,
        render: (value: string) => this.renderBooleanTemplate(value, isSearchableAriaLabel),
      },
      {
        field: 'aggregatable',
        name: aggregatableLabel,
        description: aggregatableDescription,
        dataType: 'boolean',
        sortable: true,
        render: (value: string) => this.renderBooleanTemplate(value, isAggregatableAriaLabel),
      },
      {
        field: 'excluded',
        name: excludedLabel,
        description: excludedDescription,
        dataType: 'boolean',
        sortable: true,
        render: (value: string) => this.renderBooleanTemplate(value, isExcludedAriaLabel),
      },
      {
        name: '',
        actions: [
          {
            name: editLabel,
            description: editDescription,
            icon: 'pencil',
            onClick: editField,
            type: 'icon',
            'data-test-subj': 'editFieldFormat',
          },
        ],
        width: '40px',
      },
    ];

    return (
      <EuiInMemoryTable items={items} columns={columns} pagination={pagination} sorting={true} />
    );
  }
}

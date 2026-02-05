/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { PureComponent } from 'react';
import { get } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiInMemoryTable, EuiBasicTableColumn } from '@elastic/eui';

import { ScriptedFieldItem } from '../../types';
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from '../../../../../../../data/public';

interface TableProps {
  dataset: IDataset;
  items: ScriptedFieldItem[];
  editField: (field: ScriptedFieldItem) => void;
  deleteField: (field: ScriptedFieldItem) => void;
}

export class Table extends PureComponent<TableProps> {
  renderFormatCell = (value: string) => {
    const { dataset } = this.props;
    const title = get(dataset, ['fieldFormatMap', value, 'type', 'title'], '');

    return <span>{title}</span>;
  };

  render() {
    const { items, editField, deleteField } = this.props;

    const columns: Array<EuiBasicTableColumn<ScriptedFieldItem>> = [
      {
        field: 'displayName',
        name: i18n.translate('datasetManagement.editDataset.scripted.table.nameHeader', {
          defaultMessage: 'Name',
        }),
        description: i18n.translate(
          'datasetManagement.editDataset.scripted.table.nameDescription',
          { defaultMessage: 'Name of the field' }
        ),
        dataType: 'string',
        sortable: true,
        width: '38%',
      },
      {
        field: 'lang',
        name: i18n.translate('datasetManagement.editDataset.scripted.table.langHeader', {
          defaultMessage: 'Lang',
        }),
        description: i18n.translate(
          'datasetManagement.editDataset.scripted.table.langDescription',
          { defaultMessage: 'Language used for the field' }
        ),
        dataType: 'string',
        sortable: true,
        'data-test-subj': 'scriptedFieldLang',
      },
      {
        field: 'script',
        name: i18n.translate('datasetManagement.editDataset.scripted.table.scriptHeader', {
          defaultMessage: 'Script',
        }),
        description: i18n.translate(
          'datasetManagement.editDataset.scripted.table.scriptDescription',
          { defaultMessage: 'Script for the field' }
        ),
        dataType: 'string',
        sortable: true,
      },
      {
        field: 'name',
        name: i18n.translate('datasetManagement.editDataset.scripted.table.formatHeader', {
          defaultMessage: 'Format',
        }),
        description: i18n.translate(
          'datasetManagement.editDataset.scripted.table.formatDescription',
          { defaultMessage: 'Format used for the field' }
        ),
        render: this.renderFormatCell,
        sortable: false,
      },
      {
        name: '',
        actions: [
          {
            type: 'icon',
            name: i18n.translate('datasetManagement.editDataset.scripted.table.editHeader', {
              defaultMessage: 'Edit',
            }),
            description: i18n.translate(
              'datasetManagement.editDataset.scripted.table.editDescription',
              { defaultMessage: 'Edit this field' }
            ),
            icon: 'pencil',
            onClick: editField,
          },
          {
            type: 'icon',
            name: i18n.translate('datasetManagement.editDataset.scripted.table.deleteHeader', {
              defaultMessage: 'Delete',
            }),
            description: i18n.translate(
              'datasetManagement.editDataset.scripted.table.deleteDescription',
              { defaultMessage: 'Delete this field' }
            ),
            icon: 'trash',
            color: 'danger',
            onClick: deleteField,
          },
        ],
        width: '40px',
      },
    ];

    const pagination = {
      initialPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
    };

    return (
      <EuiInMemoryTable items={items} columns={columns} pagination={pagination} sorting={true} />
    );
  }
}

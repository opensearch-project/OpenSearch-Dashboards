/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';

import {
  EuiBasicTable,
  EuiButton,
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiSpacer,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DefaultFormatEditor } from '../default';

export interface StaticLookupFormatEditorFormatParams {
  lookupEntries: Array<{ key: string; value: string }>;
  unknownKeyValue: string;
}

interface StaticLookupItem {
  key: string;
  value: string;
  index: number;
}

export class StaticLookupFormatEditor extends DefaultFormatEditor<
  StaticLookupFormatEditorFormatParams
> {
  static formatId = 'static_lookup';
  onLookupChange = (newLookupParams: { value?: string; key?: string }, index: number) => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    lookupEntries[index] = {
      ...lookupEntries[index],
      ...newLookupParams,
    };
    this.onChange({
      lookupEntries,
    });
  };

  addLookup = () => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    this.onChange({
      lookupEntries: [...lookupEntries, {}],
    });
  };

  removeLookup = (index: number) => {
    const lookupEntries = [...this.props.formatParams.lookupEntries];
    lookupEntries.splice(index, 1);
    this.onChange({
      lookupEntries,
    });
  };

  render() {
    const { formatParams } = this.props;

    const items =
      (formatParams.lookupEntries &&
        formatParams.lookupEntries.length &&
        formatParams.lookupEntries.map((lookup, index) => {
          return {
            ...lookup,
            index,
          };
        })) ||
      [];

    const columns = [
      {
        field: 'key',
        name: (
          <FormattedMessage id="datasetManagement.staticLookup.keyLabel" defaultMessage="Key" />
        ),
        render: (value: number, item: StaticLookupItem) => {
          return (
            <EuiCompressedFieldText
              value={value || ''}
              onChange={(e) => {
                this.onLookupChange(
                  {
                    key: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'value',
        name: (
          <FormattedMessage id="datasetManagement.staticLookup.valueLabel" defaultMessage="Value" />
        ),
        render: (value: number, item: StaticLookupItem) => {
          return (
            <EuiCompressedFieldText
              value={value || ''}
              onChange={(e) => {
                this.onLookupChange(
                  {
                    value: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'actions',
        name: i18n.translate('datasetManagement.staticLookup.actions', {
          defaultMessage: 'actions',
        }),
        actions: [
          {
            name: i18n.translate('datasetManagement.staticLookup.deleteAria', {
              defaultMessage: 'Delete',
            }),
            description: i18n.translate('datasetManagement.staticLookup.deleteTitle', {
              defaultMessage: 'Delete entry',
            }),
            onClick: (item: StaticLookupItem) => {
              this.removeLookup(item.index);
            },
            type: 'icon',
            icon: 'trash',
            color: 'danger',
            available: () => items.length > 1,
          },
        ],
        width: '30px',
      },
    ];

    return (
      <Fragment>
        <EuiBasicTable items={items} columns={columns} style={{ maxWidth: '400px' }} />
        <EuiSpacer size="m" />
        <EuiButton iconType="plusInCircle" size="s" onClick={this.addLookup}>
          <FormattedMessage
            id="datasetManagement.staticLookup.addEntryButton"
            defaultMessage="Add entry"
          />
        </EuiButton>
        <EuiSpacer size="l" />
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.staticLookup.unknownKeyLabel"
              defaultMessage="Value for unknown key"
            />
          }
        >
          <EuiCompressedFieldText
            value={formatParams.unknownKeyValue || ''}
            placeholder={i18n.translate('datasetManagement.staticLookup.leaveBlankPlaceholder', {
              defaultMessage: 'Leave blank to keep value as-is',
            })}
            onChange={(e) => {
              this.onChange({ unknownKeyValue: e.target.value });
            }}
          />
        </EuiCompressedFormRow>
        <EuiSpacer size="m" />
      </Fragment>
    );
  }
}

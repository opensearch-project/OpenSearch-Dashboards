/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { AggRow } from './agg_row';
import { AggSelect } from './agg_select';
import { FieldSelect } from './field_select';
import { i18n } from '@osd/i18n';
import { createChangeHandler } from '../lib/create_change_handler';
import { createSelectHandler } from '../lib/create_select_handler';
import { createTextHandler } from '../lib/create_text_handler';
import {
  htmlIdGenerator,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormLabel,
  EuiCompressedComboBox,
  EuiSpacer,
  EuiCompressedFormRow,
  EuiFormControlLayout,
} from '@elastic/eui';
import { injectI18n, FormattedMessage } from '@osd/i18n/react';
import { OSD_FIELD_TYPES } from '../../../../../../plugins/data/public';
import { PANEL_TYPES } from '../../../../common/panel_types';

const isFieldTypeEnabled = (fieldRestrictions, fieldType) =>
  fieldRestrictions.length ? fieldRestrictions.includes(fieldType) : true;

const getAggWithOptions = (field = {}, fieldTypesRestriction) => {
  if (isFieldTypeEnabled(fieldTypesRestriction, field.type)) {
    switch (field.type) {
      case OSD_FIELD_TYPES.NUMBER:
        return [
          {
            label: i18n.translate('visTypeTimeseries.topHit.aggWithOptions.averageLabel', {
              defaultMessage: 'Avg',
            }),
            value: 'avg',
          },
          {
            label: i18n.translate('visTypeTimeseries.topHit.aggWithOptions.maxLabel', {
              defaultMessage: 'Max',
            }),
            value: 'max',
          },
          {
            label: i18n.translate('visTypeTimeseries.topHit.aggWithOptions.minLabel', {
              defaultMessage: 'Min',
            }),
            value: 'min',
          },
          {
            label: i18n.translate('visTypeTimeseries.topHit.aggWithOptions.sumLabel', {
              defaultMessage: 'Sum',
            }),
            value: 'sum',
          },
        ];
      case OSD_FIELD_TYPES.STRING:
        return [
          {
            label: i18n.translate('visTypeTimeseries.topHit.aggWithOptions.concatenate', {
              defaultMessage: 'Concatenate',
            }),
            value: 'concat',
          },
        ];
    }
  }

  return [];
};

const getOrderOptions = () => [
  {
    label: i18n.translate('visTypeTimeseries.topHit.orderOptions.ascLabel', {
      defaultMessage: 'Asc',
    }),
    value: 'asc',
  },
  {
    label: i18n.translate('visTypeTimeseries.topHit.orderOptions.descLabel', {
      defaultMessage: 'Desc',
    }),
    value: 'desc',
  },
];

const ORDER_DATE_RESTRICT_FIELDS = [OSD_FIELD_TYPES.DATE];

const TopHitAggUi = (props) => {
  const { fields, series, panel } = props;
  const defaults = {
    size: 1,
    agg_with: 'noop',
    order: 'desc',
  };
  const model = { ...defaults, ...props.model };
  const indexPattern =
    (series.override_index_pattern && series.series_index_pattern) || panel.index_pattern;

  const aggWithOptionsRestrictFields = [
    PANEL_TYPES.TABLE,
    PANEL_TYPES.METRIC,
    PANEL_TYPES.MARKDOWN,
  ].includes(panel.type)
    ? [OSD_FIELD_TYPES.NUMBER, OSD_FIELD_TYPES.STRING]
    : [OSD_FIELD_TYPES.NUMBER];

  const handleChange = createChangeHandler(props.onChange, model);
  const handleSelectChange = createSelectHandler(handleChange);
  const handleTextChange = createTextHandler(handleChange);

  const field = fields[indexPattern].find((f) => f.name === model.field);
  const aggWithOptions = getAggWithOptions(field, aggWithOptionsRestrictFields);
  const orderOptions = getOrderOptions();

  const htmlId = htmlIdGenerator();

  const selectedAggWithOption = aggWithOptions.find((option) => {
    return model.agg_with === option.value;
  });

  const selectedOrderOption = orderOptions.find((option) => {
    return model.order === option.value;
  });

  return (
    <AggRow
      disableDelete={props.disableDelete}
      model={props.model}
      onAdd={props.onAdd}
      onDelete={props.onDelete}
      siblings={props.siblings}
      dragHandleProps={props.dragHandleProps}
    >
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem>
          <EuiFormLabel htmlFor={htmlId('aggregation')}>
            <FormattedMessage
              id="visTypeTimeseries.topHit.aggregationLabel"
              defaultMessage="Aggregation"
            />
          </EuiFormLabel>
          <EuiSpacer size="xs" />
          <AggSelect
            id={htmlId('aggregation')}
            panelType={props.panel.type}
            siblings={props.siblings}
            value={model.type}
            onChange={handleSelectChange('type')}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedFormRow
            id={htmlId('field')}
            label={
              <FormattedMessage id="visTypeTimeseries.topHit.fieldLabel" defaultMessage="Field" />
            }
          >
            <FieldSelect
              fields={fields}
              type={model.type}
              restrict={aggWithOptionsRestrictFields}
              indexPattern={indexPattern}
              value={model.field}
              onChange={handleSelectChange('field')}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow
            id={htmlId('size')}
            label={
              <FormattedMessage id="visTypeTimeseries.topHit.sizeLabel" defaultMessage="Size" />
            }
          >
            <EuiFormControlLayout compressed={true}>
              {/*
                EUITODO: The following input couldn't be converted to EUI because of type mis-match.
                Should it be text or number?
              */}
              <input
                className="euiFieldText euiFieldText--compressed"
                value={model.size}
                onChange={handleTextChange('size')}
              />
            </EuiFormControlLayout>
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedFormRow
            id={htmlId('agg_with')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.topHit.aggregateWithLabel"
                defaultMessage="Aggregate with"
              />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              placeholder={i18n.translate(
                'visTypeTimeseries.topHit.aggregateWith.selectPlaceholder',
                {
                  defaultMessage: 'Select...',
                }
              )}
              options={aggWithOptions}
              selectedOptions={selectedAggWithOption ? [selectedAggWithOption] : []}
              onChange={handleSelectChange('agg_with')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedFormRow
            id={htmlId('order_by')}
            label={
              <FormattedMessage
                id="visTypeTimeseries.topHit.orderByLabel"
                defaultMessage="Order by"
              />
            }
          >
            <FieldSelect
              restrict={ORDER_DATE_RESTRICT_FIELDS}
              value={model.order_by}
              onChange={handleSelectChange('order_by')}
              indexPattern={indexPattern}
              fields={fields}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedFormRow
            id={htmlId('order')}
            label={
              <FormattedMessage id="visTypeTimeseries.topHit.orderLabel" defaultMessage="Order" />
            }
          >
            <EuiCompressedComboBox
              isClearable={false}
              placeholder={i18n.translate('visTypeTimeseries.topHit.order.selectPlaceholder', {
                defaultMessage: 'Select...',
              })}
              options={orderOptions}
              selectedOptions={selectedOrderOption ? [selectedOrderOption] : []}
              onChange={handleSelectChange('order')}
              singleSelection={{ asPlainText: true }}
            />
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </AggRow>
  );
};

export const TopHitAgg = injectI18n(TopHitAggUi);

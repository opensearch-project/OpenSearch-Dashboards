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

import PropTypes from 'prop-types';
import React from 'react';
import { AggSelect } from './agg_select';
import { FieldSelect } from './field_select';
import { AggRow } from './agg_row';
import { createChangeHandler } from '../lib/create_change_handler';
import { createSelectHandler } from '../lib/create_select_handler';
import {
  htmlIdGenerator,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiFormLabel,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { getSupportedFieldsByMetricType } from '../lib/get_supported_fields_by_metric_type';

export function StandardAgg(props) {
  const { model, panel, series, fields, uiRestrictions } = props;
  const handleChange = createChangeHandler(props.onChange, model);
  const handleSelectChange = createSelectHandler(handleChange);
  const restrictFields = getSupportedFieldsByMetricType(model.type);
  const indexPattern =
    (series.override_index_pattern && series.series_index_pattern) || panel.index_pattern;
  const htmlId = htmlIdGenerator();

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
              id="visTypeTimeseries.stdAgg.aggregationLabel"
              defaultMessage="Aggregation"
            />
          </EuiFormLabel>
          <EuiSpacer size="xs" />
          <AggSelect
            id={htmlId('aggregation')}
            panelType={props.panel.type}
            siblings={props.siblings}
            value={model.type}
            uiRestrictions={uiRestrictions}
            onChange={handleSelectChange('type')}
            fullWidth
          />
        </EuiFlexItem>

        {model.type !== 'count' ? (
          <EuiFlexItem>
            <EuiCompressedFormRow
              id={htmlId('field')}
              label={
                <FormattedMessage id="visTypeTimeseries.stdAgg.fieldLabel" defaultMessage="Field" />
              }
              fullWidth
            >
              <FieldSelect
                fields={fields}
                type={model.type}
                restrict={restrictFields}
                indexPattern={indexPattern}
                value={model.field}
                onChange={handleSelectChange('field')}
                uiRestrictions={uiRestrictions}
                fullWidth
              />
            </EuiCompressedFormRow>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    </AggRow>
  );
}

StandardAgg.propTypes = {
  disableDelete: PropTypes.bool,
  fields: PropTypes.object,
  model: PropTypes.object,
  onAdd: PropTypes.func,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  panel: PropTypes.object,
  series: PropTypes.object,
  siblings: PropTypes.array,
  uiRestrictions: PropTypes.object,
};

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

import { EuiDatePickerRange, EuiFormControlLayoutDelimited } from '@elastic/eui';
import { InjectedIntl, injectI18n } from '@osd/i18n/react';
import { get } from 'lodash';

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { IFieldType } from '../../..';
import { UI_SETTINGS } from '../../../../common';
import { ValueInputType } from './value_input_type';

interface RangeParams {
  from: number | string;
  to: number | string;
}

type RangeParamsPartial = Partial<RangeParams>;

interface Props {
  field?: IFieldType;
  value?: RangeParams;
  onChange: (params: RangeParamsPartial) => void;
  intl: InjectedIntl;
}

function RangeValueInputUI(props: Props) {
  const opensearchDashboards = useOpenSearchDashboards();
  const type = props.field ? props.field.type : 'string';
  const dateFormat = opensearchDashboards.services.uiSettings!.get(UI_SETTINGS.DATE_FORMAT);

  const onFromChange = (value: string | number | boolean) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error('Range params must be a string or number');
    }
    props.onChange({ from: value, to: get(props, 'value.to') });
  };

  const onToChange = (value: string | number | boolean) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error('Range params must be a string or number');
    }
    props.onChange({ from: get(props, 'value.from'), to: value });
  };

  const rangeInputLabel = props.intl.formatMessage({
    id: 'data.filter.filterEditor.rangeInputLabel',
    defaultMessage: 'Range',
  });
  const startControl = (
    <ValueInputType
      controlOnly
      fullWidth={type === 'date'}
      type={type}
      value={props.value ? props.value.from : undefined}
      onChange={onFromChange}
      onBlur={onFromChange}
      dateFormat={dateFormat}
      placeholder={props.intl.formatMessage({
        id: 'data.filter.filterEditor.rangeStartInputPlaceholder',
        defaultMessage: 'Start of the range',
      })}
    />
  );
  const endControl = (
    <ValueInputType
      controlOnly
      fullWidth={type === 'date'}
      type={type}
      value={props.value ? props.value.to : undefined}
      onChange={onToChange}
      onBlur={onToChange}
      dateFormat={dateFormat}
      placeholder={props.intl.formatMessage({
        id: 'data.filter.filterEditor.rangeEndInputPlaceholder',
        defaultMessage: 'End of the range',
      })}
    />
  );

  return (
    <div>
      {type === 'date' ? (
        <EuiDatePickerRange
          isCustom
          compressed
          fullWidth
          aria-label={rangeInputLabel}
          startDateControl={startControl}
          endDateControl={endControl}
        />
      ) : (
        <EuiFormControlLayoutDelimited
          fullWidth
          aria-label={rangeInputLabel}
          startControl={startControl}
          endControl={endControl}
        />
      )}
    </div>
  );
}

export const RangeValueInput = injectI18n(RangeValueInputUI);

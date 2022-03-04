/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useMemo } from 'react';
import { EuiFormRow, EuiSuperSelect } from '@elastic/eui';
import { WizardServices } from 'src/plugins/wizard/public';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { useTypedSelector } from '../../../../utils/state_management';
import { SelectContribution } from './types';

interface SelectProps extends Omit<SelectContribution, 'type'> {
  value: string;
}

export const Select = ({ label, options, onChange, value, ...rest }: SelectProps) => {
  const rootState = useTypedSelector((state) => state);
  const { services } = useOpenSearchDashboards<WizardServices>();
  const selectOptions = useMemo(
    () => (typeof options === 'function' ? options(rootState, services) : options),
    [options, rootState, services]
  );
  // const { isInvalid, errorMessage } = getFieldValidityAndErrorMessage(field);

  return (
    <EuiFormRow
      label={label}
      // error={errorMessage}
      // isInvalid={isInvalid}
      fullWidth
      data-test-subj={rest['data-test-subj']}
      describedByIds={rest.idAria ? [rest.idAria] : undefined}
    >
      <EuiSuperSelect
        fullWidth
        onChange={(newValue) => {
          onChange?.(newValue);
          // field.setValue(value);
        }}
        // isInvalid={isInvalid}
        valueOfSelected={value || ''}
        data-test-subj="select"
        options={selectOptions}
      />
    </EuiFormRow>
  );
};

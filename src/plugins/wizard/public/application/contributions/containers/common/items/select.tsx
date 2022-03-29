/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiFormRow, EuiSuperSelect } from '@elastic/eui';
import { WizardServices } from 'src/plugins/wizard/public';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { useTypedSelector } from '../../../../utils/state_management';
import { SelectContribution } from './types';

interface SelectProps extends Omit<SelectContribution<string>, 'type'> {
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
        }}
        // isInvalid={isInvalid}
        valueOfSelected={value || ''}
        data-test-subj="select"
        options={selectOptions}
      />
    </EuiFormRow>
  );
};

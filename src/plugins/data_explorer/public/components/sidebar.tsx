/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiPanel, EuiComboBox, EuiSelect, EuiSelectOption } from '@elastic/eui';
import { useView } from '../utils/use';

export const Sidebar = () => {
  const { view, viewRegistry } = useView();
  const views = viewRegistry.all();
  const viewOptions: EuiSelectOption[] = useMemo(
    () =>
      views.map(({ id, title }) => ({
        value: id,
        text: title,
      })),
    [views]
  );
  return (
    <>
      <EuiPanel borderRadius="none" hasShadow={false}>
        <EuiComboBox
          placeholder="Select a datasource"
          singleSelection={{ asPlainText: true }}
          options={[
            {
              label: 'Select a datasource',
            },
          ]}
          selectedOptions={[]}
          onChange={() => {}}
        />
        <EuiSelect options={viewOptions} value={view?.id} />
      </EuiPanel>
      {view?.ui.panel}
    </>
  );
};

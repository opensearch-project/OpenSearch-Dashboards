/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, FC, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiPanel, EuiComboBox, EuiSelect, EuiComboBoxOptionOption } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useView } from '../../utils/use';
import { DataExplorerServices } from '../../types';
import { useTypedDispatch, useTypedSelector, setIndexPattern } from '../../utils/state_management';
import { setView } from '../../utils/state_management/metadata_slice';

export const Sidebar: FC = ({ children }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [options, setOptions] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [selectedOption, setSelectedOption] = useState<EuiComboBoxOptionOption<string>>();
  const { view, viewRegistry } = useView();
  const views = viewRegistry.all();
  const viewOptions = useMemo(
    () =>
      views.map(({ id, title }) => ({
        value: id,
        text: title,
      })),
    [views]
  );

  const {
    services: {
      data: { indexPatterns },
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<DataExplorerServices>();

  useEffect(() => {
    const fetchIndexPatterns = async () => {
      await indexPatterns.ensureDefaultIndexPattern();
      const cache = await indexPatterns.getCache();
      const currentOptions = (cache || []).map((indexPattern) => ({
        label: indexPattern.attributes.title,
        value: indexPattern.id,
      }));
      setOptions(currentOptions);
    };
    fetchIndexPatterns();
  }, [indexPatterns]);

  // Set option to the current index pattern
  useEffect(() => {
    if (indexPatternId) {
      const option = options.find((o) => o.value === indexPatternId);
      setSelectedOption(option);
    }
  }, [indexPatternId, options]);

  return (
    <>
      <EuiPanel borderRadius="none" hasShadow={false}>
        <EuiComboBox
          placeholder="Select a datasource"
          singleSelection={{ asPlainText: true }}
          options={options}
          selectedOptions={selectedOption ? [selectedOption] : []}
          onChange={(selected) => {
            // TODO: There are many issues with this approach, but it's a start
            // 1. Combo box can delete a selected index pattern. This should not be possible
            // 2. Combo box is severely truncated. This should be fixed in the EUI component
            // 3. The onchange can fire with a option that is not valid. discuss where to handle this.
            // 4. value is optional. If the combobox needs to act as a slecet, this should be required.
            const { value } = selected[0] || {};

            if (!value) {
              toasts.addWarning({
                id: 'index-pattern-not-found',
                title: i18n.translate('dataExplorer.indexPatternError', {
                  defaultMessage: 'Index pattern not found',
                }),
              });
              return;
            }

            dispatch(setIndexPattern(value));
          }}
        />
        <EuiSelect
          options={viewOptions}
          value={view?.id}
          onChange={(e) => {
            dispatch(setView(e.target.value));
          }}
        />
      </EuiPanel>
      {children}
    </>
  );
};

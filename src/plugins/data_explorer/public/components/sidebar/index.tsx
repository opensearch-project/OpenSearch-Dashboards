/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, FC, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiSelect,
  EuiComboBoxOptionOption,
  EuiSpacer,
  EuiSplitPanel,
  EuiPageSideBar,
} from '@elastic/eui';
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
    let isMounted = true;
    const fetchIndexPatterns = async () => {
      await indexPatterns.ensureDefaultIndexPattern();
      const cache = await indexPatterns.getCache();
      const currentOptions = (cache || []).map((indexPattern) => ({
        label: indexPattern.attributes.title,
        value: indexPattern.id,
      }));
      if (isMounted) {
        setOptions(currentOptions);
      }
    };
    fetchIndexPatterns();

    return () => {
      isMounted = false;
    };
  }, [indexPatterns]);

  // Set option to the current index pattern
  useEffect(() => {
    if (indexPatternId) {
      const option = options.find((o) => o.value === indexPatternId);
      setSelectedOption(option);
    }
  }, [indexPatternId, options]);

  return (
    <EuiPageSideBar className="deSidebar" sticky>
      <EuiSplitPanel.Outer className="eui-yScroll" hasBorder={true} borderRadius="none">
        <EuiSplitPanel.Inner paddingSize="s" color="subdued" grow={false}>
          <EuiComboBox
            placeholder="Select a datasource"
            singleSelection={{ asPlainText: true }}
            options={options}
            selectedOptions={selectedOption ? [selectedOption] : []}
            fullWidth
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
          {/* Hidden for the 2.10 release of Data Explorer. Uncomment when Data explorer is released */}
          {/* <EuiSpacer size="s" />
          <EuiSelect
            options={viewOptions}
            value={view?.id}
            onChange={(e) => {
              dispatch(setView(e.target.value));
            }}
            fullWidth
          /> */}
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="subdued" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};

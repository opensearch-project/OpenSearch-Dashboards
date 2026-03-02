/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FunctionComponent, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBasicTable,
  EuiSearchBar,
  EuiSearchBarProps,
  EuiSwitch,
  EuiSwitchEvent,
  EuiToolTip,
} from '@elastic/eui';
import { isEqual } from 'lodash';
import { TaskInfo } from '../../../../../core/common/healthcheck';
import { CheckFlyout } from './check_flyout';
import { getCore } from '../../dashboards_services';
import { formatDate } from '../services/time';
import { tableColumns } from './columns';
import { TASK } from '../../constants';

interface ChecksTableProps {
  checks: TaskInfo[];
}

const enabledSwitchField = 'enabled';
const initialQuery = EuiSearchBar.Query.parse(`${enabledSwitchField}:true`);

export const ChecksTable: FunctionComponent<ChecksTableProps> = ({ checks }) => {
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const [check, setCheck] = useState<TaskInfo | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [filteredChecks, setFilteredChecks] = useState(checks);

  const core = getCore();

  useEffect(() => {
    const queriedItems = EuiSearchBar.Query.execute(query, checks);
    setFilteredChecks(queriedItems);
  }, [query, checks]);

  const openFlyout = (item?: TaskInfo | null) => {
    if (!item) {
      setFlyoutVisible(false);
      setCheck(null);
    }

    if (isEqual(item, check)) {
      setFlyoutVisible(false);
      setCheck(null);
    } else {
      setFlyoutVisible(true);
      setCheck(item);
    }
  };

  const onChangeQuery = ({ query: searchQuery }) => {
    setQuery(searchQuery);
  };

  const filters: EuiSearchBarProps['filters'] = [
    {
      type: 'field_value_toggle_group',
      field: 'result',
      items: [
        {
          value: TASK.RUN_RESULT.GREEN.value,
          name: TASK.RUN_RESULT.GREEN.label,
        },
        {
          value: TASK.RUN_RESULT.YELLOW.value,
          name: TASK.RUN_RESULT.YELLOW.label,
        },
        {
          value: TASK.RUN_RESULT.RED.value,
          name: TASK.RUN_RESULT.RED.label,
        },
      ],
    },
  ];

  const getCellProps = (item: any, column: any) => {
    const { id } = item;
    const { field } = column;
    return {
      'data-test-subj': `cell-${id}-${field}`,
      textOnly: true,
    };
  };

  const enabledSwitchChecked = query?.ast?.clauses.some(
    (clause) => clause.field === enabledSwitchField && clause.value === false
  );
  const enabledSwitchLabel = i18n.translate('healthcheck.filter.showDisabled', {
    defaultMessage: 'Show disabled',
  });

  const enabledSwitchOnChange = (event: EuiSwitchEvent) => {
    // Baed on https://github.com/opensearch-project/oui/blob/1.21.0/src/components/search_bar/filters/field_value_toggle_filter.tsx#L71
    const field = enabledSwitchField;
    // Invert the value because the switch shows "Show disabled", so checked means isEnabled:false
    const value = !Boolean(event.target.checked);
    const operator = undefined;
    const newQuery = query
      .addSimpleFieldValue(field, value, true, operator) // Add new value
      .removeSimpleFieldValue(field, !value); // Remove the opposite and expectec previous value

    setQuery(newQuery);
  };

  return (
    <>
      <EuiSearchBar
        defaultQuery={initialQuery}
        query={query}
        onChange={onChangeQuery}
        filters={filters}
        toolsRight={
          <EuiToolTip
            content={i18n.translate('healthcheck.filter.showDisabled.tooltip', {
              defaultMessage: 'Filter by disabled checks',
            })}
            position="top"
          >
            <EuiSwitch
              label={enabledSwitchLabel}
              checked={enabledSwitchChecked}
              onChange={enabledSwitchOnChange}
              compressed={true}
            />
          </EuiToolTip>
        }
      />
      <EuiBasicTable
        columns={tableColumns(openFlyout)}
        items={filteredChecks}
        tableLayout="fixed"
        cellProps={getCellProps}
      />
      {flyoutVisible && check && (
        <CheckFlyout
          check={check}
          formatDate={(date) => formatDate(core.uiSettings, date)}
          setIsFlyoutVisible={setFlyoutVisible}
        />
      )}
    </>
  );
};

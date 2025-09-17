/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EuiButtonEmpty, EuiIcon, EuiListGroup, EuiPopover, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  selectOverallQueryStatus,
  selectQuery,
} from '../../../../application/utils/state_management/selectors';
import {
  QueryPanelActionDependencies,
  QueryPanelActionsRegistryService,
} from '../../../../services/query_panel_actions_registry';
import './query_panel_actions.scss';
import { getQueryWithSource } from '../../../../application/utils/languages';

export interface QueryPanelActionsProps {
  registry: QueryPanelActionsRegistryService;
}

export const QueryPanelActions = ({ registry }: QueryPanelActionsProps) => {
  const query = useSelector(selectQuery);
  const resultStatus = useSelector(selectOverallQueryStatus);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const dependencies = useMemo<QueryPanelActionDependencies>(
    () => ({
      // adding the source if omitted
      query: getQueryWithSource(query),
      resultStatus,
    }),
    [query, resultStatus]
  );

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          onClick={onButtonClick}
          data-test-subj="queryPanelFooterActionsButton"
          size="xs"
        >
          <div className="exploreQueryPanelActions__buttonTextWrapper">
            <EuiText size="xs">
              {i18n.translate('explore.queryPanel.actions.actions', {
                defaultMessage: 'Actions',
              })}
            </EuiText>
            <EuiIcon type="arrowDown" size="s" />
          </div>
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
      panelPaddingSize="none"
    >
      <EuiListGroup>
        {registry.getSortedActions().map((action) => (
          <EuiButtonEmpty
            key={action.id}
            className="exploreQueryPanelActions__item"
            onClick={() => action.onClick(dependencies)}
            disabled={action.getIsEnabled ? !action.getIsEnabled(dependencies) : false}
            iconType={action.getIcon?.(dependencies)}
          >
            {action.getLabel(dependencies)}
          </EuiButtonEmpty>
        ))}
      </EuiListGroup>
    </EuiPopover>
  );
};

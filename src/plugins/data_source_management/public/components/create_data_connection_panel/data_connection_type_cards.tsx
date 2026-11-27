/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButton,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  IconType,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../types';
import {
  DirectQueryConnectionFlow,
  isDirectQueryConnectionFlowAllowed,
} from '../../direct_query_connection_flow_registry';
import { getDirectQueryConnectionFlowPath } from '../direct_query_connection_flow/constants';
import { useDirectQueryConnectionFlowVisibility } from '../direct_query_connection_flow/use_visible_direct_query_connection_flows';

/** `flow:<id>` for a registered connection flow. */
export type DataConnectionTypeCardId = `flow:${string}`;

export const getFlowTypeCardId = (flowId: string): DataConnectionTypeCardId => `flow:${flowId}`;

export interface DataConnectionTypeCard {
  id: DataConnectionTypeCardId;
  title: string;
  description: string;
  iconType?: IconType;
  isNew?: boolean;
  /** Router path of the type's setup page. */
  path: string;
  testSubj: string;
}

// A connection flow's card. Only flows that can be connected in the app have one, and only once
// they work: a flow that is not released has no card at all (never a disabled "coming soon" one).
// The built-in types have their own cards (CreateDataSourceCardView) on the Create page.
const getFlowCards = (flows: DirectQueryConnectionFlow[]): DataConnectionTypeCard[] =>
  flows.flatMap((flow) =>
    flow.createPageCard
      ? [
          {
            id: getFlowTypeCardId(flow.id),
            title: flow.title,
            description: flow.createPageCard.description,
            iconType: flow.createPageCard.iconType,
            isNew: flow.createPageCard.isNew,
            path: getDirectQueryConnectionFlowPath(flow.id),
            testSubj: `datasource_card_flow_${flow.id}`,
          },
        ]
      : []
  );

export interface DataConnectionTypeCardList {
  cards: DataConnectionTypeCard[];
  /** Whether a card may still appear: a flow with a card is not known to be visible or not yet. */
  loading: boolean;
}

/**
 * The data connection types: the visible flows that have a card, in registration order. A flow that
 * requires data source management (the default) needs `dataSource.canManage`. A card appears as soon
 * as its flow is known to be visible, so a slow flow holds back only its own card.
 */
export const useDataConnectionTypeCards = (): DataConnectionTypeCardList => {
  const { application, directQueryConnectionFlowRegistry: registry } =
    useOpenSearchDashboards<DataSourceManagementContext>().services;
  const canManage = !!application.capabilities?.dataSource?.canManage;
  const visibility = useDirectQueryConnectionFlowVisibility(registry, canManage);
  return useMemo(() => {
    const cardFlows = registry
      ? registry
          .getAllFlows()
          .filter(
            (flow) => flow.createPageCard && isDirectQueryConnectionFlowAllowed(flow, canManage)
          )
      : [];
    return {
      cards: getFlowCards(cardFlows.filter((flow) => visibility.get(flow.id) === true)),
      loading: cardFlows.some((flow) => !visibility.has(flow.id)),
    };
  }, [registry, canManage, visibility]);
};

interface DataConnectionTypeCardsProps {
  cards: DataConnectionTypeCard[];
}

/** A card's width: room for a type name and its badge, and a short description on two lines. */
const CARD_WIDTH = 300;

/**
 * The type cards of the Create data connection page, side by side and wrapping: title, description
 * and a Connect button that opens the type's setup page, a page of its own.
 */
export const DataConnectionTypeCards = ({ cards }: DataConnectionTypeCardsProps) => {
  const history = useHistory();
  const newBadgeLabel = i18n.translate('dataSourcesManagement.createDataConnection.newBadge', {
    defaultMessage: 'New',
  });
  const connectLabel = i18n.translate('dataSourcesManagement.createDataConnection.connect', {
    defaultMessage: 'Connect',
  });

  return (
    <EuiFlexGroup wrap gutterSize="m" responsive={false} data-test-subj="dataConnectionTypeCards">
      {cards.map((card) => (
        <EuiFlexItem
          key={card.id}
          grow={false}
          style={{ width: CARD_WIDTH, maxWidth: '100%' }}
          data-test-subj={card.testSubj}
        >
          <EuiCard
            // Cards in a row take the height of the tallest one, with the button at the bottom.
            className="eui-fullHeight"
            textAlign="left"
            paddingSize="m"
            titleElement="h2"
            titleSize="xs"
            icon={card.iconType ? <EuiIcon type={card.iconType} size="l" /> : undefined}
            title={
              <EuiFlexGroup component="span" alignItems="center" gutterSize="s" responsive={false}>
                <EuiFlexItem component="span" grow={false}>
                  {card.title}
                </EuiFlexItem>
                {card.isNew && (
                  <EuiFlexItem component="span" grow={false}>
                    {/* A light primary badge, in sentence case, in light and dark themes. */}
                    <EuiBadge
                      color={euiThemeVars.euiFocusBackgroundColor}
                      style={{ color: euiThemeVars.euiColorPrimaryText }}
                      data-test-subj={`${card.testSubj}_new`}
                    >
                      {newBadgeLabel}
                    </EuiBadge>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            }
            description={card.description}
            footer={
              <EuiButton
                size="s"
                fill
                // Every card says Connect: the label names the type for screen readers.
                aria-label={i18n.translate(
                  'dataSourcesManagement.createDataConnection.connectType',
                  { defaultMessage: 'Connect {type}', values: { type: card.title } }
                )}
                data-test-subj={`${card.testSubj}_connect`}
                // One history entry per page change: a repeated click on the way out adds none.
                onClick={() => {
                  if (history.location.pathname !== card.path) history.push(card.path);
                }}
              >
                {connectLabel}
              </EuiButton>
            }
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};

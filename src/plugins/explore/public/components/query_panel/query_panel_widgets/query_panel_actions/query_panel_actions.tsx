/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useState } from 'react';
import { EuiButtonEmpty, EuiIcon, EuiPopover, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import {
  ButtonActionConfig,
  FlyoutActionConfig,
  QueryPanelActionsRegistryService,
  QueryPanelActionConfig,
} from '../../../../services/query_panel_actions_registry';
import { ExploreServices } from '../../../../types';
import { useQueryPanelActionDependencies } from './use_query_panel_action_dependencies';
import './query_panel_actions.scss';

export interface QueryPanelActionsProps {
  registry: QueryPanelActionsRegistryService;
}

/**
 * Inline-display threshold. Up to this many actions render directly in the
 * toolbar, each as its own button — registered actions are first-class
 * affordances, not buried behind a dropdown when the list is short. Beyond
 * the threshold, the first N stay inline and the remainder fall back into
 * an overflow popover labeled "+M".
 *
 * Tunable. Bumping past ~5 risks crowding the right-hand toolbar widgets;
 * lowering it under 3 makes the popover the common case and defeats the
 * point of inline display.
 */
const INLINE_ACTION_LIMIT = 5;

export const QueryPanelActions = ({ registry }: QueryPanelActionsProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null);

  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Get all dependencies for actions
  const dependencies = useQueryPanelActionDependencies();

  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  // Close flyout handler
  const closeFlyout = useCallback(() => {
    setOpenFlyoutId(null);
  }, []);

  // Handle action click — same dispatch path for inline and overflow
  // entries, so the popover-vs-inline split is purely presentational.
  const handleActionClick = useCallback(
    (action: QueryPanelActionConfig) => {
      if (action.actionType === 'button') {
        const buttonAction = action as ButtonActionConfig;
        buttonAction.onClick(dependencies);
      } else if (action.actionType === 'flyout') {
        const flyoutAction = action as FlyoutActionConfig;
        flyoutAction.onFlyoutOpen?.(dependencies);
        setOpenFlyoutId(action.id);
      }
      // Always close the overflow popover after dispatching, regardless of
      // whether the click came from inside it. No-op when it wasn't open.
      closePopover();
    },
    [dependencies, closePopover]
  );

  // Split the sorted action list at the inline threshold. The slice is
  // memoized so the underlying buttons keep stable identity across renders
  // when the registry contents haven't changed.
  const { inlineActions, overflowActions } = useMemo(() => {
    const all = registry.getSortedActions();
    return {
      inlineActions: all.slice(0, INLINE_ACTION_LIMIT),
      overflowActions: all.slice(INLINE_ACTION_LIMIT),
    };
  }, [registry]);

  // Get open flyout configuration
  const openFlyoutConfig = useMemo(() => {
    if (!openFlyoutId) return null;
    const action = registry.getAction(openFlyoutId);
    return action?.actionType === 'flyout' ? (action as FlyoutActionConfig) : null;
  }, [openFlyoutId, registry]);

  // Wrap the action buttons in a right-anchored group so they sit on the
  // far end of the toolbar's left section, visually separated from the
  // save/recent/dataset controls. `flex: 1` consumes leftover horizontal
  // space; `justify-content: flex-end` shoves the buttons to the right
  // edge.
  return (
    <div className="exploreQueryPanelActions__group" data-test-subj="queryPanelActionsGroup">
      {inlineActions.map((action) => {
        const isEnabled = action.getIsEnabled ? action.getIsEnabled(dependencies) : true;
        const label = action.getLabel(dependencies);
        const icon = action.getIcon?.(dependencies);

        return (
          <EuiButtonEmpty
            key={action.id}
            size="xs"
            onClick={() => handleActionClick(action)}
            disabled={!isEnabled}
            iconType={icon}
            data-test-subj={`queryPanelActionInline-${action.id}`}
          >
            {/* Explicit `EuiText size="xs"` matches the rendering of other
                toolbar buttons (e.g. Saved queries / Recent queries), which
                wrap their label in the same component. Without this wrapper,
                the inline action text picks up the surrounding inherited
                font-size and renders visibly larger than its neighbors. */}
            <EuiText size="xs">{label}</EuiText>
          </EuiButtonEmpty>
        );
      })}

      {overflowActions.length > 0 && (
        <EuiPopover
          button={
            <EuiButtonEmpty
              onClick={() => setIsPopoverOpen((open) => !open)}
              // Test-subj kept stable across the inline/overflow split so
              // existing consumers (e.g. the alerting plugin's
              // click-to-close hack) keep working when it shows up.
              data-test-subj="queryPanelFooterActionsButton"
              size="xs"
            >
              <div className="exploreQueryPanelActions__buttonTextWrapper">
                <EuiText size="xs">
                  {i18n.translate('explore.queryPanel.actions.overflow', {
                    defaultMessage: '+{count} more {count, plural, one {action} other {actions}}',
                    values: { count: overflowActions.length },
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
          <div className="exploreQueryPanelActions__overflowList">
            {overflowActions.map((action) => {
              const isEnabled = action.getIsEnabled ? action.getIsEnabled(dependencies) : true;
              const label = action.getLabel(dependencies);
              const icon = action.getIcon?.(dependencies);

              return (
                <EuiButtonEmpty
                  key={action.id}
                  className="exploreQueryPanelActions__item"
                  onClick={() => handleActionClick(action)}
                  disabled={!isEnabled}
                  iconType={icon}
                  data-test-subj={`queryPanelActionOverflow-${action.id}`}
                >
                  {label}
                </EuiButtonEmpty>
              );
            })}
          </div>
        </EuiPopover>
      )}

      {/* Render open flyout */}
      {openFlyoutConfig && (
        <openFlyoutConfig.component
          closeFlyout={closeFlyout}
          dependencies={dependencies}
          services={services}
        />
      )}
    </div>
  );
};

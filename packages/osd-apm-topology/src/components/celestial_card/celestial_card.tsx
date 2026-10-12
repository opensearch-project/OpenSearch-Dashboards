/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef } from 'react';
import { ActionsIcon } from '../../shared/resources';
import { useCelestialNodeActionsContext } from '../../shared/contexts/node_actions_context';
import { t } from '../../shared/i18n/t';
import { DEFAULT_METRICS } from '../../shared/constants/common.constants';
import { formatCount } from '../../shared/utils/format_count';
import { Description } from '../description';
import { HealthDonut } from '../health_donut';
import { CelestialCardProps } from './types';
import { ViewInsightsButton } from './components/view_insights_button';
import { SliStatus } from './components/sli_status';

export const CelestialCard = (props: CelestialCardProps) => {
  const {
    id,
    icon,
    title,
    subtitle,
    platform,
    health,
    isGroup,
    numberOfServices,
    metrics,
    isFaded,
    color,
    stackedNodeIds,
  } = props;
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const { onGroupToggle, onDashboardClick, selectedNodeId } = useCelestialNodeActionsContext();

  const totalRequests = formatCount(metrics?.requests);

  const isSliStatusDisplayed = health?.status && ['breached', 'recovered'].includes(health?.status);

  // Determine if this card is selected based on context
  const isSelected = id === selectedNodeId;
  const isAggregated = (stackedNodeIds?.length ?? 0) > 0;

  const onViewDashboardClick = useCallback(
    (event: React.MouseEvent) => {
      // Mark the click handled so the card-level handler skips it (no double action),
      // while it still bubbles to the React Flow node (selection, click-to-zoom).
      event.preventDefault();
      // Later clicks of a double-click (detail > 1) must not re-fire the action.
      if (event.detail > 1) return;
      // Selection state is handled by context now
      onDashboardClick?.(event, props);
    },
    [onDashboardClick, props]
  );

  // The card-level action: a group expands/collapses, a leaf opens its insights. An
  // aggregated (stacked) leaf has no insights of its own, as before.
  const activateCard = useCallback(
    (event: React.SyntheticEvent) => {
      if (isGroup) {
        onGroupToggle?.(event, props);
      } else if (!isAggregated) {
        onDashboardClick?.(event, props);
      }
    },
    [isGroup, isAggregated, onGroupToggle, onDashboardClick, props]
  );

  // Make the whole card clickable (not just the "View insights" text). Inner
  // controls that already acted mark the event handled (or stop it), so they
  // don't double-fire this. This replaces the former group double-click toggle;
  // the later clicks of a multi-click (detail > 1) are ignored so a double-click
  // toggles once.
  const onCardClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.defaultPrevented || event.detail > 1) return;
      activateCard(event);
    },
    [activateCard]
  );

  // Keyboard equivalent of the whole-card click (Enter/Space) so the card is
  // operable without a mouse. Keys pressed on an inner control (e.g. "View
  // insights") are left to that control's own activation.
  const onCardKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.target !== event.currentTarget) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      // The React Flow node wrapper also reacts to Enter/Space (selection); the card
      // handles the key, so it stops here.
      event.stopPropagation();
      // Holding the key auto-repeats keydown; activate once.
      if (event.repeat) return;
      activateCard(event);
    },
    [activateCard]
  );

  const customColorStyle: React.CSSProperties =
    !health?.breached && color
      ? ({ borderColor: color, '--osd-node-glow-color': color } as React.CSSProperties)
      : {};

  return (
    <div
      ref={nodeRef}
      style={customColorStyle}
      className={`osd:w-68 osd:min-h-24 osd:rounded-xl osd:p-3 osd:flex osd:justify-center osd:items-center osd:border-2 osd:box-border 'border-solid'
                ${
                  health?.breached
                    ? 'osd:bg-container-breached osd:border-status-breached'
                    : 'osd:bg-container-default osd:border-status-default'
                }
                ${
                  health?.breached
                    ? 'osd:hover:border-status-breached-hover'
                    : color
                      ? ''
                      : 'osd:hover:border-status-default-hover'
                }
                ${
                  isSelected
                    ? 'osd:outline-2 osd:outline-blue-500 osd:outline-offset-4 osd:shadow-node-selected'
                    : ''
                } 
                ${isFaded ? 'osd:opacity-30' : 'osd:opacity-100'}
                osd:transition-all osd:duration-200 osd:cursor-pointer`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      role="button"
      tabIndex={0}
      // The card is the one control; without a name, screen readers read its whole text.
      aria-label={
        isGroup
          ? t('buttons.expandGroup', { title: title ?? '' })
          : t('buttons.openNode', { title: title ?? '' })
      }
    >
      <div>
        <div className="osd:grid osd:grid-cols-58">
          {!!icon && (
            <div className="osd:col-span-14">
              <HealthDonut
                metrics={metrics || { ...DEFAULT_METRICS }}
                size={60}
                icon={icon}
                isLegendEnabled={true}
              />
            </div>
          )}

          {/* Rest of the component remains unchanged */}
          <div
            className={`osd:col-span-44 osd:flex osd:flex-col osd:justify-center ${
              isSliStatusDisplayed ? 'osd:-mt-2' : ''
            }`}
          >
            {isSliStatusDisplayed && (
              <div className="osd:col-span-44 osd:flex osd:flex-row-reverse osd:mb-0.5">
                <SliStatus status={health?.status} />
              </div>
            )}
            {isGroup ? (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <div
                className="osd:flex osd:items-center osd:group osd:hover:cursor-pointer osd:pl-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.detail > 1) return;
                  onGroupToggle?.(e, props);
                }}
              >
                <button
                  className="osd-resetFocusState osd:text-group-caret osd:transition-colors osd:mr-0 osd:bg-transparent osd:border-0 osd:p-0"
                  aria-expanded={false}
                  // The card itself is the keyboard control for this action.
                  tabIndex={-1}
                >
                  <img
                    src={ActionsIcon}
                    className="osd:w-4 osd:h-4 osd:transition-transform osd:duration-200 osd:rotate-0 osd:group-hover:rotate-90"
                    alt=""
                  />
                </button>
                <a className="osd-resetFocusState osd:font-bold osd:text-sm osd:text-link-default osd:hover:text-link-hover osd:transition-colors osd:truncate">
                  {title}
                </a>
              </div>
            ) : (
              <div className="osd:font-bold osd:text-sm osd:text-body-default osd:transition-colors osd:pl-2 osd:truncate">
                {title}
              </div>
            )}
            <div className="osd:text-xs osd:text-body-secondary osd:pl-2 osd:truncate">
              {subtitle}
            </div>
          </div>
        </div>
        {!isAggregated && (
          <div className="osd:grid osd:grid-cols-58 osd:py-2">
            <div className="osd:col-span-16">
              <Description
                className="osd:pr-1"
                label={t('node.labels.requests')}
                value={totalRequests}
              />
            </div>

            {/* Rest of the component remains unchanged */}
            <div className="osd:col-span-42 osd:flex osd:flex-col osd:justify-center osd:border-l-1 osd:border-divider-default">
              {isGroup || platform ? (
                <Description
                  className="osd:pl-2.5"
                  label={isGroup ? t('node.labels.services') : t('node.labels.platform')}
                  value={isGroup ? `${numberOfServices}` : platform!}
                />
              ) : (
                <div className="osd:flex osd:flex-row-reverse osd:flex-grow osd:text-xs osd:items-end">
                  <ViewInsightsButton onClick={onViewDashboardClick} tabIndex={-1} />
                </div>
              )}
            </div>
          </div>
        )}
        {(isGroup || platform) && !isAggregated && (
          <div className="osd:flex osd:flex-row-reverse osd:text-xs">
            <ViewInsightsButton onClick={onViewDashboardClick} tabIndex={-1} />
          </div>
        )}
      </div>
    </div>
  );
};

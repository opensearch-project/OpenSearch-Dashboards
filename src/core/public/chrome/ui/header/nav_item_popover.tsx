/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon, EuiPopoverTitle } from '@elastic/eui';
import { NavPopoverConfig, NavPopoverServices } from '../../nav_group';
import { InternalApplicationStart } from '../../../application/types';
import { SimplePopover } from './simple_popover';

export interface NavPopoverChildItem {
  id: string;
  title: string;
  iconType?: string;
  onClick?: () => void;
  /** Nested children — rendered as a secondary (cascading) popover on hover. */
  children?: NavPopoverChildItem[];
}

export interface NavItemPopoverProps {
  /** Title shown at the top of the popover. */
  title: string;
  /** Declarative actions + custom content registered by the plugin. */
  navPopover?: NavPopoverConfig;
  services?: NavPopoverServices;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  /**
   * Child nav links (for parent items / categories). Rendered as a list below the
   * actions / custom content. A child with its own `children` opens a secondary
   * cascading popover on hover; a leaf child navigates (or runs its onClick).
   */
  childItems?: NavPopoverChildItem[];
  /** Current app id — the matching child row is highlighted as active. */
  appId?: string;
  /**
   * Whether to show the popover title. Hidden in the expanded nav (the nav row
   * already shows the label, so repeating it is redundant); shown in the
   * collapsed rail where the label is otherwise unavailable.
   */
  showTitle?: boolean;
}

/** Whether this item or any nested descendant matches the current app id. */
function itemMatchesApp(item: NavPopoverChildItem, appId?: string): boolean {
  if (!appId) return false;
  if (item.id === appId) return true;
  return (item.children ?? []).some((child) => itemMatchesApp(child, appId));
}

/**
 * A single row inside the popover. Leaf rows navigate on click; rows with nested
 * `children` open a secondary popover to the right on hover (cascading menu).
 */
function ChildRow({
  item,
  navigateToApp,
  appId,
}: {
  item: NavPopoverChildItem;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  appId?: string;
}) {
  const hasChildren = !!item.children && item.children.length > 0;
  // Leaf rows are active when they ARE the current app; parent rows (with a
  // cascading sub-popover) are active when any descendant is the current app, so
  // the trail to the active page stays highlighted (e.g. Alerting → Destinations
  // keeps "Alerting" highlighted while its sub-popover is open).
  const active = hasChildren ? itemMatchesApp(item, appId) : !!appId && item.id === appId;

  const row = (
    <button
      type="button"
      className="obsNavPopover-item"
      data-active={active ? 'true' : undefined}
      onClick={() => {
        if (hasChildren) return; // parent rows only open the secondary popover
        if (item.onClick) item.onClick();
        else navigateToApp(item.id);
      }}
      data-test-subj={`obsNavPopoverItem-${item.id}`}
    >
      <span className="obsNavPopover-itemRow">
        {item.iconType && (
          <EuiIcon type={item.iconType} size="m" className="obsNavPopover-itemIcon" />
        )}
        <span className="obsNavPopover-itemLabel">{item.title}</span>
      </span>
    </button>
  );

  if (!hasChildren) return row;

  // Secondary (cascading) popover: no repeated title header (the parent row the
  // user is hovering already names it) and flush styling so it reads as one
  // connected surface with the primary popover rather than a detached card.
  return (
    <SimplePopover
      button={row}
      anchorPosition="rightUp"
      panelPaddingSize="none"
      panelClassName="obsNavPopover-panel obsNavPopover-panel--secondary"
      display="block"
      fullWidthAnchor
    >
      <div className="obsNavPopover" data-test-subj={`obsNavPopover-sub-${item.id}`}>
        <div className="obsNavPopover-content">
          {item.children!.map((child) => (
            <ChildRow key={child.id} item={child} navigateToApp={navigateToApp} appId={appId} />
          ))}
        </div>
      </div>
    </SimplePopover>
  );
}

/**
 * The hover popover for a nav item. Renders, in order:
 *  - a title,
 *  - declarative action buttons (`navPopover.actions`),
 *  - custom content (`navPopover.render`),
 *  - a child-link list (`childItems`, used by parent nav items / categories),
 *    where a child with nested children opens a secondary cascading popover.
 * Any of these are optional. An action's `onClick` is generic — the plugin may
 * navigate, open a modal/flyout, etc.
 */
export function NavItemPopover({
  title,
  navPopover,
  services,
  navigateToApp,
  childItems,
  appId,
  showTitle = true,
}: NavItemPopoverProps) {
  const actions = navPopover?.actions ?? [];
  const hasActions = actions.length > 0;
  const customContent = navPopover?.render && services ? navPopover.render(services) : null;
  const hasChildren = !!childItems && childItems.length > 0;

  return (
    <div className="obsNavPopover" data-test-subj="obsNavPopover">
      {showTitle && <EuiPopoverTitle paddingSize="s">{title}</EuiPopoverTitle>}
      <div className="obsNavPopover-content">
        {hasActions && (
          <div className="obsNavPopover-section">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="obsNavPopover-item"
                onClick={() => services && action.onClick(services)}
                data-test-subj={`obsNavPopoverAction-${action.id}`}
              >
                <span className="obsNavPopover-itemRow">
                  {action.iconType && (
                    <EuiIcon type={action.iconType} size="m" className="obsNavPopover-itemIcon" />
                  )}
                  <span className="obsNavPopover-itemLabel">{action.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {customContent}

        {hasChildren && (
          <div className="obsNavPopover-section" data-test-subj="obsNavPopover-children">
            {childItems!.map((item) => (
              <ChildRow key={item.id} item={item} navigateToApp={navigateToApp} appId={appId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

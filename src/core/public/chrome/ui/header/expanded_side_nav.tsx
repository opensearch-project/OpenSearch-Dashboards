/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText } from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink, NavPopoverServices } from '../../nav_group';
import {
  getOrderedLinksOrCategories,
  setIsCategoryOpen,
  LinkItem,
  LinkItemType,
} from '../../utils';
import { SimplePopover } from './simple_popover';
import { NavItemPopover, NavPopoverChildItem } from './nav_item_popover';

type MergedNavLink = ChromeNavLink & ChromeRegistrationNavLink;

/**
 * Sentence-case a label for display (e.g. "Agent Monitoring" -> "Agent
 * monitoring"): capitalize the first word and lowercase the rest, but PRESERVE
 * all-caps acronym tokens (e.g. "APM", "PPL", "ML") so they aren't mangled into
 * "Apm"/"Ppl". The registered Title Case source string is left untouched; this
 * only affects display.
 */
export function toSentenceCase(label: string): string {
  const isAcronym = (word: string) =>
    word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
  return label
    .split(' ')
    .map((word, index) => {
      if (isAcronym(word)) return word;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

export interface ExpandedSideNavProps {
  navLinks: MergedNavLink[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
  /** Storage for persisting collapsible-category open/closed state. */
  storage?: Storage;
}

function isItemActive(item: LinkItem, appId?: string): boolean {
  if (!appId) return false;
  if (item.itemType === LinkItemType.LINK) {
    return item.link.id === appId;
  }
  if (item.itemType === LinkItemType.PARENT_LINK) {
    if (item.link?.id === appId) return true;
    return item.links.some((child) => isItemActive(child, appId));
  }
  if (item.itemType === LinkItemType.CATEGORY) {
    return (item.links || []).some((child) => isItemActive(child, appId));
  }
  return false;
}

function NavLeafItem({
  link,
  appId,
  navigateToApp,
  basePath,
  popoverServices,
}: {
  link: MergedNavLink;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
}) {
  const active = link.id === appId;
  const icon = link.euiIconType;
  const href = basePath.prepend(`/app/${link.id}`);
  const rowClassName = icon ? 'obs-nav-item-row' : 'obs-nav-item-row obs-nav-item-row--no-icon';

  const anchor = (
    <a
      className="obs-nav-item"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateToApp(link.id);
      }}
      data-active={active ? 'true' : undefined}
      data-test-subj={`obsNavItem-${link.id}`}
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} className={rowClassName}>
        {icon && (
          <EuiFlexItem grow={false} className="obs-nav-icon">
            <EuiIcon type={icon} size="m" color="text" />
          </EuiFlexItem>
        )}
        <EuiFlexItem className="obs-nav-label">
          <EuiText size="s">{link.title}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </a>
  );

  // Leaf with registered actions/content: the popover opens on hover, flush
  // against the nav's right edge (seamless, same grey). Direct click navigates.
  if (link.navPopover && popoverServices) {
    return (
      <SimplePopover
        button={anchor}
        anchorPosition="rightUp"
        panelPaddingSize="none"
        panelClassName="obsNavPopover-panel"
        display="block"
        fullWidthAnchor
      >
        <NavItemPopover
          title={link.title}
          navPopover={link.navPopover}
          services={popoverServices}
          navigateToApp={navigateToApp}
          showTitle={false}
        />
      </SimplePopover>
    );
  }

  return anchor;
}

/**
 * Flatten a parent link's children into a navigable list for the popover.
 */
function flattenChildItems(linkItem: LinkItem & { itemType: 'parentLink' }): NavPopoverChildItem[] {
  const items: NavPopoverChildItem[] = [];
  for (const child of linkItem.links) {
    if (child.itemType === LinkItemType.LINK) {
      items.push({ id: child.link.id, title: child.link.title, iconType: child.link.euiIconType });
    } else if (child.itemType === LinkItemType.PARENT_LINK) {
      if (child.link) {
        items.push({
          id: child.link.id,
          title: child.link.title,
          iconType: child.link.euiIconType,
        });
      }
      for (const grandchild of child.links) {
        if (grandchild.itemType === LinkItemType.LINK) {
          items.push({
            id: grandchild.link.id,
            title: grandchild.link.title,
            iconType: grandchild.link.euiIconType,
          });
        }
      }
    }
  }
  return items;
}

function CollapsibleNavItem({
  linkItem,
  appId,
  navigateToApp,
  popoverServices,
}: {
  linkItem: LinkItem & { itemType: 'parentLink' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  popoverServices?: NavPopoverServices;
}) {
  const active = isItemActive(linkItem, appId);
  const parentLink = linkItem.link;
  const icon = parentLink?.euiIconType || 'apps';
  const title = parentLink?.title || '';

  const childItems = flattenChildItems(linkItem);
  // Direct click on a parent navigates to its first child.
  const firstChildId = childItems[0]?.id;

  const row = (
    <button
      className="obs-nav-item"
      onClick={() => firstChildId && navigateToApp(firstChildId)}
      data-active={active ? 'true' : undefined}
      data-test-subj={`obsNavItem-${parentLink?.id || 'parent'}`}
      type="button"
    >
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        responsive={false}
        className="obs-nav-item-row"
      >
        <EuiFlexItem grow={false} className="obs-nav-icon">
          <EuiIcon type={icon} size="m" color="text" />
        </EuiFlexItem>
        <EuiFlexItem className="obs-nav-label">
          <EuiText size="s">{title}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </button>
  );

  return (
    <SimplePopover
      button={row}
      anchorPosition="rightUp"
      panelPaddingSize="none"
      panelClassName="obsNavPopover-panel"
      display="block"
      fullWidthAnchor
    >
      <NavItemPopover
        title={title}
        navPopover={parentLink?.navPopover}
        services={popoverServices}
        navigateToApp={navigateToApp}
        childItems={childItems}
        appId={appId}
        showTitle={false}
      />
    </SimplePopover>
  );
}

function RenderLinkItem({
  item,
  appId,
  navigateToApp,
  basePath,
  popoverServices,
}: {
  item: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
}) {
  if (item.itemType === LinkItemType.PARENT_LINK) {
    return (
      <CollapsibleNavItem
        linkItem={item}
        appId={appId}
        navigateToApp={navigateToApp}
        popoverServices={popoverServices}
      />
    );
  }
  if (item.itemType === LinkItemType.LINK) {
    return (
      <NavLeafItem
        link={item.link}
        appId={appId}
        navigateToApp={navigateToApp}
        basePath={basePath}
        popoverServices={popoverServices}
      />
    );
  }
  return null;
}

function CollapsibleSection({
  label,
  icon,
  defaultCollapsed,
  categoryId,
  storage,
  alwaysUseDefaultOpen,
  children,
}: {
  label?: string;
  icon?: string;
  defaultCollapsed?: boolean;
  categoryId?: string;
  storage: Storage;
  /**
   * When true, always start from `defaultCollapsed` on each page load and don't
   * restore persisted state (the toggle still works within the session, it just
   * isn't remembered across loads).
   */
  alwaysUseDefaultOpen?: boolean;
  children: React.ReactNode;
}) {
  // Persist open/closed state per category in localStorage (key core.navGroup.<id>).
  // On first render (nothing stored) fall back to the category's defaultOpen.
  // Sections flagged alwaysUseDefaultOpen skip the stored value entirely.
  const [collapsed, setCollapsed] = useState(() => {
    if (categoryId && !alwaysUseDefaultOpen) {
      const stored = storage.getItem(`core.navGroup.${categoryId}`);
      if (stored !== null) return stored !== 'true';
    }
    return defaultCollapsed ?? false;
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    // Don't persist when the section always reverts to its default on load.
    if (categoryId && !alwaysUseDefaultOpen) setIsCategoryOpen(categoryId, !next, storage);
  };

  return (
    <div className="obs-nav-collapsible-section">
      <button
        className="obs-nav-category-toggle"
        onClick={toggle}
        type="button"
        data-test-subj={`obsNavSection-${label}`}
      >
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          {icon && (
            <EuiFlexItem grow={false} className="obs-nav-icon">
              <EuiIcon type={icon} size="m" color="text" />
            </EuiFlexItem>
          )}
          <EuiFlexItem className="obs-nav-label">
            <EuiText size="xs" className="obs-nav-category-label-text">
              {label ? toSentenceCase(label) : label}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false} className="obs-nav-label">
            <EuiIcon
              type="arrowDown"
              size="s"
              color="subdued"
              className="obs-nav-chevron"
              data-collapsed={collapsed ? 'true' : 'false'}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </button>
      <div className="obs-nav-collapsible-wrapper" data-collapsed={collapsed ? 'true' : 'false'}>
        <div className="obs-nav-collapsible-inner">{children}</div>
      </div>
    </div>
  );
}

function RenderSection({
  item,
  appId,
  navigateToApp,
  basePath,
  popoverServices,
  storage,
}: {
  item: LinkItem & { itemType: 'category' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
  storage: Storage;
}) {
  const category = item.category;
  const links = item.links || [];

  const renderedItems = links.map((child, idx) => (
    <RenderLinkItem
      key={
        child.itemType === LinkItemType.LINK
          ? child.link.id
          : child.itemType === LinkItemType.PARENT_LINK
          ? child.link?.id || `parent-${idx}`
          : `item-${idx}`
      }
      item={child}
      appId={appId}
      navigateToApp={navigateToApp}
      basePath={basePath}
      popoverServices={popoverServices}
    />
  ));

  if (category?.collapsible && category.label) {
    return (
      <CollapsibleSection
        label={category.label}
        icon={category.euiIconType as string | undefined}
        defaultCollapsed={category.defaultOpen === false}
        categoryId={category.id}
        storage={storage}
        alwaysUseDefaultOpen={category.alwaysUseDefaultOpen}
      >
        {renderedItems}
      </CollapsibleSection>
    );
  }

  if (category?.label) {
    return (
      <>
        <EuiText size="xs" className="obs-nav-category-label">
          {toSentenceCase(category.label)}
        </EuiText>
        {renderedItems}
      </>
    );
  }

  return <>{renderedItems}</>;
}

function RenderTopLevelItem({
  item,
  appId,
  navigateToApp,
  basePath,
  popoverServices,
  storage,
}: {
  item: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
  storage: Storage;
}) {
  if (item.itemType === LinkItemType.CATEGORY) {
    return (
      <RenderSection
        item={item}
        appId={appId}
        navigateToApp={navigateToApp}
        basePath={basePath}
        popoverServices={popoverServices}
        storage={storage}
      />
    );
  }
  return (
    <RenderLinkItem
      item={item}
      appId={appId}
      navigateToApp={navigateToApp}
      basePath={basePath}
      popoverServices={popoverServices}
    />
  );
}

function getItemKey(item: LinkItem, idx: number): string {
  if (item.itemType === LinkItemType.LINK) return item.link.id;
  if (item.itemType === LinkItemType.PARENT_LINK) return item.link?.id || `parent-${idx}`;
  if (item.itemType === LinkItemType.CATEGORY) return item.category?.id || `category-${idx}`;
  return `item-${idx}`;
}

function itemStartsCluster(item: LinkItem): boolean {
  if (item.itemType === LinkItemType.CATEGORY) return true;
  const link =
    item.itemType === LinkItemType.LINK
      ? item.link
      : item.itemType === LinkItemType.PARENT_LINK
      ? item.link
      : undefined;
  return Boolean((link as ChromeRegistrationNavLink | undefined)?.startCluster);
}

export function ExpandedSideNav({
  navLinks,
  appId,
  navigateToApp,
  basePath,
  popoverServices,
  storage = window.localStorage,
}: ExpandedSideNavProps) {
  const linkItems = getOrderedLinksOrCategories(navLinks);

  return (
    <div className="obs-expanded-nav" data-test-subj="obsExpandedNav">
      {linkItems.map((item, idx) => (
        <React.Fragment key={getItemKey(item, idx)}>
          {idx > 0 && itemStartsCluster(item) && (
            <div className="obs-nav-cluster-gap" aria-hidden="true" />
          )}
          <RenderTopLevelItem
            item={item}
            appId={appId}
            navigateToApp={navigateToApp}
            basePath={basePath}
            popoverServices={popoverServices}
            storage={storage}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

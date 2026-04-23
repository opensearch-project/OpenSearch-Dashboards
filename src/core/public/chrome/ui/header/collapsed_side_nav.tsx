/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopoverTitle,
  EuiToolTip,
} from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { AppCategory } from '../../../../types';
import { getOrderedLinksOrCategories, LinkItem, LinkItemType } from '../../utils';
import { SimplePopover } from './simple_popover';

export interface CollapsedSideNavProps {
  navLinks: Array<ChromeNavLink & ChromeRegistrationNavLink>;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}

/**
 * Determine whether a link (or any of its nested children) matches the current app ID.
 */
function isLinkActive(linkItem: LinkItem, appId?: string): boolean {
  if (!appId) return false;
  if (linkItem.itemType === LinkItemType.LINK) {
    return linkItem.link.id === appId;
  }
  if (linkItem.itemType === LinkItemType.PARENT_LINK) {
    if (linkItem.link?.id === appId) return true;
    return linkItem.links.some((child) => isLinkActive(child, appId));
  }
  if (linkItem.itemType === LinkItemType.CATEGORY) {
    return (linkItem.links || []).some((child) => isLinkActive(child, appId));
  }
  return false;
}

/**
 * Render a single leaf link as an icon button with a tooltip.
 */
function CollapsedLeafIcon({
  link,
  appId,
  navigateToApp,
  basePath,
}: {
  link: ChromeNavLink & ChromeRegistrationNavLink;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  const active = link.id === appId;
  const icon = link.euiIconType || 'apps';

  return (
    <EuiToolTip content={link.title} position="right">
      <EuiButtonIcon
        iconType={icon}
        aria-label={link.title}
        color={active ? 'primary' : 'text'}
        display={active ? 'base' : 'empty'}
        href={basePath.prepend(`/app/${link.id}`)}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          navigateToApp(link.id);
        }}
        className="obsCollapsedNavIcon"
        size="l"
        data-test-subj={`obsCollapsedIcon-${link.id}`}
      />
    </EuiToolTip>
  );
}

/**
 * Render a parent link (has children) as an icon button with a popover listing children.
 */
function CollapsedParentIcon({
  linkItem,
  appId,
  navigateToApp,
}: {
  linkItem: LinkItem & { itemType: 'parentLink' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
}) {
  const active = isLinkActive(linkItem, appId);
  const parentLink = linkItem.link;
  const icon = parentLink?.euiIconType || 'apps';
  const title = parentLink?.title || '';

  const button = (
    <div className="obsCollapsedNavIcon-wrapper">
      <EuiButtonIcon
        iconType={icon}
        aria-label={title}
        color={active ? 'primary' : 'text'}
        display={active ? 'base' : 'empty'}
        className="obsCollapsedNavIcon"
        size="l"
        data-test-subj={`obsCollapsedIcon-${parentLink?.id || 'parent'}`}
      />
      <EuiIcon type="arrowRight" size="s" className="obsCollapsedNav-popoverArrow" />
    </div>
  );

  // Flatten children into a list of navigable items
  const childItems: Array<{ id: string; title: string }> = [];
  for (const child of linkItem.links) {
    if (child.itemType === LinkItemType.LINK) {
      childItems.push({ id: child.link.id, title: child.link.title });
    } else if (child.itemType === LinkItemType.PARENT_LINK) {
      // Flatten nested parent links
      if (child.link) {
        childItems.push({ id: child.link.id, title: child.link.title });
      }
      for (const grandchild of child.links) {
        if (grandchild.itemType === LinkItemType.LINK) {
          childItems.push({ id: grandchild.link.id, title: grandchild.link.title });
        }
      }
    }
  }

  return (
    <SimplePopover button={button} anchorPosition="rightUp" panelPaddingSize="s">
      <EuiPopoverTitle paddingSize="s">{title}</EuiPopoverTitle>
      <EuiListGroup
        flush
        maxWidth={240}
        data-test-subj={`obsCollapsedPopover-${parentLink?.id || 'parent'}`}
      >
        {childItems.map((child) => (
          <EuiListGroupItem
            key={child.id}
            label={child.title}
            onClick={() => navigateToApp(child.id)}
            size="s"
            data-test-subj={`obsCollapsedPopoverItem-${child.id}`}
          />
        ))}
      </EuiListGroup>
    </SimplePopover>
  );
}

/**
 * Render a collapsible category with an icon as a single icon button with a popover
 * listing all flattened items + children.
 */
function CollapsedCategoryIcon({
  category,
  links,
  appId,
  navigateToApp,
}: {
  category: AppCategory;
  links: LinkItem[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
}) {
  const active = links.some((child) => isLinkActive(child, appId));

  const button = (
    <div className="obsCollapsedNavIcon-wrapper">
      <EuiButtonIcon
        iconType={category.euiIconType || 'spacesApp'}
        aria-label={category.label || ''}
        color={active ? 'primary' : 'text'}
        display={active ? 'base' : 'empty'}
        className="obsCollapsedNavIcon"
        size="l"
        data-test-subj={`obsCollapsedIcon-${category.label}`}
      />
      <EuiIcon type="arrowRight" size="s" className="obsCollapsedNav-popoverArrow" />
    </div>
  );

  // Flatten all items + their children into a single popover list
  const allItems: Array<{ id: string; title: string }> = [];
  for (const item of links) {
    if (item.itemType === LinkItemType.LINK) {
      allItems.push({ id: item.link.id, title: item.link.title });
    } else if (item.itemType === LinkItemType.PARENT_LINK) {
      // Flatten: include children rather than the parent itself
      for (const child of item.links) {
        if (child.itemType === LinkItemType.LINK) {
          allItems.push({ id: child.link.id, title: child.link.title });
        }
      }
    }
  }

  return (
    <SimplePopover button={button} anchorPosition="rightUp" panelPaddingSize="s">
      <EuiPopoverTitle paddingSize="s">{category.label}</EuiPopoverTitle>
      <EuiListGroup flush maxWidth={240} data-test-subj={`obsCollapsedPopover-${category.label}`}>
        {allItems.map((item) => (
          <EuiListGroupItem
            key={item.id}
            label={item.title}
            onClick={() => navigateToApp(item.id)}
            size="s"
            data-test-subj={`obsCollapsedPopoverItem-${item.id}`}
          />
        ))}
      </EuiListGroup>
    </SimplePopover>
  );
}

/**
 * Render a single top-level LinkItem in the collapsed strip.
 * Returns an array of EuiFlexItem elements (usually one, but a non-collapsible
 * category without an icon may produce multiple).
 */
function renderTopLevelItem({
  linkItem,
  appId,
  navigateToApp,
  basePath,
}: {
  linkItem: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}): React.ReactNode[] {
  // --- LINK ---
  if (linkItem.itemType === LinkItemType.LINK) {
    return [
      <EuiFlexItem key={linkItem.link.id} grow={false}>
        <CollapsedLeafIcon
          link={linkItem.link}
          appId={appId}
          navigateToApp={navigateToApp}
          basePath={basePath}
        />
      </EuiFlexItem>,
    ];
  }

  // --- PARENT_LINK ---
  if (linkItem.itemType === LinkItemType.PARENT_LINK) {
    return [
      <EuiFlexItem key={linkItem.link?.id || 'parent'} grow={false}>
        <CollapsedParentIcon linkItem={linkItem} appId={appId} navigateToApp={navigateToApp} />
      </EuiFlexItem>,
    ];
  }

  // --- CATEGORY ---
  if (linkItem.itemType === LinkItemType.CATEGORY) {
    const category = linkItem.category;
    const links = linkItem.links || [];

    // Collapsible category with icon: single icon with popover
    if (category?.collapsible && category.euiIconType) {
      return [
        <EuiFlexItem key={category.id} grow={false}>
          <CollapsedCategoryIcon
            category={category}
            links={links}
            appId={appId}
            navigateToApp={navigateToApp}
          />
        </EuiFlexItem>,
      ];
    }

    // Collapsible category without icon: hide entirely in collapsed view
    if (category?.collapsible) {
      return [];
    }

    // Non-collapsible category: each child link item gets its own icon in the strip
    return links.flatMap((child) =>
      renderTopLevelItem({ linkItem: child, appId, navigateToApp, basePath })
    );
  }

  return [];
}

/**
 * Decide whether a top-level item starts a new visual cluster, based on:
 *  - the first LINK child (or the item itself if it is a LINK) having
 *    `startCluster: true` on its registration, or
 *  - the item being a CATEGORY (categories are natural cluster boundaries).
 */
function shouldStartCluster(item: LinkItem): boolean {
  if (item.itemType === LinkItemType.CATEGORY) return true;
  const link =
    item.itemType === LinkItemType.LINK
      ? item.link
      : item.itemType === LinkItemType.PARENT_LINK
      ? item.link
      : undefined;
  return Boolean((link as ChromeRegistrationNavLink | undefined)?.startCluster);
}

export function CollapsedSideNav({
  navLinks,
  appId,
  navigateToApp,
  basePath,
}: CollapsedSideNavProps) {
  const linkItems = getOrderedLinksOrCategories(navLinks);

  // Filter out empty groups and track which groups produce visible output
  const groups: Array<{ key: string; nodes: React.ReactNode[]; startsCluster: boolean }> = [];
  for (let i = 0; i < linkItems.length; i++) {
    const item = linkItems[i];
    const nodes = renderTopLevelItem({ linkItem: item, appId, navigateToApp, basePath });
    if (nodes.length > 0) {
      const key =
        item.itemType === LinkItemType.CATEGORY
          ? item.category?.id || `category-${i}`
          : item.itemType === LinkItemType.PARENT_LINK
          ? item.link?.id || `parent-${i}`
          : item.itemType === LinkItemType.LINK
          ? item.link.id
          : `item-${i}`;
      groups.push({ key, nodes, startsCluster: shouldStartCluster(item) });
    }
  }

  return (
    <EuiFlexGroup
      direction="column"
      alignItems="center"
      gutterSize="xs"
      className="obsCollapsedNav"
      responsive={false}
      data-test-subj="obsCollapsedNav"
    >
      {groups.map((group, idx) => (
        <React.Fragment key={group.key}>
          {idx > 0 && group.startsCluster && (
            <EuiFlexItem grow={false} className="obsCollapsedNav-clusterGap" aria-hidden="true" />
          )}
          {group.nodes}
        </React.Fragment>
      ))}
    </EuiFlexGroup>
  );
}

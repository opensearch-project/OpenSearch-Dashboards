/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiPopoverTitle } from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink, NavPopoverServices } from '../../nav_group';
import { AppCategory } from '../../../../types';
import { getOrderedLinksOrCategories, LinkItem, LinkItemType } from '../../utils';
import { SimplePopover } from './simple_popover';
import { NavItemPopover, NavPopoverChildItem } from './nav_item_popover';

/**
 * Build the collapsed-popover title for an item, prefixing it with its category
 * in plain sentence format (e.g. "Agent monitoring traces", "Application
 * performance traces") so a bare "Traces" isn't ambiguous between categories.
 * The category label is Title Case for section headers, so lowercase all but
 * its first character here; no hyphen between category and title.
 */
function buildPopoverTitle(title: string, categoryLabel?: string): string {
  if (!categoryLabel) return title;
  // Sentence format: capitalize only the first letter of the whole phrase and
  // lowercase the rest (e.g. "Agent Monitoring" + "Traces" -> "Agent
  // monitoring traces"). Keeps the leading capital, drops the mid-phrase caps.
  const phrase = `${categoryLabel} ${title}`;
  return phrase.charAt(0) + phrase.slice(1).toLowerCase();
}

/**
 * Map a leaf link's registered navPopover actions into cascading child rows, so
 * a leaf that has its own popover (e.g. Notebooks: "Create notebook" / "View
 * all") still surfaces those actions when it appears inside a collapsed
 * category's popover. Returns undefined when there are no actions or no services
 * to run them with.
 */
function actionsAsChildren(
  link: ChromeNavLink & ChromeRegistrationNavLink,
  popoverServices?: NavPopoverServices
): NavPopoverChildItem[] | undefined {
  const actions = link.navPopover?.actions;
  if (!actions || actions.length === 0 || !popoverServices) return undefined;
  return actions.map((action) => ({
    id: `${link.id}-${action.id}`,
    title: action.label,
    iconType: action.iconType,
    onClick: () => action.onClick(popoverServices),
  }));
}

function buildChildItems(
  items: LinkItem[],
  popoverServices?: NavPopoverServices
): NavPopoverChildItem[] {
  const result: NavPopoverChildItem[] = [];
  for (const item of items) {
    if (item.itemType === LinkItemType.LINK) {
      result.push({
        id: item.link.id,
        title: item.link.title,
        iconType: item.link.euiIconType,
        // Surface a leaf's own popover actions as a nested cascade.
        children: actionsAsChildren(item.link, popoverServices),
      });
    } else if (item.itemType === LinkItemType.PARENT_LINK) {
      const children = buildChildItems(item.links, popoverServices);
      if (item.link) {
        result.push({
          id: item.link.id,
          title: item.link.title,
          iconType: item.link.euiIconType,
          children: children.length > 0 ? children : undefined,
        });
      } else {
        result.push(...children);
      }
    }
  }
  return result;
}

export interface CollapsedSideNavProps {
  navLinks: Array<ChromeNavLink & ChromeRegistrationNavLink>;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  popoverServices?: NavPopoverServices;
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
  categoryLabel,
  popoverServices,
}: {
  link: ChromeNavLink & ChromeRegistrationNavLink;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  categoryLabel?: string;
  popoverServices?: NavPopoverServices;
}) {
  const active = link.id === appId;
  const icon = link.euiIconType || 'apps';
  // Title shown in the collapsed popover, prefixed with the category in plain
  // sentence format (e.g. "Agent monitoring traces") so a bare "Traces" isn't
  // ambiguous between categories.
  const popoverTitle = buildPopoverTitle(link.title, categoryLabel);

  const iconButton = (
    <EuiButtonIcon
      iconType={icon}
      aria-label={link.title}
      color="text"
      display="empty"
      href={basePath.prepend(`/app/${link.id}`)}
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigateToApp(link.id);
      }}
      className="obsCollapsedNavIcon"
      size="m"
      data-test-subj={`obsCollapsedIcon-${link.id}`}
    />
  );

  // Every collapsed icon opens a popover on hover for a consistent feel. When the
  // link has no registered actions/content, the popover is just its title (acts
  // like a tooltip but with matching styling). The icon still navigates on click.
  return (
    <SimplePopover
      button={iconButton}
      anchorPosition="rightUp"
      panelPaddingSize="none"
      panelClassName="obsNavPopover-panel obsNavPopover-panel--rail"
      isActive={active}
    >
      {link.navPopover && popoverServices ? (
        <NavItemPopover
          title={popoverTitle}
          navPopover={link.navPopover}
          services={popoverServices}
          navigateToApp={navigateToApp}
        />
      ) : (
        <div className="obsNavPopover obsNavPopover--titleOnly" data-test-subj="obsNavPopover">
          <EuiPopoverTitle paddingSize="s">{popoverTitle}</EuiPopoverTitle>
        </div>
      )}
    </SimplePopover>
  );
}

/**
 * Render a parent link (has children) as an icon button with a popover listing children.
 */
function CollapsedParentIcon({
  linkItem,
  appId,
  navigateToApp,
  categoryLabel,
  popoverServices,
}: {
  linkItem: LinkItem & { itemType: 'parentLink' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  categoryLabel?: string;
  popoverServices?: NavPopoverServices;
}) {
  const active = isLinkActive(linkItem, appId);
  const parentLink = linkItem.link;
  const icon = parentLink?.euiIconType || 'apps';
  const title = parentLink?.title || '';
  const popoverTitle = buildPopoverTitle(title, categoryLabel);

  // Build a (nested) list of navigable items; nested parents cascade.
  const childItems = buildChildItems(linkItem.links, popoverServices);

  // Direct click on a parent navigates to its first child.
  const firstChildId = childItems[0]?.id;
  const button = (
    <div className="obsCollapsedNavIcon-wrapper">
      <EuiButtonIcon
        iconType={icon}
        aria-label={title}
        color="text"
        display="empty"
        onClick={() => firstChildId && navigateToApp(firstChildId)}
        className="obsCollapsedNavIcon"
        size="m"
        data-test-subj={`obsCollapsedIcon-${parentLink?.id || 'parent'}`}
      />
    </div>
  );

  return (
    <SimplePopover
      button={button}
      anchorPosition="rightUp"
      panelPaddingSize="none"
      panelClassName="obsNavPopover-panel obsNavPopover-panel--rail"
      isActive={active}
    >
      <NavItemPopover
        title={popoverTitle}
        navPopover={parentLink?.navPopover}
        services={popoverServices}
        navigateToApp={navigateToApp}
        childItems={childItems}
        appId={appId}
      />
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
  popoverServices,
}: {
  category: AppCategory;
  links: LinkItem[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  popoverServices?: NavPopoverServices;
}) {
  const active = links.some((child) => isLinkActive(child, appId));

  const button = (
    <div className="obsCollapsedNavIcon-wrapper">
      <EuiButtonIcon
        iconType={category.euiIconType || 'spacesApp'}
        aria-label={category.label || ''}
        color="text"
        display="empty"
        className="obsCollapsedNavIcon"
        size="m"
        data-test-subj={`obsCollapsedIcon-${category.label}`}
      />
    </div>
  );

  // Preserve sub-section grouping: parent-links cascade into secondary popovers.
  const childItems = buildChildItems(links, popoverServices);

  return (
    <SimplePopover
      button={button}
      anchorPosition="rightUp"
      panelPaddingSize="none"
      panelClassName="obsNavPopover-panel obsNavPopover-panel--rail"
      isActive={active}
    >
      <NavItemPopover
        title={category.label || ''}
        services={popoverServices}
        navigateToApp={navigateToApp}
        childItems={childItems}
        appId={appId}
      />
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
  categoryLabel,
  popoverServices,
}: {
  linkItem: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
  categoryLabel?: string;
  popoverServices?: NavPopoverServices;
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
          categoryLabel={categoryLabel}
          popoverServices={popoverServices}
        />
      </EuiFlexItem>,
    ];
  }

  // --- PARENT_LINK ---
  if (linkItem.itemType === LinkItemType.PARENT_LINK) {
    return [
      <EuiFlexItem key={linkItem.link?.id || 'parent'} grow={false}>
        <CollapsedParentIcon
          linkItem={linkItem}
          appId={appId}
          navigateToApp={navigateToApp}
          categoryLabel={categoryLabel}
          popoverServices={popoverServices}
        />
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
            popoverServices={popoverServices}
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
      renderTopLevelItem({
        linkItem: child,
        appId,
        navigateToApp,
        basePath,
        categoryLabel: category?.label,
        popoverServices,
      })
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
  popoverServices,
}: CollapsedSideNavProps) {
  const linkItems = getOrderedLinksOrCategories(navLinks);

  // Filter out empty groups and track which groups produce visible output
  const groups: Array<{ key: string; nodes: React.ReactNode[]; startsCluster: boolean }> = [];
  for (let i = 0; i < linkItems.length; i++) {
    const item = linkItems[i];
    const nodes = renderTopLevelItem({
      linkItem: item,
      appId,
      navigateToApp,
      basePath,
      popoverServices,
    });
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

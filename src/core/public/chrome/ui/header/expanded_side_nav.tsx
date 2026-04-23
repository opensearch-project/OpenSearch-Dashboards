/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText } from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../nav_links';
import { ChromeRegistrationNavLink } from '../../nav_group';
import { AppCategory } from '../../../../types';
import { getOrderedLinksOrCategories, LinkItem, LinkItemType } from '../../utils';

type MergedNavLink = ChromeNavLink & ChromeRegistrationNavLink;

export interface ExpandedSideNavProps {
  navLinks: MergedNavLink[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
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
}: {
  link: MergedNavLink;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  const active = link.id === appId;
  const icon = link.euiIconType;
  const href = basePath.prepend(`/app/${link.id}`);
  const rowClassName = icon ? 'obs-nav-item-row' : 'obs-nav-item-row obs-nav-item-row--no-icon';

  return (
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
        <EuiFlexItem>
          <EuiText size="s">{link.title}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </a>
  );
}

function CollapsibleNavItem({
  linkItem,
  appId,
  navigateToApp,
  basePath,
}: {
  linkItem: LinkItem & { itemType: 'parentLink' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  const [collapsed, setCollapsed] = useState(true);
  const active = isItemActive(linkItem, appId);
  const parentLink = linkItem.link;
  const icon = parentLink?.euiIconType || 'apps';
  const title = parentLink?.title || '';

  return (
    <div className="obs-nav-item-group" data-active={active ? 'true' : undefined}>
      <button
        className="obs-nav-item obs-nav-item-toggle"
        onClick={() => setCollapsed(!collapsed)}
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
          <EuiFlexItem>
            <EuiText size="s">{title}</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
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
        <div className="obs-nav-collapsible-inner">
          <div className="obs-nav-children">
            {linkItem.links.map((child) => {
              if (child.itemType === LinkItemType.LINK) {
                return (
                  <a
                    key={child.link.id}
                    className="obs-nav-item obs-nav-child-item"
                    href={basePath.prepend(`/app/${child.link.id}`)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToApp(child.link.id);
                    }}
                    data-active={child.link.id === appId ? 'true' : undefined}
                    data-test-subj={`obsNavItem-${child.link.id}`}
                  >
                    <EuiText size="xs" className="obs-nav-child-label">
                      {child.link.title}
                    </EuiText>
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderLinkItem({
  item,
  appId,
  navigateToApp,
  basePath,
}: {
  item: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  if (item.itemType === LinkItemType.PARENT_LINK) {
    return (
      <CollapsibleNavItem
        linkItem={item}
        appId={appId}
        navigateToApp={navigateToApp}
        basePath={basePath}
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
      />
    );
  }
  return null;
}

function CollapsibleSection({
  label,
  icon,
  defaultCollapsed,
  children,
}: {
  label?: string;
  icon?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);

  return (
    <div className="obs-nav-collapsible-section">
      <button
        className="obs-nav-category-toggle"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
        data-test-subj={`obsNavSection-${label}`}
      >
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          {icon && (
            <EuiFlexItem grow={false} className="obs-nav-icon">
              <EuiIcon type={icon} size="m" color="text" />
            </EuiFlexItem>
          )}
          <EuiFlexItem>
            <EuiText size="xs" className="obs-nav-category-label-text">
              {label}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
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
}: {
  item: LinkItem & { itemType: 'category' };
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
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
    />
  ));

  if (category?.collapsible && category.label) {
    return (
      <CollapsibleSection
        label={category.label}
        icon={category.euiIconType as string | undefined}
        defaultCollapsed={category.defaultOpen === false}
      >
        {renderedItems}
      </CollapsibleSection>
    );
  }

  if (category?.label) {
    return (
      <>
        <EuiText size="xs" className="obs-nav-category-label">
          {category.label}
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
}: {
  item: LinkItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  if (item.itemType === LinkItemType.CATEGORY) {
    return (
      <RenderSection item={item} appId={appId} navigateToApp={navigateToApp} basePath={basePath} />
    );
  }
  return (
    <RenderLinkItem item={item} appId={appId} navigateToApp={navigateToApp} basePath={basePath} />
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
          />
        </React.Fragment>
      ))}
    </div>
  );
}

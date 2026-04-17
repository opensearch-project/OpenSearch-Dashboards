/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiText } from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ObsNavItem, ObsNavSection, isNavItemActive } from './observability_nav_config';

export interface ObservabilityExpandedNavProps {
  sections: ObsNavSection[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}

// ── Collapsible nav item (items with children + collapsible flag) ──

function CollapsibleNavItem({
  item,
  appId,
  navigateToApp,
  basePath,
}: {
  item: ObsNavItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  const [collapsed, setCollapsed] = useState(item.defaultCollapsed ?? false);
  const active = isNavItemActive(item, appId);

  return (
    <div className="obs-nav-item-group" data-active={active ? 'true' : undefined}>
      <button
        className="obs-nav-item obs-nav-item-toggle"
        onClick={() => setCollapsed(!collapsed)}
        data-active={active ? 'true' : undefined}
        data-test-subj={`obsNavItem-${item.id}`}
        type="button"
      >
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          responsive={false}
          className="obs-nav-item-row"
        >
          {item.icon && (
            <EuiFlexItem grow={false} className="obs-nav-icon">
              <EuiIcon type={item.icon} size="m" color="text" />
            </EuiFlexItem>
          )}
          <EuiFlexItem>
            <EuiText size="s">{item.title}</EuiText>
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
          {item.children && (
            <div className="obs-nav-children">
              {item.children.map((child) => (
                <a
                  key={child.id}
                  className="obs-nav-item obs-nav-child-item"
                  href={basePath.prepend(`/app/${child.id}`)}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToApp(child.id);
                  }}
                  data-active={child.id === appId ? 'true' : undefined}
                  data-test-subj={`obsNavItem-${child.id}`}
                >
                  <EuiText size="xs" className="obs-nav-child-label">
                    {child.title}
                  </EuiText>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Standard nav item (leaf or non-collapsible with inline children) ──

function NavItem({
  item,
  appId,
  navigateToApp,
  basePath,
}: {
  item: ObsNavItem;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}) {
  // Collapsible items with children get their own component
  if (item.children && item.children.length > 0 && item.collapsible) {
    return (
      <CollapsibleNavItem
        item={item}
        appId={appId}
        navigateToApp={navigateToApp}
        basePath={basePath}
      />
    );
  }

  const active = isNavItemActive(item, appId);
  const href = basePath.prepend(`/app/${item.id}`);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateToApp(item.id);
  };

  // Non-collapsible items with children: render parent + inline children always visible
  if (item.children && item.children.length > 0) {
    return (
      <div className="obs-nav-item-group" data-active={active ? 'true' : undefined}>
        <a
          className="obs-nav-item obs-nav-item-parent"
          href={href}
          onClick={handleClick}
          data-active={active ? 'true' : undefined}
          data-test-subj={`obsNavItem-${item.id}`}
        >
          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            responsive={false}
            className="obs-nav-item-row"
          >
            {item.icon && (
              <EuiFlexItem grow={false} className="obs-nav-icon">
                <EuiIcon type={item.icon} size="m" color="text" />
              </EuiFlexItem>
            )}
            <EuiFlexItem>
              <EuiText size="s">{item.title}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </a>
        <div className="obs-nav-children">
          {item.children.map((child) => (
            <a
              key={child.id}
              className="obs-nav-item obs-nav-child-item"
              href={basePath.prepend(`/app/${child.id}`)}
              onClick={(e) => {
                e.preventDefault();
                navigateToApp(child.id);
              }}
              data-active={child.id === appId ? 'true' : undefined}
              data-test-subj={`obsNavItem-${child.id}`}
            >
              <EuiText size="xs" className="obs-nav-child-label">
                {child.title}
              </EuiText>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Simple leaf item — use custom onClick if provided (e.g. dev tools modal)
  const rowClassName = item.icon
    ? 'obs-nav-item-row'
    : 'obs-nav-item-row obs-nav-item-row--no-icon';
  const itemContent = (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} className={rowClassName}>
      {item.icon && (
        <EuiFlexItem grow={false} className="obs-nav-icon">
          <EuiIcon type={item.icon} size="m" color="text" />
        </EuiFlexItem>
      )}
      <EuiFlexItem>
        <EuiText size="s">{item.title}</EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  if (item.onClick) {
    return (
      <button
        className="obs-nav-item obs-nav-item-button"
        onClick={item.onClick}
        data-active={active ? 'true' : undefined}
        data-test-subj={`obsNavItem-${item.id}`}
        type="button"
      >
        {itemContent}
      </button>
    );
  }

  return (
    <a
      className="obs-nav-item"
      href={href}
      onClick={handleClick}
      data-active={active ? 'true' : undefined}
      data-test-subj={`obsNavItem-${item.id}`}
    >
      {itemContent}
    </a>
  );
}

// ── Collapsible section (section-level accordion) ──

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

// ── Main expanded nav component ──

export function ObservabilityExpandedNav({
  sections,
  appId,
  navigateToApp,
  basePath,
}: ObservabilityExpandedNavProps) {
  return (
    <div className="obs-expanded-nav" data-test-subj="obsExpandedNav">
      {sections.map((section, sectionIdx) => {
        const sectionContent = (() => {
          // Collapsible category (Tools, Manage Workspace)
          if (section.type === 'category' && section.collapsible) {
            return (
              <CollapsibleSection
                label={section.label}
                icon={section.icon}
                defaultCollapsed={section.defaultCollapsed}
              >
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    appId={appId}
                    navigateToApp={navigateToApp}
                    basePath={basePath}
                  />
                ))}
              </CollapsibleSection>
            );
          }

          // Non-collapsible category with label header (Application Performance)
          if (section.type === 'category' && section.label) {
            return (
              <>
                <EuiText size="xs" className="obs-nav-category-label">
                  {section.label}
                </EuiText>
                {section.items.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    appId={appId}
                    navigateToApp={navigateToApp}
                    basePath={basePath}
                  />
                ))}
              </>
            );
          }

          // Flat items section (no category header)
          return (
            <>
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  appId={appId}
                  navigateToApp={navigateToApp}
                  basePath={basePath}
                />
              ))}
            </>
          );
        })();

        return (
          <React.Fragment key={section.label || `section-${sectionIdx}`}>
            {sectionContent}
          </React.Fragment>
        );
      })}
    </div>
  );
}

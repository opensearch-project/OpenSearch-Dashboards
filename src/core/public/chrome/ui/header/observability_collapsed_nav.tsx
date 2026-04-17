/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopoverTitle,
  EuiToolTip,
} from '@elastic/eui';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { ObsNavItem, ObsNavSection, isNavItemActive } from './observability_nav_config';
import { SimplePopover } from './simple_popover';

export interface ObservabilityCollapsedNavProps {
  sections: ObsNavSection[];
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  basePath: HttpStart['basePath'];
}

function CollapsedIconItem({
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
  const active = isNavItemActive(item, appId);

  // Items with children: popover with title header (no tooltip — popover replaces it)
  if (item.children && item.children.length > 0) {
    const button = (
      <div className="obsCollapsedNavIcon-wrapper">
        <EuiButtonIcon
          iconType={item.icon || 'apps'}
          aria-label={item.title}
          color={active ? 'primary' : 'text'}
          display={active ? 'base' : 'empty'}
          className="obsCollapsedNavIcon"
          size="m"
          data-test-subj={`obsCollapsedIcon-${item.id}`}
        />
        <EuiIcon type="arrowRight" size="s" className="obsCollapsedNav-popoverArrow" />
      </div>
    );

    return (
      <SimplePopover button={button} anchorPosition="rightUp" panelPaddingSize="s">
        <EuiPopoverTitle paddingSize="s">{item.title}</EuiPopoverTitle>
        <EuiListGroup flush maxWidth={240} data-test-subj={`obsCollapsedPopover-${item.id}`}>
          {item.children.map((child) => (
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

  // Simple leaf item — use custom onClick if provided (e.g. dev tools modal)
  if (item.onClick) {
    return (
      <EuiToolTip content={item.title} position="right">
        <EuiButtonIcon
          iconType={item.icon || 'apps'}
          aria-label={item.title}
          color={active ? 'primary' : 'text'}
          display={active ? 'base' : 'empty'}
          onClick={item.onClick}
          className="obsCollapsedNavIcon"
          size="m"
          data-test-subj={`obsCollapsedIcon-${item.id}`}
        />
      </EuiToolTip>
    );
  }

  return (
    <EuiToolTip content={item.title} position="right">
      <EuiButtonIcon
        iconType={item.icon || 'apps'}
        aria-label={item.title}
        color={active ? 'primary' : 'text'}
        display={active ? 'base' : 'empty'}
        href={basePath.prepend(`/app/${item.id}`)}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          navigateToApp(item.id);
        }}
        className="obsCollapsedNavIcon"
        size="m"
        data-test-subj={`obsCollapsedIcon-${item.id}`}
      />
    </EuiToolTip>
  );
}

function CollapsedCategoryItem({
  section,
  appId,
  navigateToApp,
}: {
  section: ObsNavSection;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
}) {
  const active = section.items.some((item) => isNavItemActive(item, appId));

  const button = (
    <div className="obsCollapsedNavIcon-wrapper">
      <EuiButtonIcon
        iconType={section.icon || 'spacesApp'}
        aria-label={section.label || ''}
        color={active ? 'primary' : 'text'}
        display={active ? 'base' : 'empty'}
        className="obsCollapsedNavIcon"
        size="m"
        data-test-subj={`obsCollapsedIcon-${section.label}`}
      />
      <EuiIcon type="arrowRight" size="s" className="obsCollapsedNav-popoverArrow" />
    </div>
  );

  // Flatten all items + their children into a single popover list
  const allItems: Array<{ id: string; title: string }> = [];
  for (const item of section.items) {
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        allItems.push(child);
      }
    } else {
      allItems.push(item);
    }
  }

  return (
    <SimplePopover button={button} anchorPosition="rightUp" panelPaddingSize="s">
      <EuiPopoverTitle paddingSize="s">{section.label}</EuiPopoverTitle>
      <EuiListGroup flush maxWidth={240} data-test-subj={`obsCollapsedPopover-${section.label}`}>
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

export function ObservabilityCollapsedNav({
  sections,
  appId,
  navigateToApp,
  basePath,
}: ObservabilityCollapsedNavProps) {
  return (
    <EuiFlexGroup
      direction="column"
      alignItems="center"
      gutterSize="s"
      className="obsCollapsedNav"
      responsive={false}
      data-test-subj="obsCollapsedNav"
    >
      {sections.map((section, sectionIdx) => {
        // Category sections with an icon get a single collapsed icon with popover
        const isCategoryWithIcon = section.type === 'category' && !!section.icon;

        // Hide collapsible categories in collapsed view (Tools, Manage Workspace)
        if (section.type === 'category' && section.collapsible) {
          return null;
        }

        return (
          <React.Fragment key={section.label || `section-${sectionIdx}`}>
            {sectionIdx > 0 && (
              <EuiFlexItem grow={false}>
                <EuiHorizontalRule margin="xs" className="obsCollapsedNav-divider" />
              </EuiFlexItem>
            )}
            {isCategoryWithIcon ? (
              <EuiFlexItem grow={false}>
                <CollapsedCategoryItem
                  section={section}
                  appId={appId}
                  navigateToApp={navigateToApp}
                />
              </EuiFlexItem>
            ) : (
              section.items.map((item) => (
                <EuiFlexItem key={item.id} grow={false}>
                  <CollapsedIconItem
                    item={item}
                    appId={appId}
                    navigateToApp={navigateToApp}
                    basePath={basePath}
                  />
                </EuiFlexItem>
              ))
            )}
          </React.Fragment>
        );
      })}
    </EuiFlexGroup>
  );
}

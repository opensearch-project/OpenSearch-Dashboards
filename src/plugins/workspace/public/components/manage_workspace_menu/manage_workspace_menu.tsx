/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiPopoverTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import {
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  fulfillRegistrationLinksToChromeNavLinks,
  getSortedNavLinks,
} from '../../../../../core/public';

interface Props {
  coreStart: CoreStart;
}

/**
 * Footer entry-point for the "Manage workspace" apps (Workspace details,
 * Collaborators, Data sources, Index patterns, Datasets, Saved objects, Sample
 * data). These links are registered into the `manageWorkspace` category by the
 * workspace use-case service; they used to render as a collapsible section in
 * the nav body, but now live here in the footer. Clicking the button opens a
 * popover listing the links; clicking a link navigates to that app.
 *
 * Uses standard EUI popover + context-menu components (not the icon side nav's
 * bespoke popover styling), because the workspace plugin renders in every
 * workspace while the icon side nav is enabled only in the Observability
 * workspace — this component must not depend on icon-nav-only styles.
 *
 * Registered only in the expanded footer / classic nav (not the collapsed icon
 * rail), matching the workspace button it replaced. Workspace switching/creation
 * is intentionally NOT here — the always-present top-of-nav workspace selector
 * owns that.
 */
export const ManageWorkspaceMenu = ({ coreStart }: Props) => {
  const { chrome, application } = coreStart;

  // `getCurrentNavGroup$()` / `getNavLinks$()` return a NEW observable instance on
  // every call (they pipe internally), so they must be created once — calling
  // them inline in render would hand `useObservable` a fresh observable each
  // render, causing a re-subscribe → re-render loop ("Maximum update depth
  // exceeded") that tears down the whole footer subtree (including sibling icons).
  const currentNavGroup$ = useMemo(() => chrome.navGroup.getCurrentNavGroup$(), [chrome.navGroup]);
  const navLinks$ = useMemo(() => chrome.navLinks.getNavLinks$(), [chrome.navLinks]);

  const currentNavGroup = useObservable(currentNavGroup$, undefined);
  const navLinks = useObservable(navLinks$, []);
  const appId = useObservable(application.currentAppId$, undefined);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const label = i18n.translate('workspace.manageWorkspaceMenu.title', {
    defaultMessage: 'Manage workspace',
  });

  // The manage-workspace links for the current nav group, in registered order.
  const manageLinks = useMemo(() => {
    const fulfilled = fulfillRegistrationLinksToChromeNavLinks(
      currentNavGroup?.navLinks ?? [],
      navLinks
    ).filter((link) => link.category?.id === DEFAULT_APP_CATEGORIES.manageWorkspace.id);
    return getSortedNavLinks(fulfilled);
  }, [currentNavGroup, navLinks]);

  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const triggerButton = (
    <EuiToolTip content={label} position="right">
      <EuiButtonIcon
        iconType="spacesApp"
        color="text"
        aria-label={label}
        data-test-subj="manageWorkspaceMenuButton"
        onClick={() => setIsPopoverOpen((open) => !open)}
      />
    </EuiToolTip>
  );

  const menuItems = manageLinks.map((link) => (
    <EuiContextMenuItem
      key={link.id}
      icon={link.euiIconType}
      data-test-subj={`manageWorkspaceMenuItem-${link.id}`}
      // Bold the current app's row so the active page stands out.
      style={appId === link.id ? { fontWeight: 600 } : undefined}
      onClick={() => {
        closePopover();
        application.navigateToApp(link.id);
      }}
    >
      {link.title}
    </EuiContextMenuItem>
  ));

  return (
    <EuiPopover
      anchorPosition="upCenter"
      panelPaddingSize="none"
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      button={triggerButton}
    >
      <div data-test-subj="manageWorkspaceMenuPopover">
        <EuiPopoverTitle paddingSize="s">{label}</EuiPopoverTitle>
        <EuiContextMenuPanel items={menuItems} />
      </div>
    </EuiPopover>
  );
};

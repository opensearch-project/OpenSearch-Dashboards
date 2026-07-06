/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiHorizontalRule,
  EuiPopover,
  EuiPopoverTitle,
  EuiText,
  EuiToolTip,
  EuiTourStep,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import {
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  fulfillRegistrationLinksToChromeNavLinks,
  getSortedNavLinks,
} from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceSelector } from '../workspace_selector/workspace_selector';

interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

// One-time first-visit tour flag: teaches users that workspace management was
// re-grouped into this footer icon (the function of the footer button changed,
// and the icon is easy to miss). Persisted in localStorage so it shows once.
const MANAGE_WORKSPACE_TOUR_STORAGE_KEY = 'workspace.manageWorkspaceMoved.tourDismissed';

/**
 * Footer entry-point for workspace controls. Opens a popover that combines, top
 * to bottom:
 *  - the workspace switcher — the exact `WorkspaceSelector` used at the top of
 *    the nav header, so switching/creating workspaces behaves identically here;
 *  - the "Manage workspace" apps (Workspace details, Collaborators, Data
 *    sources, Index patterns, Datasets, Assets, Sample data), registered into
 *    the `manageWorkspace` category and filtered in here.
 *
 * This replaces both the old body-nav manage-workspace category AND the former
 * footer workspace switcher: switching lives in the embedded `WorkspaceSelector`,
 * so workspace navigation is reachable from the footer even when the user is
 * outside any workspace (where the top-of-nav selector is not mounted).
 *
 * Uses standard EUI popover + context-menu components (not the icon side nav's
 * bespoke popover styling), because the workspace plugin renders in every
 * workspace while the icon side nav is enabled only in the Observability
 * workspace — this component must not depend on icon-nav-only styles.
 */
export const ManageWorkspaceMenu = ({ coreStart, registeredUseCases$ }: Props) => {
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

  const [isTourDismissed, setIsTourDismissed] = useState(() =>
    Boolean(localStorage.getItem(MANAGE_WORKSPACE_TOUR_STORAGE_KEY))
  );
  const [isTourOpen, setIsTourOpen] = useState(false);
  useEffect(() => {
    if (!isTourDismissed) {
      setIsTourOpen(true);
    }
  }, [isTourDismissed]);

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

  const dismissTour = useCallback(() => {
    localStorage.setItem(MANAGE_WORKSPACE_TOUR_STORAGE_KEY, 'true');
    setIsTourDismissed(true);
    setIsTourOpen(false);
  }, []);

  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

  const openPopover = useCallback(() => {
    setIsPopoverOpen((open) => !open);
    // Finding the icon is the whole point of the tour — once opened, retire it.
    dismissTour();
  }, [dismissTour]);

  const triggerButton = (
    <EuiToolTip content={label} position="right">
      <EuiButtonIcon
        iconType="spacesApp"
        color="text"
        aria-label={label}
        data-test-subj="manageWorkspaceMenuButton"
        onClick={openPopover}
      />
    </EuiToolTip>
  );

  const manageMenuItems = manageLinks.map((link) => (
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
    <EuiTourStep
      content={
        <EuiText size="s">
          <p style={{ maxWidth: 260 }}>
            {i18n.translate('workspace.manageWorkspaceMenu.tour.content', {
              defaultMessage:
                'Workspace details, data sources, index patterns and more are now grouped here.',
            })}
          </p>
        </EuiText>
      }
      isStepOpen={isTourOpen && !isPopoverOpen}
      minWidth={260}
      onFinish={dismissTour}
      step={1}
      stepsTotal={1}
      anchorPosition="rightUp"
      subtitle={i18n.translate('workspace.manageWorkspaceMenu.tour.subtitle', {
        defaultMessage: "What's new",
      })}
      title={i18n.translate('workspace.manageWorkspaceMenu.tour.title', {
        defaultMessage: 'Workspace management moved',
      })}
      footerAction={
        <EuiButtonEmpty
          size="xs"
          color="text"
          flush="right"
          data-test-subj="manageWorkspaceTourDismiss"
          onClick={dismissTour}
        >
          {i18n.translate('workspace.manageWorkspaceMenu.tour.dismiss', {
            defaultMessage: 'Got it',
          })}
        </EuiButtonEmpty>
      }
    >
      <EuiPopover
        anchorPosition="upCenter"
        panelPaddingSize="none"
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        button={triggerButton}
      >
        <div data-test-subj="manageWorkspaceMenuPopover" style={{ width: 320 }}>
          <EuiPopoverTitle paddingSize="s">{label}</EuiPopoverTitle>
          {/* The exact workspace switcher used at the top of the nav header,
              rendered flush so it matches the manage-workspace menu rows. */}
          <div data-test-subj="manageWorkspaceMenuSelector">
            <WorkspaceSelector
              coreStart={coreStart}
              registeredUseCases$={registeredUseCases$}
              flush
            />
          </div>
          {manageMenuItems.length > 0 && (
            <>
              <EuiHorizontalRule margin="none" />
              <EuiContextMenuPanel items={manageMenuItems} />
            </>
          )}
        </div>
      </EuiPopover>
    </EuiTourStep>
  );
};

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiBreadcrumb, IconType } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { BehaviorSubject, combineLatest, merge, Observable, of, ReplaySubject } from 'rxjs';
import { flatMap, map, takeUntil } from 'rxjs/operators';
import { EuiLink } from '@elastic/eui';
import { mountReactNode } from '../utils';
import { InternalApplicationStart } from '../application';
import { DocLinksStart } from '../doc_links';
import { HttpStart } from '../http';
import { InjectedMetadataStart } from '../injected_metadata';
import { NotificationsStart } from '../notifications';
import { IUiSettingsClient } from '../ui_settings';
import { OPENSEARCH_DASHBOARDS_ASK_OPENSEARCH_LINK } from './constants';
import { ChromeDocTitle, DocTitleService } from './doc_title';
import { ChromeNavControls, NavControlsService } from './nav_controls';
import { ChromeNavLinks, NavLinksService, ChromeNavLink } from './nav_links';
import { ChromeRecentlyAccessed, RecentlyAccessedService } from './recently_accessed';
import { Header } from './ui';
import { ChromeHelpExtensionMenuLink } from './ui/header/header_help_menu';
import { Branding, WorkspacesStart } from '../';
import { getLogos } from '../../common';
import type { Logos } from '../../common/types';

export { ChromeNavControls, ChromeRecentlyAccessed, ChromeDocTitle };

const IS_LOCKED_KEY = 'core.chrome.isLocked';

/** @public */
export interface ChromeBadge {
  text: string;
  tooltip: string;
  iconType?: IconType;
}

/** @public */
export type ChromeBreadcrumb = EuiBreadcrumb;

/** @public */
export type ChromeBranding = Branding;

/** @public */
export interface ChromeHelpExtension {
  /**
   * Provide your plugin's name to create a header for separation
   */
  appName: string;
  /**
   * Creates unified links for sending users to documentation, GitHub, Discuss, or a custom link/button
   */
  links?: ChromeHelpExtensionMenuLink[];
  /**
   * Custom content to occur below the list of links
   */
  content?: (element: HTMLDivElement) => () => void;
}

interface ConstructorParams {
  browserSupportsCsp: boolean;
}

interface StartDeps {
  application: InternalApplicationStart;
  docLinks: DocLinksStart;
  http: HttpStart;
  injectedMetadata: InjectedMetadataStart;
  notifications: NotificationsStart;
  uiSettings: IUiSettingsClient;
  workspaces: WorkspacesStart;
}

type CollapsibleNavHeaderRender = (context: {
  basePath: HttpStart['basePath'];
  getUrlForApp: InternalApplicationStart['getUrlForApp'];
  navigateToUrl: InternalApplicationStart['navigateToUrl'];
  workspaces: WorkspacesStart;
}) => JSX.Element | null;

/** @internal */
export class ChromeService {
  private isVisible$!: Observable<boolean>;
  private isForceHidden$!: BehaviorSubject<boolean>;
  private readonly stop$ = new ReplaySubject(1);
  private readonly navControls = new NavControlsService();
  private readonly navLinks = new NavLinksService();
  private readonly recentlyAccessed = new RecentlyAccessedService();
  private readonly docTitle = new DocTitleService();
  private collapsibleNavHeaderRender?: CollapsibleNavHeaderRender;

  constructor(private readonly params: ConstructorParams) {}

  /**
   * These observables allow consumers to toggle the chrome visibility via either:
   *   1. Using setIsVisible() to trigger the next chromeHidden$
   *   2. Setting `chromeless` when registering an application, which will
   *      reset the visibility whenever the next application is mounted
   *   3. Having "embed" in the query string
   */
  private initVisibility(application: StartDeps['application']) {
    // Start off the chrome service hidden if "embed" is in the hash query string.
    const isEmbedded = new URL(location.hash.slice(1), location.origin).searchParams.has('embed');
    this.isForceHidden$ = new BehaviorSubject(isEmbedded);

    const appHidden$ = merge(
      // For the isVisible$ logic, having no mounted app is equivalent to having a hidden app
      // in the sense that the chrome UI should not be displayed until a non-chromeless app is mounting or mounted
      of(true),
      application.currentAppId$.pipe(
        flatMap((appId) =>
          application.applications$.pipe(
            map((applications) => {
              return !!appId && applications.has(appId) && !!applications.get(appId)!.chromeless;
            })
          )
        )
      )
    );
    this.isVisible$ = combineLatest([appHidden$, this.isForceHidden$]).pipe(
      map(([appHidden, forceHidden]) => !appHidden && !forceHidden),
      takeUntil(this.stop$)
    );
  }

  public setup() {
    return {
      registerCollapsibleNavHeader: (render: CollapsibleNavHeaderRender) => {
        this.collapsibleNavHeaderRender = render;
      },
    };
  }

  public async start({
    application,
    docLinks,
    http,
    injectedMetadata,
    notifications,
    uiSettings,
    workspaces,
  }: StartDeps): Promise<InternalChromeStart> {
    this.initVisibility(application);

    const appTitle$ = new BehaviorSubject<string>('Overview');
    const applicationClasses$ = new BehaviorSubject<Set<string>>(new Set());
    const helpExtension$ = new BehaviorSubject<ChromeHelpExtension | undefined>(undefined);
    const breadcrumbs$ = new BehaviorSubject<ChromeBreadcrumb[]>([]);
    const badge$ = new BehaviorSubject<ChromeBadge | undefined>(undefined);
    const customNavLink$ = new BehaviorSubject<ChromeNavLink | undefined>(undefined);
    const helpSupportUrl$ = new BehaviorSubject<string>(OPENSEARCH_DASHBOARDS_ASK_OPENSEARCH_LINK);
    const isNavDrawerLocked$ = new BehaviorSubject(localStorage.getItem(IS_LOCKED_KEY) === 'true');

    const navControls = this.navControls.start();
    const navLinks = this.navLinks.start({ application, http });
    const recentlyAccessed = await this.recentlyAccessed.start({ http });
    const docTitle = this.docTitle.start({ document: window.document });

    // erase chrome fields from a previous app while switching to a next app
    application.currentAppId$.subscribe(() => {
      helpExtension$.next(undefined);
      breadcrumbs$.next([]);
      badge$.next(undefined);
      docTitle.reset();
    });

    const setIsNavDrawerLocked = (isLocked: boolean) => {
      isNavDrawerLocked$.next(isLocked);
      localStorage.setItem(IS_LOCKED_KEY, `${isLocked}`);
    };

    const collapsibleNavHeaderRender = () =>
      this.collapsibleNavHeaderRender
        ? this.collapsibleNavHeaderRender({
            basePath: http.basePath,
            workspaces,
            getUrlForApp: application.getUrlForApp,
            navigateToUrl: application.navigateToUrl,
          })
        : null;

    const getIsNavDrawerLocked$ = isNavDrawerLocked$.pipe(takeUntil(this.stop$));

    const logos = getLogos(injectedMetadata.getBranding(), http.basePath.serverBasePath);

    const isIE = () => {
      const ua = window.navigator.userAgent;
      const msie = ua.indexOf('MSIE '); // IE 10 or older
      const trident = ua.indexOf('Trident/'); // IE 11

      return msie > 0 || trident > 0;
    };

    if (!this.params.browserSupportsCsp && injectedMetadata.getCspConfig().warnLegacyBrowsers) {
      notifications.toasts.addWarning({
        title: mountReactNode(
          <FormattedMessage
            id="core.chrome.legacyBrowserWarning"
            defaultMessage="Your browser does not meet the security requirements for OpenSearch Dashboards."
          />
        ),
      });
    }

    if (isIE()) {
      notifications.toasts.addWarning({
        title: mountReactNode(
          <FormattedMessage
            id="core.chrome.browserDeprecationWarning"
            defaultMessage="Internet Explorer lacks features required for OpenSearch Dashboards to function correctly; please use one of {link}."
            values={{
              link: (
                <EuiLink
                  target="_blank"
                  href={docLinks.links.opensearchDashboards.browser}
                  external
                >
                  <FormattedMessage
                    id="core.chrome.browserDeprecationLink"
                    defaultMessage="the supported browsers listed on our website"
                  />
                </EuiLink>
              ),
            }}
          />
        ),
      });
    }

    return {
      navControls,
      navLinks,
      recentlyAccessed,
      docTitle,
      logos,

      getHeaderComponent: () => (
        <Header
          loadingCount$={http.getLoadingCount$()}
          application={application}
          appTitle$={appTitle$.pipe(takeUntil(this.stop$))}
          badge$={badge$.pipe(takeUntil(this.stop$))}
          basePath={http.basePath}
          breadcrumbs$={breadcrumbs$.pipe(takeUntil(this.stop$))}
          opensearchDashboardsDocLink={docLinks.links.opensearchDashboards.introduction}
          forceAppSwitcherNavigation$={navLinks.getForceAppSwitcherNavigation$()}
          helpExtension$={helpExtension$.pipe(takeUntil(this.stop$))}
          helpSupportUrl$={helpSupportUrl$.pipe(takeUntil(this.stop$))}
          homeHref={http.basePath.prepend('/app/home')}
          isVisible$={this.isVisible$}
          opensearchDashboardsVersion={injectedMetadata.getOpenSearchDashboardsVersion()}
          navLinks$={navLinks.getNavLinks$()}
          customNavLink$={customNavLink$.pipe(takeUntil(this.stop$))}
          recentlyAccessed$={recentlyAccessed.get$()}
          navControlsLeft$={navControls.getLeft$()}
          navControlsCenter$={navControls.getCenter$()}
          navControlsRight$={navControls.getRight$()}
          navControlsExpandedCenter$={navControls.getExpandedCenter$()}
          navControlsExpandedRight$={navControls.getExpandedRight$()}
          onIsLockedUpdate={setIsNavDrawerLocked}
          isLocked$={getIsNavDrawerLocked$}
          branding={injectedMetadata.getBranding()}
          logos={logos}
          survey={injectedMetadata.getSurvey()}
          collapsibleNavHeaderRender={
            this.collapsibleNavHeaderRender ? collapsibleNavHeaderRender : undefined
          }
        />
      ),

      setAppTitle: (appTitle: string) => appTitle$.next(appTitle),

      getIsVisible$: () => this.isVisible$,

      setIsVisible: (isVisible: boolean) => this.isForceHidden$.next(!isVisible),

      getApplicationClasses$: () =>
        applicationClasses$.pipe(
          map((set) => [...set]),
          takeUntil(this.stop$)
        ),

      addApplicationClass: (className: string) => {
        const update = new Set([...applicationClasses$.getValue()]);
        update.add(className);
        applicationClasses$.next(update);
      },

      removeApplicationClass: (className: string) => {
        const update = new Set([...applicationClasses$.getValue()]);
        update.delete(className);
        applicationClasses$.next(update);
      },

      getBadge$: () => badge$.pipe(takeUntil(this.stop$)),

      setBadge: (badge: ChromeBadge) => {
        badge$.next(badge);
      },

      getBreadcrumbs$: () => breadcrumbs$.pipe(takeUntil(this.stop$)),

      setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => {
        breadcrumbs$.next(newBreadcrumbs);
      },

      getHelpExtension$: () => helpExtension$.pipe(takeUntil(this.stop$)),

      setHelpExtension: (helpExtension?: ChromeHelpExtension) => {
        helpExtension$.next(helpExtension);
      },

      setHelpSupportUrl: (url: string) => helpSupportUrl$.next(url),

      getIsNavDrawerLocked$: () => getIsNavDrawerLocked$,

      getCustomNavLink$: () => customNavLink$.pipe(takeUntil(this.stop$)),

      setCustomNavLink: (customNavLink?: ChromeNavLink) => {
        customNavLink$.next(customNavLink);
      },
    };
  }

  public stop() {
    this.navLinks.stop();
    this.stop$.next();
  }
}

/**
 * ChromeSetup allows plugins to customize the global chrome header UI rendering
 * before the header UI is mounted.
 *
 * @example
 * Customize the Collapsible Nav's (left nav menu) header section:
 * ```ts
 * core.chrome.registerCollapsibleNavHeader(() => <CustomNavHeader />)
 * ```
 */
export interface ChromeSetup {
  registerCollapsibleNavHeader: (render: CollapsibleNavHeaderRender) => void;
}

/**
 * ChromeStart allows plugins to customize the global chrome header UI and
 * enrich the UX with additional information about the current location of the
 * browser.
 *
 * @remarks
 * While ChromeStart exposes many APIs, they should be used sparingly and the
 * developer should understand how they affect other plugins and applications.
 *
 * @example
 * How to add a recently accessed item to the sidebar:
 * ```ts
 * core.chrome.recentlyAccessed.add('/app/map/1234', 'Map 1234', '1234');
 * ```
 *
 * @example
 * How to set the help dropdown extension:
 * ```tsx
 * core.chrome.setHelpExtension(elem => {
 *   ReactDOM.render(<MyHelpComponent />, elem);
 *   return () => ReactDOM.unmountComponentAtNode(elem);
 * });
 * ```
 *
 * @public
 */
export interface ChromeStart {
  /** {@inheritdoc ChromeNavLinks} */
  navLinks: ChromeNavLinks;
  /** {@inheritdoc ChromeNavControls} */
  navControls: ChromeNavControls;
  /** {@inheritdoc ChromeRecentlyAccessed} */
  recentlyAccessed: ChromeRecentlyAccessed;
  /** {@inheritdoc ChromeDocTitle} */
  docTitle: ChromeDocTitle;
  /** {@inheritdoc Logos} */
  readonly logos: Logos;

  /**
   * Sets the current app's title
   *
   * @internalRemarks
   * This should be handled by the application service once it is in charge
   * of mounting applications.
   */
  setAppTitle(appTitle: string): void;

  /**
   * Get an observable of the current visibility state of the chrome.
   */
  getIsVisible$(): Observable<boolean>;

  /**
   * Set the temporary visibility for the chrome. This does nothing if the chrome is hidden
   * by default and should be used to hide the chrome for things like full-screen modes
   * with an exit button.
   */
  setIsVisible(isVisible: boolean): void;

  /**
   * Get the current set of classNames that will be set on the application container.
   */
  getApplicationClasses$(): Observable<string[]>;

  /**
   * Add a className that should be set on the application container.
   */
  addApplicationClass(className: string): void;

  /**
   * Remove a className added with `addApplicationClass()`. If className is unknown it is ignored.
   */
  removeApplicationClass(className: string): void;

  /**
   * Get an observable of the current badge
   */
  getBadge$(): Observable<ChromeBadge | undefined>;

  /**
   * Override the current badge
   */
  setBadge(badge?: ChromeBadge): void;

  /**
   * Get an observable of the current list of breadcrumbs
   */
  getBreadcrumbs$(): Observable<ChromeBreadcrumb[]>;

  /**
   * Override the current set of breadcrumbs
   */
  setBreadcrumbs(newBreadcrumbs: ChromeBreadcrumb[]): void;

  /**
   * Get an observable of the current custom nav link
   */
  getCustomNavLink$(): Observable<Partial<ChromeNavLink> | undefined>;

  /**
   * Override the current set of custom nav link
   */
  setCustomNavLink(newCustomNavLink?: Partial<ChromeNavLink>): void;

  /**
   * Get an observable of the current custom help conttent
   */
  getHelpExtension$(): Observable<ChromeHelpExtension | undefined>;

  /**
   * Override the current set of custom help content
   */
  setHelpExtension(helpExtension?: ChromeHelpExtension): void;

  /**
   * Override the default support URL shown in the help menu
   * @param url The updated support URL
   */
  setHelpSupportUrl(url: string): void;

  /**
   * Get an observable of the current locked state of the nav drawer.
   */
  getIsNavDrawerLocked$(): Observable<boolean>;
}

/** @internal */
export interface InternalChromeStart extends ChromeStart {
  /**
   * Used only by MountingService to render the header UI
   * @internal
   */
  getHeaderComponent(): JSX.Element;
}

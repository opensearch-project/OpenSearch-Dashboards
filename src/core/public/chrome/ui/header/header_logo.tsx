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

import './header_logo.scss';
import { i18n } from '@osd/i18n';
import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import Url from 'url';
import { ChromeNavLink } from '../..';
import { ChromeBranding } from '../../chrome_service';

function findClosestAnchor(element: HTMLElement): HTMLAnchorElement | void {
  let current = element;
  while (current) {
    if (current.tagName === 'A') {
      return current as HTMLAnchorElement;
    }

    if (!current.parentElement || current.parentElement === document.body) {
      return undefined;
    }

    current = current.parentElement;
  }
}

function onClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  forceNavigation: boolean,
  navLinks: ChromeNavLink[],
  navigateToApp: (appId: string) => void
) {
  const anchor = findClosestAnchor((event as any).nativeEvent.target);
  if (!anchor) {
    return;
  }

  const navLink = navLinks.find((item) => item.href === anchor.href);
  if (navLink && navLink.disabled) {
    event.preventDefault();
    return;
  }

  if (event.isDefaultPrevented() || event.altKey || event.metaKey || event.ctrlKey) {
    return;
  }

  if (forceNavigation) {
    const toParsed = Url.parse(anchor.href);
    const fromParsed = Url.parse(document.location.href);
    const sameProto = toParsed.protocol === fromParsed.protocol;
    const sameHost = toParsed.host === fromParsed.host;
    const samePath = toParsed.path === fromParsed.path;

    if (sameProto && sameHost && samePath) {
      if (toParsed.hash) {
        document.location.reload();
      }

      // event.preventDefault() keeps the browser from seeing the new url as an update
      // and even setting window.location does not mimic that behavior, so instead
      // we use stopPropagation() to prevent angular from seeing the click and
      // starting a digest cycle/attempting to handle it in the router.
      event.stopPropagation();
    }
  } else {
    navigateToApp('home');
    event.preventDefault();
  }
}

export const DEFAULT_DARK_LOGO = 'opensearch_logo_dark_mode.svg';
export const DEFAULT_LOGO = 'opensearch_logo_default_mode.svg';
interface Props {
  href: string;
  navLinks$: Observable<ChromeNavLink[]>;
  forceNavigation$: Observable<boolean>;
  navigateToApp: (appId: string) => void;
  branding: ChromeBranding;
}

export function HeaderLogo({ href, navigateToApp, branding, ...observables }: Props) {
  const forceNavigation = useObservable(observables.forceNavigation$, false);
  const navLinks = useObservable(observables.navLinks$, []);
  const {
    darkMode,
    assetFolderUrl = '',
    logo = {},
    applicationTitle = 'opensearch dashboards',
  } = branding;
  const { defaultUrl: logoUrl, darkModeUrl: darkLogoUrl } = logo;

  const customLogo = darkMode ? darkLogoUrl ?? logoUrl : logoUrl;
  const defaultLogo = darkMode ? DEFAULT_DARK_LOGO : DEFAULT_LOGO;

  const logoSrc = customLogo ? customLogo : `${assetFolderUrl}/${defaultLogo}`;
  const testSubj = customLogo ? 'customLogo' : 'defaultLogo';
  const alt = `${applicationTitle} logo`;

  return (
    <a
      data-test-subj="logo"
      onClick={(e) => onClick(e, forceNavigation, navLinks, navigateToApp)}
      href={href}
      aria-label={i18n.translate('core.ui.chrome.headerGlobalNav.goHomePageIconAriaLabel', {
        defaultMessage: 'Go to home page',
      })}
      className="logoContainer"
    >
      <img
        data-test-subj={testSubj}
        data-test-image-url={logoSrc}
        src={logoSrc}
        alt={alt}
        loading="lazy"
        className="logoImage"
      />
    </a>
  );
}

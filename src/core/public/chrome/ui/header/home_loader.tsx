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

import './home_loader.scss';

import { i18n } from '@osd/i18n';
import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import Url from 'url';
import { EuiHeaderSectionItemButton } from '@elastic/eui';
import { ChromeNavLink } from '../..';
import { ChromeBranding } from '../../chrome_service';
import { LoadingIndicator } from '../loading_indicator';
import { HomeIcon } from './home_icon';
import type { Logos } from '../../../../common/types';

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

interface Props {
  href: string;
  navLinks$: Observable<ChromeNavLink[]>;
  forceNavigation$: Observable<boolean>;
  loadingCount$: Observable<number>;
  navigateToApp: (appId: string) => void;
  branding: ChromeBranding;
  logos: Logos;
}

export function HomeLoader({ href, navigateToApp, branding, logos, ...observables }: Props) {
  const forceNavigation = useObservable(observables.forceNavigation$, false);
  const navLinks = useObservable(observables.navLinks$, []);
  const loadingCount = useObservable(observables.loadingCount$, 0);
  const label = i18n.translate('core.ui.chrome.headerGlobalNav.goHomePageIconAriaLabel', {
    defaultMessage: 'Go to home page',
  });

  return (
    <EuiHeaderSectionItemButton
      className="header__homeLoaderNavButton"
      data-test-subj="homeLoader"
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
        onClick(e, forceNavigation, navLinks, navigateToApp)
      }
      href={href}
      aria-label={label}
      title={label}
    >
      {!(loadingCount > 0) && (
        <div className="homeIconContainer">
          <HomeIcon branding={branding} logos={logos} />
        </div>
      )}
      <div className="loaderContainer">
        <LoadingIndicator loadingCount$={observables.loadingCount$} />
      </div>
    </EuiHeaderSectionItemButton>
  );
}

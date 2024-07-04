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

import { EuiHeaderBreadcrumbs } from '@elastic/eui';
import classNames from 'classnames';
import React from 'react';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { ApplicationStart } from 'src/core/public/application';
import { ChromeBreadcrumb } from '../../chrome_service';
import { NavGroupItemInMap } from '../../nav_group';

interface Props {
  appTitle$: Observable<string>;
  breadcrumbs$: Observable<ChromeBreadcrumb[]>;
  navGroupEnabled: boolean;
  currentNavgroup$: Observable<NavGroupItemInMap | undefined>;
  navigateToApp: ApplicationStart['navigateToApp'];
}

/**
 * prepend current nav group into existing breadcrumbs and return new breadcrumbs, the new breadcrumbs will looks like
 * Home > Search > Visusalization
 * @param breadcrumbs existing breadcrumbs
 * @param currentNavGroup current nav group object
 * @param navigateToApp
 * @returns new breadcrumbs array
 */
function prependCurrentNavGroupToBreadcrumbs(
  breadcrumbs: ChromeBreadcrumb[],
  currentNavGroup: NavGroupItemInMap,
  navigateToApp: ApplicationStart['navigateToApp']
) {
  // breadcrumb order is home > navgroup > application, navgroup will be second one
  const navGroupInBreadcrumbs =
    breadcrumbs.length > 1 && breadcrumbs[1]?.text === currentNavGroup.title;
  if (!navGroupInBreadcrumbs) {
    const navGroupBreadcrumb: ChromeBreadcrumb = {
      text: currentNavGroup.title,
      onClick: () => {
        if (currentNavGroup.navLinks && currentNavGroup.navLinks.length) {
          navigateToApp(currentNavGroup.navLinks[0].id);
        }
      },
    };
    const homeBreadcrumb: ChromeBreadcrumb = {
      text: i18n.translate('core.breadcrumbs.homeTitle', { defaultMessage: 'Home' }),
      onClick: () => {
        navigateToApp('home');
      },
    };
    return [homeBreadcrumb, navGroupBreadcrumb, ...breadcrumbs];
  }

  return breadcrumbs;
}

export function HeaderBreadcrumbs({
  appTitle$,
  breadcrumbs$,
  navGroupEnabled,
  currentNavgroup$,
  navigateToApp,
}: Props) {
  const appTitle = useObservable(appTitle$, 'OpenSearch Dashboards');
  const breadcrumbs = useObservable(breadcrumbs$, []);
  let crumbs = breadcrumbs;

  if (breadcrumbs.length === 0 && appTitle) {
    crumbs = [{ text: appTitle }];
  }

  const currentNavgroup = useObservable(currentNavgroup$, undefined);
  if (navGroupEnabled && currentNavgroup) {
    crumbs = prependCurrentNavGroupToBreadcrumbs(crumbs, currentNavgroup, navigateToApp);
  }

  crumbs = crumbs.map((breadcrumb, i) => ({
    ...breadcrumb,
    'data-test-subj': classNames(
      'breadcrumb',
      breadcrumb['data-test-subj'],
      i === 0 && 'first',
      i === crumbs.length - 1 && 'last'
    ),
  }));

  return <EuiHeaderBreadcrumbs breadcrumbs={crumbs} max={10} data-test-subj="breadcrumbs" />;
}

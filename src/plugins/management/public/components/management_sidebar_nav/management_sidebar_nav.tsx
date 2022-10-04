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

import React, { ReactNode, useState } from 'react';
import { i18n } from '@osd/i18n';
import { sortBy } from 'lodash';

import {
  EuiIcon,
  EuiSideNav,
  EuiScreenReaderOnly,
  EuiSideNavItemType,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiBadge,
} from '@elastic/eui';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { FormattedMessage } from '@osd/i18n/react';
import { ManagementApp, ManagementSection } from '../../utils';

import './management_sidebar_nav.scss';

import { ManagementItem } from '../../utils/management_item';
import { reactRouterNavigate } from '../../../../opensearch_dashboards_react/public';

interface ManagementSidebarNavProps {
  sections: ManagementSection[];
  history: AppMountParameters['history'];
  selectedId: string;
}

const headerLabel = i18n.translate('management.nav.label', {
  defaultMessage: 'Management',
});

const navMenuLabel = i18n.translate('management.nav.menu', {
  defaultMessage: 'Management menu',
});

/** @internal **/
export const ManagementSidebarNav = ({
  selectedId,
  sections,
  history,
}: ManagementSidebarNavProps) => {
  const HEADER_ID = 'stack-management-nav-header';
  const [isSideNavOpenOnMobile, setIsSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => setIsSideNavOpenOnMobile(!isSideNavOpenOnMobile);

  const sectionsToNavItems = (managementSections: ManagementSection[]) => {
    const sortedManagementSections = sortBy(managementSections, 'order');

    return sortedManagementSections.reduce<Array<EuiSideNavItemType<any>>>((acc, section) => {
      const apps = sortBy(section.getAppsEnabled(), 'order');

      if (apps.length) {
        acc.push({
          ...createNavItem(section, {
            items: appsToNavItems(apps),
          }),
        });
      }

      return acc;
    }, []);
  };

  const appsToNavItems = (managementApps: ManagementApp[]) =>
    managementApps.map((app) => ({
      ...createNavItem(app, {
        ...reactRouterNavigate(history, app.basePath),
      }),
    }));

  interface TooltipWrapperProps {
    text: ReactNode | string;
    tip?: string;
  }

  const TooltipWrapper = ({ text, tip }: TooltipWrapperProps) => (
    <EuiToolTip content={tip} position="right">
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>{text}</EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiIcon type="questionInCircle" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiToolTip>
  );

  const TitleWithExperimentalBadge = ({ title }: any) => (
    <>
      {title}
      <EuiBadge className="mgtSideBarNavItemExperimentalBadge">
        <FormattedMessage id="management.navItem.experimental" defaultMessage="Experimental" />
      </EuiBadge>
    </>
  );

  const createNavItem = <T extends ManagementItem>(
    item: T,
    customParams: Partial<EuiSideNavItemType<any>> = {}
  ) => {
    const iconType = item.euiIconType || item.icon;
    const name = item.showExperimentalBadge ? (
      <TitleWithExperimentalBadge title={item.title} />
    ) : (
      item.title
    );
    return {
      id: item.id,
      name: item.tip ? <TooltipWrapper text={name} tip={item.tip} /> : name,
      isSelected: item.id === selectedId,
      icon: iconType ? <EuiIcon type={iconType} size="m" /> : undefined,
      'data-test-subj': item.id,
      ...customParams,
    };
  };

  return (
    <>
      <EuiScreenReaderOnly>
        <h2 id={HEADER_ID}>{headerLabel}</h2>
      </EuiScreenReaderOnly>
      <EuiSideNav
        aria-labelledby={HEADER_ID}
        mobileTitle={navMenuLabel}
        toggleOpenOnMobile={toggleOpenOnMobile}
        isOpenOnMobile={isSideNavOpenOnMobile}
        items={sectionsToNavItems(sections)}
        className="mgtSideBarNav"
      />
    </>
  );
};

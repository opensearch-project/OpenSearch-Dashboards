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

import { EuiFlexGroup, EuiFlexItem, EuiHeaderLinks, EuiText, EuiTitle } from '@elastic/eui';
import classNames from 'classnames';
import React, { ReactElement, useRef } from 'react';

import { MountPoint } from '../../../../core/public';
import {
  DataPublicPluginStart,
  QueryStatus,
  SearchBarProps,
  StatefulSearchBarProps,
} from '../../../data/public';
import { DataSourceMenuProps, createDataSourceMenu } from '../../../data_source_management/public';
import { MountPointPortal } from '../../../opensearch_dashboards_react/public';
import { TopNavMenuData } from './top_nav_menu_data';
import { TopNavMenuItem } from './top_nav_menu_item';

export enum TopNavMenuItemRenderType {
  IN_PORTAL = 'in_portal',
  IN_PLACE = 'in_place',
  OMITTED = 'omitted',
}

export type TopNavMenuProps = Omit<StatefulSearchBarProps, 'showDatePicker'> &
  Omit<SearchBarProps, 'opensearchDashboards' | 'intl' | 'timeHistory' | 'showDatePicker'> & {
    config?: TopNavMenuData[];
    dataSourceMenuConfig?: DataSourceMenuProps;
    showSearchBar?: boolean | TopNavMenuItemRenderType;
    showQueryBar?: boolean;
    showQueryInput?: boolean;
    showDatePicker?: boolean | TopNavMenuItemRenderType;
    showFilterBar?: boolean;
    showDataSourceMenu?: boolean;
    data?: DataPublicPluginStart;
    groupActions?: boolean;
    className?: string;
    datePickerRef?: any;
    /**
     * If provided, the menu part of the component will be rendered as a portal inside the given mount point.
     *
     * This is meant to be used with the `setHeaderActionMenu` core API.
     *
     * @example
     * ```ts
     * export renderApp = ({ element, history, setHeaderActionMenu }: AppMountParameters) => {
     *   const topNavConfig = ...; // TopNavMenuProps
     *   return (
     *     <Router history=history>
     *       <TopNavMenu {...topNavConfig} setMenuMountPoint={setHeaderActionMenu}>
     *       <MyRoutes />
     *     </Router>
     *   )
     * }
     * ```
     */
    setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
    queryStatus?: QueryStatus;
  };

/*
 * Top Nav Menu is a convenience wrapper component for:
 * - Top navigation menu - configured by an array of `TopNavMenuData` objects
 * - Search Bar - which includes Filter Bar \ Query Input \ Timepicker.
 *
 * See SearchBar documentation to learn more about its properties.
 *
 **/

export function TopNavMenu(props: TopNavMenuProps): ReactElement | null {
  const {
    config,
    showSearchBar,
    showDatePicker,
    showDataSourceMenu,
    dataSourceMenuConfig,
    groupActions,
    screenTitle,
    ...searchBarProps
  } = props;

  const datePickerRef = useRef<HTMLDivElement>(null);

  if (
    (!config || config.length === 0) &&
    (!showSearchBar || !props.data) &&
    (!showDataSourceMenu || !dataSourceMenuConfig)
  ) {
    return null;
  }

  function renderItems(): ReactElement | ReactElement[] | null {
    if (!config || config.length === 0) return null;
    const renderedItems = config.map((menuItem: TopNavMenuData, i: number) => {
      return <TopNavMenuItem key={`nav-menu-${i}`} {...menuItem} />;
    });

    return groupActions ? (
      <div className="osdTopNavMenuGroupedActions">{renderedItems}</div>
    ) : (
      renderedItems
    );
  }

  function renderMenu(className: string, spreadSections: boolean = false): ReactElement | null {
    if ((!config || config.length === 0) && (!showDataSourceMenu || !dataSourceMenuConfig))
      return null;

    const menuClassName = classNames(className, { osdTopNavMenuSpread: spreadSections });

    return (
      <EuiHeaderLinks
        data-test-subj="top-nav"
        gutterSize="xs"
        className={menuClassName}
        popoverBreakpoints={'none'}
      >
        {renderItems()}
        {renderDataSourceMenu()}
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceMenu(): ReactElement | null {
    if (!showDataSourceMenu) return null;
    const DataSourceMenu = createDataSourceMenu();
    return <DataSourceMenu {...dataSourceMenuConfig!} />;
  }

  function renderSearchBar(overrides: Partial<SearchBarProps> = {}): ReactElement | null {
    // Validate presence of all required fields
    if (!showSearchBar || !props.data) return null;
    const { SearchBar } = props.data.ui;
    return (
      <SearchBar
        {...searchBarProps}
        showDatePicker={![TopNavMenuItemRenderType.OMITTED, false].includes(showDatePicker!)}
        {...overrides}
        queryStatus={props.queryStatus}
      />
    );
  }

  function renderLayout() {
    const { setMenuMountPoint } = props;
    const menuClassName = classNames('osdTopNavMenu', props.className);

    if (setMenuMountPoint) {
      if (groupActions) {
        switch (showSearchBar) {
          case TopNavMenuItemRenderType.IN_PORTAL:
            return (
              <>
                <MountPointPortal setMountPoint={setMenuMountPoint}>
                  <EuiFlexGroup alignItems="stretch" gutterSize="none">
                    <EuiFlexItem grow={false} className="osdTopNavMenuScreenTitle">
                      <EuiTitle size="xs">
                        <h1>{screenTitle}</h1>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false} className="osdTopNavMenu">
                      {renderMenu(menuClassName)}
                    </EuiFlexItem>
                    <EuiFlexItem className="osdTopNavSearchBar">
                      {renderSearchBar({ isFilterBarPortable: true })}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </MountPointPortal>
              </>
            );

          case false:
          case TopNavMenuItemRenderType.OMITTED:
            return screenTitle ? (
              <MountPointPortal setMountPoint={setMenuMountPoint}>
                <EuiFlexGroup alignItems="stretch" gutterSize="none">
                  <EuiFlexItem grow={false} className="osdTopNavMenuScreenTitle">
                    <EuiTitle size="xs">
                      <h1>{screenTitle}</h1>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem className="osdTopNavMenu">
                    {renderMenu(menuClassName, true)}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </MountPointPortal>
            ) : (
              <MountPointPortal setMountPoint={setMenuMountPoint}>
                {renderMenu(menuClassName)}
              </MountPointPortal>
            );

          // Show the SearchBar in-place
          default:
            return (
              <>
                <MountPointPortal setMountPoint={setMenuMountPoint}>
                  <EuiFlexGroup alignItems="stretch" gutterSize="none">
                    <EuiFlexItem grow={false} className="osdTopNavMenuScreenTitle">
                      <EuiTitle size="xs">
                        <h1>{screenTitle}</h1>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false} className="osdTopNavMenu">
                      {renderMenu(menuClassName)}
                    </EuiFlexItem>
                    <EuiFlexItem className="globalDatePicker">
                      <div ref={datePickerRef} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </MountPointPortal>
                {renderSearchBar({ datePickerRef })}
              </>
            );
        }
      }

      // Legacy rendering behavior when setMenuMountPoint is set
      return (
        <>
          <MountPointPortal setMountPoint={setMenuMountPoint}>
            {renderMenu(menuClassName)}
          </MountPointPortal>
          {renderSearchBar()}
        </>
      );
    }

    return (
      <>
        {renderMenu(menuClassName)}
        {renderSearchBar()}
      </>
    );
  }

  return renderLayout();
}

TopNavMenu.defaultProps = {
  showSearchBar: false,
  showQueryBar: true,
  showQueryInput: true,
  showDatePicker: true,
  showFilterBar: true,
  showDataSourceMenu: false,
  screenTitle: '',
  groupActions: false,
};

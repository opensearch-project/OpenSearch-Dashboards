/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';
import * as Rx from 'rxjs';
import {
  EuiPopover,
  EuiHeaderSectionItemButton,
  EuiTextColor,
  EuiListGroup,
  EuiListGroupItem,
  EuiTitle,
  EuiIcon,
  EuiText,
  EuiSpacer,
  EuiHeaderSectionItemButtonProps,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { ChromeRecentlyAccessedHistoryItem, HeaderVariant } from '../..';
import { WorkspaceObject } from '../../../workspace';
import { createRecentNavLink } from './nav_link';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../../';
import './recent_items.scss';

export interface Props {
  recentlyAccessed$: Rx.Observable<ChromeRecentlyAccessedHistoryItem[]>;
  workspaceList$: Rx.Observable<WorkspaceObject[]>;
  navigateToUrl: (url: string) => Promise<void>;
  basePath: HttpStart['basePath'];
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  headerVariant?: HeaderVariant;
  renderBreadcrumbs: React.JSX.Element;
  buttonSize?: EuiHeaderSectionItemButtonProps['size'];
}

export const RecentItems = ({
  recentlyAccessed$,
  workspaceList$,
  navigateToUrl,
  navLinks$,
  basePath,
  headerVariant,
  renderBreadcrumbs,
  buttonSize = 's',
}: Props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const recentlyAccessedItems = useObservable(recentlyAccessed$, []);
  const workspaceList = useObservable(workspaceList$, []);
  const navLinks = useObservable(navLinks$, []).filter((link) => !link.hidden);

  const items = useMemo(() => {
    // Only display five most recent items
    return recentlyAccessedItems.slice(0, 5).map((item) => {
      return {
        link: createRecentNavLink(item, navLinks, basePath, navigateToUrl).href,
        label: item.label,
        workspaceId: item.workspaceId,
        workspaceName:
          workspaceList.find((workspace) => workspace.id === item.workspaceId)?.name ?? '',
      };
    });
  }, [recentlyAccessedItems, workspaceList, basePath, navLinks, navigateToUrl]);

  const handleItemClick = (link: string) => {
    navigateToUrl(link);
    setIsPopoverOpen(false);
  };

  const appendBreadcrumbs = Boolean(headerVariant === HeaderVariant.APPLICATION);

  return (
    <EuiPopover
      button={
        <EuiHeaderSectionItemButton
          onClick={() => {
            setIsPopoverOpen((prev) => !prev);
          }}
          data-test-subj="recentItemsSectionButton"
          size={buttonSize}
          className="headerRecentItemsButton"
        >
          {/* TODO: replace this icon once there is a new icon added to OUI https://github.com/opensearch-project/OpenSearch-Dashboards/issues/7354 */}
          <EuiIcon type="recentlyViewedApp" size="m" />
        </EuiHeaderSectionItemButton>
      }
      isOpen={isPopoverOpen}
      closePopover={() => {
        setIsPopoverOpen(false);
      }}
      anchorPosition="downCenter"
      repositionOnScroll
      initialFocus={false}
      panelPaddingSize="s"
    >
      {appendBreadcrumbs ? (
        <>
          {renderBreadcrumbs}
          <EuiSpacer size="s" />
        </>
      ) : null}

      <EuiTitle size="xxs">
        <h4>Recents</h4>
      </EuiTitle>
      {items.length > 0 ? (
        <EuiListGroup>
          {items.map((item) => (
            <EuiListGroupItem
              onClick={() => handleItemClick(item.link)}
              key={item.link}
              label={
                <>
                  {item.label}
                  {item.workspaceName ? (
                    <EuiTextColor color="subdued">({item.workspaceName})</EuiTextColor>
                  ) : null}
                </>
              }
              color="text"
              size="s"
            />
          ))}
        </EuiListGroup>
      ) : (
        <EuiText color="subdued">No recently viewed items</EuiText>
      )}
    </EuiPopover>
  );
};

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
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { ChromeRecentlyAccessedHistoryItem } from '../..';
import { WorkspaceObject } from '../../../workspace';
import { createRecentNavLink } from './nav_link';
import { HttpStart } from '../../../http';
import { ChromeNavLink } from '../../../';
// TODO: replace this icon once added to OUI
import recent_items from './assets/recent_items.svg';

export interface Props {
  recentlyAccessed$: Rx.Observable<ChromeRecentlyAccessedHistoryItem[]>;
  workspaceList$: Rx.Observable<WorkspaceObject[]>;
  navigateToUrl: (url: string) => Promise<void>;
  basePath: HttpStart['basePath'];
  navLinks$: Rx.Observable<ChromeNavLink[]>;
}

export const RecentItems = ({
  recentlyAccessed$,
  workspaceList$,
  navigateToUrl,
  navLinks$,
  basePath,
}: Props) => {
  const [isPopoverOpen, SetIsPopoverOpen] = useState(false);

  const recentlyAccessedItems = useObservable(recentlyAccessed$, []);
  const workspaceList = useObservable(workspaceList$, []);
  const navLinks = useObservable(navLinks$, []).filter((link) => !link.hidden);

  const items = useMemo(() => {
    // Only display five most latest items
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
    SetIsPopoverOpen(false);
  };

  return (
    <EuiPopover
      button={
        <EuiHeaderSectionItemButton
          onClick={() => {
            SetIsPopoverOpen((prev) => !prev);
          }}
          data-test-subj="recentItemsSectionButton"
        >
          <EuiIcon type={recent_items} size="m" />
        </EuiHeaderSectionItemButton>
      }
      isOpen={isPopoverOpen}
      closePopover={() => {
        SetIsPopoverOpen(false);
      }}
      anchorPosition="downCenter"
      repositionOnScroll
      initialFocus={false}
    >
      <EuiTitle size="xs">
        <h4>Recents</h4>
      </EuiTitle>
      {items.length > 0 ? (
        <EuiListGroup>
          {items.map((item) => (
            <EuiListGroupItem
              onClick={() => handleItemClick(item.link)}
              size="s"
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
            />
          ))}
        </EuiListGroup>
      ) : (
        <EuiText color="subdued">No recently viewed items</EuiText>
      )}
    </EuiPopover>
  );
};

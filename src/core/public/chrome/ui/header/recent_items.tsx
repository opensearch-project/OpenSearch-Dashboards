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
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { ChromeRecentlyAccessedHistoryItem } from '../..';
import { WorkspaceObject } from '../../../workspace';

export interface Props {
  recentlyAccessed$: Rx.Observable<ChromeRecentlyAccessedHistoryItem[]>;
  workspaceList$: Rx.Observable<WorkspaceObject[]>;
  navigateToUrl: (url: string) => Promise<void>;
}

export const RecentItems = ({ recentlyAccessed$, workspaceList$, navigateToUrl }: Props) => {
  const [isPopoverOpen, SetIsPopoverOpen] = useState(false);

  const recentlyAccessedItems = useObservable(recentlyAccessed$, []);
  const workspaceList = useObservable(workspaceList$, []);

  const items = useMemo(() => {
    // Only display five most latest items
    return recentlyAccessedItems.slice(0, 5).map(({ link, label, workspaceId }) => {
      return {
        link,
        label,
        workspaceId,
        workspaceName: workspaceList.find((workspace) => workspace.id === workspaceId)?.name ?? '',
      };
    });
  }, [recentlyAccessedItems, workspaceList]);

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
          <EuiIcon type="clock" size="m" />
        </EuiHeaderSectionItemButton>
      }
      isOpen={isPopoverOpen}
      closePopover={() => {
        SetIsPopoverOpen(false);
      }}
      anchorPosition="downCenter"
      repositionOnScroll
    >
      <EuiTitle size="xs">
        <h4>Recents</h4>
      </EuiTitle>
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
    </EuiPopover>
  );
};

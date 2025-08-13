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

import {
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiPopover,
  EuiToolTip,
  EuiContextMenuItem,
  EuiContextMenuItemProps,
  EuiButton,
  EuiPopoverTitle,
} from '@elastic/eui';
import React, { ReactElement, useState } from 'react';
import { HeaderNotificationEvent, NotificationEventProps } from './header_notification_event';

import './header_notification_area.scss';

const demoNotificationEventsData = [
  {
    id: 'alert-01',
    type: 'Alert',
    severity: 'Warning',
    badgeColor: 'warning',
    time: '1 min ago',
    title: '[Maps] Geo Alert',
    messages: [
      'The request completed at 12:32:33 GMT+4',
      'The request completed at 12:32:33 GMT+4',
      'A background request started at 12:32:33 GMT+4',
    ],
    isRead: false,
  },
  {
    id: 'report-01',
    type: 'Report',
    time: '3 min ago',
    title: '[Error Monitoring Report] is generated',
    primaryAction: 'Download',
    primaryActionProps: {
      iconType: 'download',
    },
    messages: [
      'The reported was generated at 17:12:16 GMT+4 and due to an error it was was generated again at 17:13:17 GMT+4',
    ],
    isRead: false,
  },
  {
    id: 'news-01',
    type: 'News',
    time: '6 min ago',
    badgeColor: 'accent',
    title: 'Search more, spend less',
    messages: [
      'Retain and search more data with searchable snapshots on low-cost object stores + a new cold data tier in 7.11.',
    ],
    isRead: false,
    primaryAction: 'View and go',
  },
  {
    id: 'alert-02',
    type: 'Alert',
    severity: 'Critical',
    badgeColor: 'danger',
    time: '8 min ago',
    title: 'Index Threshold Alert',
    messages: ['[prod-server-001] is above 300', '[prod-server-001] is above 700'],
    isRead: false,
  },
  {
    id: 'background-search-01',
    type: 'Background Search',
    time: '10 min ago',
    title: '[Flights] Flight Count and Average Ticket Price',
    messages: ['The request completed at 12:32:33 GMT+4'],
    isRead: false,
  },
];

export type HeaderNotificationFilters = Partial<
  {
    [K in keyof NotificationEventProps]: Array<NotificationEventProps[K]>;
  }
>;

export function HeaderNotificationArea() {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [events, setEvents] = useState<NotificationEventProps[]>(demoNotificationEventsData);
  const [filters, setFilters] = useState<HeaderNotificationFilters>({});

  function togglePopover() {
    setIsPopoverOpen(!isPopoverOpen);
  }

  function closePopover() {
    setIsPopoverOpen(false);
  }

  const button = (
    <EuiToolTip content="Notification Area" delay="long" position="bottom">
      <EuiHeaderSectionItemButton
        aria-expanded="false"
        aria-haspopup="true"
        aria-label="Notification Area"
        onClick={togglePopover}
      >
        <EuiIcon type="bell" size="m" />
      </EuiHeaderSectionItemButton>
    </EuiToolTip>
  );

  const handleRead = (id: string, isRead: boolean) => {
    const nextState = events.map((event) => {
      return event.id === id ? { ...event, isRead: !isRead } : event;
    });

    setEvents(nextState);
  };

  const onOpenContextMenu = (
    id: NotificationEventProps['id']
  ): Array<ReactElement<EuiContextMenuItemProps, typeof EuiContextMenuItem>> => {
    const event = events.find(({ id: eventId }) => eventId === id)!;

    const { type, isRead } = event;

    return [
      <EuiContextMenuItem key="contextMenuMarkAsRead" onClick={() => handleRead(id, isRead)}>
        {isRead ? 'Mark as unread' : 'Mark as read'}
      </EuiContextMenuItem>,

      <EuiContextMenuItem
        key="contextMenuSimilarMessages"
        onClick={() => setFilters({ type: [type] })}
      >
        View messages like this
      </EuiContextMenuItem>,
    ];
  };

  const notificationEvents = events
    .filter((notification) => {
      // filter logic
      if (Object.values(filters).every((v: any) => !v || v.length === 0)) return true;

      return Object.entries(filters).every(([key, allowedValues]) => {
        const allowed = (allowedValues as unknown) as any;
        if (!allowedValues || allowed.length === 0) return true;
        // @ts-expect-error
        return allowedValues.includes(notification[key]);
      });
    })
    .map((notification) => {
      const onClickTitle = notification.type === 'News' ? undefined : () => {};

      const onRead = (
        id: NotificationEventProps['id'],
        isRead: NotificationEventProps['isRead']
      ) => {
        const nextState = events.map((subNotification) => {
          return subNotification.id === id
            ? { ...subNotification, isRead: !isRead }
            : subNotification;
        });

        setEvents(nextState);
      };

      return (
        <HeaderNotificationEvent
          key={notification.id}
          id={notification.id}
          type={notification.type}
          severity={notification.severity}
          badgeColor={notification.badgeColor}
          time={notification.time}
          title={notification.title}
          isRead={notification.isRead}
          messages={notification.messages}
          onRead={onRead}
          onOpenContextMenu={onOpenContextMenu}
          onClickTitle={onClickTitle}
        />
      );
    });

  const onClickReadAll = () => {
    setEvents((notifications) => notifications.map((event) => ({ ...event, isRead: true })));
  };

  const onClickResetFilters = () => {
    setFilters({});
  };

  return (
    <EuiPopover
      id="headerNotificationArea"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      repositionOnScroll
    >
      <EuiPopoverTitle>
        <div className="headerNotificationArea__header">
          <h2>Notifications</h2>
          <div className="headerNotificationArea__header__actions">
            {!events.every((event) => event.isRead) && (
              <EuiButton
                size="s"
                aria-label="Mark all notifications as read"
                onClick={onClickReadAll}
                disabled={events.every((event) => event.isRead)}
              >
                Mark All as Read
              </EuiButton>
            )}
            {Object.keys(filters).length > 0 && (
              <EuiButton size="s" aria-label="Reset filters" onClick={onClickResetFilters}>
                Reset Filters
              </EuiButton>
            )}
          </div>
        </div>
      </EuiPopoverTitle>

      {notificationEvents}
    </EuiPopover>
  );
}

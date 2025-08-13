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
  EuiText,
  EuiBadge,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuItemProps,
  EuiPopover,
  EuiContextMenuPanel,
  EuiLink,
  htmlIdGenerator,
} from '@elastic/eui';
import classNames from 'classnames';
import React, { ReactElement, useState } from 'react';

import './header_notification_event.scss';

export interface NotificationEventProps {
  id: string;
  type: string;
  severity?: string;
  badgeColor?: string;
  time?: string;
  title: string;
  messages: string[];
  isRead: boolean;

  onRead?: (id: NotificationEventProps['id'], isRead: NotificationEventProps['isRead']) => void;
  onOpenContextMenu?: (
    id: NotificationEventProps['id']
  ) => Array<ReactElement<EuiContextMenuItemProps, typeof EuiContextMenuItem>>;
  onClickTitle?: (id: NotificationEventProps['id']) => void;
}

export function HeaderNotificationEvent({
  id,
  isRead,
  title,
  messages,
  severity,
  type,
  badgeColor = 'hollow',
  time,
  onClickTitle,
  onRead,
  onOpenContextMenu,
}: NotificationEventProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [contextMenuItems, setContextMenuItems] = useState<
    ReturnType<NonNullable<typeof onOpenContextMenu>>
  >([]);

  const buttonTitle = isRead ? 'Mark as unread' : 'Mark as read';

  const randomTitleId = htmlIdGenerator()();

  const metaClasses = classNames('headerNotificationEventMeta', {
    'headerNotificationEventMeta--hasContextMenu': onOpenContextMenu,
  });

  const onOpenPopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
    if (onOpenContextMenu) {
      setContextMenuItems(onOpenContextMenu(id));
    }
  };

  const buttonClassesReadState = classNames('headerNotificationEventReadButton', {
    'headerNotificationEventReadButton--isRead': isRead,
  });

  const TitleComponent = (props: { title: string }) => (
    <h3 className="headerNotificationEvent__title" id={randomTitleId}>
      {props.title}
    </h3>
  );

  return (
    <article aria-labelledby={randomTitleId} className="headerNotificationEvent">
      <div className="headerNotificationEvent__readButton">
        {!!onRead ? (
          <EuiButtonIcon
            iconType="dot"
            aria-label={buttonTitle}
            title={buttonTitle}
            onClick={() => onRead(id, isRead)}
            className={buttonClassesReadState}
          />
        ) : (
          <EuiButtonIcon aria-label="Mark as Unread" iconType="dot" title={buttonTitle} />
        )}
      </div>

      <div className="headerNotificationEvent__content">
        <div className={metaClasses}>
          <EuiBadge className="headerNotificationEventMeta__badge" color={badgeColor}>
            {severity ? `${type}: ${severity}` : type}
          </EuiBadge>
          {onOpenContextMenu && (
            <div className="headerNotificationEvent__contextMenuWrapperMeta">
              <div className="headerNotificationEventMeta__contextMenuWrapper">
                <EuiPopover
                  ownFocus
                  repositionOnScroll
                  isOpen={isPopoverOpen}
                  panelPaddingSize="none"
                  anchorPosition="leftUp"
                  closePopover={() => setIsPopoverOpen(false)}
                  button={
                    <EuiButtonIcon
                      aria-label="Open notification options"
                      // aria-controls={randomPopoverId}
                      aria-expanded={isPopoverOpen}
                      aria-haspopup="true"
                      iconType="boxesVertical"
                      color="subdued"
                      onClick={onOpenPopover}
                      data-test-subj={`${id}-notificationEventMetaButton`}
                    />
                  }
                >
                  <button
                    type="button"
                    onClick={() => setIsPopoverOpen(false)}
                    style={{ all: 'unset' }}
                  >
                    <EuiContextMenuPanel items={contextMenuItems} />
                  </button>
                </EuiPopover>
              </div>
            </div>
          )}
          <div className="headerNotificationEventMeta__section">
            <span className="headerNotificationEventMeta__time">{time}</span>
          </div>
        </div>

        {onClickTitle ? (
          <EuiLink onClick={() => onClickTitle(id)}>
            <TitleComponent title={title} />
          </EuiLink>
        ) : (
          <TitleComponent title={title} />
        )}
        <EuiText size="s" style={{ marginTop: '0' }}>
          {messages}
        </EuiText>
      </div>
    </article>
  );
}

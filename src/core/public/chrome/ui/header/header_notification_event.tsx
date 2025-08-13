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

export type NotificationEventProps = {
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
};

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

  const TitleComponent = ({ title }: { title: string } & { title: string }) => (
    <h3 className="headerNotificationEvent__title" id={randomTitleId}>
      {title}
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
                  <div onClick={() => setIsPopoverOpen(false)}>
                    <EuiContextMenuPanel items={contextMenuItems} />
                  </div>
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

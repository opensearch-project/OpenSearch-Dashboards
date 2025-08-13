import React from 'react';
import {
  EuiPopover,
  EuiToolTip,
  EuiHeaderSectionItemButton,
  EuiAvatar,
  EuiPopoverTitle,
  EuiPopoverFooter,
  EuiContextMenu,
  EuiContextMenuProps,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import './header_user_area.scss';
import { ChromeNavLink } from '../../nav_links';
import { Observable } from 'rxjs';
import useObservable from 'react-use/lib/useObservable';

const user = {
  name: 'Luke Skywalker',
  email: 'lukeskywalker@email.com',
};

type HeaderUserAreaProps = {
  navLinks$: Observable<ChromeNavLink[]>;
  forceNavigation$: Observable<boolean>;
  navigateToApp: (appId: string) => void;
};

async function onClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  forceNavigation: boolean,
  navLinks: ChromeNavLink[],
  navigateToApp: (appId: string) => void
) {
  return new Promise((resolve) => {
    const anchor = (event.nativeEvent.target as HTMLAnchorElement)?.closest('a');
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
      const toParsed = new URL(anchor.href);
      const fromParsed = new URL(document.location.href);
      const sameProto = toParsed.protocol === fromParsed.protocol;
      const sameHost = toParsed.host === fromParsed.host;
      const samePath = toParsed.pathname === fromParsed.pathname;

      if (sameProto && sameHost && samePath) {
        if (toParsed.hash) {
          document.location.reload();
        }
        event.stopPropagation();
      }
    } else {
      navigateToApp('management');
      resolve('Navigation ok');
      event.preventDefault();
    }
  });
}

export function HeaderUserArea({ navigateToApp, ...observables }: HeaderUserAreaProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const forceNavigation = useObservable(observables.forceNavigation$, false);
  const navLinks = useObservable(observables.navLinks$, []);

  function togglePopover() {
    setIsPopoverOpen(!isPopoverOpen);
  }
  function closePopover() {
    setIsPopoverOpen(false);
  }

  const button = (
    <EuiToolTip content="User Area" delay="long" position="bottom">
      <EuiHeaderSectionItemButton
        aria-expanded="false"
        aria-haspopup="true"
        aria-label="User Profile Area"
        onClick={togglePopover}
      >
        <EuiAvatar size="s" name={user.name} />
      </EuiHeaderSectionItemButton>
    </EuiToolTip>
  );

  const mainActionsPanels: EuiContextMenuProps['panels'] = [
    {
      id: 0,
      items: [
        {
          name: 'My profile',
          icon: 'user',
          href: 'https://docs.opensearch.org/latest/dashboards/',
          target: '_blank',
        },
        {
          name: 'Settings',
          icon: 'gear',
          href: '/app/management',
          onClick: (e: any) => {
            onClick(e, forceNavigation, navLinks, navigateToApp).then(() =>
              setIsPopoverOpen(false)
            );
          },
        },
      ],
    },
  ];

  const footerActionsPanels: EuiContextMenuProps['panels'] = [
    {
      id: 0,
      items: [
        {
          name: 'Switch accounts',
          icon: 'inputOutput',
        },
        {
          name: 'Log out',
          icon: 'push',
        },
      ],
    },
  ];

  return (
    <EuiPopover
      id="headerUserArea"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      repositionOnScroll
    >
      <EuiPopoverTitle>
        <div className="headerUserArea__header">
          <EuiAvatar size="l" name={user.name} />
          <div>
            <EuiTitle size="xs" className="headerUserArea__header__name">
              <h3>{user.name}</h3>
            </EuiTitle>
            <EuiText size="xs" className="headerUserArea__header__email">
              <p>{user.email}</p>
            </EuiText>
          </div>
        </div>
      </EuiPopoverTitle>
      <EuiContextMenu initialPanelId={0} panels={mainActionsPanels} />
      <EuiPopoverFooter paddingSize="none">
        <EuiContextMenu initialPanelId={0} panels={footerActionsPanels} />
      </EuiPopoverFooter>
    </EuiPopover>
  );
}

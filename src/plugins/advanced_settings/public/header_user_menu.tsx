/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, SyntheticEvent, useState } from 'react';

import {
  EuiAvatar,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiComboBox,
  EuiContextMenu,
  EuiContextMenuPanelDescriptor,
  EuiFieldPassword,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiRadioGroup,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTextAlign,
  EuiTitle,
} from '@elastic/eui';
import { useUiSetting$ } from '../../opensearch_dashboards_react/public';

export interface FormRowDeps {
  headerText: string;
  optional?: boolean;
  headerSubText?: string;
  helpLink?: string;
  helpText?: string;
}
export interface FormRowWithChildComponentDeps extends FormRowDeps {
  isInvalid?: boolean;
  error?: string[];
  children: React.ReactElement;
}

export function ExternalLink(props: { href: string }) {
  return (
    <EuiLink
      external={true}
      href={props.href}
      target="_blank"
      className="external-link-inline-block"
    >
      {'Learn more'}
    </EuiLink>
  );
}

export function FormRow(props: FormRowWithChildComponentDeps) {
  return (
    <EuiFormRow
      fullWidth
      label={
        <>
          <EuiText size="xs">
            <b>{props.headerText}</b>
            <i>{props.optional && ' - optional'}</i>
          </EuiText>
          <EuiText color="subdued" size="xs">
            {props.headerSubText}
            {props.helpLink && (
              <>
                {' '}
                <ExternalLink href={props.helpLink} />
              </>
            )}
          </EuiText>
        </>
      }
      helpText={props.helpText}
      isInvalid={props.isInvalid}
      error={props.error}
    >
      {props.children}
    </EuiFormRow>
  );
}

export const HeaderUserMenu = () => {
  const themeOptions = [
    {
      value: 'v7',
      text: 'v7',
    },
    {
      value: 'next',
      text: 'Next (preview)',
    },
  ];
  const screenModeOptions = [
    {
      value: 'light',
      text: 'Light mode',
    },
    {
      value: 'dark',
      text: 'Dark mode',
    },
    {
      value: 'automatic',
      text: 'Use browser settings',
    },
  ];
  const [darkMode, setDarkMode] = useUiSetting$<boolean>('theme:darkMode');
  const [themeVersion, setThemeVersion] = useUiSetting$<string>('theme:version');
  const [isPopoverOpen, setPopover] = useState(false);
  const [theme, setTheme] = useState(themeOptions.find((t) => t.text === themeVersion)?.value);
  const [screenMode, setScreenMode] = useState(
    darkMode ? screenModeOptions[1].value : screenModeOptions[0].value
  );

  console.log(themeVersion);

  const onAvatarClick = () => {
    setPopover(!isPopoverOpen);
  };

  const onThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(`change theme to ${e.target.value}`);
    setTheme(e.target.value);
  };

  const onScreenModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(`change screen mode to ${e.target.value}`);
    setScreenMode(e.target.value);
  };

  const onAppearanceSubmit = (e: SyntheticEvent) => {
    console.log(e);
    // const mainStyleLink = document.querySelector('link[href*="osd-ui-shared-deps.v8.light"]');
    // mainStyleLink?.parentNode?.removeChild(mainStyleLink);

    setThemeVersion(themeOptions.find((t) => theme === t.value)?.text ?? '');
    setDarkMode(screenMode === 'dark');
    window.location.reload();
  };

  const onTenantSwitchRadioChange = (id: string) => {
    console.log(`change tenant radio to ${id}`);
  };

  const onCustomTenantChange = () => {
    console.log('change custom tenant');
  };

  const handleTenantConfirmation = () => {
    console.log('change tenant submit');
  };

  const onChangeCurrentPassword = () => {
    console.log('change current password');
  };

  const onChangeNewPassword = () => {
    console.log('change new password');
  };

  const onChangeNewPasswordReenter = () => {
    console.log('change new password reenter');
  };

  const closePopover = () => {
    setPopover(false);
  };
  const avatar = (
    <EuiButtonEmpty>
      <EuiAvatar name="Anonymous" onClick={onAvatarClick} />
    </EuiButtonEmpty>
  );

  const roles = ['own_index', 'kibana_user', 'all_access', 'readall'];
  const backendRoles = ['admin', 'kibanauser', 'readall'];

  const customTenantOptions = [
    {
      label: 'Custom Tenant 1',
      value: 'tenant1',
    },
    {
      label: 'Custom Tenant 2',
      value: 'tenant2',
    },
  ];

  const tenantSwitchRadios = [
    {
      id: 'GLOBAL_TENANT_RADIO_ID',
      label: (
        <>
          Global
          <EuiText size="s">
            The global tenant is shared between every OpenSearch Dashboards user.
          </EuiText>
          <EuiSpacer />
        </>
      ),
    },
    {
      id: 'PRIVATE_TENANT_RADIO_ID',
      label: (
        <>
          Private
          <EuiText size="s">
            The private tenant is exclusive to each user and can&apos;t be shared. You might use the
            private tenant for exploratory work.
          </EuiText>
          <EuiSpacer />
        </>
      ),
    },
    {
      id: 'CUSTOM_TENANT_RADIO_ID',
      label: <>Choose from custom</>,
      disabled: customTenantOptions.length === 0,
    },
  ];

  const panels: EuiContextMenuPanelDescriptor[] = [
    {
      id: 0,
      title: 'Anonymous',
      items: [
        {
          name: 'Appearance',
          icon: 'color',
          panel: 2,
        },
        {
          name: 'View roles and identities',
          icon: 'users',
          panel: 3,
        },
        {
          name: 'Switch tenant',
          icon: 'inputOutput',
          panel: 4,
        },
        {
          name: 'Reset password',
          icon: 'lock',
          panel: 5,
        },
        {
          name: <EuiText color="danger">Log out</EuiText>,
          icon: <EuiIcon type="exit" color="danger" />,
          onClick: () => {
            closePopover();
          },
        },
      ],
    },
    {
      id: 1,
      initialFocusedItemIndex: 1,
      title: 'Nest panels',
      items: [
        {
          name: 'PDF reports',
          icon: 'user',
          onClick: () => {
            closePopover();
          },
        },
        {
          name: 'Embed code',
          icon: 'user',
          panel: 6,
        },
        {
          name: 'Permalinks',
          icon: 'user',
          onClick: () => {
            closePopover();
          },
        },
      ],
    },
    {
      id: 2,
      initialFocusedItemIndex: 0,
      title: 'Appearance',
      content: (
        <div style={{ padding: 16 }}>
          <EuiCallOut color="warning">
            These settings apply to only this user account. Tochange settings for the entire
            application, visit Advanced Settings or contact your administrator. Learn more
          </EuiCallOut>
          <EuiSpacer />
          <EuiFormRow label="Theme version" helpText="Default: Next (preview)">
            <EuiSelect options={themeOptions} value={theme} onChange={onThemeChange} />
          </EuiFormRow>
          <EuiFormRow label="Screen mode" helpText="Default: Dark mode">
            <EuiSelect
              options={screenModeOptions}
              value={screenMode}
              onChange={onScreenModeChange}
            />
          </EuiFormRow>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow hasEmptyLabelSpace>
                <EuiLink href="#">Theme feedback</EuiLink>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow hasEmptyLabelSpace>
                <EuiButton fill onClick={onAppearanceSubmit} type="submit">
                  Apply
                </EuiButton>
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ),
    },
    {
      id: 3,
      initialFocusedItemIndex: 0,
      title: 'View roles and identities',
      content: (
        <div style={{ padding: 16 }}>
          <EuiTitle size="xs">
            <h4>Roles ({roles.length})</h4>
          </EuiTitle>
          <EuiText color="subdued">
            Roles you are currently mapped to by your administrator.
          </EuiText>
          <EuiSpacer size="xs" />
          {roles.map((item) => (
            <EuiText key={item}>
              <strong>{item}</strong>
            </EuiText>
          ))}
          <EuiHorizontalRule />
          <EuiTitle size="xs">
            <h4>Backend roles ({backendRoles.length})</h4>
          </EuiTitle>
          <EuiText color="subdued">
            Backend roles you are currently mapped to by your administrator.
          </EuiText>
          <EuiSpacer size="xs" />
          {backendRoles.map((item) => (
            <EuiText key={item}>
              <strong>{item}</strong>
            </EuiText>
          ))}
        </div>
      ),
    },
    {
      id: 4,
      initialFocusedItemIndex: 0,
      title: 'Switch tenant',
      content: (
        <div style={{ padding: 16 }}>
          <EuiTitle size="xs">
            <h4>Select your tenant</h4>
          </EuiTitle>

          <EuiText size="s" color="subdued">
            Tenants are useful for safely sharing your work with other OpenSearch Dashboards users.
            You can switch your tenant anytime by clicking the user avatar on top right.
          </EuiText>

          <EuiSpacer />

          <EuiRadioGroup
            data-test-subj="tenant-switch-radios"
            options={tenantSwitchRadios}
            idSelected="GLOBAL_TENANT_RADIO_ID"
            onChange={(radioId) => onTenantSwitchRadioChange(radioId)}
            name="tenantSwitchRadios"
          />

          {/* This combo box has to be outside the radio group.
          In current EUI if put into the child of radio option, clicking in the combo box will not
          show the drop down list since the radio option consumes the click event. */}
          <EuiComboBox
            placeholder="Select a custom tenant"
            options={customTenantOptions}
            singleSelection={{ asPlainText: true }}
            selectedOptions={[customTenantOptions[0]]}
            onChange={onCustomTenantChange}
            // For vertical alignment with the radio option.
            style={{ marginLeft: '24px' }}
          />

          <EuiSpacer />
          <EuiTextAlign textAlign="right">
            <EuiButton data-test-subj="confirm" fill onClick={handleTenantConfirmation}>
              Confirm
            </EuiButton>
          </EuiTextAlign>
        </div>
      ),
    },
    {
      id: 5,
      initialFocusedItemIndex: 0,
      title: 'Reset password',
      content: (
        <div style={{ padding: 16 }}>
          <FormRow
            headerText="Current password"
            helpText="Verify your account by entering your current password."
          >
            <EuiFieldPassword
              data-test-subj="current-password"
              onChange={onChangeCurrentPassword}
            />
          </FormRow>

          <FormRow headerText="New password">
            <EuiFieldPassword data-test-subj="new-password" onChange={onChangeNewPassword} />
          </FormRow>

          <FormRow
            headerText="Re-enter new password"
            helpText="The password must be identical to what you entered above."
          >
            <EuiFieldPassword
              data-test-subj="reenter-new-password"
              onChange={onChangeNewPasswordReenter}
            />
          </FormRow>

          <EuiSpacer />
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow hasEmptyLabelSpace>
                <EuiButtonEmpty>Cancel</EuiButtonEmpty>
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow hasEmptyLabelSpace>
                <EuiButton fill>Reset</EuiButton>
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ),
    },
  ];

  return (
    <EuiPopover
      id="contextMenuExample"
      button={avatar}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};

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

import React from 'react';
import { Observable } from 'rxjs';
import { act } from 'react-dom/test-utils';
import { ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { I18nProvider } from '@osd/i18n/react';
import { mountWithI18nProvider, nextTick } from 'test_utils/enzyme_helpers';
import dedent from 'dedent';
import {
  PublicUiSettingsParams,
  UserProvidedValues,
  UiSettingsType,
  IUiSettingsClient,
  ApplicationStart,
  UiSettingScope,
  ENABLE_GLOBAL_SETTING_CONTROL,
} from '../../../../core/public';
import { FieldSetting } from './types';
import { AdvancedSettingsComponent } from './advanced_settings';
import {
  notificationServiceMock,
  docLinksServiceMock,
  applicationServiceMock,
} from '../../../../core/public/mocks';
import { ComponentRegistry } from '../component_registry';
import { navigationPluginMock } from '../../../navigation/public/mocks';

jest.mock('./components/field', () => ({
  Field: () => {
    return 'field';
  },
}));

jest.mock('./components/call_outs', () => ({
  CallOuts: () => {
    return 'callOuts';
  },
}));

jest.mock('./components/search', () => ({
  Search: () => {
    return 'search';
  },
}));

interface MockConfigOptions {
  // Extra settings merged into getAll(), e.g. ones carrying an explicit scope.
  extraSettings?: Record<string, any>;
  // User-provided values returned by getUserProvidedForScope(), keyed by scope.
  userProvidedForScope?: Partial<Record<UiSettingScope, Record<string, UserProvidedValues>>>;
}

function mockConfig(options: MockConfigOptions = {}) {
  const defaultConfig: Partial<FieldSetting> = {
    displayName: 'defaultName',
    requiresPageReload: false,
    isOverridden: false,
    isPermissionControlled: false,
    ariaName: 'ariaName',
    readOnly: false,
    isCustom: false,
    defVal: 'defVal',
    type: 'string' as UiSettingsType,
    category: ['category'],
  };

  const getAll = (): Readonly<Record<string, PublicUiSettingsParams & UserProvidedValues>> => {
    return {
      'test:array:setting': {
        ...defaultConfig,
        value: ['default_value'],
        name: 'Test array setting',
        description: 'Description for Test array setting',
        category: ['opensearch'],
      },
      'test:boolean:setting': {
        ...defaultConfig,
        value: true,
        name: 'Test boolean setting',
        description: 'Description for Test boolean setting',
        category: ['opensearch'],
      },
      'test:image:setting': {
        ...defaultConfig,
        value: null,
        name: 'Test image setting',
        description: 'Description for Test image setting',
        type: 'image',
      },
      'test:json:setting': {
        ...defaultConfig,
        value: '{"foo": "bar"}',
        name: 'Test json setting',
        description: 'Description for Test json setting',
        type: 'json',
      },
      'test:markdown:setting': {
        ...defaultConfig,
        value: '',
        name: 'Test markdown setting',
        description: 'Description for Test markdown setting',
        type: 'markdown',
      },
      'test:number:setting': {
        ...defaultConfig,
        value: 5,
        name: 'Test number setting',
        description: 'Description for Test number setting',
      },
      'test:select:setting': {
        ...defaultConfig,
        value: 'orange',
        name: 'Test select setting',
        description: 'Description for Test select setting',
        type: 'select',
        options: ['apple', 'orange', 'banana'],
      },
      'test:string:setting': {
        ...defaultConfig,
        ...{
          value: null,
          name: 'Test string setting',
          description: 'Description for Test string setting',
          type: 'string',
          isCustom: true,
        },
      },
      'test:readonlystring:setting': {
        ...defaultConfig,
        ...{
          value: null,
          name: 'Test readonly string setting',
          description: 'Description for Test readonly string setting',
          type: 'string',
          readOnly: true,
        },
      },
      'test:customstring:setting': {
        ...defaultConfig,
        ...{
          value: null,
          name: 'Test custom string setting',
          description: 'Description for Test custom string setting',
          type: 'string',
          isCustom: true,
        },
      },
      'test:isOverridden:string': {
        ...defaultConfig,
        isOverridden: true,
        value: 'foo',
        name: 'An overridden string',
        description: 'Description for overridden string',
        type: 'string',
      },
      'test:isOverridden:number': {
        ...defaultConfig,
        isOverridden: true,
        value: 1234,
        name: 'An overridden number',
        description: 'Description for overridden number',
        type: 'number',
      },
      'test:isOverridden:json': {
        ...defaultConfig,
        isOverridden: true,
        value: dedent`
          {
            "foo": "bar"
          }
        `,
        name: 'An overridden json',
        description: 'Description for overridden json',
        type: 'json',
      },
      'test:isOverridden:select': {
        ...defaultConfig,
        isOverridden: true,
        value: 'orange',
        name: 'Test overridden select setting',
        description: 'Description for overridden select setting',
        type: 'select',
        options: ['apple', 'orange', 'banana'],
      },
      'test:isPermissionControlled:string': {
        ...defaultConfig,
        isOverridden: true,
        value: 'foo',
        name: 'An permission controlled string',
        description: 'Description for permission controlled string',
        type: 'string',
      },
      ...options.extraSettings,
    };
  };

  const setMock = jest.fn((key: string, value: any, scope?: UiSettingScope) =>
    Promise.resolve(true)
  );
  const getUserProvidedForScopeMock = jest.fn((scope: UiSettingScope) =>
    Promise.resolve(options.userProvidedForScope?.[scope] ?? {})
  );

  const config: IUiSettingsClient = {
    set: setMock,
    remove: (key: string) => Promise.resolve(true),
    isCustom: (key: string) => false,
    isOverridden: (key: string) => Boolean(config.getAll()[key].isOverridden),
    overrideLocalDefault: (key: string, value: any) => {},
    getUpdate$: () =>
      new Observable<{
        key: string;
        newValue: any;
        oldValue: any;
      }>(),
    isDeclared: (key: string) => true,
    isDefault: (key: string) => true,

    getSaved$: () =>
      new Observable<{
        key: string;
        newValue: any;
        oldValue: any;
      }>(),
    getUpdateErrors$: () => new Observable<Error>(),
    get: (key: string, defaultOverride?: any): any => config.getAll()[key] || defaultOverride,
    get$: (key: string) => new Observable<any>(config.get(key)),
    getAll,
    getUserProvidedWithScope: ((key) =>
      Promise.resolve(config.getAll()[key])) as IUiSettingsClient['getUserProvidedWithScope'],
    getUserProvidedForScope: getUserProvidedForScopeMock as IUiSettingsClient['getUserProvidedForScope'],
    getDefault: jest.fn() as IUiSettingsClient['getDefault'],
  };
  return {
    core: {
      uiSettings: config,
    },
    plugins: {
      advancedSettings: {
        componentRegistry: {
          get: () => {
            const foo: React.ComponentType = () => <div>Hello</div>;
            foo.displayName = 'foo_component';
            return foo;
          },
          componentType: {
            PAGE_TITLE_COMPONENT: 'page_title_component',
            PAGE_SUBTITLE_COMPONENT: 'page_subtitle_component',
          },
        },
      },
    },
  };
}

const navigationUI = navigationPluginMock.createStartContract().ui;
const applicationMock = applicationServiceMock.createStartContract();

// Builds an application start contract with custom capabilities. Capabilities on the
// default mock are deep-frozen, so we replace the whole object instead of mutating it.
const applicationWithCapabilities = (capabilities: Record<string, any>): ApplicationStart => ({
  ...applicationServiceMock.createStartContract(),
  capabilities: {
    catalogue: {},
    management: {},
    navLinks: {},
    ...capabilities,
  } as ApplicationStart['capabilities'],
});

// Mounts the component and drains the async fetchScopedValues() so the wrapper leaves
// its initial loading state before assertions run. The mount + flush happen inside
// act() so the React 18 enzyme adapter reconciles the async setState.
async function mountAndLoad(element: React.ReactElement): Promise<ReactWrapper<any, any>> {
  // Mount the provider root ourselves (rather than mountWithI18nProvider, which returns
  // a child sub-wrapper) so update() reconciles the async setState onto the tree.
  let root: ReactWrapper<any, any>;
  await act(async () => {
    root = mount(<I18nProvider>{element}</I18nProvider>);
    // Drain the nested Promise.all chains in fetchScopedValues before act() exits.
    await nextTick();
    await nextTick();
    await nextTick();
  });
  root!.update();
  return root!.find('AdvancedSettingsComponent');
}

const findSetting = (component: ReactWrapper<any, any>, name: string) =>
  component
    .find('Field')
    .filterWhere((n: ReactWrapper) => (n.prop('setting') as Record<string, string>).name === name);

// Common props for the component, so scope/save tests only spell out what they vary.
const baseProps = () => ({
  enableSaving: true,
  toasts: notificationServiceMock.createStartContract().toasts,
  dockLinks: docLinksServiceMock.createStartContract().links,
  componentRegistry: new ComponentRegistry().start,
  useUpdatedUX: false,
  navigationUI,
  application: applicationMock,
});

describe('AdvancedSettings', () => {
  it('should show a loading spinner before the scoped values resolve', () => {
    const component = mountWithI18nProvider(
      <AdvancedSettingsComponent
        queryText="test:string:setting"
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
      />
    );

    expect(component.find('[data-test-subj="advancedSettingsLoading"]').exists()).toBe(true);
    expect(component.find('Field')).toHaveLength(0);
  });

  it('should render specific setting if given setting key', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:string:setting"
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
      />
    );

    expect(findSetting(component, 'test:string:setting')).toHaveLength(1);
  });

  it('should render read-only when saving is disabled', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:string:setting"
        enableSaving={false}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
      />
    );

    expect(findSetting(component, 'test:string:setting').prop('enableSaving')).toBe(false);
  });

  it('should render read-only when global settings are restricted to non-admins', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:isPermissionControlled:string"
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationWithCapabilities({
          globalScopeEditable: { enabled: false },
          dashboards: { isDashboardAdmin: false },
        })}
      />
    );

    expect(
      findSetting(component, 'test:isPermissionControlled:string').prop('setting')
    ).toMatchObject({ isPermissionControlled: true });
  });

  it('should not permission-control global settings for dashboard admins', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:isPermissionControlled:string"
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationWithCapabilities({
          globalScopeEditable: { enabled: false },
          dashboards: { isDashboardAdmin: true },
        })}
      />
    );

    expect(
      findSetting(component, 'test:isPermissionControlled:string').prop('setting')
    ).toMatchObject({ isPermissionControlled: false });
  });

  it('should show the load error state when fetching scoped values fails', async () => {
    const uiSettings = mockConfig().core.uiSettings;
    uiSettings.getUserProvidedForScope = (() =>
      Promise.reject(new Error('boom'))) as IUiSettingsClient['getUserProvidedForScope'];

    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:string:setting"
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
      />
    );

    expect(component.find('[data-test-subj="advancedSettingsLoadError"]').exists()).toBe(true);
    expect(component.find('Field')).toHaveLength(0);
  });

  it('should hide the call outs on a scoped page', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText=""
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
        scope={UiSettingScope.WORKSPACE}
      />
    );

    expect(component.find('CallOuts')).toHaveLength(0);
  });

  it('should render the call outs on the application page', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText=""
        enableSaving={true}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={false}
        navigationUI={navigationUI}
        application={applicationMock}
      />
    );

    expect(component.find('CallOuts')).toHaveLength(1);
  });

  it('should render normally when use updated UX', async () => {
    const component = await mountAndLoad(
      <AdvancedSettingsComponent
        queryText="test:string:setting"
        enableSaving={false}
        toasts={notificationServiceMock.createStartContract().toasts}
        dockLinks={docLinksServiceMock.createStartContract().links}
        uiSettings={mockConfig().core.uiSettings}
        componentRegistry={new ComponentRegistry().start}
        useUpdatedUX={true}
        navigationUI={{ HeaderControl: () => null, TopNavMenu: () => null }}
        application={applicationServiceMock.createStartContract()}
      />
    );

    expect(component).toMatchSnapshot();
  });

  describe('fetchScopedValues - scope reading', () => {
    it('should read GLOBAL and DASHBOARD_ADMIN on the application page when permission control is on', async () => {
      const { core } = mockConfig();
      await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationWithCapabilities({
            advancedSettings: { permissionControlEnabled: true },
          })}
        />
      );

      const scopesRead = (core.uiSettings.getUserProvidedForScope as jest.Mock).mock.calls.map(
        ([scope]) => scope
      );
      expect(scopesRead).toContain(UiSettingScope.GLOBAL);
      expect(scopesRead).toContain(UiSettingScope.DASHBOARD_ADMIN);
    });

    it('should only read GLOBAL on the application page when permission control is off', async () => {
      const { core } = mockConfig();
      await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
        />
      );

      const scopesRead = (core.uiSettings.getUserProvidedForScope as jest.Mock).mock.calls.map(
        ([scope]) => scope
      );
      expect(scopesRead).toEqual([UiSettingScope.GLOBAL]);
    });

    [UiSettingScope.WORKSPACE, UiSettingScope.USER].forEach((pageScope) => {
      it(`should read the page scope (${pageScope}) and also GLOBAL for inheritance on a scoped page`, async () => {
        const { core } = mockConfig();
        await mountAndLoad(
          <AdvancedSettingsComponent
            {...baseProps()}
            queryText=""
            uiSettings={core.uiSettings}
            application={applicationMock}
            scope={pageScope}
          />
        );

        const scopesRead = (core.uiSettings.getUserProvidedForScope as jest.Mock).mock.calls.map(
          ([scope]) => scope
        );
        expect(scopesRead).toContain(pageScope);
        expect(scopesRead).toContain(UiSettingScope.GLOBAL);
      });
    });
  });

  describe('belongsToScope filtering', () => {
    const buildSetting = (scope: UiSettingScope | UiSettingScope[]) => ({
      'test:scoped:only': {
        displayName: 'Scoped only setting',
        requiresPageReload: false,
        isOverridden: false,
        isPermissionControlled: false,
        ariaName: 'ariaName',
        readOnly: false,
        isCustom: false,
        defVal: 'defVal',
        type: 'string' as UiSettingsType,
        category: ['category'],
        value: null,
        name: 'Test scoped only setting',
        description: 'A setting registered only for a specific scope',
        scope,
      },
    });

    it('should show a WORKSPACE-only setting on the WORKSPACE page', async () => {
      const { core } = mockConfig({ extraSettings: buildSetting(UiSettingScope.WORKSPACE) });
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
          scope={UiSettingScope.WORKSPACE}
        />
      );

      expect(findSetting(component, 'test:scoped:only')).toHaveLength(1);
    });

    it('should hide a USER-only setting from the WORKSPACE page', async () => {
      const { core } = mockConfig({ extraSettings: buildSetting(UiSettingScope.USER) });
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
          scope={UiSettingScope.WORKSPACE}
        />
      );

      expect(findSetting(component, 'test:scoped:only')).toHaveLength(0);
    });

    it('should hide a WORKSPACE-only setting from the application (global) page', async () => {
      const { core } = mockConfig({ extraSettings: buildSetting(UiSettingScope.WORKSPACE) });
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
        />
      );

      expect(findSetting(component, 'test:scoped:only')).toHaveLength(0);
    });
  });

  describe('value inheritance and provenance on a scoped page', () => {
    // Registered for both scoped pages plus GLOBAL, so it appears on WORKSPACE and USER pages.
    const scopedSetting = {
      'test:scoped:setting': {
        displayName: 'Scoped setting',
        requiresPageReload: false,
        isOverridden: false,
        isPermissionControlled: false,
        ariaName: 'ariaName',
        readOnly: false,
        isCustom: false,
        defVal: 'defVal',
        type: 'string' as UiSettingsType,
        category: ['category'],
        value: null,
        name: 'Test scoped setting',
        description: 'A scoped setting',
        scope: [UiSettingScope.WORKSPACE, UiSettingScope.USER, UiSettingScope.GLOBAL],
      },
    };

    [UiSettingScope.WORKSPACE, UiSettingScope.USER].forEach((pageScope) => {
      it(`should prefer the page scope (${pageScope}) value over the inherited GLOBAL value`, async () => {
        const { core } = mockConfig({
          extraSettings: scopedSetting,
          userProvidedForScope: {
            [pageScope]: { 'test:scoped:setting': { userValue: 'scopedValue' } },
            [UiSettingScope.GLOBAL]: { 'test:scoped:setting': { userValue: 'globalValue' } },
          },
        });

        const component = await mountAndLoad(
          <AdvancedSettingsComponent
            {...baseProps()}
            queryText=""
            uiSettings={core.uiSettings}
            application={applicationMock}
            scope={pageScope}
          />
        );

        expect(findSetting(component, 'test:scoped:setting').prop('setting')).toMatchObject({
          value: 'scopedValue',
          isUserProvided: true,
          inheritedValue: 'globalValue',
        });
      });

      it(`should fall back to the inherited GLOBAL value on the ${pageScope} page when it has no value`, async () => {
        const { core } = mockConfig({
          extraSettings: scopedSetting,
          userProvidedForScope: {
            [UiSettingScope.GLOBAL]: { 'test:scoped:setting': { userValue: 'globalValue' } },
          },
        });

        const component = await mountAndLoad(
          <AdvancedSettingsComponent
            {...baseProps()}
            queryText=""
            uiSettings={core.uiSettings}
            application={applicationMock}
            scope={pageScope}
          />
        );

        expect(findSetting(component, 'test:scoped:setting').prop('setting')).toMatchObject({
          value: 'globalValue',
          isUserProvided: false,
          inheritedValue: 'globalValue',
        });
      });
    });
  });

  describe('ENABLE_GLOBAL_SETTING_CONTROL toggle default', () => {
    const toggleSetting = {
      [ENABLE_GLOBAL_SETTING_CONTROL]: {
        displayName: 'Global setting control',
        requiresPageReload: false,
        isOverridden: false,
        isPermissionControlled: false,
        ariaName: 'ariaName',
        readOnly: false,
        isCustom: false,
        defVal: false,
        type: 'boolean' as UiSettingsType,
        category: ['category'],
        value: false,
        name: 'Global setting control',
        description: 'Restrict global settings to admins',
      },
    };

    it('should display the dynamic-config-derived value when the toggle has no stored value', async () => {
      const { core } = mockConfig({ extraSettings: toggleSetting });

      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationWithCapabilities({
            globalScopeEditable: { enabled: false },
            dashboards: { isDashboardAdmin: true },
          })}
        />
      );

      // globalScopeEditable.enabled === false => restrictGlobalToAdmins is true.
      expect(findSetting(component, ENABLE_GLOBAL_SETTING_CONTROL).prop('setting')).toMatchObject({
        value: true,
      });
    });

    it('should let an explicit stored toggle value take precedence over globalScopeEditable', async () => {
      const { core } = mockConfig({
        extraSettings: toggleSetting,
        userProvidedForScope: {
          [UiSettingScope.GLOBAL]: { [ENABLE_GLOBAL_SETTING_CONTROL]: { userValue: false } },
        },
      });

      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationWithCapabilities({
            // Legacy flag says restrict, but the explicit stored toggle says don't.
            globalScopeEditable: { enabled: false },
            dashboards: { isDashboardAdmin: true },
          })}
        />
      );

      expect(findSetting(component, ENABLE_GLOBAL_SETTING_CONTROL).prop('setting')).toMatchObject({
        value: false,
      });
    });
  });

  describe('saveConfig - scope routing', () => {
    it('should write GLOBAL settings to the GLOBAL scope on the application page', async () => {
      const { core } = mockConfig();
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
        />
      );

      const instance = component.instance() as any;
      await act(async () => {
        await instance.saveConfig({ 'test:string:setting': 'newValue' });
      });

      expect(core.uiSettings.set).toHaveBeenCalledWith(
        'test:string:setting',
        'newValue',
        UiSettingScope.GLOBAL
      );
    });

    it('should write DASHBOARD_ADMIN settings to the DASHBOARD_ADMIN scope on the application page', async () => {
      const { core } = mockConfig({
        extraSettings: {
          'test:admin:setting': {
            displayName: 'Admin setting',
            requiresPageReload: false,
            isOverridden: false,
            isPermissionControlled: false,
            ariaName: 'ariaName',
            readOnly: false,
            isCustom: false,
            defVal: 'defVal',
            type: 'string' as UiSettingsType,
            category: ['category'],
            value: null,
            name: 'Admin setting',
            description: 'An admin-scoped setting',
            scope: UiSettingScope.DASHBOARD_ADMIN,
          },
        },
      });
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationWithCapabilities({
            advancedSettings: { permissionControlEnabled: true },
            dashboards: { isDashboardAdmin: true },
          })}
        />
      );

      const instance = component.instance() as any;
      await act(async () => {
        await instance.saveConfig({ 'test:admin:setting': 'adminValue' });
      });

      expect(core.uiSettings.set).toHaveBeenCalledWith(
        'test:admin:setting',
        'adminValue',
        UiSettingScope.DASHBOARD_ADMIN
      );
    });

    [UiSettingScope.WORKSPACE, UiSettingScope.USER].forEach((pageScope) => {
      it(`should write to the page scope (${pageScope}) on a scoped page`, async () => {
        const { core } = mockConfig();
        const component = await mountAndLoad(
          <AdvancedSettingsComponent
            {...baseProps()}
            queryText=""
            uiSettings={core.uiSettings}
            application={applicationMock}
            scope={pageScope}
          />
        );

        const instance = component.instance() as any;
        await act(async () => {
          await instance.saveConfig({ 'test:string:setting': 'scopedValue' });
        });

        expect(core.uiSettings.set).toHaveBeenCalledWith(
          'test:string:setting',
          'scopedValue',
          pageScope
        );
      });
    });

    it('should fold a successful write into scopedUserProvided', async () => {
      const { core } = mockConfig();
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
          scope={UiSettingScope.WORKSPACE}
        />
      );

      const instance = component.instance() as any;
      await act(async () => {
        await instance.saveConfig({ 'test:string:setting': 'wsValue' });
      });

      expect(instance.scopedUserProvided['test:string:setting']).toMatchObject({
        userValue: 'wsValue',
      });
    });

    it('should clear the key from scopedUserProvided when the value is null', async () => {
      const { core } = mockConfig({
        userProvidedForScope: {
          [UiSettingScope.WORKSPACE]: { 'test:string:setting': { userValue: 'old' } },
        },
      });
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
          scope={UiSettingScope.WORKSPACE}
        />
      );

      const instance = component.instance() as any;
      expect(instance.scopedUserProvided['test:string:setting']).toBeDefined();

      await act(async () => {
        await instance.saveConfig({ 'test:string:setting': null });
      });

      expect(instance.scopedUserProvided['test:string:setting']).toBeUndefined();
    });

    it('should not fold the value into scopedUserProvided when the write fails', async () => {
      const { core } = mockConfig();
      (core.uiSettings.set as jest.Mock).mockResolvedValueOnce(false);
      const component = await mountAndLoad(
        <AdvancedSettingsComponent
          {...baseProps()}
          queryText=""
          uiSettings={core.uiSettings}
          application={applicationMock}
          scope={UiSettingScope.WORKSPACE}
        />
      );

      const instance = component.instance() as any;
      await act(async () => {
        await instance.saveConfig({ 'test:string:setting': 'wsValue' });
      });

      expect(instance.scopedUserProvided['test:string:setting']).toBeUndefined();
    });
  });
});

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

import { Component } from 'react';
import {
  Comparators,
  EuiButton,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiSpacer,
  Query,
} from '@elastic/eui';

import { useParams } from 'react-router-dom';
import { FormattedMessage } from '@osd/i18n/react';
import { CallOuts } from './components/call_outs';
import { Search } from './components/search';
import { Form } from './components/form';
import { AdvancedSettingsVoiceAnnouncement } from './components/advanced_settings_voice_announcement';
import {
  IUiSettingsClient,
  DocLinksStart,
  ToastsStart,
  ApplicationStart,
  UserProvidedValues,
} from '../../../../core/public/';
import { ComponentRegistry } from '../';

import {
  getAriaName,
  toEditableConfig,
  DEFAULT_CATEGORY,
  ADMIN_CATEGORY,
  toScopeArray,
} from './lib';

import { FieldSetting, SettingsChanges } from './types';
import { NavigationPublicPluginStart } from '../../../../plugins/navigation/public';
import { UiSettingScope, ENABLE_GLOBAL_SETTING_CONTROL } from '../../../../core/public';

interface AdvancedSettingsProps {
  enableSaving: boolean;
  uiSettings: IUiSettingsClient;
  dockLinks: DocLinksStart['links'];
  toasts: ToastsStart;
  componentRegistry: ComponentRegistry['start'];
  useUpdatedUX: boolean;
  navigationUI: NavigationPublicPluginStart['ui'];
  application: ApplicationStart;
  scope?: UiSettingScope;
}

interface AdvancedSettingsComponentProps extends AdvancedSettingsProps {
  queryText: string;
}

interface AdvancedSettingsState {
  footerQueryMatched: boolean;
  query: Query;
  filteredSettings: Record<string, FieldSetting[]>;
  loading: boolean;
  loadError: boolean;
}

type GroupedSettings = Record<string, FieldSetting[]>;

const getPageScopes = (
  scope: UiSettingScope | undefined,
  permissionControlEnabled: boolean
): UiSettingScope[] => {
  if (scope) {
    return [scope];
  }
  // Application page edits GLOBAL, plus DASHBOARD_ADMIN only when permission control
  // is on. Without it there is no admin area, so skip reading the admin scope.
  return permissionControlEnabled
    ? [UiSettingScope.GLOBAL, UiSettingScope.DASHBOARD_ADMIN]
    : [UiSettingScope.GLOBAL];
};

export class AdvancedSettingsComponent extends Component<
  AdvancedSettingsComponentProps,
  AdvancedSettingsState
> {
  private settings: FieldSetting[];
  private groupedSettings: GroupedSettings;
  private categoryCounts: Record<string, number>;
  private categories: string[] = [];
  private isMounted = false;
  private scopedUserProvided: Record<string, UserProvidedValues> = {};
  private inheritedFromGlobal: Record<string, UserProvidedValues> = {};

  constructor(props: AdvancedSettingsComponentProps) {
    super(props);

    this.settings = this.initSettings(this.props.uiSettings);
    this.groupedSettings = this.initGroupedSettings(this.settings);
    this.categories = this.initCategories(this.groupedSettings);
    this.categoryCounts = this.initCategoryCounts(this.groupedSettings);

    const parsedQuery = Query.parse(this.props.queryText ? getAriaName(this.props.queryText) : '');
    this.state = {
      query: parsedQuery,
      footerQueryMatched: false,
      filteredSettings: this.mapSettings(Query.execute(parsedQuery, this.settings)),
      loading: true,
      loadError: false,
    };
  }

  fetchScopedValues = async () => {
    const { uiSettings, scope, application } = this.props;
    const isScopedPage = scope !== undefined && scope !== UiSettingScope.GLOBAL;
    const permissionControlEnabled = !!application.capabilities.advancedSettings
      ?.permissionControlEnabled;

    const merged: Record<string, UserProvidedValues> = {};

    try {
      const [, inherited] = await Promise.all([
        // This page's own scope layer(s) — drives the displayed value and provenance.
        Promise.all(
          getPageScopes(scope, permissionControlEnabled).map(async (s) => {
            Object.assign(merged, await uiSettings.getUserProvidedForScope(s));
          })
        ),
        // On a scoped page, also read the GLOBAL layer so a setting with no value in
        // this scope can show the effective value it inherits.
        isScopedPage
          ? uiSettings.getUserProvidedForScope(UiSettingScope.GLOBAL)
          : Promise.resolve({} as Record<string, UserProvidedValues>),
      ]);

      this.scopedUserProvided = merged;
      this.inheritedFromGlobal = inherited;
      if (!this.isMounted) return;

      this.init(this.props.uiSettings);
      this.setState((state) => ({
        filteredSettings: this.mapSettings(Query.execute(state.query, this.settings)),
        loading: false,
        loadError: false,
      }));
    } catch (e) {
      if (!this.isMounted) return;
      this.setState({ loading: false, loadError: true });
    }
  };

  init(config: IUiSettingsClient) {
    this.settings = this.initSettings(config);
    this.groupedSettings = this.initGroupedSettings(this.settings);
    this.categories = this.initCategories(this.groupedSettings);
    this.categoryCounts = this.initCategoryCounts(this.groupedSettings);
  }

  initSettings = this.mapConfig;
  initGroupedSettings = this.mapSettings;
  initCategories(groupedSettings: GroupedSettings) {
    return Object.keys(groupedSettings).sort((a, b) => {
      // Admin settings come first, then the default "general" category.
      if (a === ADMIN_CATEGORY) return -1;
      if (b === ADMIN_CATEGORY) return 1;
      if (a === DEFAULT_CATEGORY) return -1;
      if (b === DEFAULT_CATEGORY) return 1;
      if (a > b) return 1;
      return a === b ? 0 : -1;
    });
  }
  initCategoryCounts(groupedSettings: GroupedSettings) {
    return Object.keys(groupedSettings).reduce(
      (counts: Record<string, number>, category: string) => {
        counts[category] = groupedSettings[category].length;
        return counts;
      },
      {}
    );
  }

  componentDidMount() {
    this.isMounted = true;
    this.fetchScopedValues();

    // scrolls to setting provided in the URL hash
    const { hash } = window.location;
    if (hash !== '') {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        let globalNavOffset = 0;

        const globalNavBars = document
          .getElementById('globalHeaderBars')
          ?.getElementsByClassName('euiHeader');

        if (globalNavBars) {
          Array.from(globalNavBars).forEach((navBar) => {
            globalNavOffset += (navBar as HTMLDivElement).offsetHeight;
          });
        }

        if (element) {
          element.scrollIntoView();
          window.scrollBy(0, -globalNavOffset); // offsets scroll by height of the global nav
        }
      }, 0);
    }
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  mapConfig(config: IUiSettingsClient) {
    const all = config.getAll();
    const userSettingsEnabled = config.get('theme:enableUserControl');
    const isDashboardAdmin = !!this.props.application.capabilities.dashboards?.isDashboardAdmin;
    const pageScope = this.props.scope;
    // Values stored in this page's own scope(s).
    const pageScopeValues = this.scopedUserProvided;

    // Effective "restrict global settings to admins" flag: an explicit admin toggle
    // is the source of truth, else fall back to the legacy globalScopeEditable.
    const adminToggleValue = pageScopeValues[ENABLE_GLOBAL_SETTING_CONTROL]?.userValue;
    const globalScopeEditable = this.props.application.capabilities.globalScopeEditable?.enabled as
      | boolean
      | undefined;
    const restrictGlobalToAdmins =
      adminToggleValue !== undefined ? !!adminToggleValue : globalScopeEditable === false;

    // A setting belongs on a page when its registered scope matches: the Application
    // page shows GLOBAL/DASHBOARD_ADMIN (unscoped counts as GLOBAL); a scoped page
    // shows only its own scope.
    const belongsToScope = (setting: { scope?: UiSettingScope | UiSettingScope[] }) => {
      const scopes = toScopeArray(setting.scope);
      if (pageScope) {
        return scopes.includes(pageScope);
      }
      return (
        scopes.includes(UiSettingScope.GLOBAL) || scopes.includes(UiSettingScope.DASHBOARD_ADMIN)
      );
    };

    return Object.entries(all)
      .filter(([, setting]) => belongsToScope(setting))
      .map(([key, def]) => {
        const pageScopeValue = pageScopeValues[key];
        const isOverridden = config.isOverridden(key);
        const hasStoredValue = pageScopeValue?.userValue !== undefined;
        // The value inherited from the Application (global) scope on a scoped page.
        const inheritedValue = this.inheritedFromGlobal[key]?.userValue;

        // Displayed value: this scope's stored value, else the inherited global value
        // , else the code default.
        let displayedValue = hasStoredValue
          ? pageScopeValue.userValue
          : inheritedValue ?? undefined;
        // The global-control toggle has no stored value until an admin sets it; show
        // its effective (dynamic-config-derived) value so an upgraded deployment
        // reflects the pre-existing state instead of the code default (off).
        if (key === ENABLE_GLOBAL_SETTING_CONTROL && !hasStoredValue) {
          displayedValue = restrictGlobalToAdmins;
        }

        // DASHBOARD_ADMIN settings are always admin-only. GLOBAL settings are too while
        // restriction is on — but only on the Application page (which edits GLOBAL); a
        // GLOBAL+USER setting edited on a scoped page touches its own scope, not GLOBAL.
        const scopes = toScopeArray(def.scope);
        const globalLocked =
          !pageScope && restrictGlobalToAdmins && scopes.includes(UiSettingScope.GLOBAL);
        const isPermissionControlled =
          (scopes.includes(UiSettingScope.DASHBOARD_ADMIN) || globalLocked) && !isDashboardAdmin;

        return toEditableConfig({
          def,
          name: key,
          value: displayedValue,
          isCustom: config.isCustom(key),
          isOverridden,
          isPermissionControlled,
          userSettingsEnabled,
          isUserProvided: pageScope ? hasStoredValue && !isOverridden : undefined,
          inheritedValue: pageScope ? inheritedValue : undefined,
        });
      })
      .filter((c) => !c.readonly)
      .sort(Comparators.property('name', Comparators.default('asc')));
  }

  mapSettings(settings: FieldSetting[]) {
    // Group settings by category
    return settings.reduce((groupedSettings: GroupedSettings, setting) => {
      // We will want to change this logic when we put each category on its
      // own page aka allowing a setting to be included in multiple categories.
      const category = setting.category[0];
      (groupedSettings[category] = groupedSettings[category] || []).push(setting);
      return groupedSettings;
    }, {});
  }

  onQueryChange = ({ query }: { query: Query }) => {
    this.setState({
      query,
      filteredSettings: this.mapSettings(Query.execute(query, this.settings)),
    });
  };

  clearQuery = () => {
    this.setState({
      query: Query.parse(''),
      footerQueryMatched: false,
      filteredSettings: this.groupedSettings,
    });
  };

  onFooterQueryMatchChange = (matched: boolean) => {
    this.setState({
      footerQueryMatched: matched,
    });
  };

  saveConfig = async (changes: SettingsChanges) => {
    const { uiSettings, scope } = this.props;
    const all = uiSettings.getAll();
    const arr = Object.entries(changes).map(([key, value]) => {
      // Always write with an explicit scope so the value lands in the exact layer
      // this page edits (and so the client's merged-cache "unchanged" de-dup never
      // suppresses the request). On a dedicated page that is the page scope; on the
      // Application page it is DASHBOARD_ADMIN for admin settings, otherwise GLOBAL.
      let effectiveScope = scope;
      if (!effectiveScope) {
        const scopes = toScopeArray(all[key]?.scope);
        effectiveScope = scopes.includes(UiSettingScope.DASHBOARD_ADMIN)
          ? UiSettingScope.DASHBOARD_ADMIN
          : UiSettingScope.GLOBAL;
      }
      return uiSettings.set(key, value, effectiveScope);
    });
    const results = await Promise.all(arr);

    Object.keys(changes).forEach((key, i) => {
      // Write failed show the last persisted state.
      if (!results[i]) {
        return;
      }
      // A null value clears the key (back to inherited); any other value stores it.
      if (changes[key] === null || changes[key] === undefined) {
        delete this.scopedUserProvided[key];
      } else {
        this.scopedUserProvided[key] = {
          ...this.scopedUserProvided[key],
          userValue: changes[key],
        };
      }
    });

    // Re-render from the freshly folded scoped values / rolled-back client cache so the
    // displayed value stays truthful for both the succeeded and failed keys.
    this.init(this.props.uiSettings);
    this.setState((state) => ({
      filteredSettings: this.mapSettings(Query.execute(state.query, this.settings)),
    }));

    return results;
  };

  render() {
    const { filteredSettings, query, footerQueryMatched, loading } = this.state;
    const { componentRegistry, scope } = this.props;

    const PageTitle = componentRegistry.get(componentRegistry.componentType.PAGE_TITLE_COMPONENT);
    const PageSubtitle = componentRegistry.get(
      componentRegistry.componentType.PAGE_SUBTITLE_COMPONENT
    );
    const PageFooter = componentRegistry.get(componentRegistry.componentType.PAGE_FOOTER_COMPONENT);

    // Only show caution in application setting page.
    const showCallOuts = scope === undefined;

    const renderHeader = () => {
      if (!this.props.useUpdatedUX) {
        return (
          <>
            <EuiFlexGroup gutterSize="none">
              <EuiFlexItem>
                <PageTitle />
              </EuiFlexItem>
              <EuiFlexItem>
                <Search
                  query={query}
                  categories={this.categories}
                  onQueryChange={this.onQueryChange}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
            <PageSubtitle />
            <EuiSpacer size="m" />
            {showCallOuts && (
              <>
                <CallOuts />
                <EuiSpacer size="m" />
              </>
            )}
          </>
        );
      } else {
        const { HeaderControl } = this.props.navigationUI;
        return (
          <>
            {showCallOuts && (
              <HeaderControl
                setMountPoint={this.props.application.setAppBottomControls}
                controls={[
                  {
                    renderComponent: <CallOuts />,
                  },
                ]}
              />
            )}
            <Search query={query} categories={this.categories} onQueryChange={this.onQueryChange} />
            <EuiSpacer size="s" />
          </>
        );
      }
    };

    return (
      <div>
        {renderHeader()}
        {loading ? (
          <EuiFlexGroup justifyContent="center" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiSpacer size="xxl" />
              <EuiLoadingSpinner size="xl" data-test-subj="advancedSettingsLoading" />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : this.state.loadError ? (
          <EuiEmptyPrompt
            iconType="alert"
            iconColor="danger"
            data-test-subj="advancedSettingsLoadError"
            title={
              <h2>
                <FormattedMessage
                  id="advancedSettings.loadErrorTitle"
                  defaultMessage="Unable to load settings"
                />
              </h2>
            }
            body={
              <p>
                <FormattedMessage
                  id="advancedSettings.loadErrorDescription"
                  defaultMessage="Something went wrong while loading settings. Reload the page to try again."
                />
              </p>
            }
            actions={
              <EuiButton
                color="primary"
                fill
                onClick={() => window.location.reload()}
                data-test-subj="advancedSettingsReload"
              >
                <FormattedMessage
                  id="advancedSettings.loadErrorReloadButton"
                  defaultMessage="Reload page"
                />
              </EuiButton>
            }
          />
        ) : (
          <>
            <AdvancedSettingsVoiceAnnouncement queryText={query.text} settings={filteredSettings} />

            <Form
              settings={this.groupedSettings}
              visibleSettings={filteredSettings}
              categories={this.categories}
              categoryCounts={this.categoryCounts}
              clearQuery={this.clearQuery}
              save={this.saveConfig}
              showNoResultsMessage={!footerQueryMatched}
              enableSaving={this.props.enableSaving}
              dockLinks={this.props.dockLinks}
              toasts={this.props.toasts}
              pageScope={scope}
            />
            <PageFooter
              toasts={this.props.toasts}
              query={query}
              onQueryMatchChange={this.onFooterQueryMatchChange}
              enableSaving={this.props.enableSaving}
            />
          </>
        )}
      </div>
    );
  }
}

export const AdvancedSettings = (props: AdvancedSettingsProps) => {
  const { query } = useParams<{ query: string }>();
  return (
    <AdvancedSettingsComponent
      queryText={query || ''}
      enableSaving={props.enableSaving}
      uiSettings={props.uiSettings}
      dockLinks={props.dockLinks}
      toasts={props.toasts}
      componentRegistry={props.componentRegistry}
      useUpdatedUX={props.useUpdatedUX}
      navigationUI={props.navigationUI}
      application={props.application}
      scope={props.scope}
    />
  );
};

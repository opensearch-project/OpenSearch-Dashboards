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

import { PureComponent, Fragment } from 'react';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiBottomBar,
  EuiButton,
  EuiToolTip,
  EuiButtonEmpty,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  DocLinksStart,
  ToastsStart,
  UiSettingScope,
  ENABLE_GLOBAL_SETTING_CONTROL,
} from 'opensearch-dashboards/public';
import { createPortal } from 'react-dom';
import { toMountPoint } from '../../../../../opensearch_dashboards_react/public';

import { getCategoryName } from '../../lib';
import { Field, getEditableValue } from '../field';
import { FieldSetting, SettingsChanges, FieldState } from '../../types';

type Category = string;

interface FormProps {
  settings: Record<string, FieldSetting[]>;
  visibleSettings: Record<string, FieldSetting[]>;
  categories: Category[];
  categoryCounts: Record<string, number>;
  clearQuery: () => void;
  save: (changes: SettingsChanges) => Promise<boolean[]>;
  showNoResultsMessage: boolean;
  enableSaving: boolean;
  dockLinks: DocLinksStart['links'];
  toasts: ToastsStart;
  pageScope?: UiSettingScope;
}

interface FormState {
  unsavedChanges: {
    [key: string]: FieldState;
  };
  loading: boolean;
}

export class Form extends PureComponent<FormProps, FormState> {
  state: FormState = {
    unsavedChanges: {},
    loading: false,
  };

  setLoading(loading: boolean) {
    this.setState({
      loading,
    });
  }

  getSettingByKey = (key: string): FieldSetting | undefined => {
    return Object.values(this.props.settings)
      .flat()
      .find((el) => el.name === key);
  };

  getCountOfUnsavedChanges = (): number => {
    return Object.keys(this.state.unsavedChanges).length;
  };

  getCountOfHiddenUnsavedChanges = (): number => {
    const shownSettings = Object.values(this.props.visibleSettings)
      .flat()
      .map((setting) => setting.name);
    return Object.keys(this.state.unsavedChanges).filter((key) => !shownSettings.includes(key))
      .length;
  };

  areChangesInvalid = (): boolean => {
    const { unsavedChanges } = this.state;
    return Object.values(unsavedChanges).some(({ isInvalid }) => isInvalid);
  };

  handleChange = (key: string, change: FieldState) => {
    const setting = this.getSettingByKey(key);
    if (!setting) {
      return;
    }
    const { type, defVal, value } = setting;
    const savedValue = getEditableValue(type, value, defVal);
    // clearToInherit ("Use global value") is an intent to clear this scope's stored
    // value (persist null), which is distinct from the displayed value even when they
    // look identical — e.g. the stored value equals the code default. So it must be
    // kept as an unsaved change rather than discarded by the value-equality check.
    if (change.value === savedValue && !change.clearToInherit) {
      return this.clearChange(key);
    }
    this.setState({
      unsavedChanges: {
        ...this.state.unsavedChanges,
        [key]: change,
      },
    });
  };

  clearChange = (key: string) => {
    if (!this.state.unsavedChanges[key]) {
      return;
    }
    const unsavedChanges = { ...this.state.unsavedChanges };
    delete unsavedChanges[key];

    this.setState({
      unsavedChanges,
    });
  };

  clearAllUnsaved = () => {
    this.setState({ unsavedChanges: {} });
  };

  saveAll = async () => {
    const { unsavedChanges } = this.state;

    if (isEmpty(unsavedChanges)) {
      return;
    }
    this.setLoading(true);
    const configToSave: SettingsChanges = {};
    const reloadKeys = new Set<string>();

    const isScopedPage =
      this.props.pageScope !== undefined && this.props.pageScope !== UiSettingScope.GLOBAL;

    Object.entries(unsavedChanges).forEach(([name, { value, clearToInherit }]) => {
      const setting = this.getSettingByKey(name);
      if (!setting) {
        return;
      }
      const { defVal, type, requiresPageReload } = setting;
      let valueToSave = value;
      let equalsToDefault = false;
      switch (type) {
        case 'array':
          valueToSave = valueToSave.trim();
          valueToSave =
            valueToSave === '' ? [] : valueToSave.split(',').map((val: string) => val.trim());
          equalsToDefault = valueToSave.join(',') === (defVal as string[]).join(',');
          break;
        case 'json':
          const isArray = Array.isArray(JSON.parse((defVal as string) || '{}'));
          valueToSave = valueToSave.trim();
          valueToSave = valueToSave || (isArray ? '[]' : '{}');
        default:
          equalsToDefault = valueToSave === defVal;
      }
      if (requiresPageReload) {
        reloadKeys.add(name);
      }
      // For this toggle a missing key means "follow dynamic config", so always store
      // its boolean (even when equal to the default) to keep an explicit override.
      const preserveExplicitValue = name === ENABLE_GLOBAL_SETTING_CONTROL;

      // clearToInherit ("Use global value" on a scoped page) → persist null so the
      // setting inherits from global. Otherwise, only the global page collapses an
      // equal-to-default value to null; a scoped page always stores the actual value.
      configToSave[name] =
        clearToInherit || (!isScopedPage && equalsToDefault && !preserveExplicitValue)
          ? null
          : valueToSave;
    });

    try {
      // save() returns a per-key boolean[] aligned with configToSave's key order.
      const savedKeys = Object.keys(configToSave);
      const results = await this.props.save(configToSave);
      // Treat a non-array/missing result as failure so a malformed response never
      // clears the unsaved marker for a key that wasn't persisted.
      const succeeded = (key: string, i: number) => Array.isArray(results) && results[i] !== false;
      const failedKeys = savedKeys.filter((key, i) => !succeeded(key, i));

      // Clear only the succeeded keys in one setState — per-key clearChange calls would
      // each read the same stale state, so only the last delete would survive.
      const failedKeySet = new Set(failedKeys);
      this.setState((state) => {
        const remaining: FormState['unsavedChanges'] = {};
        Object.entries(state.unsavedChanges).forEach(([key, change]) => {
          // Keep failed keys (for retry) and any key not in this save batch.
          if (failedKeySet.has(key) || !savedKeys.includes(key)) {
            remaining[key] = change;
          }
        });
        return { unsavedChanges: remaining };
      });

      if (failedKeys.length > 0) {
        const failedNames = failedKeys
          .map((key) => this.getSettingByKey(key)?.displayName || key)
          .join(', ');
        this.props.toasts.addDanger(
          i18n.translate('advancedSettings.form.savePartialErrorMessage', {
            defaultMessage:
              'Unable to save {count, plural, one {setting} other {settings}}: {settingNames}',
            values: { count: failedKeys.length, settingNames: failedNames },
          })
        );
      }

      // Prompt for reload if any successfully-saved key requires it — independent of
      // failures, so a partial failure doesn't swallow the hint for the saved keys.
      const reloadNeeded = savedKeys.some((key, i) => reloadKeys.has(key) && succeeded(key, i));
      if (reloadNeeded) {
        this.renderPageReloadToast();
      }
    } catch {
      this.props.toasts.addDanger(
        i18n.translate('advancedSettings.form.saveErrorMessage', {
          defaultMessage: 'Unable to save',
        })
      );
    }
    this.setLoading(false);
  };

  renderPageReloadToast = () => {
    this.props.toasts.add({
      title: i18n.translate('advancedSettings.form.requiresPageReloadToastDescription', {
        defaultMessage: 'One or more settings require you to reload the page to take effect.',
      }),
      text: toMountPoint(
        <>
          <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButton size="s" onClick={() => window.location.reload()}>
                {i18n.translate('advancedSettings.form.requiresPageReloadToastButtonLabel', {
                  defaultMessage: 'Reload page',
                })}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ),
      color: 'success',
    });
  };

  renderClearQueryLink(totalSettings: number, currentSettings: number) {
    const { clearQuery } = this.props;

    if (totalSettings !== currentSettings) {
      return (
        <EuiFlexItem grow={false}>
          <em>
            <FormattedMessage
              id="advancedSettings.form.searchResultText"
              defaultMessage="Search terms are hiding {settingsCount} settings {clearSearch}"
              values={{
                settingsCount: totalSettings - currentSettings,
                clearSearch: (
                  <EuiLink onClick={clearQuery}>
                    <em>
                      <FormattedMessage
                        id="advancedSettings.form.clearSearchResultText"
                        defaultMessage="(clear search)"
                      />
                    </em>
                  </EuiLink>
                ),
              }}
            />
          </em>
        </EuiFlexItem>
      );
    }

    return null;
  }

  renderCategory(category: Category, settings: FieldSetting[], totalSettings: number) {
    return (
      <Fragment key={category}>
        <EuiPanel paddingSize="l" id={category}>
          <EuiForm>
            <EuiText>
              <EuiFlexGroup alignItems="baseline">
                <EuiFlexItem grow={false}>
                  <h2>{getCategoryName(category)}</h2>
                </EuiFlexItem>
                {this.renderClearQueryLink(totalSettings, settings.length)}
              </EuiFlexGroup>
            </EuiText>
            <EuiSpacer size="m" />
            {settings.map((setting) => {
              return (
                <Field
                  key={setting.name}
                  setting={setting}
                  handleChange={this.handleChange}
                  unsavedChanges={this.state.unsavedChanges[setting.name]}
                  clearChange={this.clearChange}
                  enableSaving={this.props.enableSaving}
                  dockLinks={this.props.dockLinks}
                  toasts={this.props.toasts}
                  pageScope={this.props.pageScope}
                />
              );
            })}
          </EuiForm>
        </EuiPanel>
        <EuiSpacer size="l" />
      </Fragment>
    );
  }

  maybeRenderNoSettings(clearQuery: FormProps['clearQuery']) {
    if (this.props.showNoResultsMessage) {
      return (
        <EuiPanel paddingSize="l">
          <FormattedMessage
            id="advancedSettings.form.noSearchResultText"
            defaultMessage="No settings found {clearSearch}"
            values={{
              clearSearch: (
                <EuiLink onClick={clearQuery}>
                  <FormattedMessage
                    id="advancedSettings.form.clearNoSearchResultText"
                    defaultMessage="(clear search)"
                  />
                </EuiLink>
              ),
            }}
          />
        </EuiPanel>
      );
    }
    return null;
  }

  renderCountOfUnsaved = () => {
    const unsavedCount = this.getCountOfUnsavedChanges();
    const hiddenUnsavedCount = this.getCountOfHiddenUnsavedChanges();
    return (
      <EuiTextColor className="mgtAdvancedSettingsForm__unsavedCountMessage" color="ghost">
        <FormattedMessage
          id="advancedSettings.form.countOfSettingsChanged"
          defaultMessage="{unsavedCount} unsaved {unsavedCount, plural,
              one {setting}
              other {settings}
            }{hiddenCount, plural,
              =0 {}
              other {, # hidden}
            }"
          values={{
            unsavedCount,
            hiddenCount: hiddenUnsavedCount,
          }}
        />
      </EuiTextColor>
    );
  };

  renderBottomBar = () => {
    try {
      const areChangesInvalid = this.areChangesInvalid();
      const bottomBar = (
        <EuiBottomBar data-test-subj="advancedSetting-bottomBar" position="sticky">
          <EuiFlexGroup
            justifyContent="spaceBetween"
            alignItems="center"
            responsive={false}
            gutterSize="s"
          >
            <EuiFlexItem grow={false} className="mgtAdvancedSettingsForm__unsavedCount">
              <p id="aria-describedby.countOfUnsavedSettings">{this.renderCountOfUnsaved()}</p>
            </EuiFlexItem>
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                color="ghost"
                size="s"
                iconType="cross"
                onClick={this.clearAllUnsaved}
                aria-describedby="aria-describedby.countOfUnsavedSettings"
                data-test-subj="advancedSetting-cancelButton"
              >
                {i18n.translate('advancedSettings.form.cancelButtonLabel', {
                  defaultMessage: 'Cancel changes',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={
                  areChangesInvalid &&
                  i18n.translate('advancedSettings.form.saveButtonTooltipWithInvalidChanges', {
                    defaultMessage: 'Fix invalid settings before saving.',
                  })
                }
              >
                <EuiButton
                  className="mgtAdvancedSettingsForm__button"
                  disabled={areChangesInvalid}
                  color="secondary"
                  fill
                  size="s"
                  iconType="check"
                  onClick={this.saveAll}
                  aria-describedby="aria-describedby.countOfUnsavedSettings"
                  isLoading={this.state.loading}
                  data-test-subj="advancedSetting-saveButton"
                >
                  {i18n.translate('advancedSettings.form.saveButtonLabel', {
                    defaultMessage: 'Save changes',
                  })}
                </EuiButton>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiBottomBar>
      );

      return createPortal(bottomBar, document.getElementById('app-wrapper')!);
    } catch {
      return null;
    }
  };

  render() {
    const { unsavedChanges } = this.state;
    const { visibleSettings, categories, categoryCounts, clearQuery } = this.props;
    const currentCategories: Category[] = [];
    const hasUnsavedChanges = !isEmpty(unsavedChanges);

    categories.forEach((category) => {
      if (visibleSettings[category] && visibleSettings[category].length) {
        currentCategories.push(category);
      }
    });

    return (
      <Fragment>
        <div>
          {currentCategories.length
            ? currentCategories.map((category) => {
                return this.renderCategory(
                  category,
                  visibleSettings[category],
                  categoryCounts[category]
                );
              })
            : this.maybeRenderNoSettings(clearQuery)}
        </div>
        {hasUnsavedChanges && this.renderBottomBar()}
      </Fragment>
    );
  }
}

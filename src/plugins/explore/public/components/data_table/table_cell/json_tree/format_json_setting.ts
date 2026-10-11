/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';
import { FORMAT_JSON_SETTING } from '../../../../../common';
import { useExploreUiSetting } from '../../use_explore_ui_setting';

const STORAGE_KEY = 'explore:formatJson';

/**
 * The user's own choice for showing JSON values as a tree, remembered in the browser.
 * Undefined until they change it from the table settings, and for any stored value other than
 * the two `storeFormatJson` writes.
 */
export const getStoredFormatJson = (): boolean | undefined => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return undefined;
  } catch (e) {
    return undefined;
  }
};

export const storeFormatJson = (enabled: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (e) {
    // Storage can be unavailable (private mode, blocked site data); the choice then lasts
    // for the session only.
  }
};

const noopSubscribe = () => () => {};

/**
 * Whether JSON values should be shown as a tree. In order of precedence: the explore UI state
 * (when a Redux store is available), the choice remembered in the browser, then the
 * `explore:formatJsonValues` advanced setting.
 */
export const useFormatJson = (): boolean => {
  const settingDefault = useExploreUiSetting(FORMAT_JSON_SETTING, true);
  const store = useContext(ReactReduxContext)?.store;
  const userChoice = useSyncExternalStore(store ? store.subscribe : noopSubscribe, () => {
    const formatJson = store?.getState()?.ui?.formatJson;
    return typeof formatJson === 'boolean' ? formatJson : getStoredFormatJson();
  });
  return userChoice ?? settingDefault;
};

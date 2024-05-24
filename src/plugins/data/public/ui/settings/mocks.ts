/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings } from './settings';

export class SettingsMock extends Settings {
  getUserQueryLanguage = jest.fn();
  setUserQueryLanguage = jest.fn();
  getUserQueryString = jest.fn();
  setUserQueryString = jest.fn();
  getUiOverrides = jest.fn();
  setUiOverrides = jest.fn();
  setUiOverridesByUserQueryLanguage = jest.fn();
  toJSON = jest.fn();
  updateSettings = jest.fn();
}

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

import React, { act } from 'react';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import ReactDOM from 'react-dom';
import { shallowWithI18nProvider, mountWithI18nProvider } from 'test_utils/enzyme_helpers';
import { UiSettingsType } from '../../../../../../core/public';

// @ts-expect-error TS6133 TODO(ts-error): fixme
import { findTestSubject } from 'test_utils/helpers';

import { notificationServiceMock } from '../../../../../../core/public/mocks';
import { SettingsChanges } from '../../types';
import { Form } from './form';

// Note: We don't mock createPortal because we provide an actual app-wrapper element in the DOM

jest.mock('../field', () => ({
  Field: () => {
    return 'field';
  },
}));

beforeAll(() => {
  // Create app-wrapper element for portal target
  const appWrapper = document.createElement('div');
  appWrapper.id = 'app-wrapper';
  document.body.appendChild(appWrapper);

  const localStorage: Record<string, any> = {
    'core.chrome.isLocked': true,
  };

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => {
        return localStorage[key] || null;
      },
    },
    writable: true,
  });
});

afterAll(() => {
  // Clean up app-wrapper element
  const appWrapper = document.getElementById('app-wrapper');
  if (appWrapper) {
    document.body.removeChild(appWrapper);
  }
  delete (window as any).localStorage;
});

const defaults = {
  requiresPageReload: false,
  readOnly: false,
  value: 'value',
  description: 'description',
  isOverridden: false,
  isPermissionControlled: false,
  type: 'string' as UiSettingsType,
  isCustom: false,
  defVal: 'defVal',
};

const settings = {
  dashboard: [
    {
      ...defaults,
      name: 'dashboard:test:setting',
      ariaName: 'dashboard test setting',
      displayName: 'Dashboard test setting',
      category: ['dashboard'],
      requiresPageReload: true,
    },
  ],
  general: [
    {
      ...defaults,
      name: 'general:test:date',
      ariaName: 'general test date',
      displayName: 'Test date',
      description: 'bar',
      category: ['general'],
    },
    {
      ...defaults,
      name: 'setting:test',
      ariaName: 'setting test',
      displayName: 'Test setting',
      description: 'foo',
      category: ['general'],
    },
    {
      ...defaults,
      name: 'general:test:array',
      ariaName: 'array test',
      displayName: 'Test array setting',
      description: 'array foo',
      type: 'array' as UiSettingsType,
      category: ['general'],
      defVal: ['test'],
    },
  ],
};

const categories = ['general', 'dashboard', 'hiddenCategory'];
const categoryCounts = {
  general: 2,
  dashboard: 1,
};
const save = jest.fn((changes: SettingsChanges) => Promise.resolve([true]));

const clearQuery = () => {};

describe('Form', () => {
  beforeEach(() => {
    save.mockClear();
  });
  it('should render normally', async () => {
    const component = shallowWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={true}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render read-only when saving is disabled', async () => {
    const component = shallowWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={false}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render no settings message when there are no settings', async () => {
    const component = shallowWithI18nProvider(
      <Form
        settings={{}}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={true}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should not render no settings message when instructed not to', async () => {
    const component = shallowWithI18nProvider(
      <Form
        settings={{}}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={false}
        enableSaving={true}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should hide bottom bar when clicking on the cancel changes button', () => {
    const wrapper = mountWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={false}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    // Wrap setState in act() for React 18
    act(() => {
      (wrapper.instance() as Form).setState({
        unsavedChanges: {
          'dashboard:test:setting': {
            value: 'changedValue',
          },
        },
      });
    });
    wrapper.update();
    // Portal content is rendered in app-wrapper element
    expect(document.querySelector('[data-test-subj="advancedSetting-bottomBar"]')).not.toBeNull();

    // Click cancel button - portal content is in document, not wrapper
    act(() => {
      const cancelButton = document.querySelector(
        '[data-test-subj="advancedSetting-cancelButton"]'
      ) as HTMLElement;
      cancelButton.click();
    });
    wrapper.update();
    expect(document.querySelector('[data-test-subj="advancedSetting-bottomBar"]')).toBeNull();
  });

  it('should show a reload toast when saving setting requiring a page reload', async () => {
    const toasts = notificationServiceMock.createStartContract().toasts;
    const wrapper = mountWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={false}
        toasts={toasts}
        dockLinks={{} as any}
      />
    );

    // Wrap setState in act() for React 18
    act(() => {
      (wrapper.instance() as Form).setState({
        unsavedChanges: {
          'dashboard:test:setting': {
            value: 'changedValue',
          },
        },
      });
    });
    wrapper.update();

    // Click save button - portal content is in document
    act(() => {
      const saveButton = document.querySelector(
        '[data-test-subj="advancedSetting-saveButton"]'
      ) as HTMLElement;
      saveButton.click();
    });

    expect(save).toHaveBeenCalled();
    await save({ 'dashboard:test:setting': 'changedValue' });
    expect(toasts.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining(
          'One or more settings require you to reload the page to take effect.'
        ),
      })
    );
  });

  it('should save an array typed field when user provides an empty string correctly', () => {
    const wrapper = mountWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={false}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    // Wrap setState in act() for React 18
    act(() => {
      (wrapper.instance() as Form).setState({
        unsavedChanges: {
          'general:test:array': {
            value: '',
          },
        },
      });
    });
    wrapper.update();

    // Click save button - portal content is in document
    act(() => {
      const saveButton = document.querySelector(
        '[data-test-subj="advancedSetting-saveButton"]'
      ) as HTMLElement;
      saveButton.click();
    });

    expect(save).toHaveBeenCalledWith({ 'general:test:array': [] });
  });

  it('should save an array typed field when user provides a comma separated string correctly', () => {
    const wrapper = mountWithI18nProvider(
      <Form
        settings={settings}
        visibleSettings={settings}
        categories={categories}
        categoryCounts={categoryCounts}
        save={save}
        clearQuery={clearQuery}
        showNoResultsMessage={true}
        enableSaving={false}
        toasts={{} as any}
        dockLinks={{} as any}
      />
    );

    // Wrap setState in act() for React 18
    act(() => {
      (wrapper.instance() as Form).setState({
        unsavedChanges: {
          'general:test:array': {
            value: 'test1, test2',
          },
        },
      });
    });
    wrapper.update();

    // Click save button - portal content is in document
    act(() => {
      const saveButton = document.querySelector(
        '[data-test-subj="advancedSetting-saveButton"]'
      ) as HTMLElement;
      saveButton.click();
    });

    expect(save).toHaveBeenCalledWith({ 'general:test:array': ['test1', 'test2'] });
  });
});

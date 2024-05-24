/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LegacyQueryLanguageSwitcher } from './legacy_language_switcher';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { EuiButtonEmpty, EuiPopover } from '@elastic/eui';
const startMock = coreMock.createStart();

describe('LegacyLanguageSwitcher', () => {
  function wrapInContext(testProps: any) {
    const services = {
      uiSettings: startMock.uiSettings,
      docLinks: startMock.docLinks,
    };

    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <LegacyQueryLanguageSwitcher {...testProps} />
      </OpenSearchDashboardsContextProvider>
    );
  }

  it('should toggle off if language is lucene', () => {
    const component = mountWithIntl(
      wrapInContext({
        language: 'lucene',
        onSelectLanguage: () => {
          return;
        },
      })
    );
    component.find(EuiButtonEmpty).simulate('click');
    expect(component.find(EuiPopover).prop('isOpen')).toBe(true);
    expect(component.find('[data-test-subj="languageToggle"]').get(0).props.checked).toBeFalsy();
  });

  it('should toggle on if language is kuery', () => {
    const component = mountWithIntl(
      wrapInContext({
        language: 'kuery',
        onSelectLanguage: () => {
          return;
        },
      })
    );
    component.find(EuiButtonEmpty).simulate('click');
    expect(component.find(EuiPopover).prop('isOpen')).toBe(true);
    expect(component.find('[data-test-subj="languageToggle"]').get(0).props.checked).toBeTruthy();
  });
});

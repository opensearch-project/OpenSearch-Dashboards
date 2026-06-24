/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Description } from './description';
import { mount } from 'enzyme';

import { mockManagementPlugin } from '../../../../mocks';
import { I18nProvider } from '@osd/i18n/react';

const mockContext = mockManagementPlugin.createDatasetManagmentContext();

describe('Description', () => {
  it('render normally', () => {
    const componentW = mount(
      <I18nProvider>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <Description docLinks={mockContext.docLinks} />
      </I18nProvider>
    );
    const component = componentW.find('Description');
    expect(component).toMatchSnapshot();
  });
});

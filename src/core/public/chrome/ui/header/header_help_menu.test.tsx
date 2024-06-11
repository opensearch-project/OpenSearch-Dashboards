/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { HeaderHelpMenu } from './header_help_menu';

function mockProps() {
  return {
    helpExtension$: new BehaviorSubject(undefined),
    helpSupportUrl$: new BehaviorSubject(''),
    opensearchDashboardsDocLink: '/doclink',
    opensearchDashboardsVersion: '1.0',
    useDefaultContent: true,
  };
}

describe('Header help menu', () => {
  it('renders survey link', () => {
    const props = {
      ...mockProps(),
      surveyLink: '/',
    };
    const component = mountWithIntl(<HeaderHelpMenu {...props} />);
    component.find('button').simulate('click');

    expect(component).toMatchSnapshot();
  });

  it('hides survey link', () => {
    const props = {
      ...mockProps(),
      surveyLink: '',
    };
    const component = mountWithIntl(<HeaderHelpMenu {...props} />);
    component.find('button').simulate('click');

    expect(component).toMatchSnapshot();
  });
});

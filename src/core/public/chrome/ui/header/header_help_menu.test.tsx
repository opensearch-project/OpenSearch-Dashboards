/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { mount } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
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
    const component = mount(wrapWithIntl(<HeaderHelpMenu {...props} />));
    component.find('button').simulate('click');

    expect(component.children()).toMatchSnapshot();
  });

  it('hides survey link', () => {
    const props = {
      ...mockProps(),
      surveyLink: '',
    };
    const component = mount(wrapWithIntl(<HeaderHelpMenu {...props} />));
    component.find('button').simulate('click');

    expect(component.children()).toMatchSnapshot();
  });
});

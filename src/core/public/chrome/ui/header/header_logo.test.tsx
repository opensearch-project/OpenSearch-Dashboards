/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { HeaderLogo } from './header_logo';
import { getLogosMock } from '../../../../common/mocks';

const mockTitle = 'Page Title';
const mockProps = () => ({
  href: '/',
  navLinks$: new BehaviorSubject([]),
  forceNavigation$: new BehaviorSubject(false),
  navigateToApp: jest.fn(),
  branding: {},
  logos: getLogosMock.default,
});

describe('Header logo', () => {
  it("uses the light color-scheme's Application logo by default", () => {
    const props = {
      ...mockProps(),
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('src')).toEqual(props.logos.Application.light.url);
  });

  it("uses the light color-scheme's Application logo if the header's theme is not dark", () => {
    const props = {
      ...mockProps(),
      backgroundColorScheme: 'light' as const,
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('src')).toEqual(props.logos.Application.light.url);
  });

  it("uses the normal color-scheme's Application logo if the header's theme is not dark", () => {
    const props = {
      ...mockProps(),
      backgroundColorScheme: 'normal' as const,
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('src')).toEqual(props.logos.Application.light.url);
  });

  it("uses the dark color-scheme's Application logo if the header's theme is dark", () => {
    const props = {
      ...mockProps(),
      backgroundColorScheme: 'dark' as const,
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('src')).toEqual(props.logos.Application.dark.url);
  });

  it('uses default application title when not branded', () => {
    const props = {
      ...mockProps(),
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('data-test-subj')).toEqual(`defaultLogo`);
    expect(img.prop('alt')).toEqual(`opensearch dashboards logo`);
    expect(component).toMatchSnapshot();
  });

  it('uses branded application title when provided', () => {
    const props = {
      ...mockProps(),
      logos: getLogosMock.branded,
      branding: {
        applicationTitle: mockTitle,
      },
    };
    const component = shallowWithIntl(<HeaderLogo {...props} />);
    const img = component.find('.logoContainer img');
    expect(img.prop('data-test-subj')).toEqual(`customLogo`);
    expect(img.prop('alt')).toEqual(`${mockTitle} logo`);
    expect(component).toMatchSnapshot();
  });

  describe('onClick', () => {
    it('uses default application title when not branded', () => {
      const props = {
        ...mockProps(),
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      component.find('.logoContainer img').simulate('click');

      expect(props.navigateToApp).toHaveBeenCalledTimes(1);
      expect(props.navigateToApp).toHaveBeenCalledWith('home');
    });

    // ToDo: Add tests for onClick
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4692
    it.todo('performs all the complications');
  });
});

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

import React from 'react';
import { ExitFullScreenButton } from './exit_full_screen_button';
import { keys } from '@elastic/eui';
import { shallow } from 'enzyme';
import { getLogosMock } from '../../../../core/common/mocks';
import { ColorScheme } from '../../../../core/common';

const mockProps = () => ({
  onExitFullScreenMode: jest.fn(),
  logos: getLogosMock.default,
});

describe('ExitFullScreenButton', () => {
  it("is rendered using the dark theme's mark by default", () => {
    const props = {
      ...mockProps(),
    };
    const component = shallow(<ExitFullScreenButton {...props} />);
    // In light color-scheme, the button has a dark background
    const icons = component.find(`EuiIcon[type="${props.logos.Mark.dark.url}"]`);

    expect(icons.length).toEqual(1);

    expect(component).toMatchSnapshot();
  });

  it("is rendered using the dark theme's mark when light color-scheme is applied", () => {
    const props = {
      ...mockProps(),
      logos: { ...getLogosMock.default, colorScheme: ColorScheme.LIGHT },
    };
    const component = shallow(<ExitFullScreenButton {...props} />);
    // In light color-scheme, the button has a dark background
    const icons = component.find(`EuiIcon[type="${props.logos.Mark.dark.url}"]`);

    expect(icons.length).toEqual(1);

    expect(component).toMatchSnapshot();
  });

  it("is rendered using the light theme's mark when dark color-scheme is applied", () => {
    const props = {
      ...mockProps(),
      logos: { ...getLogosMock.default, colorScheme: ColorScheme.DARK },
    };
    const component = shallow(<ExitFullScreenButton {...props} />);
    // In light color-scheme, the button has a dark background
    const icons = component.find(`EuiIcon[type="${props.logos.Mark.light.url}"]`);

    expect(icons.length).toEqual(1);

    expect(component).toMatchSnapshot();
  });
});

describe('onExitFullScreenMode', () => {
  it('is called when the button is pressed', () => {
    const props = {
      ...mockProps(),
    };
    const component = shallow(<ExitFullScreenButton {...props} />);
    component.find('button').simulate('click');

    expect(props.onExitFullScreenMode).toHaveBeenCalledTimes(1);
  });

  it('is called when the ESC key is pressed', () => {
    const props = {
      ...mockProps(),
    };
    shallow(<ExitFullScreenButton {...props} />);

    const escapeKeyEvent = new KeyboardEvent('keydown', { key: keys.ESCAPE } as any);
    document.dispatchEvent(escapeKeyEvent);

    expect(props.onExitFullScreenMode).toHaveBeenCalledTimes(1);
  });
});

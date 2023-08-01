/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { ImportFlyout } from './import_flyout';
import { ContextValue, ServicesContextProvider } from '../contexts';
import { serviceContextMock } from '../contexts/services_context.mock';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper, mount } from 'enzyme';

describe('ImportFlyout Component', () => {
  let mockedAppContextValue: ContextValue;
  const mockClose = jest.fn();
  const mockRefresh = jest.fn();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    await act(async () => {
      mockedAppContextValue = serviceContextMock.create();
      component = await mount(
        wrapWithIntl(<ImportFlyout close={mockClose} refresh={mockRefresh} />),
        {
          wrappingComponent: ServicesContextProvider,
          wrappingComponentProps: {
            value: mockedAppContextValue,
          },
        }
      );
    });
    component.update();
  });

  it('renders correctly', () => {
    expect(component).toMatchSnapshot();
  });
});

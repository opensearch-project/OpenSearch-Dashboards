/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { act } from '@testing-library/react-hooks';
import { ShallowWrapper, shallow } from 'enzyme';
import { nextTick, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { ImportModeControl } from './import_mode_control';
import { EuiFormLegendProps, EuiRadioGroupProps } from '@elastic/eui';

const radioGroupIdentifier = 'EuiRadioGroup';

describe('ImportModeControl Component', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockUpdateSelection = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    act(() => {
      component = shallowWithIntl(
        <ImportModeControl
          initialValues={{ overwrite: false }}
          updateSelection={mockUpdateSelection}
        />
      );
    });
    await nextTick();
    component.update();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correclty', () => {
    expect(component).toMatchSnapshot();
  });

  it('should render the correct title in the fieldset legend', () => {
    const legendText = 'Import options';
    const legend: EuiFormLegendProps = component.find('EuiFormFieldset').prop('legend');
    const legendTitle = shallow(legend?.children as ReactElement);

    expect(legendTitle.text()).toBe(legendText);
  });

  it('should display the correct labels for radio options', () => {
    const componentProps = (component
      .find(radioGroupIdentifier)
      .props() as unknown) as EuiRadioGroupProps;

    // Check if the labels for radio options are displayed correctly
    const radioOptions = componentProps.options;
    expect(radioOptions[0].label).toBe('Merge with existing queries');
    expect(radioOptions[1].label).toBe('Overwrite existing queries');

    // Check the initial selection (overwrite is false, so Merge with existing queries should be selected)
    const selectedOptionId = component.find(radioGroupIdentifier).prop('idSelected');
    expect(selectedOptionId).toBe('overwriteDisabled');
  });

  it('should call updateSelection when the selection is changed', async () => {
    act(() => {
      // @ts-ignore
      component.find(radioGroupIdentifier).first().props().onChange('overwriteEnabled');
    });
    component.update();

    // Expect that the updateSelection function has been called with the correct parameters
    expect(mockUpdateSelection).toHaveBeenCalledWith({ overwrite: true });
  });
});

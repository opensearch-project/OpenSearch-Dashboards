/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';
import { OverwriteModal } from './overwrite_modal';
import { act } from '@testing-library/react-hooks';
import { ShallowWrapper } from 'enzyme';

const confirmModalIdentifier = 'EuiConfirmModal';

describe('OverwriteModal Component', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockOnConfirm = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      component = shallowWithIntl(<OverwriteModal onConfirm={mockOnConfirm} onSkip={mockOnSkip} />);
    });

    component.update();
  });

  it('should render correclty', () => {
    expect(component).toMatchSnapshot();
  });

  it('should call onConfirm when clicking the "Overwrite" button', () => {
    act(() => {
      // @ts-ignore
      component.find(confirmModalIdentifier).first().props().onConfirm();
    });

    component.update();

    // Expect that the onConfirm function has been called
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onSkip when clicking the "Skip" button', () => {
    act(() => {
      // @ts-ignore
      component.find(confirmModalIdentifier).first().props().onCancel();
    });

    component.update();

    // Expect that the onSkip function has been called
    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should display the correct title and body text', () => {
    // Find the title and body text elements
    const componentProps = component.find(confirmModalIdentifier).first().props();
    // Find the <p> element inside the component
    const paragraphElement = component.find('p');

    // Expect the correct translations for title and body text
    expect(componentProps.title).toBe('Confirm Overwrite');

    // Check the text content of the <p> element
    const expectedText =
      'Are you sure you want to overwrite the existing queries? This action cannot be undone. All existing queries will be deleted and replaced with the imported queries. If you are unsure, please choose the "Merge with existing queries" option instead';
    expect(paragraphElement.text()).toEqual(expectedText);
  });
});

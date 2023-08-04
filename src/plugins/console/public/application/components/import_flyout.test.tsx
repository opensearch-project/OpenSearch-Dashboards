/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { ImportFlyout } from './import_flyout';
import { ContextValue, ServicesContextProvider } from '../contexts';
import { serviceContextMock } from '../contexts/services_context.mock';
import { wrapWithIntl, nextTick } from 'test_utils/enzyme_helpers';
import { ReactWrapper, mount } from 'enzyme';

const mockFile = new File(['{"text":"Sample JSON data"}'], 'sample.json', {
  type: 'application/json',
});

const mockInvalidFile = new File(['Some random data'], 'sample.json', {
  type: 'application/json',
});

const filePickerIdentifier = '[data-test-subj="queryFilePicker"]';
const confirmBtnIdentifier = '[data-test-subj="importQueriesConfirmBtn"]';
const cancelBtnIdentifier = '[data-test-subj="importQueriesCancelBtn"]';
const confirmModalConfirmButton = '[data-test-subj="confirmModalConfirmButton"]';
const confirmModalCancelButton = '[data-test-subj="confirmModalCancelButton"]';
const importErrorTextIdentifier = '[data-test-subj="importSenseObjectsErrorText"]';
const mergeOptionIdentifier = '[id="overwriteDisabled"]';
const overwriteOptionIdentifier = '[id="overwriteEnabled"]';
const callOutIdentifier = 'EuiCallOut';

const invalidFileError = 'The selected file is not valid. Please select a valid JSON file.';

describe('ImportFlyout Component', () => {
  let mockedAppContextValue: ContextValue;
  const mockClose = jest.fn();
  const mockRefresh = jest.fn();
  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedAppContextValue = serviceContextMock.create();
    mockedAppContextValue.services.objectStorageClient.text = {
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
    };

    await act(async () => {
      component = mount(wrapWithIntl(<ImportFlyout close={mockClose} refresh={mockRefresh} />), {
        wrappingComponent: ServicesContextProvider,
        wrappingComponentProps: {
          value: mockedAppContextValue,
        },
      });
    });
    await nextTick();
    component.update();
  });

  it('renders correctly', () => {
    expect(component).toMatchSnapshot();
  });

  it('should enable confirm button when select file', async () => {
    // Confirm button should be disable if no file selected
    expect(component.find(confirmBtnIdentifier).first().props().disabled).toBe(true);
    component.update();

    act(() => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockFile]);
    });
    await nextTick();
    component.update();

    // Confirm button should be enable after importing file
    expect(component.find(confirmBtnIdentifier).first().props().disabled).toBe(false);
  });

  it('should handle import process with default import mode', async () => {
    // Test import process for different scenarios
    await act(async () => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockFile]);
      await nextTick();
    });

    component.update();

    await act(async () => {
      component.find(confirmBtnIdentifier).first().simulate('click');
      await nextTick();
    });

    component.update();

    // default option "Merge with existing queries" should be checked by default
    expect(component.find(mergeOptionIdentifier).first().props().checked).toBe(true);
    expect(component.find(overwriteOptionIdentifier).first().props().checked).toBe(false);

    expect(mockClose).toBeCalledTimes(1);
    expect(mockRefresh).toBeCalledTimes(1);
  });

  it('should handle errors during import', async () => {
    await act(async () => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockInvalidFile]);
    });

    component.update();

    await act(async () => {
      component.find(confirmBtnIdentifier).first().simulate('click');
      await nextTick();
    });

    component.update();

    expect(component.find(callOutIdentifier).exists()).toBe(true);

    expect(component.find(importErrorTextIdentifier).text()).toEqual(invalidFileError);
  });

  it('should cancel button work normally', async () => {
    act(() => {
      component.find(cancelBtnIdentifier).first().simulate('click');
    });

    expect(mockClose).toBeCalledTimes(1);
  });

  describe('OverwriteModal', () => {
    beforeEach(async () => {
      // Select a file
      await act(async () => {
        const nodes = component.find(filePickerIdentifier);
        // @ts-ignore
        nodes.first().props().onChange([mockFile]);
        await nextTick();
      });

      component.update();

      // change import mode to overwrite
      await act(async () => {
        component.find(overwriteOptionIdentifier).last().simulate('change');
        await nextTick();
      });

      component.update();

      // import selected file
      await act(async () => {
        component.find(confirmBtnIdentifier).first().simulate('click');
        await nextTick();
      });

      component.update();
    });
    it('should handle overwrite confirmation', async () => {
      // Check confirm overwrite modal exist before confirmation
      expect(component.find('OverwriteModal').exists()).toBe(true);

      // confirm overwrite
      await act(async () => {
        component.find(confirmModalConfirmButton).first().simulate('click');
        await nextTick();
      });

      component.update();

      expect(mockClose).toBeCalledTimes(1);
      expect(mockRefresh).toBeCalledTimes(1);

      // confirm overwrite modal should close after confirmation.
      expect(component.find('OverwriteModal').exists()).toBe(false);
    });

    it('should handle overwrite skip', async () => {
      // Check confirm overwrite modal exist before skip
      expect(component.find('OverwriteModal').exists()).toBe(true);

      // confirm overwrite
      act(() => {
        component.find(confirmModalCancelButton).first().simulate('click');
      });
      await nextTick();
      component.update();

      // confirm overwrite modal should close after cancel.
      expect(component.find('OverwriteModal').exists()).toBe(false);
    });
  });
});

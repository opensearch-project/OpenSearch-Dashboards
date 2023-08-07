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
const mockFile1 = new File(['{"text":"Sample JSON data1"}'], 'sample.json', {
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

const defaultQuery = {
  id: '43461752-1fd5-472e-8487-b47ff7fccbc8',
  createdAt: 1690958998493,
  updatedAt: 1690958998493,
  text: 'GET _search\n{\n  "query": {\n    "match_all": {}\n  }\n}',
};

describe('ImportFlyout Component', () => {
  let mockedAppContextValue: ContextValue;
  const mockClose = jest.fn();
  const mockRefresh = jest.fn();
  const mockFindAll = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();

  let component: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockedAppContextValue = serviceContextMock.create();

    mockedAppContextValue.services.objectStorageClient.text = {
      create: mockCreate,
      update: mockUpdate,
      findAll: mockFindAll,
    };

    mockFindAll.mockResolvedValue([defaultQuery]);

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

    await act(async () => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockFile1]);
      await new Promise((r) => setTimeout(r, 1));
    });
    await nextTick();
    component.update();

    // Confirm button should be enable after importing file
    expect(component.find(confirmBtnIdentifier).first().props().disabled).toBe(false);
  });

  it('should handle import process with default import mode', async () => {
    await act(async () => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockFile]);
      // Applied a timeout after FileReader.onload event to resolve side effect issue.
      await new Promise((r) => setTimeout(r, 10));
    });

    await nextTick();
    component.update();

    await act(async () => {
      await nextTick();
      component.find(confirmBtnIdentifier).first().simulate('click');
    });

    component.update();

    // default option "Merge with existing queries" should be checked by default
    expect(component.find(mergeOptionIdentifier).first().props().checked).toBe(true);
    expect(component.find(overwriteOptionIdentifier).first().props().checked).toBe(false);

    // should update existing query
    expect(mockUpdate).toBeCalledTimes(1);
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
      await nextTick();
      component.find(confirmBtnIdentifier).first().simulate('click');
    });

    component.update();

    expect(component.find(callOutIdentifier).exists()).toBe(true);

    expect(component.find(importErrorTextIdentifier).text()).toEqual(invalidFileError);
  });

  it('should handle internal errors', async () => {
    const errorMessage = 'some internal error';
    mockFindAll.mockRejectedValue(new Error(errorMessage));
    await act(async () => {
      const nodes = component.find(filePickerIdentifier);
      // @ts-ignore
      nodes.first().props().onChange([mockFile]);
      await new Promise((r) => setTimeout(r, 1));
    });

    component.update();

    await act(async () => {
      await nextTick();
      component.find(confirmBtnIdentifier).first().simulate('click');
    });

    component.update();

    expect(component.find(callOutIdentifier).exists()).toBe(true);

    expect(component.find(importErrorTextIdentifier).text()).toEqual(
      `The file could not be processed due to error: "${errorMessage}"`
    );
  });

  it('should cancel button work normally', async () => {
    act(() => {
      component.find(cancelBtnIdentifier).first().simulate('click');
    });

    expect(mockClose).toBeCalledTimes(1);
  });

  describe('OverwriteModal', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      // Select a file
      await act(async () => {
        const nodes = component.find(filePickerIdentifier);
        // @ts-ignore
        nodes.first().props().onChange([mockFile]);
        await new Promise((r) => setTimeout(r, 1));
      });
      component.update();

      // change import mode to overwrite
      await act(async () => {
        await nextTick();
        component.find(overwriteOptionIdentifier).last().simulate('change');
      });

      component.update();

      // import selected file
      await act(async () => {
        await nextTick();
        component.find(confirmBtnIdentifier).first().simulate('click');
      });

      component.update();
    });
    it('should handle overwrite confirmation', async () => {
      // Check confirm overwrite modal exist before confirmation
      expect(component.find('OverwriteModal').exists()).toBe(true);

      // confirm overwrite
      await act(async () => {
        await nextTick();
        component.find(confirmModalConfirmButton).first().simulate('click');
      });

      component.update();

      // should update existing query
      expect(mockUpdate).toBeCalledTimes(1);
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

    it('should create storage text when storage client returns empty result with overwrite import mode', async () => {
      mockFindAll.mockResolvedValue([]);

      // confirm overwrite
      await act(async () => {
        await nextTick();
        component.find(confirmModalConfirmButton).first().simulate('click');
      });

      component.update();

      expect(component.find(overwriteOptionIdentifier).first().props().checked).toBe(true);

      // should create new query
      expect(mockCreate).toBeCalledTimes(1);
      expect(mockClose).toBeCalledTimes(1);
      expect(mockRefresh).toBeCalledTimes(1);
    });
  });
});

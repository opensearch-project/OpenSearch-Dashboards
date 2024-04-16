/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  httpServiceMock,
  notificationServiceMock,
  workspacesServiceMock,
} from '../../../../../../core/public/mocks';
import { ShowDuplicateModalProps, SavedObjectsDuplicateModal } from './duplicate_modal';
import { SavedObjectWithMetadata } from '../../../types';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';
import React from 'react';
import { WorkspaceObject } from 'src/core/types';
import { render } from '@testing-library/react';
import { WorkspaceOption } from './utils';
import { DuplicateMode } from '../../types';

interface Props extends ShowDuplicateModalProps {
  onClose: () => void;
}

describe('DuplicateModal', () => {
  let selectedModeProps: Props;
  let allModeProps: Props;
  let http: ReturnType<typeof httpServiceMock.createStartContract>;
  let notifications: ReturnType<typeof notificationServiceMock.createStartContract>;
  let workspaces: ReturnType<typeof workspacesServiceMock.createStartContract>;
  const selectedSavedObjects: SavedObjectWithMetadata[] = [
    {
      id: '1',
      type: 'dashboard',
      workspaces: ['workspace1'],
      attributes: {},
      references: [],
      meta: {
        title: 'Dashboard_1',
        icon: 'dashboardApp',
      },
    },
    {
      id: '2',
      type: 'visualization',
      workspaces: ['workspace2'],
      attributes: {},
      references: [],
      meta: {
        title: 'Visualization',
        icon: 'visualizationApp',
      },
    },
    {
      id: '3',
      type: 'dashboard',
      workspaces: ['workspace2'],
      attributes: {},
      references: [],
      meta: {
        title: 'Dashboard_2',
      },
    },
  ];
  const workspaceList: WorkspaceObject[] = [
    {
      id: 'workspace1',
      name: 'foo',
    },
    {
      id: 'workspace2',
      name: 'bar',
    },
  ];
  beforeEach(() => {
    http = httpServiceMock.createStartContract();
    notifications = notificationServiceMock.createStartContract();
    workspaces = workspacesServiceMock.createStartContract();

    selectedModeProps = {
      onDuplicate: jest.fn(),
      onClose: jest.fn(),
      http,
      workspaces,
      duplicateMode: DuplicateMode.Selected,
      notifications,
      selectedSavedObjects,
    };

    allModeProps = {
      ...selectedModeProps,
      duplicateMode: DuplicateMode.All,
      selectedSavedObjects,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render normally', async () => {
    render(<SavedObjectsDuplicateModal {...allModeProps} />);
    expect(document.children).toMatchSnapshot();
  });

  it('should Unmount normally', async () => {
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    expect(component.unmount()).toMatchSnapshot();
  });

  it('should show all target workspace options when not in any workspace', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    selectedModeProps = { ...selectedModeProps, workspaces };
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    await new Promise((resolve) => process.nextTick(resolve));
    component.update();
    const options = component.find('EuiComboBox').prop('options') as WorkspaceOption[];
    expect(options.length).toEqual(2);
    expect(options[0].label).toEqual('foo');
    expect(options[1].label).toEqual('bar');
  });

  it('should display the suffix (current) in target workspace options when in workspace1', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('workspace1');
    workspaces.currentWorkspace$.next({
      id: 'workspace1',
      name: 'foo',
    });
    selectedModeProps = { ...selectedModeProps, workspaces };
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    await new Promise((resolve) => process.nextTick(resolve));
    component.update();
    const options = component.find('EuiComboBox').prop('options') as WorkspaceOption[];
    expect(options.length).toEqual(2);
    expect(options[0].label).toEqual('foo (current)');
    expect(options[1].label).toEqual('bar');
  });

  it('should only show saved objects belong to workspace1 when target workspace is workspace2', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    selectedModeProps = { ...selectedModeProps, workspaces };
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    const selectedObjects = component
      .find('EuiInMemoryTable')
      .prop('items') as SavedObjectWithMetadata[];
    expect(selectedObjects.length).toEqual(3);
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'bar', key: 'workspace2', value: workspaceList[1] }]);
    component.update();

    const targetWorkspaceOption = component.state('targetWorkspaceOption') as WorkspaceOption[];
    expect(targetWorkspaceOption.length).toEqual(1);
    expect(targetWorkspaceOption[0].key).toEqual('workspace2');

    const includedSelectedObjects = component
      .find('EuiInMemoryTable')
      .prop('items') as SavedObjectWithMetadata[];
    expect(includedSelectedObjects.length).toEqual(1);
    expect(includedSelectedObjects[0].workspaces).toEqual(['workspace1']);
    expect(includedSelectedObjects[0].id).toEqual('1');

    expect(component.find('EuiCallOut').prop('aria-disabled')).toEqual(false);
  });

  it('should ignore one saved object when target workspace is workspace1', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    selectedModeProps = { ...selectedModeProps, workspaces };
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'foo', key: 'workspace1', value: workspaceList[0] }]);

    const includedSelectedObjects = component
      .find('EuiInMemoryTable')
      .prop('items') as SavedObjectWithMetadata[];
    expect(includedSelectedObjects.length).toEqual(2);
  });

  it('should show saved objects type when duplicate mode is all', async () => {
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...allModeProps} />);
    const savedObjectTypeInfoMap = component.state('savedObjectTypeInfoMap') as Map<
      string,
      [number, boolean]
    >;
    expect(savedObjectTypeInfoMap.get('dashboard')).toEqual([2, true]);

    const euiCheckbox = component.find('EuiCheckbox').at(0);
    expect(euiCheckbox.prop('checked')).toEqual(true);
    expect(euiCheckbox.prop('id')).toEqual('includeSavedObjectType.dashboard');

    euiCheckbox.simulate('change', { target: { checked: false } });
    const euiCheckboxUnCheced = component.find('EuiCheckbox').at(0);
    expect(euiCheckboxUnCheced.prop('checked')).toEqual(false);
    expect(savedObjectTypeInfoMap.get('dashboard')).toEqual([2, false]);

    (component.instance() as any).changeIncludeSavedObjectType('invalid');
  });

  it('should uncheck duplicate related objects', async () => {
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );

    const euiCheckbox = component.find('EuiCheckbox').at(0);
    expect(euiCheckbox.prop('checked')).toEqual(true);
    expect(euiCheckbox.prop('id')).toEqual('includeReferencesDeep');
    expect(component.state('isIncludeReferencesDeepChecked')).toEqual(true);

    euiCheckbox.simulate('change', { target: { checked: false } });
    expect(component.state('isIncludeReferencesDeepChecked')).toEqual(false);
  });

  it('should call onClose function when cancle button is clicked', () => {
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    component.find('[data-test-subj="duplicateCancelButton"]').simulate('click');
    expect(selectedModeProps.onClose).toHaveBeenCalled();
  });

  it('should call onDuplicate function when confirm button is clicked', () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    selectedModeProps = { ...selectedModeProps, workspaces };
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'bar', key: 'workspace2', value: workspaceList[1] }]);
    const confirmButton = component.find('[data-test-subj="duplicateConfirmButton"]');
    expect(confirmButton.prop('isLoading')).toBe(false);
    expect(confirmButton.prop('disabled')).toBe(false);
    confirmButton.simulate('click');
    expect(selectedModeProps.onDuplicate).toHaveBeenCalled();
  });

  it('should not change isLoading when isMounted is false ', async () => {
    const component = shallowWithI18nProvider(
      <SavedObjectsDuplicateModal {...selectedModeProps} />
    );
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'bar', key: 'workspace2', value: workspaceList[1] }]);
    const confirmButton = component.find('[data-test-subj="duplicateConfirmButton"]');
    (component.instance() as any).isMounted = false;
    confirmButton.simulate('click');
    expect(selectedModeProps.onDuplicate).toHaveBeenCalled();
    expect(component.state('isLoading')).toBe(true);
  });
});

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
import { WorkspaceAttribute } from 'src/core/types';
import { render } from '@testing-library/react';
import { WorkspaceOption } from './utils';

interface Props extends ShowDuplicateModalProps {
  onClose: () => void;
}

describe('DuplicateModal', () => {
  let duplicateProps: Props;
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
  const workspaceList: WorkspaceAttribute[] = [
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

    duplicateProps = {
      onDuplicate: jest.fn(),
      onClose: jest.fn(),
      http,
      workspaces,
      notifications,
      selectedSavedObjects,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render normally', async () => {
    render(<SavedObjectsDuplicateModal {...duplicateProps} />);
    expect(document.children).toMatchSnapshot();
  });

  it('should Unmount normally', async () => {
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    expect(component.unmount()).toMatchSnapshot();
  });

  it('should show all target workspace options when not in any workspace', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    duplicateProps = { ...duplicateProps, workspaces };
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    await new Promise((resolve) => process.nextTick(resolve));
    component.update();
    const options = component.find('EuiComboBox').prop('options') as WorkspaceOption[];
    expect(options.length).toEqual(2);
    expect(options[0].label).toEqual('foo');
    expect(options[1].label).toEqual('bar');
  });

  it('should display the suffix (current) in target workspace options when it is the current workspace', async () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('workspace1');
    workspaces.currentWorkspace$.next({
      id: 'workspace1',
      name: 'foo',
    });
    duplicateProps = { ...duplicateProps, workspaces };
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    await new Promise((resolve) => process.nextTick(resolve));
    component.update();
    const options = component.find('EuiComboBox').prop('options') as WorkspaceOption[];
    expect(options.length).toEqual(2);
    expect(options[0].label).toEqual('foo (current)');
    expect(options[1].label).toEqual('bar');
  });

  it('should uncheck duplicate related objects', async () => {
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);

    const euiCheckbox = component.find('EuiCheckbox').at(0);
    expect(euiCheckbox.prop('checked')).toEqual(true);
    expect(euiCheckbox.prop('id')).toEqual('includeReferencesDeep');
    expect(component.state('isIncludeReferencesDeepChecked')).toEqual(true);

    euiCheckbox.simulate('change', { target: { checked: false } });
    expect(component.state('isIncludeReferencesDeepChecked')).toEqual(false);
  });

  it('should call onClose function when cancle button is clicked', () => {
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    component.find('[data-test-subj="duplicateCancelButton"]').simulate('click');
    expect(duplicateProps.onClose).toHaveBeenCalled();
  });

  it('should call onDuplicate function when confirm button is clicked', () => {
    workspaces.workspaceList$.next(workspaceList);
    workspaces.currentWorkspaceId$.next('');
    workspaces.currentWorkspace$.next(null);
    duplicateProps = { ...duplicateProps, workspaces };
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'bar', key: 'workspace2', value: workspaceList[1] }]);
    const confirmButton = component.find('[data-test-subj="duplicateConfirmButton"]');
    expect(confirmButton.prop('isLoading')).toBe(false);
    expect(confirmButton.prop('disabled')).toBe(false);
    confirmButton.simulate('click');
    expect(duplicateProps.onDuplicate).toHaveBeenCalled();
  });

  it('should not change isLoading when isMounted is false ', async () => {
    const component = shallowWithI18nProvider(<SavedObjectsDuplicateModal {...duplicateProps} />);
    const comboBox = component.find('EuiComboBox');
    comboBox.simulate('change', [{ label: 'bar', key: 'workspace2', value: workspaceList[1] }]);
    const confirmButton = component.find('[data-test-subj="duplicateConfirmButton"]');
    (component.instance() as any).isMounted = false;
    confirmButton.simulate('click');
    expect(duplicateProps.onDuplicate).toHaveBeenCalled();
    expect(component.state('isLoading')).toBe(true);
  });
});

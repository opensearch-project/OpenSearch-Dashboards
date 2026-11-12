/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopNavIds } from '../components/dashboard_top_nav';
import { getNavActions } from './get_nav_actions';
import { createDashboardServicesMock } from './mocks';
import { saveDashboard } from './save_dashboard';
import { saveNewDashboard } from './save_new_dashboard';

jest.mock('./save_dashboard', () => ({ saveDashboard: jest.fn(async () => 'orig-id') }));
jest.mock('./save_new_dashboard', () => ({ saveNewDashboard: jest.fn(async () => ({})) }));

let saveModal: any;
jest.mock('../../../../saved_objects/public', () => ({
  ...jest.requireActual('../../../../saved_objects/public'),
  showSaveModal: jest.fn((element: any) => {
    saveModal = element;
  }),
}));

let onClone: any;
jest.mock('../components/dashboard_top_nav/top_nav/show_clone_modal', () => ({
  showCloneModal: jest.fn((fn: any) => {
    onClone = fn;
  }),
}));

const build = () => {
  const services = createDashboardServicesMock();
  const stateContainer = {
    getState: () => ({ title: 'Original', description: '', timeRestore: false }),
    transitions: { set: jest.fn(), setDashboard: jest.fn() },
  };
  const savedDashboard = { id: 'orig-id', title: 'Original' };
  const navActions = getNavActions(
    stateContainer as any,
    savedDashboard as any,
    services as any,
    { setIsDirty: jest.fn() } as any,
    undefined,
    undefined
  );
  return { navActions, services, stateContainer, savedDashboard };
};

const saveArgs = {
  newTitle: 'New',
  newDescription: 'd',
  newTimeRestore: true,
  isTitleDuplicateConfirmed: false,
  onTitleDuplicate: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('save as new goes through saveNewDashboard', async () => {
  const { navActions, services, stateContainer, savedDashboard } = build();
  navActions[TopNavIds.SAVE]();
  const signal = new AbortController().signal;
  const copyPanels = { titleTemplate: '{{panelTitle}}' };
  await saveModal.props.onSave({
    ...saveArgs,
    newCopyOnSave: true,
    newCopyPanels: copyPanels,
    signal,
  });

  expect(saveNewDashboard).toHaveBeenCalledWith(
    {
      title: 'New',
      description: 'd',
      timeRestore: true,
      copyPanels,
      saveOptions: {
        isTitleDuplicateConfirmed: false,
        onTitleDuplicate: saveArgs.onTitleDuplicate,
      },
      signal,
    },
    stateContainer,
    savedDashboard,
    services
  );
  expect(saveDashboard).not.toHaveBeenCalled();
  expect(stateContainer.transitions.setDashboard).not.toHaveBeenCalled();
});

test('a plain save keeps the existing save path', async () => {
  const { navActions } = build();
  navActions[TopNavIds.SAVE]();
  await saveModal.props.onSave({ ...saveArgs, newCopyOnSave: false });

  expect(saveDashboard).toHaveBeenCalled();
  expect(saveNewDashboard).not.toHaveBeenCalled();
});

test('clone goes through saveNewDashboard without description or time restore', async () => {
  const { navActions, services, stateContainer, savedDashboard } = build();
  navActions[TopNavIds.CLONE]();
  const signal = new AbortController().signal;
  const onTitleDuplicate = jest.fn();
  await onClone('Copy', true, onTitleDuplicate, undefined, signal);

  expect(saveNewDashboard).toHaveBeenCalledWith(
    {
      title: 'Copy',
      copyPanels: undefined,
      saveOptions: { isTitleDuplicateConfirmed: true, onTitleDuplicate },
      signal,
    },
    stateContainer,
    savedDashboard,
    services
  );
  expect(saveDashboard).not.toHaveBeenCalled();
  expect(stateContainer.transitions.set).not.toHaveBeenCalled();
});

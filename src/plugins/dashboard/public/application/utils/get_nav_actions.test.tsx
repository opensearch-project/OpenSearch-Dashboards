/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopNavIds } from '../components/dashboard_top_nav';
import { getNavActions } from './get_nav_actions';
import { createDashboardServicesMock } from './mocks';
import { applyCopyPanels, revertCopyPanels } from './apply_copy_panels';
import { saveDashboard } from './save_dashboard';
import { checkForDuplicateTitle } from '../../../../saved_objects/public';
// Real constant so the tests exercise the actual isErrorNonFatal contract rather
// than a mocked predicate (a mocked predicate would pass even on the wrong check).
import { SAVE_DUPLICATE_REJECTED } from '../../../../saved_objects/public/constants';

jest.mock('./apply_copy_panels', () => ({
  applyCopyPanels: jest.fn(),
  revertCopyPanels: jest.fn(),
}));

jest.mock('./save_dashboard', () => ({
  saveDashboard: jest.fn(),
}));

let capturedSaveModal: any;
// Keep the REAL isErrorNonFatal; only stub the lookup + modal entry points.
jest.mock('../../../../saved_objects/public', () => {
  const actual = jest.requireActual('../../../../saved_objects/public');
  return {
    ...actual,
    checkForDuplicateTitle: jest.fn(),
    showSaveModal: jest.fn((element: any) => {
      capturedSaveModal = element;
    }),
  };
});

let capturedOnClone: any;
jest.mock('../components/dashboard_top_nav/top_nav/show_clone_modal', () => ({
  showCloneModal: jest.fn((onClone: any) => {
    capturedOnClone = onClone;
  }),
}));

const makeStateContainer = () => ({
  getState: jest.fn(() => ({
    title: 'Original',
    description: 'desc',
    timeRestore: false,
    panels: [],
  })),
  transitions: {
    set: jest.fn(),
    setDashboard: jest.fn(),
  },
});

const makeSavedDashboard = () => ({
  id: 'orig-id',
  title: 'Original',
  lastSavedTitle: 'Original',
  copyOnSave: false,
  getOpenSearchType: () => 'dashboard',
  getDisplayName: () => 'dashboard',
});

const buildNavActions = () => {
  const services = createDashboardServicesMock();
  const stateContainer = makeStateContainer();
  const navActions = getNavActions(
    stateContainer as any,
    makeSavedDashboard() as any,
    services as any,
    { setIsDirty: jest.fn() } as any
  );
  return { navActions, services, stateContainer };
};

// Save-as: trigger the SAVE action and return its captured onSave callback.
const triggerSaveAs = () => {
  const { navActions, services, stateContainer } = buildNavActions();
  navActions[TopNavIds.SAVE]();
  const run = (overrides: Record<string, unknown> = {}) =>
    capturedSaveModal.props.onSave({
      newTitle: 'New title',
      newDescription: 'd',
      newCopyOnSave: true,
      newTimeRestore: false,
      newCopyPanels: true,
      newCopyPanelsTitleTemplate: '{{panelTitle}} (copy)',
      isTitleDuplicateConfirmed: false,
      onTitleDuplicate: jest.fn(),
      ...overrides,
    });
  return { run, services, stateContainer };
};

// Clone: trigger the CLONE action and return its captured onClone callback.
const triggerClone = () => {
  const { navActions, services, stateContainer } = buildNavActions();
  navActions[TopNavIds.CLONE]();
  const run = (isTitleDuplicateConfirmed = false) =>
    capturedOnClone(
      'New title',
      isTitleDuplicateConfirmed,
      jest.fn(),
      true, // copyPanels
      '{{panelTitle}} (copy)',
      new AbortController().signal
    );
  return { run, services, stateContainer };
};

describe('getNavActions copy-panels duplicate-title handling (#1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedSaveModal = undefined;
    capturedOnClone = undefined;
    (applyCopyPanels as jest.Mock).mockResolvedValue({
      originalPanels: [],
      createdObjects: [],
      failures: [],
    });
    (saveDashboard as jest.Mock).mockResolvedValue('new-id');
  });

  describe('save-as path', () => {
    it('does not copy and keeps the modal open on an unconfirmed duplicate', async () => {
      (checkForDuplicateTitle as jest.Mock).mockRejectedValue(new Error(SAVE_DUPLICATE_REJECTED));

      const { run, stateContainer } = triggerSaveAs();
      const result = await run();

      expect(checkForDuplicateTitle).toHaveBeenCalledTimes(1);
      expect(applyCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).not.toHaveBeenCalled();
      expect(revertCopyPanels).not.toHaveBeenCalled();
      // Empty id and NO error -> the modal stays open for the user to confirm.
      expect(result).toEqual({ id: '' });
      // B1: the fields written on entry are restored, so a cancelled duplicate
      // leaves no unsaved title/description/timeRestore in app state.
      expect(stateContainer.transitions.setDashboard).toHaveBeenLastCalledWith({
        title: 'Original',
        description: 'desc',
        timeRestore: false,
      });
    });

    it('copies once (no copy-then-revert) when the title is unique', async () => {
      (checkForDuplicateTitle as jest.Mock).mockResolvedValue(true);

      const { run } = triggerSaveAs();
      await run();

      expect(applyCopyPanels).toHaveBeenCalledTimes(1);
      expect(revertCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).toHaveBeenCalledTimes(1);
      // FN-1 guard: the pre-check must run with id: undefined, matching the shape
      // saveSavedObject uses (it deletes the id before its own check). A live id
      // here would self-match a same-title source and miss the duplicate.
      expect((checkForDuplicateTitle as jest.Mock).mock.calls[0][0]).toMatchObject({
        id: undefined,
        title: 'New title',
      });
      // Comment A guard: the pre-check's verdict is final, so the save is told to
      // skip its identical _find. If this regresses, the redundant query returns.
      const saveOptions = (saveDashboard as jest.Mock).mock.calls[0][3];
      expect(saveOptions.isTitleDuplicateConfirmed).toBe(true);
    });

    it('copies once on the confirmed retry', async () => {
      (checkForDuplicateTitle as jest.Mock).mockResolvedValue(true);

      const { run } = triggerSaveAs();
      await run({ isTitleDuplicateConfirmed: true });

      expect(applyCopyPanels).toHaveBeenCalledTimes(1);
      expect(saveDashboard).toHaveBeenCalledTimes(1);
    });

    it('reports a fatal check failure and does not copy (B2)', async () => {
      (checkForDuplicateTitle as jest.Mock).mockRejectedValue(new Error('network boom'));

      const { run, services, stateContainer } = triggerSaveAs();
      const result = await run();

      expect(applyCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).not.toHaveBeenCalled();
      expect((result as { error?: Error }).error).toBeDefined();
      expect(services.notifications.toasts.addDanger).toHaveBeenCalled();
      // B1: fields restored on the fatal path too.
      expect(stateContainer.transitions.setDashboard).toHaveBeenLastCalledWith({
        title: 'Original',
        description: 'desc',
        timeRestore: false,
      });
    });
  });

  describe('clone path', () => {
    it('does not copy and keeps the modal open on an unconfirmed duplicate', async () => {
      (checkForDuplicateTitle as jest.Mock).mockRejectedValue(new Error(SAVE_DUPLICATE_REJECTED));

      const { run } = triggerClone();
      const result = await run();

      expect(applyCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).not.toHaveBeenCalled();
      expect(result).toEqual({ id: '' });
    });

    it('copies once when the title is unique', async () => {
      (checkForDuplicateTitle as jest.Mock).mockResolvedValue(true);

      const { run } = triggerClone();
      await run();

      expect(applyCopyPanels).toHaveBeenCalledTimes(1);
      expect(saveDashboard).toHaveBeenCalledTimes(1);
      // FN-1 guard (clone): pre-check runs with id: undefined.
      expect((checkForDuplicateTitle as jest.Mock).mock.calls[0][0]).toMatchObject({
        id: undefined,
        title: 'New title',
      });
      // Comment A guard (clone): the save skips its identical _find.
      const saveOptions = (saveDashboard as jest.Mock).mock.calls[0][3];
      expect(saveOptions.isTitleDuplicateConfirmed).toBe(true);
    });

    it('reports a fatal check failure and does not copy (B2)', async () => {
      (checkForDuplicateTitle as jest.Mock).mockRejectedValue(new Error('boom'));

      const { run, services, stateContainer } = triggerClone();
      const result = await run();

      expect(applyCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).not.toHaveBeenCalled();
      expect((result as { error?: Error }).error).toBeDefined();
      expect(services.notifications.toasts.addDanger).toHaveBeenCalled();
      // Clone fatal branch restores the title (its duplicate branch does not).
      expect(stateContainer.transitions.set).toHaveBeenCalledWith('title', 'Original');
    });
  });

  describe('FN-1 integration: real duplicate check with a same-id, same-title object', () => {
    it('does not copy when the copy keeps the source title (id-less check still catches it)', async () => {
      // Exercise the REAL checkForDuplicateTitle so the id: undefined + copyOnSave
      // wiring is tested end to end. newTitle equals the source lastSavedTitle
      // ('Original'), making the L62 "title unchanged && !copyOnSave" branch the
      // discriminator: only copyOnSave: true in the literal keeps the check running
      // to the id comparison. A pre-check with the live id, or without copyOnSave,
      // would short-circuit to "no duplicate" and wrongly copy. mockImplementationOnce
      // so the real impl does not leak into later tests (clearAllMocks keeps it).
      const actual = jest.requireActual('../../../../saved_objects/public');
      (checkForDuplicateTitle as jest.Mock).mockImplementationOnce(actual.checkForDuplicateTitle);

      const { run, services } = triggerSaveAs();
      // The colliding dashboard is the original itself: same title, live id.
      (services.savedObjects.client.find as jest.Mock).mockResolvedValue({
        savedObjects: [{ id: 'orig-id', get: () => 'Original' }],
      });
      const onTitleDuplicate = jest.fn();

      const result = await run({ newTitle: 'Original', onTitleDuplicate });

      // id: undefined !== 'orig-id', and copyOnSave: true kept L62 from skipping,
      // so the real check treats it as a duplicate.
      expect(onTitleDuplicate).toHaveBeenCalledTimes(1);
      expect(applyCopyPanels).not.toHaveBeenCalled();
      expect(saveDashboard).not.toHaveBeenCalled();
      expect(result).toEqual({ id: '' });
    });
  });
});

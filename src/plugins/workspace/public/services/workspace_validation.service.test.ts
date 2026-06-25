/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { workspaceClientMock, WorkspaceClientMock } from '../workspace_client.mock';
import { coreMock } from '../../../../core/public/mocks';
import { WorkspaceValidationService } from './workspace_validation_service';
import { waitFor } from '@testing-library/dom';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_DETAIL_APP_ID } from '../../common/constants';
import { WorkspaceError } from '../../../../core/public';

const setupWorkspaceValidationStart = () => {
  const core = coreMock.createStart();

  core.application.currentAppId$.subscribe = jest.fn();

  const workspaceError$ = core.workspaces.workspaceError$;
  const initialized$ = core.workspaces.initialized$;
  const currentAppId$ = core.application.currentAppId$;
  const service = new WorkspaceValidationService();

  return {
    core,
    workspaceError$,
    initialized$,
    currentAppId$,
    service,
  };
};

describe('WorkspaceValidationService', () => {
  describe('#setup', () => {
    beforeEach(() => {
      WorkspaceClientMock.mockClear();
      Object.values(workspaceClientMock).forEach((item) => item.mockClear());
    });

    it('should initialize workspace validation service and enter workspace', async () => {
      const core = coreMock.createSetup();
      const service = new WorkspaceValidationService();
      await service.setup(core, 'test-workspace-123');

      expect(WorkspaceClientMock).toBeCalledTimes(1);
      expect(core.workspaces.setClient).toHaveBeenCalled();
      expect(workspaceClientMock.enterWorkspace).toBeCalledTimes(1);
    });

    it('should not enter workspace it workspace id is not set', async () => {
      const core = coreMock.createSetup();
      const service = new WorkspaceValidationService();
      await service.setup(core, '');

      expect(WorkspaceClientMock).toBeCalledTimes(1);
      expect(core.workspaces.setClient).toHaveBeenCalled();
      expect(workspaceClientMock.enterWorkspace).toBeCalledTimes(0);
    });
  });

  describe('#start', () => {
    it('should handle successful workspace initialization', async () => {
      const { core, service, initialized$ } = setupWorkspaceValidationStart();

      service.start(core);
      initialized$.next(true);

      await waitFor(() => {
        expect(core.chrome.setIsVisible).not.toHaveBeenCalled();
        expect(core.application.navigateToApp).not.toHaveBeenCalled();
      });
    });

    it('should show fatal error page when refreshWorkspace returns permission error on page switch', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();

      const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
      core.application.currentAppId$ = currentAppId$;
      core.application.capabilities = {
        ...core.application.capabilities,
        workspaces: { permissionEnabled: true },
      };

      workspaceClientMock.refreshWorkspace.mockResolvedValue({
        success: false,
        error: 'Invalid saved objects permission',
      });

      const coreSetup = coreMock.createSetup();
      await service.setup(coreSetup, 'test-workspace');
      service.start(core);

      // Simulate page switch
      currentAppId$.next('some-app');

      await waitFor(() => {
        expect(workspaceClientMock.refreshWorkspace).toHaveBeenCalledWith('test-workspace');
        expect(core.chrome.setIsVisible).toHaveBeenCalledWith(false);
        expect(core.application.navigateToApp).toHaveBeenCalledWith(WORKSPACE_FATAL_ERROR_APP_ID, {
          replace: true,
          state: { error: expect.any(String) },
        });
      });
    });

    it('should not show fatal error page when refreshWorkspace succeeds on page switch', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();

      const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
      core.application.currentAppId$ = currentAppId$;
      core.application.capabilities = {
        ...core.application.capabilities,
        workspaces: { permissionEnabled: true },
      };

      workspaceClientMock.refreshWorkspace.mockResolvedValue({
        success: true,
        result: { id: 'test-workspace', name: 'Test' },
      });

      const coreSetup = coreMock.createSetup();
      await service.setup(coreSetup, 'test-workspace');
      service.start(core);

      // Simulate page switch
      currentAppId$.next('some-app');

      await waitFor(() => {
        expect(workspaceClientMock.refreshWorkspace).toHaveBeenCalledWith('test-workspace');
      });
      expect(core.chrome.setIsVisible).not.toHaveBeenCalled();
    });

    it('should not show fatal error page when refreshWorkspace returns non-permission error', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();

      const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
      core.application.currentAppId$ = currentAppId$;
      core.application.capabilities = {
        ...core.application.capabilities,
        workspaces: { permissionEnabled: true },
      };

      workspaceClientMock.refreshWorkspace.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const coreSetup = coreMock.createSetup();
      await service.setup(coreSetup, 'test-workspace');
      service.start(core);

      // Simulate page switch
      currentAppId$.next('some-app');

      await waitFor(() => {
        expect(workspaceClientMock.refreshWorkspace).toHaveBeenCalledWith('test-workspace');
      });
      expect(core.chrome.setIsVisible).not.toHaveBeenCalled();
    });

    it('should not show fatal error page on page switch when permission control is disabled', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();
      workspaceClientMock.refreshWorkspace.mockClear();

      const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
      core.application.currentAppId$ = currentAppId$;
      // permissionEnabled is falsy by default

      workspaceClientMock.refreshWorkspace.mockResolvedValue({
        success: false,
        error: 'Invalid saved objects permission',
      });

      const coreSetup = coreMock.createSetup();
      await service.setup(coreSetup, 'test-workspace');
      service.start(core);

      // Simulate page switch
      currentAppId$.next('some-app');

      await waitFor(() => {
        expect(workspaceClientMock.refreshWorkspace).toHaveBeenCalledWith('test-workspace');
      });
      // Should not show error page when permission control is disabled
      expect(core.chrome.setIsVisible).not.toHaveBeenCalled();
    });

    it('should not refresh workspace when navigating to fatal error page', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();
      workspaceClientMock.refreshWorkspace.mockClear();

      const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
      core.application.currentAppId$ = currentAppId$;
      core.application.capabilities = {
        ...core.application.capabilities,
        workspaces: { permissionEnabled: true },
      };

      workspaceClientMock.refreshWorkspace.mockResolvedValue({ success: true, result: {} });

      const coreSetup = coreMock.createSetup();
      await service.setup(coreSetup, 'test-workspace');
      service.start(core);

      // Clear calls from initial subscription emission
      workspaceClientMock.refreshWorkspace.mockClear();

      // Simulate navigation to fatal error page
      currentAppId$.next(WORKSPACE_FATAL_ERROR_APP_ID);

      expect(workspaceClientMock.refreshWorkspace).not.toHaveBeenCalled();
    });

    it('should redirect from error page to workspace detail when workspace becomes valid', async () => {
      const core = coreMock.createStart();
      const service = new WorkspaceValidationService();

      // Simulate being on the fatal error page by replacing currentAppId$ with a BehaviorSubject
      core.application.currentAppId$ = new BehaviorSubject<string | undefined>(
        WORKSPACE_FATAL_ERROR_APP_ID
      );

      service.start(core);
      core.workspaces.initialized$.next(true);

      await waitFor(() => {
        expect(core.application.navigateToApp).toHaveBeenCalledWith(WORKSPACE_DETAIL_APP_ID);
      });
    });

    it('should handle stale workspace error', async () => {
      const { core, service, workspaceError$, initialized$ } = setupWorkspaceValidationStart();

      service.start(core);
      workspaceError$.next(WorkspaceError.WORKSPACE_IS_STALE);
      initialized$.next(false);

      await waitFor(() => {
        expect(core.chrome.setIsVisible).toHaveBeenCalledWith(false);
        expect(core.application.navigateToApp).toHaveBeenCalledWith(WORKSPACE_FATAL_ERROR_APP_ID, {
          replace: true,
          state: {
            error: expect.any(String),
          },
        });
      });
    });

    it('should handle workspace not found error', async () => {
      const { core, service, workspaceError$, initialized$ } = setupWorkspaceValidationStart();
      const workspaceNotFoundError = 'workspace not found';

      service.start(core);

      workspaceError$.next(workspaceNotFoundError);
      initialized$.next(false);

      await waitFor(() => {
        expect(core.chrome.setIsVisible).toHaveBeenCalledWith(false);
        expect(core.application.navigateToApp).toHaveBeenCalledWith(WORKSPACE_FATAL_ERROR_APP_ID, {
          replace: true,
          state: {
            error: workspaceNotFoundError,
          },
        });
      });
    });
  });

  describe('#stop', () => {
    it('should cleanup subscriptions on stop', async () => {
      const { core, service, workspaceError$, initialized$ } = setupWorkspaceValidationStart();

      service.start(core);
      service.stop();

      // These emissions should not trigger any actions after stop
      workspaceError$.next(WorkspaceError.WORKSPACE_IS_STALE);
      initialized$.next(false);

      await waitFor(() => {
        expect(core.application.navigateToApp).not.toHaveBeenCalled();
      });
    });
  });
});

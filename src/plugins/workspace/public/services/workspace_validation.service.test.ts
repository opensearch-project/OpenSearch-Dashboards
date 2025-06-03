/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { workspaceClientMock, WorkspaceClientMock } from '../workspace_client.mock';
import { coreMock } from '../../../../core/public/mocks';
import { WorkspaceValidationService } from './workspace_validation_service';
import { waitFor } from '@testing-library/dom';
import { WORKSPACE_FATAL_ERROR_APP_ID } from '../../common/constants';
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

    it('should redirect from error page to workspace detail when workspace becomes valid', async () => {
      const { core, service, initialized$ } = setupWorkspaceValidationStart();

      service.start(core);
      initialized$.next(true);

      await waitFor(() => {
        expect(core.application.currentAppId$.subscribe).toHaveBeenCalledWith(expect.any(Function));
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

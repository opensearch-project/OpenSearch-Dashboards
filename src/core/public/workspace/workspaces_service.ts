/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { isEqual } from 'lodash';
import { CoreService, WorkspaceObject } from '../../types';

interface WorkspaceObservables {
  /**
   * Indicates the current activated workspace id, the value should be changed every time
   * when switching to a different workspace
   */
  currentWorkspaceId$: BehaviorSubject<string>;

  /**
   * The workspace that is derived from `currentWorkspaceId` and `workspaceList`, if
   * `currentWorkspaceId` cannot be found from `workspaceList`, it will return an error
   *
   * This value MUST NOT set manually from outside of WorkspacesService
   */
  currentWorkspace$: BehaviorSubject<WorkspaceObject | null>;

  /**
   * The list of available workspaces. This workspace list should be set by whoever
   * the workspace functionalities
   */
  workspaceList$: BehaviorSubject<WorkspaceObject[]>;

  /**
   * This is a flag which indicates the WorkspacesService module is initialized and ready
   * for consuming by others. For example, the `workspaceList` has been set, etc
   */
  initialized$: BehaviorSubject<boolean>;
}

enum WORKSPACE_ERROR_REASON_MAP {
  WORKSPACE_STALED = 'WORKSPACE_STALED',
}

export type WorkspacesSetup = WorkspaceObservables;
export type WorkspacesStart = WorkspaceObservables;

export class WorkspacesService implements CoreService<WorkspacesSetup, WorkspacesStart> {
  private currentWorkspaceId$ = new BehaviorSubject<string>('');
  private workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([]);
  private currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(null);
  private initialized$ = new BehaviorSubject<boolean>(false);

  constructor() {
    combineLatest([this.initialized$, this.workspaceList$, this.currentWorkspaceId$]).subscribe(
      ([workspaceInitialized, workspaceList, currentWorkspaceId]) => {
        if (workspaceInitialized) {
          const currentWorkspace = workspaceList.find((w) => w && w.id === currentWorkspaceId);

          /**
           * Do a simple idempotent verification here
           */
          if (!isEqual(currentWorkspace, this.currentWorkspace$.getValue())) {
            this.currentWorkspace$.next(currentWorkspace ?? null);
          }

          if (currentWorkspaceId && !currentWorkspace?.id) {
            /**
             * Current workspace is staled
             */
            this.currentWorkspaceId$.error({
              reason: WORKSPACE_ERROR_REASON_MAP.WORKSPACE_STALED,
            });
            this.currentWorkspace$.error({
              reason: WORKSPACE_ERROR_REASON_MAP.WORKSPACE_STALED,
            });
          }
        }
      }
    );
  }

  public setup(): WorkspacesSetup {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      initialized$: this.initialized$,
    };
  }

  public start(): WorkspacesStart {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      initialized$: this.initialized$,
    };
  }

  public async stop() {
    this.currentWorkspace$.unsubscribe();
    this.currentWorkspaceId$.unsubscribe();
    this.workspaceList$.unsubscribe();
    this.initialized$.unsubscribe();
  }
}

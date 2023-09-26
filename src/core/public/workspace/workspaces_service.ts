/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { isEqual } from 'lodash';

import { CoreService, WorkspaceAttribute } from '../../types';

type WorkspaceObject = WorkspaceAttribute & { readonly?: boolean };

export interface WorkspaceObservables {
  currentWorkspaceId$: BehaviorSubject<string>;
  currentWorkspace$: BehaviorSubject<WorkspaceObject | null>;
  workspaceList$: BehaviorSubject<WorkspaceObject[]>;
  workspaceEnabled$: BehaviorSubject<boolean>;
  initialized$: BehaviorSubject<boolean>;
}

enum WORKSPACE_ERROR {
  WORKSPACE_STALED = 'WORKSPACE_STALED',
}

export type WorkspacesSetup = WorkspaceObservables;
export type WorkspacesStart = WorkspaceObservables;

export class WorkspacesService implements CoreService<WorkspacesSetup, WorkspacesStart> {
  private currentWorkspaceId$ = new BehaviorSubject<string>('');
  private workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([]);
  private currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(null);
  private initialized$ = new BehaviorSubject<boolean>(false);
  private workspaceEnabled$ = new BehaviorSubject<boolean>(false);

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
              reason: WORKSPACE_ERROR.WORKSPACE_STALED,
            });
            this.currentWorkspace$.error({
              reason: WORKSPACE_ERROR.WORKSPACE_STALED,
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
      workspaceEnabled$: this.workspaceEnabled$,
    };
  }

  public start(): WorkspacesStart {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      initialized$: this.initialized$,
      workspaceEnabled$: this.workspaceEnabled$,
    };
  }

  public async stop() {
    this.currentWorkspace$.unsubscribe();
    this.currentWorkspaceId$.unsubscribe();
    this.workspaceList$.unsubscribe();
    this.workspaceEnabled$.unsubscribe();
    this.initialized$.unsubscribe();
  }
}

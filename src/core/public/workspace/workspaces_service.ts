/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, combineLatest } from 'rxjs';
import { isEqual } from 'lodash';

import { CoreService, WorkspaceAttribute } from '../../types';
import { InternalApplicationStart } from '../application';
import { HttpSetup } from '../http';

type WorkspaceMenuRenderFn = ({
  basePath,
  getUrlForApp,
  observables,
}: {
  getUrlForApp: InternalApplicationStart['getUrlForApp'];
  basePath: HttpSetup['basePath'];
  observables: WorkspaceObservables;
}) => JSX.Element | null;

export interface WorkspaceObservables {
  currentWorkspaceId$: BehaviorSubject<string>;
  currentWorkspace$: BehaviorSubject<WorkspaceAttribute | null>;
  workspaceList$: BehaviorSubject<WorkspaceAttribute[]>;
  workspaceEnabled$: BehaviorSubject<boolean>;
  initialized$: BehaviorSubject<boolean>;
}

enum WORKSPACE_ERROR_REASON_MAP {
  WORKSPACE_STALED = 'WORKSPACE_STALED',
}

/**
 * @public
 */
export interface WorkspaceSetup extends WorkspaceObservables {
  registerWorkspaceMenuRender: (render: WorkspaceMenuRenderFn) => void;
}

export interface WorkspaceStart extends WorkspaceObservables {
  renderWorkspaceMenu: () => JSX.Element | null;
}

export class WorkspaceService implements CoreService<WorkspaceSetup, WorkspaceStart> {
  private currentWorkspaceId$ = new BehaviorSubject<string>('');
  private workspaceList$ = new BehaviorSubject<WorkspaceAttribute[]>([]);
  private currentWorkspace$ = new BehaviorSubject<WorkspaceAttribute | null>(null);
  private initialized$ = new BehaviorSubject<boolean>(false);
  private workspaceEnabled$ = new BehaviorSubject<boolean>(false);
  private _renderWorkspaceMenu: WorkspaceMenuRenderFn | null = null;

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

  public setup(): WorkspaceSetup {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      initialized$: this.initialized$,
      workspaceEnabled$: this.workspaceEnabled$,
      registerWorkspaceMenuRender: (render: WorkspaceMenuRenderFn) =>
        (this._renderWorkspaceMenu = render),
    };
  }

  public start({
    http,
    application,
  }: {
    application: InternalApplicationStart;
    http: HttpSetup;
  }): WorkspaceStart {
    const observables = {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      initialized$: this.initialized$,
      workspaceEnabled$: this.workspaceEnabled$,
    };
    return {
      ...observables,
      renderWorkspaceMenu: () => {
        if (this._renderWorkspaceMenu) {
          return this._renderWorkspaceMenu({
            basePath: http.basePath,
            getUrlForApp: application.getUrlForApp,
            observables,
          });
        }
        return null;
      },
    };
  }

  public async stop() {
    this.currentWorkspace$.unsubscribe();
    this.currentWorkspaceId$.unsubscribe();
    this.workspaceList$.unsubscribe();
    this.workspaceEnabled$.unsubscribe();
    this.initialized$.unsubscribe();
    this._renderWorkspaceMenu = null;
  }
}

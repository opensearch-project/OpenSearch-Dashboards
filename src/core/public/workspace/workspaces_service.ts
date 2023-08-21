/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreService } from '../../types';
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

export interface WorkspaceAttribute {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
}

export class WorkspaceService implements CoreService<WorkspaceSetup, WorkspaceStart> {
  private currentWorkspaceId$ = new BehaviorSubject<string>('');
  private workspaceList$ = new BehaviorSubject<WorkspaceAttribute[]>([]);
  private currentWorkspace$ = new BehaviorSubject<WorkspaceAttribute | null>(null);
  private workspaceEnabled$ = new BehaviorSubject<boolean>(false);
  private _renderWorkspaceMenu: WorkspaceMenuRenderFn | null = null;

  public setup(): WorkspaceSetup {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
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
    this._renderWorkspaceMenu = null;
  }
}

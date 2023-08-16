/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BehaviorSubject } from 'rxjs';
import { CoreService } from '../../types';

/**
 * @public
 */
export interface WorkspaceStart {
  currentWorkspaceId$: BehaviorSubject<string>;
  currentWorkspace$: BehaviorSubject<WorkspaceAttribute | null>;
  workspaceList$: BehaviorSubject<WorkspaceAttribute[]>;
  workspaceEnabled$: BehaviorSubject<boolean>;
}

export type WorkspaceSetup = WorkspaceStart;

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

  public setup(): WorkspaceSetup {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      workspaceEnabled$: this.workspaceEnabled$,
    };
  }

  public start(): WorkspaceStart {
    return {
      currentWorkspaceId$: this.currentWorkspaceId$,
      currentWorkspace$: this.currentWorkspace$,
      workspaceList$: this.workspaceList$,
      workspaceEnabled$: this.workspaceEnabled$,
    };
  }

  public async stop() {
    this.currentWorkspace$.unsubscribe();
    this.currentWorkspaceId$.unsubscribe();
    this.workspaceList$.unsubscribe();
  }
}

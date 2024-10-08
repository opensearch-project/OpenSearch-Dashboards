/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { WorkspaceCollaborator } from '../types';

interface OnAddOptions {
  onAddCollaborators: (collaborators: WorkspaceCollaborator[]) => Promise<void>;
}

export interface WorkspaceCollaboratorType {
  id: string;
  name: string;
  buttonLabel: string;
  getDisplayedType?: (collaborator: WorkspaceCollaborator) => string | void;
  onAdd: ({ onAddCollaborators }: OnAddOptions) => Promise<void>;
}

export class WorkspaceCollaboratorTypesService {
  private _collaboratorTypes$ = new BehaviorSubject<WorkspaceCollaboratorType[]>([]);

  public getTypes$() {
    return this._collaboratorTypes$;
  }

  public setTypes(types: WorkspaceCollaboratorType[]) {
    this._collaboratorTypes$.next(types);
  }

  public stop() {
    this._collaboratorTypes$.complete();
  }
}

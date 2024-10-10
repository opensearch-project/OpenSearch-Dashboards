/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { CoreService } from '../../types';
import { CoreContext } from '../core_context';
import { Logger } from '../logging';

export interface InternalWorkspaceServiceSetup {
  isWorkspaceEnabled: () => boolean;
}

export interface InternalWorkspaceServiceStart {
  isWorkspaceEnabled: () => boolean;
}

/** @internal */
export class WorkspaceService
  implements CoreService<InternalWorkspaceServiceSetup, InternalWorkspaceServiceStart> {
  private readonly log: Logger;
  private readonly config$: Observable<{ enabled: boolean }>;

  constructor(private readonly coreContext: CoreContext) {
    this.log = this.coreContext.logger.get('workspace-service');
    this.config$ = this.coreContext.configService.atPath<{ enabled: boolean }>('workspace');
  }

  public async setup(): Promise<InternalWorkspaceServiceSetup> {
    this.log.debug('Setting up workspace service');

    const workspaceConfig = await this.config$.pipe(first()).toPromise();

    return {
      isWorkspaceEnabled: () => workspaceConfig.enabled,
    };
  }

  public async start(): Promise<InternalWorkspaceServiceStart> {
    this.log.debug('Starting workspace service');

    const workspaceConfig = await this.config$.pipe(first()).toPromise();

    return {
      isWorkspaceEnabled: () => workspaceConfig.enabled,
    };
  }

  public async stop() {}
}

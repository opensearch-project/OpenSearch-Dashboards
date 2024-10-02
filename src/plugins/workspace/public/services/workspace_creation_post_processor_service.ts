/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

import { ApplicationStart, HttpStart } from '../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../core/public/utils';

const defaultProcessor = ({
  http,
  workspaceId,
  application,
  useCaseLandingAppId,
}: {
  http: HttpStart;
  workspaceId: string;
  application: ApplicationStart;
  useCaseLandingAppId: string;
}) => {
  // Redirect page after one second, leave one second time to show create successful toast.
  window.setTimeout(() => {
    window.location.href = formatUrlWithWorkspaceId(
      application.getUrlForApp(useCaseLandingAppId, {
        absolute: true,
      }),
      workspaceId,
      http.basePath
    );
  }, 1000);
};

export type WorkspaceCreationPostProcessor = typeof defaultProcessor;

export class WorkspaceCreationPostProcessorService {
  private static _instance: WorkspaceCreationPostProcessorService;
  private _processor$ = new BehaviorSubject(defaultProcessor);

  public getProcessor() {
    return this._processor$.getValue();
  }

  public registerProcessor(processor: WorkspaceCreationPostProcessor) {
    this._processor$.next(processor);
    return () => {
      if (this._processor$.getValue() === processor) {
        this._processor$.next(defaultProcessor);
      }
    };
  }

  static getInstance() {
    if (!WorkspaceCreationPostProcessorService._instance) {
      WorkspaceCreationPostProcessorService._instance = new WorkspaceCreationPostProcessorService();
    }
    return WorkspaceCreationPostProcessorService._instance;
  }
}

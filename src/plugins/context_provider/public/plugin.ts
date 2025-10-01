/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  ContextProviderSetup,
  ContextProviderStart,
  ContextProviderSetupDeps,
  ContextProviderStartDeps,
} from './types';
import { ContextCaptureService } from './services/context_capture_service';

export class ContextProviderPlugin
  implements
    Plugin<
      ContextProviderSetup,
      ContextProviderStart,
      ContextProviderSetupDeps,
      ContextProviderStartDeps
    > {
  private contextCaptureService?: ContextCaptureService;

  public setup(core: CoreSetup, plugins: ContextProviderSetupDeps): ContextProviderSetup {
    this.contextCaptureService = new ContextCaptureService(core, plugins);

    this.contextCaptureService.setup();

    return {};
  }

  public start(core: CoreStart, plugins: ContextProviderStartDeps): ContextProviderStart {
    if (!this.contextCaptureService) {
      throw new Error('Context Provider services not initialized');
    }

    this.contextCaptureService.start(core, plugins);

    return {
      getAssistantContextStore: () => this.contextCaptureService!.getAssistantContextStore(),
    };
  }

  public stop() {
    if (this.contextCaptureService) {
      this.contextCaptureService.stop();
    }
  }
}

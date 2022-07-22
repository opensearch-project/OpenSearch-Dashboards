/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { HttpSetup } from '../../../../core/public';
import { CredentialCreationConfig, CredentialCreationManager } from './creation';


interface SetupDependencies {
  httpClient: HttpSetup;
}

/**
 * credential management service
 *
 * @internal
 */
export class CredentialManagementService {
  credentialCreationManager: CredentialCreationManager;

  constructor() {
    // TODO: Refactor with Singleton
    this.credentialCreationManager = new CredentialCreationManager();
  }

  public setup({ httpClient }: SetupDependencies) {
    const creationManagerSetup = this.credentialCreationManager.setup(httpClient);
    creationManagerSetup.addCreationConfig(CredentialCreationConfig);

    return {
      creation: creationManagerSetup,
      // TODO: Add list, editor, and env service setup
    };
  }

  public start() {
    return {
      creation: this.credentialCreationManager.start(),
      // TODO: Add list config and editor
    };
  }

  public stop() {
    // nothing to do here yet.
  }
}

// /** @internal */
export type CredentialManagementServiceSetup = ReturnType<CredentialManagementService['setup']>;
export type CredentialManagementServiceStart = ReturnType<CredentialManagementService['start']>;

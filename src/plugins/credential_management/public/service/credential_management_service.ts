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

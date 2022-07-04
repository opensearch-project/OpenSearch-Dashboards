import { HttpSetup } from '../../../../core/public';

interface SetupDependencies {
  httpClient: HttpSetup;
}

/**
 * credential management service
 *
 * @internal
 */
export class CredentialManagementService {
  constructor() {}

  public setup({ httpClient }: SetupDependencies) {}

  public start() {}

  public stop() {
    // nothing to do here yet.
  }
}

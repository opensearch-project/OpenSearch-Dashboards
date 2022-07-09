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

import { HttpSetup } from '../../../../../core/public';
import { CredentialCreationConfig, UrlHandler, CredentialCreationOption } from './config';

// TODO: Revisit it
export class CredentialCreationManager {
  private configs: CredentialCreationConfig[] = [];
  setup(httpClient: HttpSetup) {
    return {
      addCreationConfig: (Config: typeof CredentialCreationConfig) => {
        const config = new Config({ httpClient });

        if (this.configs.findIndex((c) => c.key === config.key) !== -1) {
          throw new Error(`${config.key} exists in CredentialCreationManager.`);
        }

        this.configs.push(config);
      },
    };
  }

  start() {
    return {
      getCredentialCreationOptions: async (urlHandler: UrlHandler) => {
        const options: CredentialCreationOption[] = [];

        await Promise.all(
          this.configs.map(async (config) => {
            const option = config.getCredentialCreationOption
              ? await config.getCredentialCreationOption(urlHandler)
              : null;
            if (option) {
              options.push(option);
            }
          })
        );

        return options;
      },
    };
  }
}

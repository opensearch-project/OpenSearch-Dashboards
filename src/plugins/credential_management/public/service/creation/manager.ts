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
// import { CredentialCreationConfig, UrlHandler, CredentialCreationOption } from './config';

// TODO: Revisit it
export class CredentialCreationManager {
//   private configs: CredentialCreationConfig[] = [];
  setup(httpClient: HttpSetup) {
    return {
    // TODO - Add Config  
    //   addCreationConfig: (Config: typeof CredentialCreationConfig) => {
    //     const config = new Config({ httpClient });

    //     if (this.configs.findIndex((c) => c.key === config.key) !== -1) {
    //       throw new Error(`${config.key} exists in CredentialCreationManager.`);
    //     }

    //     this.configs.push(config);
    //   },
    };
  }

  start() {
    // const getType = (key: string | undefined): CredentialCreationConfig => {
    //   if (key) {
    //     const index = this.configs.findIndex((config) => config.key === key);
    //     const config = this.configs[index];

    //     if (config) {
    //       return config;
    //     } else {
    //       throw new Error(`Index pattern creation type not found: ${key}`);
    //     }
    //   } else {
    //     return getType('default');
    //   }
    // };

    // return {
    //   getType,
    //   getIndexPatternCreationOptions: async (urlHandler: UrlHandler) => {
    //     const options: CredentialCreationOption[] = [];

    //     await Promise.all(
    //       this.configs.map(async (config) => {
    //         const option = config.getCredentialCreationOption
    //           ? await config.getCredentialCreationOption(urlHandler)
    //           : null;
    //         if (option) {
    //           options.push(option);
    //         }
    //       })
    //     );

    //     return options;
    //   },
    // };
    return {};
  }
}

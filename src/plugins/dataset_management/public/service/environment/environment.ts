/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MlCardState } from '../../types';

/** @public */
export interface Environment {
  /**
   * Flag whether ml features should be advertised
   */
  readonly ml: () => MlCardState;
}

export class EnvironmentService {
  private environment = {
    ml: () => MlCardState.DISABLED,
  };

  public setup() {
    return {
      /**
       * Update the environment to influence how available features are presented.
       * @param update
       */
      update: (update: Partial<Environment>) => {
        this.environment = Object.assign({}, this.environment, update);
      },
    };
  }

  public getEnvironment() {
    return this.environment;
  }
}

export type EnvironmentServiceSetup = ReturnType<EnvironmentService['setup']>;

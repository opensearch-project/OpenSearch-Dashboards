/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deepFreeze } from '@osd/std';
import { AuthenticationMethod } from '../../server/types';
import { AuthType } from '../../common/data_sources';

export type IAuthenticationMethodRegistry = Omit<
  AuthenticationMethodRegistry,
  'registerAuthenticationMethod'
>;

export class AuthenticationMethodRegistry {
  private readonly authMethods = new Map<string, AuthenticationMethod>();
  /**
   * Register a authMethods with function to return credentials inside the registry.
   * Authentication Method can only be registered once. subsequent calls with the same method name will throw an error.
   */
  public registerAuthenticationMethod(method: AuthenticationMethod) {
    if (
      method.name === AuthType.NoAuth ||
      method.name === AuthType.UsernamePasswordType ||
      method.name === AuthType.SigV4
    ) {
      throw new Error(
        `Must not be no_auth or username_password or sigv4 for registered auth types`
      );
    }
    if (this.authMethods.has(method.name)) {
      throw new Error(`Authentication method '${method.name}' is already registered`);
    }
    this.authMethods.set(method.name, deepFreeze(method) as AuthenticationMethod);
  }

  public getAllAuthenticationMethods() {
    return [...this.authMethods.values()];
  }

  public getAuthenticationMethod(name: string) {
    return this.authMethods.get(name);
  }
}

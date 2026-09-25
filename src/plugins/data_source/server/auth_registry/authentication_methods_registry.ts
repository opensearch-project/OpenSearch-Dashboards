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

  /**
   * Removes a previously registered authentication method.
   *
   * Exists so the data source plugin's built-in OAuth2 provider can be replaced when another
   * plugin registers its own. Without it that registration would hit the duplicate-name check
   * above and fail the registering plugin's setup, taking down startup. Not part of
   * IAuthenticationMethodRegistry, so it is not reachable by plugins.
   */
  public removeAuthenticationMethod(name: string) {
    this.authMethods.delete(name);
  }

  public getAllAuthenticationMethods() {
    return [...this.authMethods.values()];
  }

  public getAuthenticationMethod(name: string) {
    return this.authMethods.get(name);
  }
}

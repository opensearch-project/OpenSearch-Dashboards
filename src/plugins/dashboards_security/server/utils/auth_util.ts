/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../auth/user';
import { userProfiles } from '../auth/types/basic/user_bank';
import { OpenIdAuthConfig } from '../auth/types/openid/openid_auth';

export const authenticate = (authBody: any): User | null => {
  const user = userProfiles.get(authBody.username);
  try {
    if (user !== undefined && user.password === authBody.password) {
      return {
        username: authBody.username,
        credentials: authBody.password,
      };
    } else {
      throw new Error('authentication exception:: User not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const authenticateWithToken = (
  authzHeader: string,
  idToken: string | undefined,
  idpConfig: any,
  openIdAuthConfig: OpenIdAuthConfig,
  authType: string
): User => {
  try {
    // If IdToke = null => not authenticated
    // Else: if token payload.email does not exist => insert entry
    //      else: get the user info from identity storage

    const credentials: any = {
      authzHeader,
      idToken,
    };

    if (!idToken) {
      throw new Error('authentication exception');
    } else {
      const decodedIdToken = decodeIdToken(idToken);
      if (!validateIdToken(decodedIdToken, idpConfig, openIdAuthConfig)) {
        throw new Error('authentication exception:: Invalid ID Token');
      }

      const username = decodedIdToken.email;
      const user = userProfiles.get(username);

      if (user) {
        return {
          username: user.username,
          credentials,
        };
      } else {
        // insert into user_bank, need implementation
        userProfiles.set(username, { username, password: '', authOption: authType });
        // console.log("userProfile:: ", userProfiles);
        return {
          username,
          credentials,
        };
      }
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const decodeIdToken = (token: string): any => {
  const parts = token.toString().split('.');
  if (parts.length !== 3) {
    throw new Error('authentication exception:: Invalid token');
  }
  const claim = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  return claim;
};

const validateIdToken = (
  idToken: any,
  idpConfig: any,
  openIdAuthConfig: OpenIdAuthConfig
): boolean => {
  if (
    idToken.aud !== idpConfig.client_id ||
    idToken.iss !== openIdAuthConfig.issuer ||
    idToken.exp > Date.now()
  ) {
    return false;
  }
  return true;
};

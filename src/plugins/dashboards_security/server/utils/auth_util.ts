/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../auth/user';
import { userProfiles } from '../auth/types/basic/user_bank';

export const authenticate = (authBody: any): User | null => {
  const user = userProfiles.get(authBody.username);
  if (user !== undefined && user.password === authBody.password) {
    return {
      username: authBody.username,
      credentials: authBody.password,
    };
  } else {
    return null;
  }
};

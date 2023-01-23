/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSchema {
  username: string;
  email: string;
  password: string;
}

export const userProfiles = new Map([
  [
    'admin',
    {
      username: 'admin',
      email: 'admin@amazon.com',
      password: 'admin',
    },
  ],
  [
    'aoguan',
    {
      username: 'aoguan',
      email: 'aoguan@amazon.com',
      password: 'admin',
    },
  ],
]);

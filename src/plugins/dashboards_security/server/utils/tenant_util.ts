/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../auth/user';

export const resolveTenant = (user: User) => {
  if (user.username === 'admin') {
    return '';
  } else {
    return '__user__';
  }
};

export const isValidTenant = (tenantName: string): boolean => {
  return true;
};

export const isMultitenantPath = (pathName: string): boolean => {
  return true;
};

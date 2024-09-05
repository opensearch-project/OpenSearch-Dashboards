/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, OpenSearchDashboardsRequest } from '../../../core/server';
import { getPrincipalsFromRequest } from '../../../core/server/utils';

export const extractUserName = (request: OpenSearchDashboardsRequest, core?: CoreStart) => {
  try {
    const principals = getPrincipalsFromRequest(request, core?.http.auth);
    if (principals && principals.users?.length) {
      return principals.users[0];
    }
  } catch (error) {
    return undefined;
  }
};

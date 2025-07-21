/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setup } from '../../../../../core/test_helpers/http_test_setup';

export const { http } = setup((injectedMetadata) => {
  injectedMetadata.getBasePath.mockReturnValue('/hola/daro/');
});

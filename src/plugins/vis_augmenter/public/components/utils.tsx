/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorEmbeddable } from '../../../embeddable/public';

export const getErrorMessage = (errorEmbeddable: ErrorEmbeddable): string => {
  return errorEmbeddable.error instanceof Error
    ? errorEmbeddable.error.message
    : errorEmbeddable.error;
};

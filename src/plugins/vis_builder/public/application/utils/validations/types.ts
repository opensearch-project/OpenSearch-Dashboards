/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationResult<T = boolean> {
  errorMsg?: string;
  valid: T;
}

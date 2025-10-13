/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function containsIllegalCharacters(pattern: string, illegalCharacters: string[]) {
  return illegalCharacters.some((char) => pattern.includes(char));
}

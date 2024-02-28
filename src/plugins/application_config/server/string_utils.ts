/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
export const ERROR_MESSSAGE_FOR_EMPTY_INPUT = 'Input cannot be empty!';
export const ERROR_FOR_EMPTY_INPUT = new Error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);

export function isEmpty(input: string): boolean {
  if (!input) {
    return true;
  }

  return !input.trim();
}

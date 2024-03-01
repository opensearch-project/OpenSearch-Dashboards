/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'src/core/server';

const ERROR_MESSSAGE_FOR_EMPTY_INPUT = 'Input cannot be empty!';
const ERROR_FOR_EMPTY_INPUT = new Error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);

function isEmpty(input: string): boolean {
  if (!input) {
    return true;
  }

  return !input.trim();
}

export function validate(input: string, logger: Logger): string {
  if (isEmpty(input)) {
    logger.error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);
    throw ERROR_FOR_EMPTY_INPUT;
  }

  return input.trim();
}

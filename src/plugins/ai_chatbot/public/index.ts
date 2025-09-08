/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { AIChatbotPlugin } from './plugin';

export function plugin() {
  return new AIChatbotPlugin();
}

export { AIChatbotPlugin };
export * from './types';
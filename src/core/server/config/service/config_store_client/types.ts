/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConfigDocument {
  config_name: string;
  config_blob: Record<string, any>;
}

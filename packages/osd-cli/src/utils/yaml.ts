/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as jsYaml from 'js-yaml';

/**
 * Serialize a JavaScript value to YAML string using js-yaml.
 */
export function toYaml(value: unknown): string {
  return jsYaml.dump(value, { lineWidth: -1 });
}

/**
 * Parse a YAML string into a JavaScript value using js-yaml.
 * Also handles JSON input transparently since JSON is valid YAML.
 */
export function fromYaml(input: string): unknown {
  return jsYaml.load(input);
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes field names for use in Vega-Lite visualizations by replacing special characters
 * with underscores to ensure compatibility with Vega-Lite's field referencing system.
 *
 * This function is essential for handling nested object field names (e.g., "machine.os",
 * "user[name]") that contain characters with special meaning in Vega-Lite. By normalizing
 * these field names, we ensure that Vega-Lite can properly reference and process the fields
 * in visualization specifications.
 *
 * See: https://vega.github.io/vega-lite/docs/field.html
 *
 * @example
 * normalizeField("machine.os") // returns "machine_os"
 * normalizeField("user[name]") // returns "user(name)"
 * normalizeField("data.metrics[0]") // returns "data_metrics(0)"
 */
export const normalizeField = (field: string) => {
  return field.replace(/\./g, '_').replace(/\[/g, '(').replace(/\]/g, ')').trim();
};

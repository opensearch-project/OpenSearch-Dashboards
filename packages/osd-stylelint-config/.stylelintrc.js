/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

module.exports = {
  plugins: [
    '@osd/stylelint-plugin-stylelint',
  ],

  rules: {
    '@osd/stylelint/no_modifying_global_selectors': [
      {
        config: "./../../../osd-stylelint-config/config/global_selectors.json"
      },
      {
        severity: "error"
      }
    ],
    '@osd/stylelint/no_custom_colors': [
      {
        config: './../../../osd-stylelint-config/config/colors.json'
      },
    ],
    '@osd/stylelint/no_restricted_properties': [
      {
        config: "./../../../osd-stylelint-config/config/restricted_properties.json"
      },
      {
        severity: "error"
      }
    ],
    '@osd/stylelint/no_restricted_values': [
      {
        config: "./../../../osd-stylelint-config/config/restricted_values.json"
      },
      {
        severity: "error"
      }
    ],
  }
}

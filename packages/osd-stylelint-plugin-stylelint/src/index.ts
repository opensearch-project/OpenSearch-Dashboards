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

import stylelint from 'stylelint';
import rules from './rules';

export const NAMESPACE = '@osd/stylelint';

const rulesPlugins = Object.keys(rules).map((ruleName: string) => {
  return stylelint.createPlugin(`${NAMESPACE}/${ruleName}`, rules[ruleName]);
});

// eslint-disable-next-line import/no-default-export
export default rulesPlugins;

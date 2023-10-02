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
import { NAMESPACE } from '../..';
import {
  getNotCompliantMessage,
  getRulesFromConfig,
  isValidOptions,
  getRuleFromConfig,
  FileBasedConfig,
} from '../../utils';

const { ruleMessages, report } = stylelint.utils;

const ruleName = 'no_modifying_global_selectors';
const messages = ruleMessages(ruleName, {
  expected: (message) => `${message}`,
});

const ruleFunction: stylelint.Rule = (
  primaryOption: Record<string, any>,
  secondaryOptionObject: Record<string, any>,
  context
) => {
  return (postcssRoot, postcssResult) => {
    const validOptions = isValidOptions(postcssResult, ruleName, primaryOption);
    if (!validOptions) {
      return;
    }

    const rules: FileBasedConfig = getRulesFromConfig(primaryOption.config);

    const isAutoFixing = Boolean(context.fix);

    postcssRoot.walkRules((rule) => {
      const selectorRule = getRuleFromConfig(rules, rule.selector);
      if (!selectorRule) {
        return;
      }

      let shouldReport = false;

      const file = postcssRoot.source?.input.file;
      if (!file) {
        return;
      }

      const approvedFiles = selectorRule.approved;

      const reportInfo = {
        ruleName: `${NAMESPACE}/${ruleName}`,
        result: postcssResult,
        node: rule,
        message: '',
      };

      if (approvedFiles) {
        shouldReport = !approvedFiles.some((inspectedFile) => {
          return file.includes(inspectedFile);
        });
      }

      if (shouldReport && isAutoFixing) {
        rule.remove();
        return;
      }

      if (!shouldReport) {
        return;
      }

      reportInfo.message = messages.expected(
        getNotCompliantMessage(
          `Modifying the global selector "${rule.selector}" is not allowed.`,
          selectorRule.explanation
        )
      );
      report(reportInfo);
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

// eslint-disable-next-line import/no-default-export
export default ruleFunction;

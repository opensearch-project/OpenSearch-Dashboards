/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import stylelint from 'stylelint';
import { NAMESPACE } from '../..';
import {
  getNotCompliantMessage,
  getRuleFromConfig,
  getRulesFromConfig,
  isValidOptions,
  FileBasedConfig,
} from '../../utils';

const { ruleMessages, report } = stylelint.utils;

const ruleName = 'no_restricted_values';
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

    postcssRoot.walkDecls((decl) => {
      const valueRule = getRuleFromConfig(rules, decl.value);
      if (!valueRule) {
        return;
      }

      let shouldReport = false;

      const file = postcssRoot.source?.input.file;
      if (!file) {
        return;
      }

      const approvedFiles = valueRule.approved;

      const reportInfo = {
        ruleName: `${NAMESPACE}/${ruleName}`,
        result: postcssResult,
        node: decl,
        message: '',
      };

      if (approvedFiles) {
        shouldReport = !approvedFiles.some((inspectedFile) => {
          return file.includes(inspectedFile);
        });
      }

      if (shouldReport && isAutoFixing) {
        decl.remove();
        return;
      }

      if (!shouldReport) {
        return;
      }

      reportInfo.message = messages.expected(
        getNotCompliantMessage(
          `Using the value "${decl.value}" is not allowed.`,
          valueRule.explanation
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

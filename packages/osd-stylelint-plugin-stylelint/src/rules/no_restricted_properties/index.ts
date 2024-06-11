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

const ruleName = 'no_restricted_properties';
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
      const propertyRule = getRuleFromConfig(rules, decl.prop);
      if (!propertyRule) {
        return;
      }

      let shouldReport = false;

      const file = postcssRoot.source?.input.file;
      if (!file) {
        return;
      }

      const approvedFiles = propertyRule.approved;

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
          `Specifying the "${decl.prop}" property is not allowed.`,
          propertyRule.explanation
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

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
import { Rule } from 'postcss';
import { NAMESPACE } from '../..';
import {
  ComplianceEngine,
  getTrackedMessage,
  getUntrackedMessage,
  getNotCompliantMessage,
  getRulesFromConfig,
  isColorProperty,
  isValidOptions,
} from '../../utils';

const isOuiAuditEnabled = Boolean(process.env.OUI_AUDIT_ENABLED);

const { ruleMessages, report } = stylelint.utils;
const engine = ComplianceEngine.default;

const ruleName = 'no_custom_colors';
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

    const rules = getRulesFromConfig(primaryOption.config);

    const isAutoFixing = Boolean(context.fix);

    postcssRoot.walkDecls((decl) => {
      if (!isColorProperty(decl.prop)) {
        return;
      }

      // We know this is a rule, because we discriminate the property in the conditional above. This means we only have 1 choice on its type.
      const parent = decl.parent as Rule;

      let shouldReport = false;

      const nodeInfo = {
        selector: parent.selector,
        prop: decl.prop,
        value: decl.value,
      };

      const reportInfo = {
        ruleName: `${NAMESPACE}/${ruleName}`,
        result: postcssResult,
        node: decl,
        message: '',
      };

      if (isOuiAuditEnabled && !engine.isTracked(rules, nodeInfo)) {
        reportInfo.message = messages.expected(getUntrackedMessage(nodeInfo));
        report(reportInfo);
        return;
      }

      const ruleObject = engine.getComplianceRule(rules, nodeInfo);

      if (!ruleObject) {
        if (isOuiAuditEnabled) {
          reportInfo.message = messages.expected(getTrackedMessage(nodeInfo));
          report(reportInfo);
        }
        return;
      }

      shouldReport = !ruleObject.isComplaint;

      if (shouldReport && isAutoFixing) {
        decl.value = ruleObject.expected;
        return;
      }

      if (!shouldReport) {
        return;
      }

      reportInfo.message = messages.expected(getNotCompliantMessage(ruleObject.message));
      report(reportInfo);
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

// eslint-disable-next-line import/no-default-export
export default ruleFunction;

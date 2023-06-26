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

const ruleFunction = (
  primaryOption: Record<string, any>,
  secondaryOptionObject: Record<string, any>,
  context
) => {
  return (postcssRoot: any, postcssResult: any) => {
    const validOptions = isValidOptions(postcssResult, ruleName, primaryOption);
    if (!validOptions) {
      return;
    }

    const rules = getRulesFromConfig(primaryOption.config);

    const isAutoFixing = Boolean(context.fix);

    postcssRoot.walkDecls((decl: any) => {
      if (!isColorProperty(decl.prop)) {
        return;
      }

      let shouldReport = false;

      const nodeInfo = {
        selector: decl.parent.selector,
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

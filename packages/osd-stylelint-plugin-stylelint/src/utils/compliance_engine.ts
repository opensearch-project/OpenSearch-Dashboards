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

export interface ComplianceRule {
  isComplaint: boolean;
  actual: string;
  expected: string;
  message: string;
}

const getRule = (rules: JSON, nodeInfo: { selector: string; prop: string }) => {
  const rule = rules[nodeInfo.prop];
  if (!rule) {
    return undefined;
  }

  if (!nodeInfo.selector) {
    return undefined;
  }

  const ruleKey = Object.keys(rule).find((key) => {
    const regex = new RegExp(key, 'gi');
    return nodeInfo.selector.match(regex);
  });

  if (!ruleKey) {
    return undefined;
  }

  return rule[ruleKey];
};

const isTracked = (rules: JSON, nodeInfo: { selector: string; prop: string }) => {
  return getRule(rules, nodeInfo) !== undefined;
};

const getComplianceRule = (
  rules: JSON,
  nodeInfo: { selector: string; prop: string; value: string }
): ComplianceRule | undefined => {
  const rule = getRule(rules, nodeInfo);

  if (!rule) {
    return undefined;
  }

  const ruleObject = rule.find((object) => {
    if (object.approved.includes(nodeInfo.value) || object.rejected.includes(nodeInfo.value)) {
      return object;
    }
  });

  if (!ruleObject) {
    return undefined;
  }

  return {
    isComplaint: !ruleObject.rejected.includes(nodeInfo.value),
    actual: nodeInfo.value,
    expected: ruleObject.approved,
    message: `${nodeInfo.selector} expected: ${ruleObject.approved} - actual: ${nodeInfo.value}`,
  };
};

// eslint-disable-next-line import/no-default-export
export default {
  isTracked,
  getComplianceRule,
};

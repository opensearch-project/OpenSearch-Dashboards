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

import { ValueBasedConfig } from './get_rules_from_config';

export interface ComplianceRule {
  isComplaint: boolean;
  actual: string;
  expected: string | undefined;
  message: string;
}

/**
 * Retrieves a specific rule from the provided rules based on the node information.
 * @param rules - The ValueBasedConfig containing rules.
 * @param nodeInfo - The information about the node (selector and prop).
 * @returns The specific rule if found, otherwise undefined.
 */
const getRule = (rules: ValueBasedConfig, nodeInfo: { selector: string; prop: string }) => {
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

/**
 * Checks if the specified node is tracked based on the provided rules.
 * @param rules - The ValueBasedConfig containing rules.
 * @param nodeInfo - The information about the node (selector and prop).
 * @returns True if the node is tracked, otherwise false.
 */
const isTracked = (rules: ValueBasedConfig, nodeInfo: { selector: string; prop: string }) => {
  return getRule(rules, nodeInfo) !== undefined;
};

/**
 * Retrieves the compliance rule for the specified node and value.
 * @param rules - The ValueBasedConfig containing rules.
 * @param nodeInfo - The information about the node (selector, prop, and value).
 * @returns The ComplianceRule object if a rule is found, otherwise undefined.
 */
const getComplianceRule = (
  rules: ValueBasedConfig,
  nodeInfo: { selector: string; prop: string; value: string }
): ComplianceRule | undefined => {
  const rule = getRule(rules, nodeInfo);

  if (!rule) {
    return undefined;
  }

  const ruleObject = rule.find((object) => {
    if (object.approved?.includes(nodeInfo.value) || object.rejected?.includes(nodeInfo.value)) {
      return object;
    }
  });

  if (!ruleObject) {
    return undefined;
  }

  return {
    isComplaint: !ruleObject.rejected?.includes(nodeInfo.value),
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

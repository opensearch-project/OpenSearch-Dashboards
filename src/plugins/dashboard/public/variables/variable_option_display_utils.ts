/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedVariableOption } from './types';

const getBaseDisplayText = (option: NormalizedVariableOption): string =>
  option.label?.trim() || option.value;

const hasDisplayLabel = (option: NormalizedVariableOption): boolean => Boolean(option.label?.trim());

export const buildVariableOptionDisplayTextMap = (
  options: NormalizedVariableOption[]
): Map<string, string> => {
  const displayTextCounts = new Map<string, number>();

  options.forEach((option) => {
    const displayText = getBaseDisplayText(option);
    displayTextCounts.set(displayText, (displayTextCounts.get(displayText) ?? 0) + 1);
  });

  return new Map(
    options.map((option) => {
      const displayText = getBaseDisplayText(option);
      const hasDuplicateDisplayText = (displayTextCounts.get(displayText) ?? 0) > 1;

      return [
        option.value,
        hasDuplicateDisplayText && hasDisplayLabel(option)
          ? `${displayText} (${option.value})`
          : displayText,
      ];
    })
  );
};

export const getVariableOptionDisplayText = (
  option: NormalizedVariableOption,
  displayTextMap: Map<string, string>
): string => displayTextMap.get(option.value) ?? getBaseDisplayText(option);

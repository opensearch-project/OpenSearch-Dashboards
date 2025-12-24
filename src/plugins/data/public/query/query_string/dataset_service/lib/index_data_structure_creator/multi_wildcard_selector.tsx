/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFieldText, EuiButton, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { canAppendWildcard } from './index_data_structure_creator_utils';

// Note: * and , are NOT in this list because they are special characters
// * is used for wildcard matching, , is used to separate multiple patterns
const ILLEGAL_CHARACTERS_VISIBLE = ['\\', '/', '?', '"', '<', '>', '|', ':', '+', '#'];

interface MultiWildcardSelectorProps {
  patterns: string[];
  onPatternsChange: (patterns: string[]) => void;
  onCurrentPatternChange?: (pattern: string) => void;
}

export const MultiWildcardSelector: React.FC<MultiWildcardSelectorProps> = ({
  patterns,
  onPatternsChange,
  onCurrentPatternChange,
}) => {
  const [currentPattern, setCurrentPattern] = useState('');
  const [appendedWildcard, setAppendedWildcard] = useState(false);
  const [previousValue, setPreviousValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate pattern for illegal characters
  const validatePattern = (inputPattern: string): string[] => {
    // If the input contains commas, validate each pattern separately
    if (inputPattern.includes(',')) {
      const splitPatterns = inputPattern
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);
      const allIllegalChars = new Set<string>();

      splitPatterns.forEach((pattern) => {
        const illegalChars = ILLEGAL_CHARACTERS_VISIBLE.filter((char) => pattern.includes(char));
        illegalChars.forEach((char) => allIllegalChars.add(char));

        // Check for spaces within the trimmed pattern (not leading/trailing)
        if (pattern.includes(' ')) {
          allIllegalChars.add(' ');
        }
      });

      return Array.from(allIllegalChars);
    } else {
      // For single patterns, check for illegal characters
      // Only flag spaces if they're within the pattern (not leading/trailing)
      const trimmedPattern = inputPattern.trim();
      const illegalChars = ILLEGAL_CHARACTERS_VISIBLE.filter((char) =>
        trimmedPattern.includes(char)
      );

      // Check for internal spaces (spaces that remain after trimming)
      if (trimmedPattern.includes(' ')) {
        illegalChars.push(' ');
      }

      return illegalChars;
    }
  };

  // Get validation error message
  const getValidationErrorMessage = (errors: string[]): string => {
    if (errors.length === 0) return '';

    const characterList =
      ILLEGAL_CHARACTERS_VISIBLE.slice(0, ILLEGAL_CHARACTERS_VISIBLE.length - 1).join(', ') +
      `, and ${ILLEGAL_CHARACTERS_VISIBLE[ILLEGAL_CHARACTERS_VISIBLE.length - 1]}`;

    return i18n.translate('data.datasetService.multiWildcard.illegalCharactersError', {
      defaultMessage: 'Spaces and the characters {characterList} are not allowed.',
      values: { characterList },
    });
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    let value = target.value;
    const isAddingContent = value.length > previousValue.length;

    // Auto-append wildcard when user types a single alphanumeric character
    // Places cursor before the wildcard for continued typing
    if (value.length === 1 && canAppendWildcard(value)) {
      value += '*';
      setAppendedWildcard(true);
      setTimeout(() => target.setSelectionRange(1, 1));
    } else {
      if (value === '*' && appendedWildcard) {
        value = '';
        setAppendedWildcard(false);
      }
    }

    // Only apply transformations when user is adding content, not deleting
    if (isAddingContent) {
      // Transform "text,*" to "text*, *" in real-time as user types
      // Look for this pattern at the end of the string, but allow for previous patterns
      if (value.match(/([^,\s]+),\*$/)) {
        const transformedValue = value.replace(/([^,\s]+),\*$/g, '$1*, *');
        value = transformedValue;
        setCurrentPattern(value);
        setPreviousValue(value);
        // Position cursor between ", " and "*" for continued typing
        const cursorPosition = value.length - 1; // Before the trailing asterisk
        setTimeout(() => target.setSelectionRange(cursorPosition, cursorPosition));
        // Validate transformed value
        setValidationErrors(validatePattern(value));
        // Notify parent of current pattern change
        if (onCurrentPatternChange) {
          onCurrentPatternChange(value);
        }
        return;
      }

      // Transform "text*," to "text*, *" when user adds comma after existing wildcard
      // Look for this pattern anywhere in the string
      if (value.match(/([^,\s]+\*),$/)) {
        const transformedValue = value.replace(/([^,\s]+\*),$/g, '$1, *');
        value = transformedValue;
        setCurrentPattern(value);
        setPreviousValue(value);
        // Position cursor between ", " and "*" for continued typing
        const cursorPosition = value.length - 1; // Before the trailing asterisk
        setTimeout(() => target.setSelectionRange(cursorPosition, cursorPosition));
        // Validate transformed value
        setValidationErrors(validatePattern(value));
        // Notify parent of current pattern change
        if (onCurrentPatternChange) {
          onCurrentPatternChange(value);
        }
        return;
      }
    }

    setPreviousValue(value);
    setCurrentPattern(value);
    // Validate current value
    setValidationErrors(validatePattern(value));

    // Notify parent of current pattern change for real-time matching
    if (onCurrentPatternChange) {
      onCurrentPatternChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentPattern.trim() && !shouldDisableAddButton(currentPattern)) {
      addPattern();
    }
  };

  const addPattern = () => {
    let processedPattern = currentPattern.trim();
    if (!processedPattern) return;

    // Handle special case: "text,*" should become "text*, *"
    // Only apply this transformation if it matches the exact pattern
    if (processedPattern.match(/([^,\s]+),\*$/)) {
      processedPattern = processedPattern.replace(/([^,\s]+),\*$/g, '$1*, *');
    }

    // Check if the pattern contains commas (Kibana-style multi-pattern input)
    if (processedPattern.includes(',')) {
      // Split by comma and process each pattern individually
      const splitPatterns = processedPattern
        .split(',')
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern && !patterns.includes(pattern));

      if (splitPatterns.length > 0) {
        const newPatterns = [...patterns, ...splitPatterns];
        onPatternsChange(newPatterns);
      }
    } else {
      // Single pattern - original behavior
      if (!patterns.includes(processedPattern)) {
        const newPatterns = [...patterns, processedPattern];
        onPatternsChange(newPatterns);
      }
    }

    setCurrentPattern('');
    setAppendedWildcard(false);
    setValidationErrors([]);

    // Notify parent that pattern was cleared
    if (onCurrentPatternChange) {
      onCurrentPatternChange('');
    }
  };

  // Helper function to check if should disable the add button
  const shouldDisableAddButton = (input: string): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return true;

    // Disable if there are validation errors
    if (validationErrors.length > 0) return true;

    if (trimmed.includes(',')) {
      const splitPatterns = trimmed
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      // Disable if no valid patterns or ALL patterns are duplicates
      return splitPatterns.length === 0 || splitPatterns.every((p) => patterns.includes(p));
    } else {
      return patterns.includes(trimmed);
    }
  };

  const hasValidationErrors = validationErrors.length > 0;
  const errorMessage = getValidationErrorMessage(validationErrors);

  return (
    <EuiFormRow
      isInvalid={hasValidationErrors}
      error={hasValidationErrors ? errorMessage : undefined}
      fullWidth
      data-test-subj="dataset-prefix-selector"
    >
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem>
          <EuiFieldText
            data-test-subj="multiWildcardPatternInput"
            placeholder={i18n.translate('data.datasetService.multiWildcard.patternPlaceholder', {
              defaultMessage: 'Enter pattern (e.g., otel*, logs*) and press enter',
            })}
            value={currentPattern}
            onChange={handlePatternChange}
            onKeyDown={handleKeyDown}
            isInvalid={hasValidationErrors}
            fullWidth
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="multiWildcardAddButton"
            size="s"
            onClick={addPattern}
            disabled={shouldDisableAddButton(currentPattern)}
          >
            {i18n.translate('data.datasetService.multiWildcard.addButton', {
              defaultMessage: 'Add',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFormRow>
  );
};

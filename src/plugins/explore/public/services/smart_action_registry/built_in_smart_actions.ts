/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { SmartActionDefinition, SmartActionItemProps } from '../../types/smart_actions';
import { SmartActionConfig } from '../../types/base_actions';
import { BaseSmartActionItem } from '../../components/smart_action_menu/base_smart_action_item';
import { smartActionRegistry } from './smart_action_registry_service';

// Helper function to check if Extract Pattern action is supported for a field type
const isExtractPatternSupported = (fieldType: string): boolean => {
  const supportedTypes = ['text', 'keyword', 'string'];
  return supportedTypes.includes(fieldType.toLowerCase());
};

// Smart Extract Pattern Action Component using BaseSmartActionItem
const SmartExtractPatternActionComponent: React.FC<SmartActionItemProps> = (props) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Create stable NOOP hook reference to avoid re-renders
  const NOOP_DYNAMIC_CONTEXT_HOOK = useCallback(
    (_options: any, _shouldCleanup?: boolean): string => '',
    []
  );

  // Register smart action context (following LogAction pattern)
  const useDynamicContext =
    services.contextProvider?.hooks?.useDynamicContext || NOOP_DYNAMIC_CONTEXT_HOOK;

  const contextData = useMemo(
    () => ({
      id: `smart-extract-${props.context.fieldContext.documentId}`,
      description: `Smart Extract Pattern action for field "${props.context.fieldContext.fieldName}"`,
      value: JSON.stringify({
        action: 'extract-pattern',
        fieldName: props.context.fieldContext.fieldName,
        selectedText: props.context.fieldContext.selectedText,
        fieldType: props.context.fieldContext.fieldType,
        fieldValue: props.context.fieldContext.fieldValue,
      }),
      label: `Extract Pattern from "${props.context.fieldContext.selectedText}"`,
      categories: ['smart-action', 'extract', 'field-selection', 'dynamic'],
    }),
    [props.context.fieldContext]
  );

  // Register context with cleanup on unmount
  useDynamicContext(contextData, false);

  // Register PPL documentation knowledge context
  const pplDocumentationContext = useMemo(
    () => ({
      id: 'ppl-parse-documentation',
      description: 'PPL Parse Command Documentation (from OpenSearch)',
      value:
        "The parse command parses a text field with a regular expression and appends the result to the search result.\n\nSyntax: parse <field> <pattern>\n\n- field: mandatory. The field must be a text field.\n- pattern: mandatory. The regular expression pattern used to extract new fields from the given text field.\n\nRegular Expression: The pattern uses Java regex engine. Each named capture group in the expression will become a new STRING field.\n\nNamed capture group syntax: (?<fieldName>pattern)\n\nIMPORTANT: Named capture group must start with a letter and contain only letters and digits (NO underscores allowed).\n\nExample - Extract host from email:\nparse email '.+@(?<host>.+)' | fields email, host\n\nExample - Extract first line from multi-line text:\nparse body '^(?<firstLine>[^\\n]+)'\n\nTo get error type distribution, parse the first line of the body field and aggregate:\nsource = index | where severityText = 'ERROR' | parse body '^(?<errorSummary>[^\\n]+)' | stats count() as cnt by errorSummary | sort - cnt | head 10",
      label: 'PPL Parse Command Documentation',
      categories: ['ppl', 'parse-command', 'opensearch', 'documentation'],
    }),
    []
  );

  // Register PPL documentation context
  useDynamicContext(pplDocumentationContext, false);

  // Create action-specific configuration for BaseSmartActionItem
  const actionConfig: SmartActionConfig = useMemo(
    () => ({
      description:
        'Create a PPL parse command to extract patterns from text fields using regex and named capture groups',
      knowledgeContext: {
        id: 'ppl-parse-documentation',
        description: 'PPL Parse Command Documentation (from OpenSearch)',
        value:
          "The parse command parses a text field with a regular expression and appends the result to the search result.\n\nSyntax: parse <field> <pattern>\n\n- field: mandatory. The field must be a text field.\n- pattern: mandatory. The regular expression pattern used to extract new fields from the given text field.\n\nRegular Expression: The pattern uses Java regex engine. Each named capture group in the expression will become a new STRING field.\n\nNamed capture group syntax: (?<fieldName>pattern)\n\nIMPORTANT: Named capture group must start with a letter and contain only letters and digits (NO underscores allowed).\n\nExample - Extract host from email:\nparse email '.+@(?<host>.+)' | fields email, host\n\nExample - Extract first line from multi-line text:\nparse body '^(?<firstLine>[^\\n]+)'\n\nTo get error type distribution, parse the first line of the body field and aggregate:\nsource = index | where severityText = 'ERROR' | parse body '^(?<errorSummary>[^\\n]+)' | stats count() as cnt by errorSummary | sort - cnt | head 10",
        label: 'PPL Parse Command Documentation',
        categories: ['ppl', 'parse-command', 'opensearch', 'documentation'],
      },
      onApply: async (fullContext) => {
        // This is now handled by BaseSmartActionItem
        // Keeping this function for compatibility but it won't be called
        throw new Error('onApply should be handled by BaseSmartActionItem');
      },
      onPreview: (fullContext) => {
        // Return the preview text to be displayed
        return `Preview: This action will generate a PPL parse command to extract the pattern:

Pattern: "${fullContext.selectedContext.selectedText}"
Field: "${fullContext.selectedContext.fieldName}" (${fullContext.selectedContext.fieldType})

The AI will create a regex pattern with named capture groups that can be used in OpenSearch PPL queries to extract and parse this data from your logs.

Example output:
parse ${fullContext.selectedContext.fieldName} | rex field=${fullContext.selectedContext.fieldName} "(?<extracted_field>pattern)" | ...`;
      },
    }),
    [props.context.fieldContext, services]
  );

  return React.createElement(BaseSmartActionItem, {
    context: props.context,
    action: props.action,
    onClose: props.onClose,
    onResult: props.onResult,
    config: actionConfig,
  });
};

// Register built-in smart actions
export const registerBuiltInSmartActions = () => {
  // Extract Pattern Action
  const extractPatternAction: SmartActionDefinition = {
    id: 'smart-extract-pattern',
    displayName: 'Extract Pattern',
    description: 'Create a PPL parse command to extract patterns from text fields',
    iconType: 'indexPatternApp',
    order: 10,
    isCompatible: (context) => {
      return isExtractPatternSupported(context.fieldContext.fieldType);
    },
    component: SmartExtractPatternActionComponent,
  };

  smartActionRegistry.registerAction(extractPatternAction);

  // Future: Add more built-in actions
  // - Calculate Statistics (for numeric fields)
  // - Format Date (for date fields)
  // - Generate Filter (for any field)
  // etc.
};

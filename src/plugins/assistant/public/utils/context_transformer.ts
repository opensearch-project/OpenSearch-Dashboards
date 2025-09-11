/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StaticContext } from '../../../context_provider/public';
import { ContextPill } from '../components/context/context_injector';

/**
 * Context data structure for AI-Agents API
 */
export interface AIAgentContext {
  type: 'dashboard' | 'discover' | 'visualize' | 'general';
  appId: string;
  timestamp: number;
  data: {
    // Common fields
    url?: string;
    query?: any;
    filters?: any[];
    timeRange?: {
      from: string;
      to: string;
    };

    // Dashboard specific
    dashboardId?: string;
    panelIds?: string[];
    embeddables?: any[];

    // Discover specific
    indexPattern?: string;
    columns?: string[];
    sort?: any[];

    // Additional raw data
    raw?: Record<string, any>;
  };
}

/**
 * Transform context provider StaticContext to AI-Agents format
 */
export function transformContextToAIAgent(context: StaticContext): AIAgentContext {
  const { appId, timestamp, data } = context;

  // Determine context type based on appId
  let type: AIAgentContext['type'] = 'general';
  if (appId === 'dashboard' || appId === 'dashboards') {
    type = 'dashboard';
  } else if (appId === 'discover') {
    type = 'discover';
  } else if (appId === 'visualize') {
    type = 'visualize';
  }

  const transformedData: AIAgentContext['data'] = {
    raw: data,
  };

  // Extract common fields from raw data
  if (data.url) {
    transformedData.url = data.url;
  }

  if (data.query) {
    transformedData.query = data.query;
  }

  if (data.filters) {
    transformedData.filters = data.filters;
  }

  if (data.timeRange || data.time) {
    const timeData = data.timeRange || data.time;
    if (timeData && timeData.from && timeData.to) {
      transformedData.timeRange = {
        from: timeData.from,
        to: timeData.to,
      };
    }
  }

  // Dashboard-specific transformations
  if (type === 'dashboard') {
    if (data.dashboardId || data.id) {
      transformedData.dashboardId = data.dashboardId || data.id;
    }

    if (data.panels || data.embeddables) {
      const panels = data.panels || data.embeddables || [];
      transformedData.panelIds = panels
        .map((panel: any) => panel.id || panel.panelId)
        .filter(Boolean);
      transformedData.embeddables = panels;
    }
  }

  // Discover-specific transformations
  if (type === 'discover') {
    if (data.indexPattern) {
      transformedData.indexPattern = data.indexPattern;
    }

    if (data.columns) {
      transformedData.columns = data.columns;
    }

    if (data.sort) {
      transformedData.sort = data.sort;
    }
  }

  return {
    type,
    appId,
    timestamp,
    data: transformedData,
  };
}

/**
 * Transform multiple context pills to AI-Agents format
 */
export function transformContextPillsToAIAgent(pills: ContextPill[]): AIAgentContext[] {
  return pills.map((pill) => transformContextToAIAgent(pill.context));
}

/**
 * Create a minimal context prompt for AI agents
 */
export function createContextPrompt(contexts: AIAgentContext[]): string {
  if (contexts.length === 0) {
    return '';
  }

  const contextDescriptions = contexts.map((context) => {
    const { type, appId, data } = context;

    let description = `Current ${appId} context`;

    // Add specific details based on type
    if (type === 'dashboard' && data.dashboardId) {
      description += ` (Dashboard ID: ${data.dashboardId})`;
    } else if (type === 'discover' && data.indexPattern) {
      description += ` (Index: ${data.indexPattern})`;
    }

    // Add time range if available
    if (data.timeRange) {
      description += ` | Time: ${data.timeRange.from} to ${data.timeRange.to}`;
    }

    // Add active filters count
    if (data.filters && data.filters.length > 0) {
      description += ` | Filters: ${data.filters.length} active`;
    }

    return description;
  });

  return `Context: ${contextDescriptions.join('; ')}`;
}

/**
 * Extract action-relevant context for tool execution
 */
export function extractActionContext(contexts: AIAgentContext[]): Record<string, any> {
  if (contexts.length === 0) {
    return {};
  }

  // Use the most recent context for actions
  const context = contexts[contexts.length - 1];

  return {
    appId: context.appId,
    type: context.type,
    currentFilters: context.data.filters || [],
    currentTimeRange: context.data.timeRange,
    currentQuery: context.data.query,
    dashboardId: context.data.dashboardId,
    indexPattern: context.data.indexPattern,
  };
}

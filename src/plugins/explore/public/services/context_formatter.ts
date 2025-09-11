/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Explore Context Formatter
 *
 * Transforms raw Explore context data into structured, LLM-friendly format
 * Parses OpenSearch Dashboards URL parameters and application state
 */

import { ExploreFlavor } from '../../common';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ExploreURLParams {
  _q?: string; // Query parameters (dataset, language, query)
  _a?: string; // Application state (UI, tabs, display options)
  _g?: string; // Global state (time range, filters)
  _v?: string; // Visualization parameters (chart type, style options)
}

export interface ParsedDataset {
  id: string;
  title: string;
  type: 'INDEX_PATTERN' | 'INDEX';
  timeFieldName?: string;
  dataSourceId?: string;
  dataSourceTitle?: string;
}

export interface ParsedQuery {
  query: string;
  language: 'PPL' | 'DQL' | 'SQL';
}

export interface ParsedVisualization {
  chartType?: string;
  axesMapping?: Record<string, string>;
  styleOptions?: {
    colorSchema?: string;
    fontSize?: number;
    showTitle?: boolean;
    title?: string;
    useColor?: boolean;
    customRanges?: Array<{ min: number; max: number }>;
  };
}

export interface ParsedAppState {
  activeTabId?: string;
  showHistogram?: boolean;
  columns?: string[];
  sort?: any[];
  legacy?: {
    interval?: string;
    isDirty?: boolean;
  };
  tab?: {
    logs?: Record<string, any>;
    patterns?: {
      patternsField?: string;
      usingRegexPatterns?: boolean;
    };
  };
}

export interface ParsedGlobalState {
  timeRange?: {
    from: string;
    to: string;
  };
  filters?: any[];
  refreshInterval?: {
    pause: boolean;
    value: number;
  };
}

export interface FormattedExploreContext {
  appType: string;
  flavor: ExploreFlavor;
  dataset: ParsedDataset | null;
  query: ParsedQuery;
  visualization: ParsedVisualization;
  appState: ParsedAppState;
  globalState: ParsedGlobalState;
  userActions: any[];
  recommendations: string[];
}

// ============================================================================
// URL PARAMETER PARSERS
// ============================================================================

export class ExploreURLParser {
  /**
   * Parse RISON-encoded URL parameters from OpenSearch Dashboards
   * RISON format: (key:value,key2:value2) for objects, !(item1,item2) for arrays
   */
  static parseRisonParam(param: string): any {
    try {
      // Decode URL encoding first
      const decoded = decodeURIComponent(param);

      // Simple RISON to JSON conversion
      const result = this.risonToJson(decoded);
      return result;
    } catch (error) {
      console.warn('Failed to parse RISON parameter:', param, error);
      return null;
    }
  }

  /**
   * Convert RISON format to JSON - Simplified approach using manual extraction
   */
  private static risonToJson(rison: string): any {
    // Skip complex RISON parsing and use manual extraction directly
    // This is more reliable for the OpenSearch Dashboards URL format
    return this.manualExtraction(rison);
  }

  /**
   * Manual extraction as fallback when RISON parsing fails
   */
  private static manualExtraction(param: string): any {
    const result: any = {};

    // Extract nested dataset and dataSource information
    const dataSourceMatch = param.match(/dataSource:\(([^)]+)\)/);
    if (dataSourceMatch) {
      const dataSourceContent = dataSourceMatch[1];
      const dsIdMatch = dataSourceContent.match(/id:([^,)]+)/);
      const dsTitleMatch = dataSourceContent.match(/title:([^,)]+)/);
      const dsTypeMatch = dataSourceContent.match(/type:([^,)]+)/);

      result.dataSource = {
        id: dsIdMatch ? dsIdMatch[1] : '',
        title: dsTitleMatch ? dsTitleMatch[1] : '',
        type: dsTypeMatch ? dsTypeMatch[1] : '',
      };
    }

    // Extract dataset information (separate from dataSource)
    const datasetIdMatch = param.match(/id:([^,)]+)/g);
    const datasetTitleMatch = param.match(/title:([^,)]+)/g);
    const datasetTypeMatch = param.match(/type:([^,)]+)/g);
    const timeFieldMatch = param.match(/timeFieldName:([^,)]+)/);

    if (datasetTitleMatch && datasetTitleMatch.length > 0) {
      // Get the last title match which should be the dataset title (not dataSource title)
      const lastTitle = datasetTitleMatch[datasetTitleMatch.length - 1];
      const titleValue = lastTitle.replace('title:', '');

      result.dataset = {
        id: datasetIdMatch && datasetIdMatch.length > 1 ? datasetIdMatch[1].replace('id:', '') : '',
        title: titleValue,
        type:
          datasetTypeMatch && datasetTypeMatch.length > 1
            ? datasetTypeMatch[1].replace('type:', '')
            : 'INDEX_PATTERN',
        timeFieldName: timeFieldMatch ? timeFieldMatch[1] : undefined,
      };
    }

    // Language
    const langMatch = param.match(/language:(\w+)/);
    if (langMatch) {
      result.language = langMatch[1];
    }

    // Query (handle both encoded and decoded)
    const queryMatch = param.match(/query:'([^']+)'/);
    if (queryMatch) {
      result.query = queryMatch[1]; // Already decoded in the logs
    }

    // Chart type
    const chartMatch = param.match(/chartType:(\w+)/);
    if (chartMatch) {
      result.chartType = chartMatch[1];
    }

    // Axes mapping
    const axesMappingMatch = param.match(/axesMapping:\(([^)]+)\)/);
    if (axesMappingMatch) {
      const axesContent = axesMappingMatch[1];
      const valueMatch = axesContent.match(/value:'([^']+)'/);
      if (valueMatch) {
        result.axesMapping = { value: valueMatch[1] };
      }
    }

    // Style options
    const styleMatch = param.match(/styleOptions:\(([^)]+)\)/);
    if (styleMatch) {
      const styleContent = styleMatch[1];
      const colorSchemaMatch = styleContent.match(/colorSchema:(\w+)/);
      const fontSizeMatch = styleContent.match(/fontSize:(\d+)/);
      const showTitleMatch = styleContent.match(/showTitle:!([tf])/);

      result.styleOptions = {};
      if (colorSchemaMatch) result.styleOptions.colorSchema = colorSchemaMatch[1];
      if (fontSizeMatch) result.styleOptions.fontSize = parseInt(fontSizeMatch[1]);
      if (showTitleMatch) result.styleOptions.showTitle = showTitleMatch[1] === 't';
    }

    // UI state
    const activeTabMatch = param.match(/activeTabId:([^,)]+)/);
    const showHistogramMatch = param.match(/showHistogram:!([tf])/);
    if (activeTabMatch || showHistogramMatch) {
      result.ui = {};
      if (activeTabMatch) result.ui.activeTabId = activeTabMatch[1];
      if (showHistogramMatch) result.ui.showHistogram = showHistogramMatch[1] === 't';
    }

    // Legacy state
    const columnsMatch = param.match(/columns:!\(([^)]*)\)/);
    const intervalMatch = param.match(/interval:(\w+)/);
    const isDirtyMatch = param.match(/isDirty:!([tf])/);
    if (columnsMatch || intervalMatch || isDirtyMatch) {
      result.legacy = {};
      if (columnsMatch) {
        const columnsContent = columnsMatch[1];
        result.legacy.columns = columnsContent ? columnsContent.split(',') : [];
      }
      if (intervalMatch) result.legacy.interval = intervalMatch[1];
      if (isDirtyMatch) result.legacy.isDirty = isDirtyMatch[1] === 't';
    }

    // Time range
    const timeFromMatch = param.match(/from:([^,)]+)/);
    const timeToMatch = param.match(/to:([^,)]+)/);
    if (timeFromMatch && timeToMatch) {
      result.time = { from: timeFromMatch[1], to: timeToMatch[1] };
    }

    // Filters
    const filtersMatch = param.match(/filters:!\(\)/);
    if (filtersMatch) {
      result.filters = [];
    }

    // Refresh interval
    const pauseMatch = param.match(/pause:!([tf])/);
    const valueMatch = param.match(/value:(\d+)/);
    if (pauseMatch && valueMatch) {
      result.refreshInterval = {
        pause: pauseMatch[1] === 't',
        value: parseInt(valueMatch[1]),
      };
    }

    console.log('🔍 manualExtraction result:', result);
    return result;
  }

  /**
   * Parse the _q parameter containing dataset and query information
   */
  static parseQueryParams(qParam: string): { dataset: ParsedDataset | null; query: ParsedQuery } {
    try {
      const parsed = this.parseRisonParam(qParam);
      if (!parsed) {
        return { dataset: null, query: { query: '', language: 'PPL' } };
      }

      // Extract dataset information
      let dataset: ParsedDataset | null = null;
      if (parsed.dataset) {
        dataset = {
          id: parsed.dataset.id || '',
          title: parsed.dataset.title || '',
          type: parsed.dataset.type || 'INDEX_PATTERN',
          timeFieldName: parsed.dataset.timeFieldName,
          dataSourceId: parsed.dataset.dataSource?.id,
          dataSourceTitle: parsed.dataset.dataSource?.title,
        };
      }

      // Extract query information
      const query = {
        query: parsed.query ? decodeURIComponent(parsed.query) : '',
        language: (parsed.language || 'PPL') as 'PPL' | 'DQL' | 'SQL',
      };

      return { dataset, query };
    } catch (error) {
      console.warn('Failed to parse query params:', error);
      return { dataset: null, query: { query: '', language: 'PPL' } };
    }
  }

  /**
   * Parse the _v parameter containing visualization configuration
   */
  static parseVisualizationParams(vParam: string): ParsedVisualization {
    try {
      const parsed = this.parseRisonParam(vParam);
      if (!parsed) return {};

      return {
        chartType: parsed.chartType,
        axesMapping: parsed.axesMapping,
        styleOptions: parsed.styleOptions,
      };
    } catch (error) {
      console.warn('Failed to parse visualization params:', error);
      return {};
    }
  }

  /**
   * Parse the _a parameter containing application state
   */
  static parseAppParams(aParam: string): ParsedAppState {
    try {
      const parsed = this.parseRisonParam(aParam);
      if (!parsed) return {};

      return {
        activeTabId: parsed.ui?.activeTabId,
        showHistogram: parsed.ui?.showHistogram,
        columns: parsed.legacy?.columns,
        sort: parsed.legacy?.sort,
        legacy: parsed.legacy,
        tab: parsed.tab,
      };
    } catch (error) {
      console.warn('Failed to parse app params:', error);
      return {};
    }
  }

  /**
   * Parse the _g parameter containing global state
   */
  static parseGlobalParams(gParam: string): ParsedGlobalState {
    try {
      const parsed = this.parseRisonParam(gParam);
      if (!parsed) return {};

      let timeRange;
      if (parsed.time) {
        timeRange = {
          from: parsed.time.from || 'now-15m',
          to: parsed.time.to || 'now',
        };
      }

      return {
        timeRange,
        filters: parsed.filters || [],
        refreshInterval: parsed.refreshInterval,
      };
    } catch (error) {
      console.warn('Failed to parse global params:', error);
      return {};
    }
  }
}

// ============================================================================
// CONTEXT FORMATTER
// ============================================================================

export class ExploreContextFormatter {
  /**
   * Main method to format raw context data into structured format
   */
  static formatContext(rawContext: any): string {
    const urlParams = this.extractURLParams(rawContext);
    const formattedContext = this.parseContext(rawContext, urlParams);

    return this.generateMarkdown(formattedContext);
  }

  /**
   * Extract URL parameters from raw context
   */
  private static extractURLParams(rawContext: any): ExploreURLParams {
    const url = rawContext?.data?.url || rawContext?.currentUrl || '';
    if (!url) return {};

    try {
      // Extract hash fragment from URL
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return {};

      const hash = url.substring(hashIndex + 1);

      // Remove leading /? if present
      const cleanHash = hash.startsWith('/?') ? hash.substring(2) : hash;

      // Parse URL parameters from hash
      const params = new URLSearchParams(cleanHash);

      return {
        _q: params.get('_q') || undefined,
        _a: params.get('_a') || undefined,
        _g: params.get('_g') || undefined,
        _v: params.get('_v') || undefined,
      };
    } catch (error) {
      console.warn('Failed to extract URL params:', error);
      return {};
    }
  }

  /**
   * Parse context data using URL parameters and raw context
   */
  private static parseContext(
    rawContext: any,
    urlParams: ExploreURLParams
  ): FormattedExploreContext {
    // Determine app flavor from URL or appId
    const appId = rawContext?.data?.appId || rawContext?.appId || '';
    const flavor = this.determineExploreFlavor(appId);

    // Parse URL parameters and get both dataset and dataSource
    const parsedData = urlParams._q
      ? ExploreURLParser.parseQueryParams(urlParams._q)
      : { dataset: null, query: { query: '', language: 'PPL' as const } };

    const visualization = urlParams._v
      ? ExploreURLParser.parseVisualizationParams(urlParams._v)
      : {};

    const appState = urlParams._a ? ExploreURLParser.parseAppParams(urlParams._a) : {};

    const globalState = urlParams._g ? ExploreURLParser.parseGlobalParams(urlParams._g) : {};

    // Extract additional context from raw data
    const timeRange = rawContext?.data?.timeRange ||
      globalState.timeRange || {
        from: 'now-15m',
        to: 'now',
      };

    const filters = rawContext?.data?.filters || globalState.filters || [];

    // Generate recommendations based on current state
    const recommendations = this.generateRecommendations(
      parsedData.query,
      parsedData.dataset,
      visualization,
      flavor
    );

    // Create enhanced context with dataSource information
    const enhancedContext = {
      appType: appId,
      flavor,
      dataset: parsedData.dataset,
      query: parsedData.query,
      visualization,
      appState,
      globalState: {
        ...globalState,
        timeRange,
        filters,
      },
      userActions: rawContext?.data?.interactionSummary ? [rawContext.data.interactionSummary] : [],
      recommendations,
    } as any;

    // Add dataSource information if available from URL parsing
    if (urlParams._q) {
      const qParsed = ExploreURLParser.parseRisonParam(urlParams._q);
      if (qParsed && qParsed.dataSource) {
        enhancedContext.dataSource = qParsed.dataSource;
      }
    }

    return enhancedContext;
  }

  /**
   * Determine Explore flavor from app ID
   */
  private static determineExploreFlavor(appId: string): ExploreFlavor {
    if (appId.includes('logs')) return ExploreFlavor.Logs;
    if (appId.includes('traces')) return ExploreFlavor.Traces;
    if (appId.includes('metrics')) return ExploreFlavor.Metrics;
    return ExploreFlavor.Logs; // Default
  }

  /**
   * Generate contextual recommendations based on current state
   */
  private static generateRecommendations(
    query: ParsedQuery,
    dataset: ParsedDataset | null,
    visualization: ParsedVisualization,
    flavor: ExploreFlavor
  ): string[] {
    const recommendations: string[] = [];

    // Query recommendations
    if (!query.query.trim()) {
      recommendations.push(
        `Start with a basic ${query.language} query like: source = ${
          dataset?.title || 'your_dataset'
        } | head 10`
      );
    }

    // Visualization recommendations
    if (visualization.chartType === 'metric' && !query.query.includes('stats')) {
      recommendations.push(
        'For metric charts, use aggregation functions like: source = dataset | stats count()'
      );
    }

    // Dataset recommendations
    if (dataset?.title?.includes('sample_data')) {
      recommendations.push(
        'You are using sample data - perfect for testing queries and visualizations'
      );
    }

    // Flavor-specific recommendations
    switch (flavor) {
      case ExploreFlavor.Logs:
        recommendations.push('Use PPL commands like: where, stats, sort, head for log analysis');
        break;
      case ExploreFlavor.Metrics:
        recommendations.push('Use aggregation functions: avg(), sum(), count(), max(), min()');
        break;
      case ExploreFlavor.Traces:
        recommendations.push('Filter by trace attributes and analyze span relationships');
        break;
    }

    return recommendations;
  }

  /**
   * Generate formatted markdown output
   */
  private static generateMarkdown(context: FormattedExploreContext): string {
    const sections: string[] = [];

    // Header
    sections.push('# 🔍 Explore Context Analysis\n');

    // Current Application State
    sections.push('## 📱 Current Application State');
    sections.push(`app: ${context.appType.split('/')[0]}`);
    sections.push(`activeTabId: ${context.appState.activeTabId || 'logs'}`);
    sections.push(`showHistogram: ${context.appState.showHistogram ? 'yes' : 'no'}`);
    if (context.appState.columns?.length) {
      sections.push(`visibleColumns: ${context.appState.columns.join(', ')}`);
    }
    if (context.appState.legacy?.interval) {
      sections.push(`interval: ${context.appState.legacy.interval}`);
    }
    if (context.appState.legacy?.isDirty !== undefined) {
      sections.push(`isDirty: ${context.appState.legacy.isDirty ? 'yes' : 'no'}`);
    }
    sections.push('');

    // Visualization Configuration
    if (context.visualization.chartType) {
      sections.push('## 📊 Visualization Configuration');
      sections.push(`chartType: ${context.visualization.chartType}`);

      if (context.visualization.axesMapping) {
        Object.entries(context.visualization.axesMapping).forEach(([key, value]) => {
          sections.push(`axesMapping.${key}: ${value}`);
        });
      }

      if (context.visualization.styleOptions) {
        const style = context.visualization.styleOptions;
        if (style.colorSchema) sections.push(`styleOptions.colorSchema: ${style.colorSchema}`);
        if (style.fontSize) sections.push(`styleOptions.fontSize: ${style.fontSize}`);
        if (style.showTitle !== undefined)
          sections.push(`styleOptions.showTitle: ${style.showTitle ? 'yes' : 'no'}`);
        if (style.title !== undefined)
          sections.push(`styleOptions.title: ${style.title || '(empty)'}`);
        if (style.useColor !== undefined)
          sections.push(`styleOptions.useColor: ${style.useColor ? 'yes' : 'no'}`);
        if (style.customRanges?.length) {
          sections.push(
            `styleOptions.customRanges: ${style.customRanges
              .map((r) => `${r.min}-${r.max}`)
              .join(', ')}`
          );
        }
      }
      sections.push('');
    }

    // Data Source and Dataset Information
    sections.push('## 📁 Dataset Information');

    // Parse the raw context to get dataSource and dataset separately
    const rawContext = context as any;
    if (rawContext.dataSource) {
      sections.push(`dataSource.id: ${rawContext.dataSource.id || ''}`);
      sections.push(`dataSource.title: ${rawContext.dataSource.title || ''}`);
      sections.push(`dataSource.type: ${rawContext.dataSource.type || ''}`);
    }

    if (context.dataset) {
      sections.push(`dataset.id: ${context.dataset.id || ''}`);
      sections.push(`dataset.title: ${context.dataset.title || ''}`);
      sections.push(`dataset.type: ${context.dataset.type || ''}`);
      if (context.dataset.timeFieldName) {
        sections.push(`dataset.timeFieldName: ${context.dataset.timeFieldName}`);
      }
    }
    sections.push('');

    // Query Context
    sections.push('## 🔍 Query Context');
    sections.push(`language: ${context.query.language}`);
    sections.push(`query: ${context.query.query || '(empty)'}`);
    sections.push('');

    // Time & Filters
    sections.push('## ⏰ Time & Filters');
    if (context.globalState.timeRange) {
      const timeRange = context.globalState.timeRange;
      sections.push(`timeRange.from: ${timeRange.from}`);
      sections.push(`timeRange.to: ${timeRange.to}`);
    }
    sections.push(`activeFilters: ${context.globalState.filters?.length || 0}`);
    if (context.globalState.refreshInterval) {
      const refresh = context.globalState.refreshInterval;
      sections.push(`refreshInterval.pause: ${refresh.pause ? 'yes' : 'no'}`);
      sections.push(`refreshInterval.value: ${refresh.value}`);
    }
    sections.push('');

    // User Actions - Enhanced with detailed action information
    if (context.userActions.length > 0) {
      sections.push('## 🎯 Recent User Activity');
      context.userActions.forEach((action, index) => {
        if (action.totalInteractions !== undefined) {
          sections.push(`totalInteractions: ${action.totalInteractions}`);
          sections.push(`expandedDocuments: ${action.totalExpanded}`);
          sections.push(`fieldFilters: ${action.totalFieldFilters}`);
          sections.push(`recentActivity: ${action.recentActivity ? 'yes' : 'no'}`);
          sections.push(`lastInteraction: ${new Date(action.lastInteraction).toISOString()}`);
          sections.push(`hasMultipleExpanded: ${action.hasMultipleExpanded ? 'yes' : 'no'}`);
        }
      });
      sections.push('');
    }

    // Enhanced User Activity Details with Action History
    const activityData = context as any;
    if (activityData.userActivity) {
      sections.push('## 👤 User Activity Details');
      sections.push(`currentFocus: ${activityData.userActivity.currentFocus}`);
      sections.push(`lastAction: ${activityData.userActivity.lastAction}`);
      if (activityData.userActivity.contextNote) {
        sections.push(`contextNote: ${activityData.userActivity.contextNote}`);
      }

      // Show recent document interactions
      if (
        activityData.userActivity.recentDocuments &&
        activityData.userActivity.recentDocuments.length > 0
      ) {
        sections.push('');
        sections.push('### Recent Document Interactions');
        activityData.userActivity.recentDocuments.forEach((doc: any, index: number) => {
          sections.push(`#### Interaction ${index + 1}`);
          sections.push(`documentId: ${doc.documentId}`);
          sections.push(`triggerType: ${doc.triggerType}`);
          sections.push(`triggerTime: ${doc.expandedAt}`);
          sections.push(`triggerComment: ${doc.triggerComment}`);

          // Add key document fields for context
          if (doc.message)
            sections.push(
              `documentMessage: ${doc.message.substring(0, 100)}${
                doc.message.length > 100 ? '...' : ''
              }`
            );
          if (doc.timestamp) sections.push(`documentTimestamp: ${doc.timestamp}`);
          if (doc.level) sections.push(`documentLevel: ${doc.level}`);
          if (doc.host) sections.push(`documentHost: ${doc.host}`);
          if (doc.clientip) sections.push(`documentClientIP: ${doc.clientip}`);
          sections.push('');
        });
      }
      sections.push('');
    }

    // Enhanced User Activity with Document Details
    const rawContextData = context as any;
    if (rawContextData.expandedDocuments && rawContextData.expandedDocuments.length > 0) {
      sections.push('## 📄 Expanded Documents');
      rawContextData.expandedDocuments.forEach((doc: any, index: number) => {
        sections.push(`### Document ${index + 1}`);
        sections.push(`documentId: ${doc.documentId}`);
        sections.push(`expandedAt: ${doc.expandedAt}`);
        sections.push(`triggerType: ${doc.triggerType}`);
        sections.push(`triggerComment: ${doc.triggerComment}`);

        // Add document content fields
        if (doc.message) sections.push(`message: ${doc.message}`);
        if (doc.timestamp) sections.push(`timestamp: ${doc.timestamp}`);
        if (doc.level) sections.push(`level: ${doc.level}`);
        if (doc.host) sections.push(`host: ${doc.host}`);
        if (doc.url) sections.push(`url: ${doc.url}`);
        if (doc.referer) sections.push(`referer: ${doc.referer}`);
        if (doc.request) sections.push(`request: ${doc.request}`);
        if (doc.response) sections.push(`response: ${doc.response}`);
        if (doc.bytes) sections.push(`bytes: ${doc.bytes}`);
        if (doc.clientip) sections.push(`clientip: ${doc.clientip}`);

        // Add additional fields if present
        if (doc.additionalFields) {
          Object.entries(doc.additionalFields).forEach(([key, value]) => {
            sections.push(`${key}: ${value}`);
          });
        }

        sections.push('');
      });
    }

    // User Activity Summary
    if (rawContextData.userActivity) {
      sections.push('## 👤 User Activity Summary');
      sections.push(`currentFocus: ${rawContextData.userActivity.currentFocus}`);
      sections.push(`lastAction: ${rawContextData.userActivity.lastAction}`);
      if (rawContextData.userActivity.contextNote) {
        sections.push(`contextNote: ${rawContextData.userActivity.contextNote}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Format time range for display
   */
  private static formatTimeRange(from: string, to: string): string {
    // Convert relative time to human readable
    const timeMap: Record<string, string> = {
      'now-15m': 'Last 15 minutes',
      'now-1h': 'Last hour',
      'now-24h': 'Last 24 hours',
      'now-7d': 'Last 7 days',
      'now-15w': 'Last 15 weeks',
      now: 'now',
    };

    const fromDisplay = timeMap[from] || from;
    const toDisplay = timeMap[to] || to;

    if (to === 'now') {
      return fromDisplay.replace('Last ', '');
    }

    return `${fromDisplay} to ${toDisplay}`;
  }
}

// ============================================================================
// EXPORT DEFAULT FORMATTER FUNCTION
// ============================================================================

/**
 * Main export function for formatting Explore context
 */
export function formatExploreContext(rawContext: any): string {
  return ExploreContextFormatter.formatContext(rawContext);
}

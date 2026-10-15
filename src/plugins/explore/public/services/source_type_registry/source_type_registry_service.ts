/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType } from 'react';
import { Dataset } from '../../../../data/common';
import { DataPublicPluginStart } from '../../../../data/public';
import {
  ExploreFlavor,
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_METRICS_TABLE_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../../../common';
import { getServices } from '../services';
import { openSearchSourceType, OPENSEARCH_SOURCE_TYPE_ID } from './opensearch_source_type';
import { BUILT_IN_LANGUAGE_GUIDES } from './built_in_language_guides';

export { OPENSEARCH_SOURCE_TYPE_ID };

/** Languages Explore supports itself; their default behavior applies unless a source lists them. */
const BUILT_IN_LANGUAGES = ['PPL', 'SQL', 'PROMQL'];

/** The results tabs a language joins on each flavor when its settings don't list `tabs`. */
const DEFAULT_TABS: Record<ExploreFlavor, string[]> = {
  [ExploreFlavor.Logs]: [EXPLORE_LOGS_TAB_ID],
  [ExploreFlavor.Traces]: [EXPLORE_LOGS_TAB_ID],
  [ExploreFlavor.Metrics]: [EXPLORE_METRICS_TABLE_TAB_ID, EXPLORE_VISUALIZATION_TAB_ID],
};

/** A sample query the query panel offers for a language. */
export interface SourceTypeSampleQuery {
  label: string;
  query: string;
}

/**
 * How the query panel introduces a language on a source, so users can tell the same language
 * apart across sources (for example SQL on OpenSearch versus SQL on another store).
 */
export interface SourceTypeLanguageGuide {
  /** The language's name on this source. Defaults to the language's registered title. */
  label?: string;
  /**
   * A short qualifier shown next to the label in the language picker, e.g. which of the source's
   * data the language reaches.
   */
  tag?: string;
  /** One sentence on what the language queries on this source. */
  description?: string;
  /** The language's docs for this source; replaces the language's own "Learn more" link. */
  docLink?: { title: string; url: string };
  /** Examples shown where the Metrics page has no query yet. */
  sampleQueries?: SourceTypeSampleQuery[];
  /** Syntax highlighting for the sample queries (an EuiCode language). Defaults to plain text. */
  codeLanguage?: string;
}

/**
 * What a source type's callbacks receive. Kept to the data plugin's start contract so a plugin
 * registering a source type does not depend on Explore's internal services.
 */
export interface SourceTypeDependencies {
  data: DataPublicPluginStart;
  /** The Explore flavor the user is switching in (null while it is still being resolved). */
  flavor?: ExploreFlavor | null;
}

/** Props Explore passes to a source type's own dataset selector. */
export interface SourceTypeDatasetSelectorProps {
  /** The active dataset (one of this source's). */
  dataset?: Dataset;
  /** Call with the chosen dataset; Explore applies it like a pick from its own dataset picker. */
  onSelect: (dataset: Dataset) => void;
  data: DataPublicPluginStart;
  flavor?: ExploreFlavor | null;
}

/**
 * How Explore treats one of a source's languages. The language itself is registered with the data
 * plugin's LanguageService and declared by the dataset type's `supportedLanguages`; these are the
 * Explore-only parts. Explore uses the language's query text as typed (no source clause, no stats
 * stripping).
 */
export interface SourceTypeLanguageSettings extends SourceTypeLanguageGuide {
  /**
   * Tabs that can render this language's results. Defaults to the results tabs of the flavor the
   * page shows: the Logs tab on Logs and Traces, the Table and Visualization tabs on Metrics.
   */
  tabs?: string[];
  /** Run Explore's histogram query. Off by default: that query is built in PPL. */
  supportsHistogram?: boolean;
  /** Offer the Logs page's visual query builder. Off by default: the builder emits PPL. */
  supportsVisualBuilder?: boolean;
  /**
   * Replaces the Metrics page's query rows while this language is active on one of this source's
   * datasets, for example a builder of the source's own. Without it, PromQL keeps the PromQL rows
   * and any other language gets a single code editor.
   */
  metricsQueryEditor?: ComponentType<SourceTypeQueryEditorProps>;
}

/** Where the last run of the query stands, for a source's own query editor. */
export interface SourceTypeQueryStatus {
  /** Whether a run is in progress. */
  isRunning: boolean;
  /** Why the last run failed, if it did. */
  error?: string;
}

/**
 * Props Explore passes to a source type's own query editor. The time range is the data plugin's
 * (`data.query.timefilter`); Explore sends it with every run.
 */
export interface SourceTypeQueryEditorProps {
  /** The query text to show. */
  query: string;
  /** Call with the full query text on every edit. */
  onChange: (query: string) => void;
  /** Runs `query` when given (it is applied first), else the query last passed to `onChange`. */
  onRun: (query?: string) => void;
  /** The language being edited. */
  languageId: string;
  /** The active dataset (one of this source's). */
  dataset?: Dataset;
  data: DataPublicPluginStart;
  /** The query's options (`query.queryOptions`), sent with every run. */
  queryOptions?: Record<string, unknown>;
  /** Merges options into `query.queryOptions`. */
  onQueryOptionsChange: (options: Record<string, unknown>) => void;
  /** The last run's status. */
  status: SourceTypeQueryStatus;
}

/**
 * A kind of data source the query panel's "Source type" column offers (OpenSearch is built in).
 *
 * Dataset types (data plugin) describe how to list and query datasets. A source type is Explore's
 * view of a group of them: how the query panel presents the source, which dataset to open when
 * it's picked, an optional picker of its own, and how Explore treats its languages. Keeping that
 * here keeps Explore-only concerns out of the data plugin.
 *
 * Register from `setup`, or synchronously from `start` when registration depends on a capability
 * (capabilities only exist in `start`). Explore reads the registry when its app mounts.
 */
export interface SourceTypeDefinition {
  id: string;
  /** Shown in the query panel's "Source type" column. */
  label: string;
  /** A different label on some flavors (e.g. what the source means on the Metrics page). */
  flavorLabels?: Partial<Record<ExploreFlavor, string>>;
  /**
   * Icon on the query panel's language pill while this source is active: an EUI icon type or an
   * image URL. Defaults to the active dataset type's `meta.icon`.
   */
  icon?: string;
  /** Ids of the dataset types (registered with the data plugin's DatasetService) this source owns. */
  datasetTypes: string[];
  /** Flavors that offer this source type. Defaults to Logs. */
  flavors?: ExploreFlavor[];
  /** Position in the "Source type" column; lower first. OpenSearch is 0, the default is 100. */
  order?: number;
  /**
   * The dataset to switch to when this source type is picked in the query panel. Resolve to
   * undefined when there is nothing to query; Explore then warns instead of switching.
   */
  resolveDefaultDataset: (deps: SourceTypeDependencies) => Promise<Dataset | undefined>;
  /**
   * Replaces the data plugin's dataset picker while one of this source's datasets is active.
   * Omit it to use the generic picker, scoped to `datasetTypes`.
   */
  datasetSelector?: ComponentType<SourceTypeDatasetSelectorProps>;
  /**
   * Explore settings per language id, for each language this source's dataset types support that
   * Explore doesn't already know (`{}` takes the defaults). A language listed here applies these
   * settings only while one of this source's datasets is active.
   */
  languageSettings?: Record<string, SourceTypeLanguageSettings>;
  /**
   * Metrics page: the id of the data plugin resource client (`resourceClientFactory`) that the
   * Explore tab's metric browser and the PromQL builder use for this source's datasets. The client
   * implements {@link SourceTypeMetricsResourceClient} (metric metadata, labels, label values,
   * series). Without one, the Metrics page offers only its Query tab for this source, and PromQL
   * gets a single code editor instead of the builder rows. The built-in source uses `prometheus`.
   *
   * The PromQL itself (the browser's charts and the PromQL rows) runs through query_enhancements'
   * PromQL search strategy, which uses the server query manager registered with
   * `registerQueryManager` under the dataset's type, else the Prometheus manager. A source that
   * lists PromQL registers both.
   * PromQL autocomplete in the code editors lists metrics and labels through this client too.
   */
  metricsResourceClientId?: string;
}

/** A time range as the metric browser passes it (date math, e.g. `now-15m`). */
export interface SourceTypeMetricsTimeRange {
  from: string;
  to: string;
}

/**
 * The resource client a source registers in the data plugin's `resourceClientFactory` and names
 * with `metricsResourceClientId`: the Prometheus resource calls the metric browser and the PromQL
 * builder make for the source's datasets.
 */
export interface SourceTypeMetricsResourceClient {
  getMetrics(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    timeRange?: SourceTypeMetricsTimeRange
  ): Promise<string[]>;
  getMetricMetadata(
    dataConnectionId: string,
    meta: Record<string, unknown> | undefined,
    metric?: string,
    timeRange?: SourceTypeMetricsTimeRange
  ): Promise<Record<string, Array<{ type?: string; help?: string; unit?: string }>>>;
  getSeries(
    dataConnectionId: string,
    match: string,
    meta?: Record<string, unknown>,
    timeRange?: SourceTypeMetricsTimeRange
  ): Promise<Array<Record<string, string>>>;
  getLabels(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: SourceTypeMetricsTimeRange
  ): Promise<string[]>;
  getLabelValues(
    dataConnectionId: string,
    meta: Record<string, unknown> | undefined,
    label: string,
    timeRange?: SourceTypeMetricsTimeRange
  ): Promise<string[]>;
}

export interface SourceTypeRegistrySetup {
  register: (definition: SourceTypeDefinition) => void;
  /**
   * Names a registered source (the built-in one included) the way this deployment knows it.
   * With a flavor, the label replaces the source's label on that flavor, `flavorLabels`
   * included. Without one, it replaces `label` only: a flavor with its own `flavorLabels` entry
   * keeps it unless a label is also set for that flavor.
   */
  setLabel: (sourceTypeId: string, label: string, flavor?: ExploreFlavor) => void;
}

export class SourceTypeRegistryService {
  private readonly sourceTypes = new Map<string, SourceTypeDefinition>();
  // Labels set with `setLabel`, by source id, then by flavor ('' for every flavor).
  private readonly labelOverrides = new Map<string, Map<string, string>>();
  // Called with every source, already registered or still to come (see `onRegister`).
  private readonly registerListeners: Array<(definition: SourceTypeDefinition) => void> = [];

  constructor() {
    this.register(openSearchSourceType);
  }

  public register(definition: SourceTypeDefinition): void {
    if (this.sourceTypes.has(definition.id)) {
      throw new Error(`Explore source type "${definition.id}" is already registered`);
    }
    for (const existing of this.sourceTypes.values()) {
      const claimed = definition.datasetTypes.find((type) => existing.datasetTypes.includes(type));
      if (claimed) {
        throw new Error(
          `Dataset type "${claimed}" already belongs to Explore source type "${existing.id}"`
        );
      }
    }
    this.sourceTypes.set(definition.id, definition);
    this.registerListeners.forEach((listener) => listener(definition));
  }

  /**
   * Calls `listener` with each registered source now, and with each one registered later. Sources
   * may register from their plugin's `start`, which runs after Explore's, so anything Explore
   * derives from the registry at start has to follow later registrations too.
   */
  public onRegister(listener: (definition: SourceTypeDefinition) => void): void {
    this.registerListeners.push(listener);
    this.sourceTypes.forEach((definition) => listener(definition));
  }

  public get(id: string): SourceTypeDefinition | undefined {
    return this.sourceTypes.get(id);
  }

  /** Source types offered for a flavor (all of them when no flavor is given), sorted by order. */
  public getAll(flavor?: ExploreFlavor | null): SourceTypeDefinition[] {
    return Array.from(this.sourceTypes.values())
      .filter(
        (sourceType) => !flavor || (sourceType.flavors ?? [ExploreFlavor.Logs]).includes(flavor)
      )
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  /**
   * The source type that owns a dataset. OpenSearch owns every dataset type no other source
   * claims, so this never returns undefined.
   */
  public getForDataset(dataset?: { type?: string }): SourceTypeDefinition {
    const owner = Array.from(this.sourceTypes.values()).find(
      (sourceType) =>
        sourceType.id !== OPENSEARCH_SOURCE_TYPE_ID &&
        !!dataset?.type &&
        sourceType.datasetTypes.includes(dataset.type)
    );
    return owner ?? openSearchSourceType;
  }

  /** A source's label on a flavor. */
  public getLabel(sourceType: SourceTypeDefinition, flavor?: ExploreFlavor | null): string {
    const overrides = this.labelOverrides.get(sourceType.id);
    return (
      (flavor && overrides?.get(flavor)) ||
      (flavor && sourceType.flavorLabels?.[flavor]) ||
      overrides?.get('') ||
      sourceType.label
    );
  }

  /** See {@link SourceTypeRegistrySetup.setLabel}. */
  public setLabel(sourceTypeId: string, label: string, flavor?: ExploreFlavor): void {
    if (!this.sourceTypes.has(sourceTypeId)) {
      throw new Error(`Explore source type "${sourceTypeId}" is not registered`);
    }
    const overrides = this.labelOverrides.get(sourceTypeId) ?? new Map<string, string>();
    overrides.set(flavor ?? '', label);
    this.labelOverrides.set(sourceTypeId, overrides);
  }

  /** Whether a dataset belongs to a registered (non-OpenSearch) source offered on a flavor. */
  public isRegisteredSourceDataset(
    dataset: { type?: string } | undefined,
    flavor: ExploreFlavor
  ): boolean {
    const owner = this.getForDataset(dataset);
    return (
      owner.id !== OPENSEARCH_SOURCE_TYPE_ID &&
      (owner.flavors ?? [ExploreFlavor.Logs]).includes(flavor)
    );
  }

  /**
   * Explore settings for a language: the active dataset's source's entry when there is a dataset,
   * else the first source that lists it. Undefined for languages no source lists (built-ins).
   */
  public getLanguageSettings(
    languageId?: string,
    dataset?: { type?: string }
  ): SourceTypeLanguageSettings | undefined {
    if (!languageId) return undefined;
    if (dataset?.type) return this.getForDataset(dataset).languageSettings?.[languageId];
    // A source's settings for a built-in language apply only on that source's own datasets.
    if (BUILT_IN_LANGUAGES.includes(languageId)) return undefined;
    for (const sourceType of this.sourceTypes.values()) {
      const settings = sourceType.languageSettings?.[languageId];
      if (settings) return settings;
    }
    return undefined;
  }

  /**
   * How to introduce a language on the active dataset's source. A source that lists the language
   * describes it entirely (built-in wording would name the wrong store); otherwise a built-in
   * language gets Explore's own wording.
   */
  public getLanguageGuide(
    languageId?: string,
    dataset?: { type?: string }
  ): SourceTypeLanguageGuide {
    if (!languageId) return {};
    const settings = this.settingsFor(languageId, dataset);
    if (settings) {
      const { label, tag, description, docLink, sampleQueries, codeLanguage } = settings;
      return { label, tag, description, docLink, sampleQueries, codeLanguage };
    }
    return BUILT_IN_LANGUAGE_GUIDES[languageId] ?? {};
  }

  /**
   * What to call a language on the active dataset's source: its guide's label, else the title the
   * language is registered with in the data plugin, else its id.
   */
  public getLanguageLabel(
    languageId: string | undefined,
    dataset: { type?: string } | undefined
  ): string {
    if (!languageId) return '';
    return (
      this.getLanguageGuide(languageId, dataset).label ?? registeredTitle(languageId) ?? languageId
    );
  }

  /**
   * The resource client the Metrics page's metric browser and PromQL builder use for a dataset's
   * source, or undefined when the source has none (the page then offers only its Query tab).
   */
  public getMetricsResourceClientId(dataset?: { type?: string }): string | undefined {
    return this.getForDataset(dataset).metricsResourceClientId;
  }

  /**
   * Whether a metrics query editor shows the PromQL builder rows for a language: PromQL on a
   * source with a metrics resource client for the builder to call, unless the source brings its
   * own editor for PromQL. Otherwise the editor is the source's own or a single code editor.
   */
  public usesPromQLRows(languageId?: string, dataset?: { type?: string }): boolean {
    return (
      languageId === 'PROMQL' &&
      !this.getLanguageSettings(languageId, dataset)?.metricsQueryEditor &&
      !!this.getMetricsResourceClientId(dataset)
    );
  }

  /**
   * Whether a language queries metrics: PromQL, or a language a registered source offered on the
   * Metrics flavor lists. Such a query needs a metrics dataset and keeps its query options.
   */
  public isMetricsLanguage(languageId?: string): boolean {
    if (languageId === 'PROMQL') return true;
    if (!languageId || BUILT_IN_LANGUAGES.includes(languageId)) return false;
    return this.getAll(ExploreFlavor.Metrics).some(
      (sourceType) =>
        sourceType.id !== OPENSEARCH_SOURCE_TYPE_ID && !!sourceType.languageSettings?.[languageId]
    );
  }

  /** Whether Explore should run its histogram query. Built-in languages keep their behavior. */
  public supportsHistogram(languageId?: string, dataset?: { type?: string }): boolean {
    const settings = this.settingsFor(languageId, dataset);
    return settings ? !!settings.supportsHistogram : languageId !== 'PROMQL';
  }

  /** Whether the Logs page may show its visual builder. Built-in languages keep their behavior. */
  public supportsVisualBuilder(languageId?: string, dataset?: { type?: string }): boolean {
    const settings = this.settingsFor(languageId, dataset);
    return settings ? !!settings.supportsVisualBuilder : true;
  }

  /** Whether Explore can run a language: a built-in one, or one a registered source lists. */
  public isExploreLanguage(languageId?: string): boolean {
    return (
      !!languageId &&
      (BUILT_IN_LANGUAGES.includes(languageId) || !!this.getLanguageSettings(languageId))
    );
  }

  /** Whether any of a source's languages can use the visual builder (OpenSearch's can). */
  public hasVisualBuilder(sourceType: SourceTypeDefinition): boolean {
    const settings = Object.values(sourceType.languageSettings ?? {});
    return settings.length === 0 || settings.some((s) => s.supportsVisualBuilder);
  }

  // The active source's settings. For a non-built-in language seen briefly on another source's
  // dataset (mid-switch), use the settings of a source that lists it rather than PPL's behavior.
  private settingsFor(languageId?: string, dataset?: { type?: string }) {
    const settings = this.getLanguageSettings(languageId, dataset);
    if (settings || !dataset || !languageId || BUILT_IN_LANGUAGES.includes(languageId)) {
      return settings;
    }
    return this.getLanguageSettings(languageId);
  }

  /** Languages sources list for a tab on a flavor, to add to that tab's supported languages. */
  public getLanguagesForTab(tabId: string, flavor: ExploreFlavor): string[] {
    const languages = new Set<string>();
    this.getAll(flavor).forEach((sourceType) => {
      Object.entries(sourceType.languageSettings ?? {}).forEach(([languageId, settings]) => {
        if ((settings.tabs ?? DEFAULT_TABS[flavor]).includes(tabId)) languages.add(languageId);
      });
    });
    return Array.from(languages);
  }

  public setup(): SourceTypeRegistrySetup {
    return {
      register: (definition) => this.register(definition),
      setLabel: (sourceTypeId, label, flavor) => this.setLabel(sourceTypeId, label, flavor),
    };
  }
}

// The title a language is registered with. Explore's services are unset in some unit tests.
const registeredTitle = (languageId: string): string | undefined => {
  try {
    return getServices().data.query.queryString.getLanguageService().getLanguage(languageId)?.title;
  } catch {
    return undefined;
  }
};

// Read from components and query actions that have no services handle. Falls back to a registry
// holding only the built-in OpenSearch source, which is also what unit tests get.
let activeRegistry: SourceTypeRegistryService | undefined;
export const setSourceTypeRegistry = (registry: SourceTypeRegistryService) => {
  activeRegistry = registry;
};
export const getSourceTypeRegistry = (): SourceTypeRegistryService => {
  if (!activeRegistry) activeRegistry = new SourceTypeRegistryService();
  return activeRegistry;
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType } from 'react';
import { Dataset } from '../../../../data/common';
import { DataPublicPluginStart } from '../../../../data/public';
import { ExploreFlavor, EXPLORE_LOGS_TAB_ID } from '../../../common';
import { openSearchSourceType, OPENSEARCH_SOURCE_TYPE_ID } from './opensearch_source_type';

export { OPENSEARCH_SOURCE_TYPE_ID };

/** Languages Explore supports itself; their default behavior applies unless a source lists them. */
const BUILT_IN_LANGUAGES = ['PPL', 'SQL', 'PROMQL'];

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
export interface SourceTypeLanguageSettings {
  /** Tabs that can render this language's results. Defaults to the Logs tab. */
  tabs?: string[];
  /** Run Explore's histogram query. Off by default: that query is built in PPL. */
  supportsHistogram?: boolean;
  /** Offer the Logs page's visual query builder. Off by default: the builder emits PPL. */
  supportsVisualBuilder?: boolean;
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
}

export interface SourceTypeRegistrySetup {
  register: (definition: SourceTypeDefinition) => void;
}

export class SourceTypeRegistryService {
  private readonly sourceTypes = new Map<string, SourceTypeDefinition>();

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
    for (const sourceType of this.sourceTypes.values()) {
      const settings = sourceType.languageSettings?.[languageId];
      if (settings) return settings;
    }
    return undefined;
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
        if ((settings.tabs ?? [EXPLORE_LOGS_TAB_ID]).includes(tabId)) languages.add(languageId);
      });
    });
    return Array.from(languages);
  }

  public setup(): SourceTypeRegistrySetup {
    return {
      register: (definition) => this.register(definition),
    };
  }
}

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

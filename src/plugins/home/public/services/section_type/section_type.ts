/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { SavedObjectLoader } from '../../../../saved_objects/public';
import { createSavedHomepageLoader, SavedHomepage } from '../../saved_homepage';

// TODO: this should support error handling explicitly
// TODO: this should support async rendering through a promise
export type RenderFn = (element: HTMLElement) => () => void;

export interface HeroSection {
  id: string;
  render: RenderFn;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  links?: Array<{ label: string; url: string }>;
  render: RenderFn;
}

export interface Homepage {
  heroes: HeroSection[];
  sections: Section[];
}

export class SectionTypeService {
  private heroSections: { [key: string]: HeroSection } = {};
  private sections: { [key: string]: Section } = {};
  private savedHomepageLoader?: SavedObjectLoader;

  public setup() {
    return {
      /**
       * Register a new hero section type. The id must be unique.
       */
      registerHeroSection: (heroSection: HeroSection) => {
        if (this.heroSections[heroSection.id]) {
          throw new Error(`Hero section with id '${heroSection.id}' already exists.`);
        }

        this.heroSections[heroSection.id] = heroSection;
      },

      /**
       * Register a new section type. The id must be unique.
       */
      registerSection: (section: Section) => {
        if (this.sections[section.id]) {
          throw new Error(`Section with id '${section.id}' already exists.`);
        }

        this.sections[section.id] = section;
      },
    };
  }

  public start({ core, data }: { core: CoreStart; data: DataPublicPluginStart }) {
    this.savedHomepageLoader = createSavedHomepageLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });
  }

  /**
   * Gets the current homepage in any scenario. If no homepage exists, one will be created.
   * The actual homepage that is returned is opaque to the caller, meaning this may be an
   * application-wide homepage, a workspace-specific homepage, or a user-specific homepage.
   *
   * Currently, if there are multiple candidates for the homepage, the first one will be returned.
   * This may change in the future.
   */
  public async getHomepage(): Promise<Homepage> {
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    // TODO: this will ignore multiple homepages if there are more than one. Maybe we want some other logic here?
    const { hits } = await this.savedHomepageLoader.find();
    const id = Object.values(hits)[0]?.id as string | undefined;
    const homepage: SavedHomepage = await this.savedHomepageLoader.get(id);

    if (!id) {
      await homepage.save({});
    }

    // TODO: is there a better/maybe more performant way to do this?
    const heroes = Array.isArray(homepage.heros) ? homepage.heros : [homepage.heros];
    const sections = Array.isArray(homepage.sections) ? homepage.sections : [homepage.sections];

    return {
      heroes: heroes.map((hero) => this.heroSections[hero.id]),
      sections: sections.map((section) => this.sections[section.id]),
    };
  }

  public getHeroSectionTypes() {
    return Object.values(this.heroSections);
  }

  public getSectionTypes() {
    return Object.values(this.sections);
  }
}

export type SectionTypeServiceSetup = ReturnType<SectionTypeService['setup']>;
// NOTE: we don't currently export a start type since start doesn't expose any APIs

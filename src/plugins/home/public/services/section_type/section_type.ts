/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../data/public';
import { SavedObjectLoader } from '../../../../saved_objects/public';
import { createSavedHomepageLoader } from '../../saved_homepage';

export interface HeroSection {
  id: string;
}

export interface Section {
  id: string;
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

  // TODO: convert this into some getters for homepages
  public getSavedHomepageLoader() {
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    return this.savedHomepageLoader;
  }

  public getHeroSections() {
    return Object.values(this.heroSections);
  }

  public getSections() {
    return Object.values(this.sections);
  }
}

export type SectionTypeServiceSetup = ReturnType<SectionTypeService['setup']>;
// NOTE: we don't currently export a start type since start doesn't expose any APIs

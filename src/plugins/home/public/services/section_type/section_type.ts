/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EuiLinkAnchorProps } from '@elastic/eui';
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
  links?: Array<{ label: string; url: string; props?: Omit<EuiLinkAnchorProps, 'href'> }>;
  render: RenderFn;
}

export interface Homepage {
  heroes$: Observable<HeroSection[] | undefined>;
  sections$: Observable<Section[] | undefined>;
  error$: Observable<unknown | undefined>;
  saveHomepage(heroes: HeroSection[], sections: Section[]): void;
  cleanup(): void;
}

export class SectionTypeService {
  private heroSections: Record<string, HeroSection> = {};
  private sections: Record<string, Section> = {};
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
   * An edge case to be aware of is if a user creates a homepage with sections from plugins,
   * then uninstalls those plugins, and navigates to the homepage. In this case, those sections
   * are ignored so that if the user installs the plugins again, they will see the sections again.
   *
   * Currently, if there are multiple candidates for the homepage, the first one will be returned.
   * This may change in the future.
   */
  public getHomepage(): Homepage {
    const heroesSubject = new BehaviorSubject<HeroSection[] | undefined>(undefined);
    const sectionsSubject = new BehaviorSubject<Section[] | undefined>(undefined);
    const errorSubject = new BehaviorSubject<unknown | undefined>(undefined);

    const subscriptions = new Subscription();

    this.fetchHomepageData()
      .then((homepage) => {
        const initialHeroes = Array.isArray(homepage.heros) ? homepage.heros : [homepage.heros];
        const initialSections = Array.isArray(homepage.sections)
          ? homepage.sections
          : [homepage.sections];

        heroesSubject.next(initialHeroes.map((hero) => this.heroSections[hero.id]).filter(Boolean));
        sectionsSubject.next(
          initialSections.map((section) => this.sections[section.id]).filter(Boolean)
        );

        // TODO: make this debounce time configurable
        const combinedSave$ = combineLatest([heroesSubject, sectionsSubject]).pipe(
          debounceTime(1000)
        );

        subscriptions.add(
          combinedSave$.subscribe(([heroes, sections]) => {
            if (heroes) {
              homepage.heros = heroes.map((hero) => ({ id: hero.id }));
            }

            if (sections) {
              homepage.sections = sections.map((section) => ({ id: section.id }));
            }

            if (heroes || sections) {
              homepage.save({});
            }
          })
        );
      })
      .catch((e) => {
        errorSubject.next(e);
      });

    return {
      heroes$: heroesSubject.asObservable(),
      sections$: sectionsSubject.asObservable(),
      error$: errorSubject.asObservable(),
      saveHomepage: (heroes, sections) => {
        heroesSubject.next(heroes);
        sectionsSubject.next(sections);
      },
      cleanup: () => {
        subscriptions.unsubscribe();
      },
    };
  }

  private async fetchHomepageData(): Promise<SavedHomepage> {
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    // TODO: this will ignore multiple homepages if there are more than one. Maybe we want some other logic here?
    const { hits } = await this.savedHomepageLoader.find();
    const id = hits[0]?.id as string | undefined;
    const homepage: SavedHomepage = await this.savedHomepageLoader.get(id);

    if (!id) {
      await homepage.save({});
    }

    return homepage;
  }

  public getHeroSectionTypes() {
    return Object.values(this.heroSections);
  }

  public getSectionTypes() {
    return Object.values(this.sections);
  }

  public getSavedHomepageLoader() {
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    return this.savedHomepageLoader;
  }
}

export type SectionTypeServiceSetup = ReturnType<SectionTypeService['setup']>;
// NOTE: we don't currently export a start type since start doesn't expose any APIs

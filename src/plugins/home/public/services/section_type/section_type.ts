/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
    // TODO: this should return some sort of way to know if the homepage is still loading
    // TODO: errors should be tested
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    const heroes$ = new BehaviorSubject<HeroSection[] | undefined>(undefined);
    const sections$ = new BehaviorSubject<Section[] | undefined>(undefined);
    const error$ = new BehaviorSubject<unknown | undefined>(undefined);

    const subscriptions = new Subscription();

    this.fetchHomepageData()
      .then((homepage) => {
        const initialHeroes = Array.isArray(homepage.heroes) ? homepage.heroes : [homepage.heroes];
        const initialSections = Array.isArray(homepage.sections)
          ? homepage.sections
          : [homepage.sections];

        heroes$.next(initialHeroes.map((hero) => this.heroSections[hero.id]).filter(Boolean));
        sections$.next(initialSections.map((section) => this.sections[section.id]).filter(Boolean));
        error$.next(undefined);

        // TODO: make this debounce time configurable
        const combinedSave$ = combineLatest([heroes$, sections$]).pipe(debounceTime(1000));

        subscriptions.add(
          combinedSave$.subscribe(([heroes, sections]) => {
            if (heroes) {
              homepage.heroes = heroes.map((hero) => ({ id: hero.id }));
            }

            if (sections) {
              homepage.sections = sections.map((section) => ({ id: section.id }));
            }

            if (heroes || sections) {
              homepage
                .save({})
                .then(() => error$.next(undefined))
                .catch((e) => error$.next(e));
            }
          })
        );
      })
      .catch((e) => {
        error$.next(e);
      });

    return {
      heroes$: heroes$.asObservable(),
      sections$: sections$.asObservable(),
      error$: error$.asObservable(),
      saveHomepage: (heroes, sections) => {
        heroes$.next(heroes);
        sections$.next(sections);
      },
      cleanup: () => {
        subscriptions.unsubscribe();
      },
    };
  }

  // In the future, it may be useful to get the current state of the homepage without using observables. If that
  // is the case, this function could be extended to produce usable heroes and sections, as well as a save function
  // that properly saves the data.
  private async fetchHomepageData(): Promise<SavedHomepage> {
    if (!this.savedHomepageLoader) {
      throw new Error('SectionTypeService has not been started yet.');
    }

    // TODO: this will use the first hit even if there are more than one homepage. Maybe we want some other logic here?
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

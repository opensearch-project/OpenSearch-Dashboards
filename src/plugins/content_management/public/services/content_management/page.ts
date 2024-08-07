/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { Content, PageConfig, Section } from './types';

export class Page {
  config: PageConfig;
  private sections: Map<string, Section> = new Map();
  private contents: Map<string, Content[]> = new Map();
  private sections$ = new BehaviorSubject<Section[]>([]);
  private contentObservables: Map<string, BehaviorSubject<Content[]>> = new Map();
  private NO_CONTENT$ = new BehaviorSubject<Content[]>([]);

  constructor(pageConfig: PageConfig) {
    this.config = pageConfig;
  }

  createSection(section: Section) {
    this.sections.set(section.id, section);
    this.sections$.next(this.getSections());
  }

  getSections() {
    return [...this.sections.values()].sort((a, b) => a.order - b.order);
  }

  getSections$() {
    return this.sections$;
  }

  addContent(sectionId: string, content: Content) {
    const sectionContents = this.contents.get(sectionId);
    if (sectionContents) {
      /**
       * `dashboard` type of content is exclusive, one section can only hold one `dashboard`
       * if adding a `dashboard` to an existing section, it will replace the contents of section
       * if adding a non-dashboard content to an section with `dashboard`, it will replace the dashboard
       */
      if (content.kind === 'dashboard' || sectionContents.some((c) => c.kind === 'dashboard')) {
        sectionContents.length = 0;
      }
      sectionContents.push(content);
      // sort content by order
      sectionContents.sort((a, b) => a.order - b.order);
    } else {
      this.contents.set(sectionId, [content]);
    }

    if (this.contentObservables.get(sectionId)) {
      this.contentObservables.get(sectionId)?.next([...(this.contents.get(sectionId) ?? [])]);
    } else {
      this.contentObservables.set(
        sectionId,
        new BehaviorSubject(this.contents.get(sectionId) ?? [])
      );
    }
  }

  getContents(sectionId: string) {
    return this.contents.get(sectionId) ?? [];
  }

  getContents$(sectionId: string) {
    return this.contentObservables.get(sectionId) ?? this.NO_CONTENT$;
  }
}

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
    if (this.sections.has(section.id)) {
      throw new Error(`Section id exists: ${section.id}`);
    }
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
      if (content.kind === 'dashboard' && sectionContents.length > 0) {
        throw new Error('Section type "dashboard" can only have one content type of "dashboard"');
      }
      sectionContents.push(content);
      // sort content by order
      sectionContents.sort((a, b) => a.order - b.order);
    } else {
      this.contents.set(sectionId, [content]);
    }

    if (this.contentObservables.get(sectionId)) {
      this.contentObservables.get(sectionId)?.next(this.contents.get(sectionId) ?? []);
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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionTypeService, SectionTypeServiceSetup, HeroSection, Section } from './section_type';
import { Subject } from 'rxjs';

const createSetupMock = (): jest.Mocked<SectionTypeServiceSetup> => {
  return {
    registerHeroSection: jest.fn(),
    registerSection: jest.fn(),
  };
};

const createMock = () => {
  const service: jest.Mocked<PublicMethodsOf<SectionTypeService>> = {
    setup: jest.fn(),
    start: jest.fn(),
    getHomepage: jest.fn(() => ({
      heroes$: new Subject<HeroSection[] | undefined>().asObservable(),
      sections$: new Subject<Section[] | undefined>().asObservable(),
      error$: new Subject<unknown>().asObservable(),
      saveHomepage: jest.fn(),
      cleanup: jest.fn(),
    })),
    getHeroSectionTypes: jest.fn(() => []),
    getSectionTypes: jest.fn(() => []),
    getSavedHomepageLoader: jest.fn(() => ({ get: jest.fn() } as any)),
  };

  service.setup.mockImplementation(createSetupMock);

  return service;
};

export const sectionTypeServiceMock = {
  createSetup: createSetupMock,
  create: createMock,
};

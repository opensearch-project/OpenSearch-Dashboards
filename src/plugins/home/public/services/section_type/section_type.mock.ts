/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionTypeService, SectionTypeServiceSetup } from './section_type';

const createSetupMock = (): jest.Mocked<SectionTypeServiceSetup> => {
  return {
    registerHeroSection: jest.fn(),
    registerSection: jest.fn(),
  };
};

const createMock = (): jest.Mocked<PublicMethodsOf<SectionTypeService>> => {
  const service = {
    setup: jest.fn(),
    start: jest.fn(),
    getHomepage: jest.fn(() =>
      Promise.resolve({
        heroes: [],
        sections: [],
      })
    ),
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

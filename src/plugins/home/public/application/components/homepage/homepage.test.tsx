/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Homepage } from './homepage';
import {
  HomeOpenSearchDashboardsServices,
  setServices,
} from '../../opensearch_dashboards_services';
import { SectionTypeService } from '../../../services';
import { BehaviorSubject } from 'rxjs';
import { HeroSection, Section } from '../../../services/section_type/section_type';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { act } from 'react-dom/test-utils';
import { homePluginMock } from '../../../mocks/mocks';

let services: HomeOpenSearchDashboardsServices;
const mockErrors = new BehaviorSubject<unknown | undefined>(undefined);
let mockHeros: any;
let mockSections: any;

// Mock implementation of the SectionTypeService class
jest.mock('../../../services', () => {
  return {
    SectionTypeService: jest.fn().mockImplementation(() => ({
      setup: jest.fn().mockReturnValue({
        registerHeroSection: jest.fn(),
        registerSection: jest.fn(),
      }),
      start: jest.fn(),
      getHomepage: () => {
        return {
          heroes$: mockHeros,
          sections$: mockSections,
          error$: mockErrors,
          saveHomepage: jest.fn(),
          fetchHomepageData: jest.fn(),
          getHeroSectionTypes: jest.fn(),
          getSectionTypes: jest.fn(),
          getSavedHomepageLoader: jest.fn(),
          cleanup: jest.fn(),
        };
      },
    })),
  };
});

describe('Home page', () => {
  beforeAll(() => {
    services = homePluginMock.createStartContract();
  });

  it('renders the loading spinner if home page is still being loaded', async () => {
    mockSections = new BehaviorSubject<Section[] | undefined>(undefined);
    mockHeros = new BehaviorSubject<HeroSection[] | undefined>(undefined);
    const sectionTypes = new SectionTypeService();

    setServices({
      ...services,
      homeConfig: {
        disableWelcomeScreen: true,
        disableNewThemeModal: true,
      },
      sectionTypes,
    });

    await act(async () => {
      const component = mountWithIntl(
        <OpenSearchDashboardsContextProvider services={services}>
          <Homepage />
        </OpenSearchDashboardsContextProvider>
      );
      expect(component.find('[data-test-subj="loading"]')).toBeTruthy();
    });
  });

  it('renders the welcome modal if enabled', async () => {
    mockSections = new BehaviorSubject<Section[] | undefined>([]);
    mockHeros = new BehaviorSubject<HeroSection[] | undefined>([]);
    const sectionTypes = new SectionTypeService();

    setServices({
      ...services,
      homeConfig: {
        disableWelcomeScreen: false,
        disableNewThemeModal: true,
      },
      sectionTypes,
    });

    await act(async () => {
      const component = mountWithIntl(
        <OpenSearchDashboardsContextProvider services={services}>
          <Homepage />
        </OpenSearchDashboardsContextProvider>
      );
      expect(component.find('[data-test-subj="welcome"]')).toBeTruthy();
    });
  });

  it('renders home page content sections', async () => {
    const sectionTypes = new SectionTypeService();
    const sectionMock = {
      id: 'id',
      title: 'title',
      render: jest.fn(),
    };
    const heroMock = {
      id: 'id',
      render: jest.fn(),
    };
    sectionTypes.getHomepage().sections$ = new BehaviorSubject<Section[] | undefined>([
      sectionMock,
    ]);
    sectionTypes.getHomepage().heroes$ = new BehaviorSubject<HeroSection[] | undefined>([heroMock]);
    setServices({
      ...services,
      homeConfig: {
        disableWelcomeScreen: true,
        disableNewThemeModal: true,
      },
      sectionTypes,
    });
    await act(async () => {
      const component = mountWithIntl(
        <OpenSearchDashboardsContextProvider services={services}>
          <Homepage />
        </OpenSearchDashboardsContextProvider>
      );
      expect(component.find('[data-test-subj="loading"]')).toBeTruthy();
    });
  });
});

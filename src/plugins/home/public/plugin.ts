/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { first } from 'rxjs/operators';

import { Branding } from 'src/core/types';
import {
  EnvironmentService,
  EnvironmentServiceSetup,
  FeatureCatalogueCategory,
  FeatureCatalogueRegistry,
  FeatureCatalogueRegistrySetup,
  TutorialService,
  TutorialServiceSetup,
  SectionTypeService,
  SectionTypeServiceSetup,
} from './services';
import { ConfigSchema } from '../config';
import { setServices } from './application/opensearch_dashboards_services';
import { DataPublicPluginStart } from '../../data/public';
import { TelemetryPluginStart } from '../../telemetry/public';
import { UsageCollectionSetup } from '../../usage_collection/public';
import { UrlForwardingSetup, UrlForwardingStart } from '../../url_forwarding/public';
import { AppNavLinkStatus } from '../../../core/public';
import { PLUGIN_ID, HOME_APP_BASE_PATH } from '../common/constants';
import { DataSourcePluginStart } from '../../data_source/public';
import { workWithDataSection } from './application/components/homepage/sections/work_with_data';
import { learnBasicsSection } from './application/components/homepage/sections/learn_basics';
import { recentWorkSection } from './application/components/homepage/sections/recent_work';

export interface HomePluginStartDependencies {
  data: DataPublicPluginStart;
  telemetry?: TelemetryPluginStart;
  urlForwarding: UrlForwardingStart;
  dataSource?: DataSourcePluginStart;
}

export interface HomePluginSetupDependencies {
  usageCollection?: UsageCollectionSetup;
  urlForwarding: UrlForwardingSetup;
}

export class HomePublicPlugin
  implements
    Plugin<
      HomePublicPluginSetup,
      HomePublicPluginStart,
      HomePluginSetupDependencies,
      HomePluginStartDependencies
    > {
  private readonly featuresCatalogueRegistry = new FeatureCatalogueRegistry();
  private readonly environmentService = new EnvironmentService();
  private readonly tutorialService = new TutorialService();
  private readonly sectionTypeService = new SectionTypeService();

  constructor(private readonly initializerContext: PluginInitializerContext<ConfigSchema>) {}

  public setup(
    core: CoreSetup<HomePluginStartDependencies>,
    { urlForwarding, usageCollection }: HomePluginSetupDependencies
  ): HomePublicPluginSetup {
    core.application.register({
      id: PLUGIN_ID,
      title: 'Home',
      navLinkStatus: AppNavLinkStatus.hidden,
      mount: async (params: AppMountParameters) => {
        const trackUiMetric = usageCollection
          ? usageCollection.reportUiStats.bind(usageCollection, 'OpenSearch_Dashboards_home')
          : () => {};
        const [
          coreStart,
          { telemetry, data, urlForwarding: urlForwardingStart, dataSource },
        ] = await core.getStartServices();
        setServices({
          trackUiMetric,
          opensearchDashboardsVersion: this.initializerContext.env.packageInfo.version,
          http: coreStart.http,
          toastNotifications: core.notifications.toasts,
          banners: coreStart.overlays.banners,
          docLinks: coreStart.docLinks,
          savedObjectsClient: coreStart.savedObjects.client,
          chrome: coreStart.chrome,
          application: coreStart.application,
          telemetry,
          uiSettings: core.uiSettings,
          addBasePath: core.http.basePath.prepend,
          getBasePath: core.http.basePath.get,
          indexPatternService: data.indexPatterns,
          environmentService: this.environmentService,
          urlForwarding: urlForwardingStart,
          homeConfig: this.initializerContext.config.get(),
          tutorialService: this.tutorialService,
          featureCatalogue: this.featuresCatalogueRegistry,
          injectedMetadata: coreStart.injectedMetadata,
          dataSource,
          sectionTypes: this.sectionTypeService,
        });
        coreStart.chrome.docTitle.change(
          i18n.translate('home.pageTitle', { defaultMessage: 'Home' })
        );
        const { renderApp } = await import('./application');
        return await renderApp(params.element, coreStart, params.history);
      },
    });
    urlForwarding.forwardApp('home', 'home');

    const featureCatalogue = { ...this.featuresCatalogueRegistry.setup() };

    featureCatalogue.register({
      id: 'home_tutorial_directory',
      title: i18n.translate('home.tutorialDirectory.featureCatalogueTitle', {
        defaultMessage: 'Add sample data',
      }),
      description: i18n.translate('home.tutorialDirectory.featureCatalogueDescription', {
        defaultMessage: 'Get started with sample data, visualizations, and dashboards.',
      }),
      icon: 'indexOpen',
      showOnHomePage: true,
      path: `${HOME_APP_BASE_PATH}#/tutorial_directory`,
      category: 'data' as FeatureCatalogueCategory.DATA,
      order: 500,
    });

    const sectionTypes = { ...this.sectionTypeService.setup() };

    sectionTypes.registerSection(workWithDataSection);
    sectionTypes.registerSection(recentWorkSection);
    sectionTypes.registerSection(learnBasicsSection);

    return {
      featureCatalogue,
      environment: { ...this.environmentService.setup() },
      tutorials: { ...this.tutorialService.setup() },
      sectionTypes,
    };
  }

  public start(core: CoreStart, { data, urlForwarding }: HomePluginStartDependencies) {
    const {
      application: { capabilities, currentAppId$ },
      http,
    } = core;

    this.featuresCatalogueRegistry.start({ capabilities });
    this.sectionTypeService.start({ core, data });

    // If the home app is the initial location when loading OpenSearch Dashboards...
    if (
      window.location.pathname === http.basePath.prepend(HOME_APP_BASE_PATH) &&
      window.location.hash === ''
    ) {
      // ...wait for the app to mount initially and then...
      currentAppId$.pipe(first()).subscribe((appId) => {
        if (appId === 'home') {
          // ...navigate to default app set by `opensearchDashboards.defaultAppId`.
          // This doesn't do anything as along as the default settings are kept.
          urlForwarding.navigateToDefaultApp({ overwriteHash: false });
        }
      });
    }

    return {
      featureCatalogue: this.featuresCatalogueRegistry,
      getSavedHomepageLoader: () => this.sectionTypeService.getSavedHomepageLoader(),
    };
  }
}

/** @public */
export type FeatureCatalogueSetup = FeatureCatalogueRegistrySetup;

/** @public */
export type EnvironmentSetup = EnvironmentServiceSetup;

/** @public */
export type TutorialSetup = TutorialServiceSetup;

/** @public */
export type HomePluginBranding = Branding;

/** @public */
export interface HomePublicPluginSetup {
  tutorials: TutorialServiceSetup;
  featureCatalogue: FeatureCatalogueSetup;
  /**
   * The environment service is only available for a transition period and will
   * be replaced by display specific extension points.
   * @deprecated
   */

  environment: EnvironmentSetup;
  sectionTypes: SectionTypeServiceSetup;
}
export interface HomePublicPluginStart {
  featureCatalogue: FeatureCatalogueRegistry;
  getSavedHomepageLoader: SectionTypeService['getSavedHomepageLoader'];
}

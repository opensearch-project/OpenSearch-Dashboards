/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  Plugin,
  AppMountParameters,
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
} from '../../../src/core/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';
import { ExpressionsSetup, ExpressionsStart } from '../../../src/plugins/expressions/public';
import { ExplorePluginSetup, ExplorePluginStart } from '../../../src/plugins/explore/public';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
  expressions: ExpressionsSetup;
  explore: ExplorePluginSetup;
}

interface StartDeps {
  explore: ExplorePluginStart;
  expressions: ExpressionsStart;
}

export class VisualizationExamplesPlugin implements Plugin<void, void, SetupDeps, StartDeps> {
  public setup(core: CoreSetup<StartDeps>, { developerExamples, expressions, explore }: SetupDeps) {
    // Register an application that will be listed in the left navigation
    // under the "Visualizations Examples" section
    core.application.register({
      id: 'visualizationExamples',
      title: 'Visualization Examples',
      order: 8000,
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./app');
        // Get start services
        const [coreStart, depsStart] = await core.getStartServices();
        // Get the Visualization component from the explore plugin
        const { Visualization } = explore.ui;
        // Render the application
        return renderApp({
          core: coreStart,
          deps: depsStart,
          expressions: depsStart.expressions,
          appBasePath: params.appBasePath,
          element: params.element,
          Visualization,
        });
      },
    });

    // Register with the developer examples plugin
    developerExamples.register({
      appId: 'visualizationExamples',
      title: 'Visualization Examples',
      description: 'Examples of using the Visualization component from the explore plugin.',
      links: [
        {
          label: 'Visualization Component',
          href:
            'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/explore/public/components/visualizations/visualization.tsx',
          iconType: 'logoGithub',
          target: '_blank',
        },
      ],
    });
  }

  public start() {}

  public stop() {}
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
} from '../../../src/core/public';
import {
  ExpressionsExamplePluginSetup,
  ExpressionsExamplePluginStart,
  ExpressionsExampleSetupDependencies,
  ExpressionsExampleStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

import {
  sleep,
  square,
  avatar,
  avatarFn,
  quickFormFn,
  quickFormRenderer,
} from '../common/expression_functions';

export class ExpressionsExamplePlugin
  implements Plugin<ExpressionsExamplePluginSetup, ExpressionsExamplePluginStart> {
  public setup(
    core: CoreSetup,
    { expressions, developerExamples }: ExpressionsExampleSetupDependencies
  ): ExpressionsExamplePluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'expressions-example',
      title: PLUGIN_NAME,
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as ExpressionsExampleStartDependencies, params);
      },
    });

    const expressionFunctions = [sleep, square, avatarFn, quickFormFn];
    const expressionRenderers = [avatar, quickFormRenderer];

    expressionFunctions.forEach((createExpressionFunction) => {
      expressions.registerFunction(createExpressionFunction);
    });

    expressionRenderers.forEach((createExpressionRenderer) => {
      expressions.registerRenderer(createExpressionRenderer);
    });

    developerExamples.register({
      appId: 'expressions-example',
      title: i18n.translate('expressionsExample.developerExamples.title', {
        defaultMessage: 'Expressions',
      }),
      description: i18n.translate('expressionsExample.developerExamples.description', {
        defaultMessage:
          'Examples showing you how the expressions plugin is used to chain functions and render content',
      }),
      links: [
        {
          label: 'README',
          href:
            'https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/expressions/README.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
      ],
    });

    return {};
  }

  public start(core: CoreStart): ExpressionsExamplePluginStart {
    return {};
  }

  public stop() {}
}

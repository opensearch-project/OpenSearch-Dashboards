/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, Plugin, AppMountParameters, AppNavLinkStatus } from '../../../src/core/public';
import { DeveloperExamplesSetup } from '../../developer_examples/public';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
}

export class ApmTopologyExamplePlugin implements Plugin<void, void, SetupDeps> {
  public setup(core: CoreSetup, { developerExamples }: SetupDeps) {
    core.application.register({
      id: 'apmTopologyExample',
      title: 'APM Topology',
      navLinkStatus: AppNavLinkStatus.hidden,
      async mount(params: AppMountParameters) {
        const { renderApp } = await import('./app');
        return renderApp(params.element);
      },
    });

    developerExamples.register({
      appId: 'apmTopologyExample',
      title: 'APM Topology',
      description:
        'Demonstrates the @osd/apm-topology package for rendering interactive service topology maps.',
    });
  }

  public start() {}

  public stop() {}
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  Plugin,
  WorkspaceAvailability,
} from '../../../core/public';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupPlugins,
  ExploreStartPlugins,
} from './types';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  public setup(core: CoreSetup, plugins: ExploreSetupPlugins): ExplorePluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      order: 1000,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as ExploreStartPlugins, params);
      },
    });

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.essentials, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 200,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.search, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 200,
      },
    ]);

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 200,
      },
    ]);

    // Register the plugin in the data explorer
    // plugins.dataExplorer.registerView({
    //   id: PLUGIN_ID,
    //   title: PLUGIN_NAME,
    //   defaultPath: '#/',
    //   appExtentions: {
    //     savedObject: {
    //       docTypes: ['explore'],
    //       toListItem: (obj) => ({
    //         id: obj.id,
    //         label: obj.title,
    //       }),
    //     },
    //   },
    //   shouldShow: () => true,
    //   // ViewComponent
    //   Canvas: lazy(() => import('./application/view_components/canvas')),
    //   Panel: lazy(() => import('./application/view_components/panel')),
    //   Context: lazy(() => import('./application/view_components/context')),
    // });

    // TODO: Register embeddable factory when ready
    // this.registerEmbeddable(core, plugins);

    return {};
  }

  public start(core: CoreStart): ExplorePluginStart {
    return {};
  }

  public stop() {}

  // TODO: Register embeddable factory when ready
  // private registerEmbeddable(core: CoreSetup<ExploreStartPlugins>, plugins: ExploreSetupPlugins) {
  //   const getStartServices = async () => {
  //     const [coreStart, deps] = await core.getStartServices();
  //     return {
  //       executeTriggerActions: deps.uiActions.executeTriggerActions,
  //       isEditable: () => coreStart.application.capabilities.discover?.save as boolean,
  //     };
  //   };

  //   const factory = new ExploreEmbeddableFactory(getStartServices);
  //   plugins.embeddable.registerEmbeddableFactory(factory.type, factory);
  // }
}

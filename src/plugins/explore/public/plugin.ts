/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { take } from 'rxjs/operators';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_GROUPS,
  Plugin,
  PluginInitializerContext,
  WorkspaceAvailability,
} from '../../../core/public';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { ConfigSchema } from '../common/config';
import {
  ExplorePluginSetup,
  ExplorePluginStart,
  ExploreSetupPlugins,
  ExploreStartPlugins,
} from './types';
import { isNavGroupInFeatureConfigs } from '../../../core/public';

export class ExplorePlugin implements Plugin<ExplorePluginSetup, ExplorePluginStart> {
  private config: ConfigSchema;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
  }

  public setup(core: CoreSetup, plugins: ExploreSetupPlugins): ExplorePluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: PLUGIN_ID,
      title: PLUGIN_NAME,
      order: 1000,
      workspaceAvailability: WorkspaceAvailability.insideWorkspace,
      euiIconType: 'inputOutput',
      defaultPath: '#/',
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      async mount(params: AppMountParameters) {
        const [coreStart, depsStart] = await core.getStartServices();
        const features = await core.workspaces.currentWorkspace$
          .pipe(take(1))
          .toPromise()
          .then((workspace) => workspace?.features);
        // We want to limit explore UI to only show up under observability and
        // security analytics workspaces. If user lands in the explore plugin
        // URL in a different workspace, we will redirect them to classic discover.
        if (
          !features ||
          (!isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features) &&
            !isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS['security-analytics'].id, features))
        ) {
          coreStart.application.navigateToApp('discover', { replace: true });
        }

        const { renderApp } = await import('./application');
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

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
      {
        id: PLUGIN_ID,
        category: undefined,
        order: 300,
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

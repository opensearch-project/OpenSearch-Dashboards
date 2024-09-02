/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { combineLatest } from 'rxjs';
import {
  NavGroupType,
  SavedObjectsStart,
  NavGroupItemInMap,
  ALL_USE_CASE_ID,
  CoreStart,
  ChromeBreadcrumb,
  ApplicationStart,
  HttpSetup,
  NotificationsStart,
  DEFAULT_NAV_GROUPS,
} from '../../../core/public';
import {
  App,
  AppCategory,
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
  WorkspaceObject,
  WorkspaceAvailability,
} from '../../../core/public';
import { WORKSPACE_DETAIL_APP_ID } from '../common/constants';
import { WorkspaceUseCase, WorkspaceUseCaseFeature } from './types';
import { formatUrlWithWorkspaceId } from '../../../core/public/utils';
import { SigV4ServiceName } from '../../../plugins/data_source/common/data_sources';
import {
  DirectQueryDatasourceDetails,
  DATACONNECTIONS_BASE,
  DatasourceTypeToDisplayName,
} from '../../data_source_management/public';
import { DataSource, DataSourceConnection, DataSourceConnectionType } from '../common/types';
import {
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  ESSENTIAL_OVERVIEW_PAGE_ID,
} from '../../../plugins/content_management/public';

export const USE_CASE_PREFIX = 'use-case-';

export const getUseCaseFeatureConfig = (useCaseId: string) => `${USE_CASE_PREFIX}${useCaseId}`;

export const isUseCaseFeatureConfig = (featureConfig: string) =>
  featureConfig.startsWith(USE_CASE_PREFIX);

export const getUseCaseFromFeatureConfig = (featureConfig: string) => {
  if (isUseCaseFeatureConfig(featureConfig)) {
    return featureConfig.substring(USE_CASE_PREFIX.length);
  }
  return null;
};

export const isFeatureIdInsideUseCase = (
  featureId: string,
  useCaseId: string,
  useCases: WorkspaceUseCase[]
) => {
  const availableFeatures = useCases.find(({ id }) => id === useCaseId)?.features ?? [];
  return availableFeatures.some((feature) => feature.id === featureId);
};

export const isNavGroupInFeatureConfigs = (navGroupId: string, featureConfigs: string[]) =>
  featureConfigs.includes(getUseCaseFeatureConfig(navGroupId));

/**
 * Checks if a given feature matches the provided feature configuration.
 *
 * Rules:
 * 1. `*` matches any feature.
 * 2. Config starts with `@` matches category, for example, @management matches any feature of `management` category,
 * 3. To match a specific feature, use the feature id, such as `discover`,
 * 4. To exclude a feature or category, prepend with `!`, e.g., `!discover` or `!@management`.
 * 5. The order of featureConfig array matters. From left to right, later configs override the previous ones.
 *    For example, ['!@management', '*'] matches any feature because '*' overrides the previous setting: '!@management'.
 * 6. For feature id start with use case prefix, it will read use case's features and match every passed apps.
 *    For example, ['user-case-observability'] matches all features under observability use case.
 */
export const featureMatchesConfig = (featureConfigs: string[], useCases: WorkspaceUseCase[]) => ({
  id,
  category,
}: {
  id: string;
  category?: AppCategory;
}) => {
  let matched = false;
  let firstUseCaseId: string | undefined;

  /**
   * Iterate through each feature configuration to determine if the given feature matches any of them.
   * Note: The loop will not break prematurely because the order of featureConfigs array matters.
   * Later configurations may override previous ones, so each configuration must be evaluated in sequence.
   */
  for (const featureConfig of featureConfigs) {
    // '*' matches any feature
    if (featureConfig === '*') {
      matched = true;
    }

    // matches any feature inside use cases
    if (!firstUseCaseId) {
      const useCaseId = getUseCaseFromFeatureConfig(featureConfig);
      if (useCaseId) {
        firstUseCaseId = useCaseId;
        if (isFeatureIdInsideUseCase(id, firstUseCaseId, useCases)) {
          matched = true;
        }
      }
    }

    // The config starts with `@` matches a category
    if (category && featureConfig === `@${category.id}`) {
      matched = true;
    }

    // The config matches a feature id
    if (featureConfig === id) {
      matched = true;
    }

    // If a config starts with `!`, such feature or category will be excluded
    if (featureConfig.startsWith('!')) {
      if (category && featureConfig === `!@${category.id}`) {
        matched = false;
      }

      if (featureConfig === `!${id}`) {
        matched = false;
      }
    }
  }

  return matched;
};

/**
 * Check if an app is accessible in a workspace based on the workspace configured features
 */
export function isAppAccessibleInWorkspace(
  app: App,
  workspace: WorkspaceObject,
  availableUseCases: WorkspaceUseCase[]
) {
  /**
   * App is not accessible within workspace if it explicitly declare itself as WorkspaceAvailability.outsideWorkspace
   */
  if (app.workspaceAvailability === WorkspaceAvailability.outsideWorkspace) {
    return false;
  }

  /**
   * When workspace has no features configured, all apps are considered to be accessible
   */
  if (!workspace.features) {
    return true;
  }

  /**
   * When workspace is all use case, all apps are accessible
   */
  if (getFirstUseCaseOfFeatureConfigs(workspace.features) === ALL_USE_CASE_ID) {
    return true;
  }

  /**
   * The app is configured into a workspace, it is accessible after entering the workspace
   */
  const featureMatcher = featureMatchesConfig(workspace.features, availableUseCases);
  if (featureMatcher({ id: app.id, category: app.category })) {
    return true;
  }

  /*
   * An app with hidden nav link is not configurable by workspace, which means user won't be
   * able to select/unselect it when configuring workspace features. Such apps are by default
   * accessible when in a workspace.
   */
  if (app.navLinkStatus === AppNavLinkStatus.hidden) {
    return true;
  }

  /**
   * A chromeless app is not configurable by workspace, which means user won't be
   * able to select/unselect it when configuring workspace features. Such apps are by default
   * accessible when in a workspace.
   */
  if (app.chromeless) {
    return true;
  }
  return false;
}

// Get all apps that should be displayed in workspace when create/update a workspace.
export const filterWorkspaceConfigurableApps = (applications: PublicAppInfo[]) => {
  const visibleApplications = applications.filter(
    ({ navLinkStatus, chromeless, category, id, workspaceAvailability }) => {
      const filterCondition =
        navLinkStatus !== AppNavLinkStatus.hidden &&
        !chromeless &&
        workspaceAvailability !== WorkspaceAvailability.outsideWorkspace;
      // If the category is management, only retain Dashboards Management which contains saved objets and index patterns.
      // Saved objets can show all saved objects in the current workspace and index patterns is at workspace level.
      if (category?.id === DEFAULT_APP_CATEGORIES.management.id) {
        return filterCondition && id === 'management';
      }
      return filterCondition;
    }
  );

  return visibleApplications;
};

export const getDataSourcesList = (
  client: SavedObjectsStart['client'],
  targetWorkspaces: string[]
) => {
  return client
    .find({
      type: 'data-source',
      fields: ['id', 'title', 'auth', 'description', 'dataSourceEngineType'],
      perPage: 10000,
      workspaces: targetWorkspaces,
    })
    .then((response) => {
      const objects = response?.savedObjects;
      if (objects) {
        return objects.map((source) => {
          const id = source.id;
          const title = source.get('title');
          const workspaces = source.workspaces ?? [];
          const auth = source.get('auth');
          const description = source.get('description');
          const dataSourceEngineType = source.get('dataSourceEngineType');
          return {
            id,
            title,
            auth,
            description,
            dataSourceEngineType,
            workspaces,
          };
        });
      } else {
        return [];
      }
    });
};

export const getDirectQueryConnections = async (dataSourceId: string, http: HttpSetup) => {
  const endpoint = `${DATACONNECTIONS_BASE}/dataSourceMDSId=${dataSourceId}`;
  const res = await http.get(endpoint);
  const directQueryConnections: DataSourceConnection[] = res.map(
    (dataConnection: DirectQueryDatasourceDetails) => ({
      id: `${dataSourceId}-${dataConnection.name}`,
      name: dataConnection.name,
      type: DatasourceTypeToDisplayName[dataConnection.connector],
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      description: dataConnection.description,
      parentId: dataSourceId,
    })
  );
  return directQueryConnections;
};

// Helper function to merge data sources with direct query connections
export const mergeDataSourcesWithConnections = (
  assignedDataSources: DataSource[],
  directQueryConnections: DataSourceConnection[]
): DataSourceConnection[] => {
  const dataSources: DataSourceConnection[] = [];
  assignedDataSources.forEach((ds) => {
    const relatedConnections = directQueryConnections.filter(
      (directQueryConnection) => directQueryConnection.parentId === ds.id
    );

    dataSources.push({
      id: ds.id,
      type: ds.dataSourceEngineType,
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      name: ds.title,
      description: ds.description,
      relatedConnections,
    });
  });

  return [...dataSources, ...directQueryConnections];
};

// If all connected data sources are serverless, will only allow to select essential use case.
export const getIsOnlyAllowEssentialUseCase = async (client: SavedObjectsStart['client']) => {
  const allDataSources = await getDataSourcesList(client, ['*']);
  if (allDataSources.length > 0) {
    return allDataSources.every(
      (ds) => ds?.auth?.credentials?.service === SigV4ServiceName.OpenSearchServerless
    );
  }
  return false;
};

export const convertNavGroupToWorkspaceUseCase = ({
  id,
  title,
  description,
  navLinks,
  type,
  order,
}: NavGroupItemInMap): WorkspaceUseCase => ({
  id,
  title,
  description,
  features: navLinks.map((item) => ({ id: item.id, title: item.title })),
  systematic: type === NavGroupType.SYSTEM || id === ALL_USE_CASE_ID,
  order,
});

const compareFeatures = (
  features1: WorkspaceUseCaseFeature[],
  features2: WorkspaceUseCaseFeature[]
) => {
  const featuresSerializer = (features: WorkspaceUseCaseFeature[]) =>
    features
      .map(({ id, title }) => `${id}-${title}`)
      .sort()
      .join();
  return featuresSerializer(features1) === featuresSerializer(features2);
};

export const isEqualWorkspaceUseCase = (a: WorkspaceUseCase, b: WorkspaceUseCase) => {
  if (a.id !== b.id) {
    return false;
  }
  if (a.title !== b.title) {
    return false;
  }
  if (a.description !== b.description) {
    return false;
  }
  if (a.systematic !== b.systematic) {
    return false;
  }
  if (a.order !== b.order) {
    return false;
  }
  if (a.features.length !== b.features.length || !compareFeatures(a.features, b.features)) {
    return false;
  }
  return true;
};

const isNotNull = <T extends unknown>(value: T | null): value is T => !!value;

export const getFirstUseCaseOfFeatureConfigs = (featureConfigs: string[]): string | undefined =>
  featureConfigs.map(getUseCaseFromFeatureConfig).filter(isNotNull)[0];

export function enrichBreadcrumbsWithWorkspace(core: CoreStart) {
  return combineLatest([
    core.workspaces.currentWorkspace$,
    core.application.currentAppId$,
    core.chrome.navGroup.getCurrentNavGroup$(),
    core.chrome.navGroup.getNavGroupsMap$(),
  ]).subscribe(([currentWorkspace, appId, currentNavGroup, navGroupsMap]) => {
    prependWorkspaceToBreadcrumbs(core, currentWorkspace, appId, currentNavGroup, navGroupsMap);
  });
}

/**
 * prepend workspace or its use case to breadcrumbs
 * @param core CoreStart
 */
export function prependWorkspaceToBreadcrumbs(
  core: CoreStart,
  currentWorkspace: WorkspaceObject | null,
  appId: string | undefined,
  currentNavGroup: NavGroupItemInMap | undefined,
  navGroupsMap: Record<string, NavGroupItemInMap>
) {
  if (
    appId === WORKSPACE_DETAIL_APP_ID ||
    appId === ESSENTIAL_OVERVIEW_PAGE_ID ||
    appId === ANALYTICS_ALL_OVERVIEW_PAGE_ID
  ) {
    core.chrome.setBreadcrumbsEnricher(undefined);
    return;
  }

  /**
   * There has 3 cases
   * nav group is enable + workspace enable + in a workspace -> workspace enricher
   * nav group is enable + workspace enable + out a workspace -> nav group enricher
   * nav group is enable + workspace disabled -> nav group enricher
   *
   * switch workspace will cause page refresh, breadcrumbs enricher will reset automatically
   * so we don't need to have reset logic for workspace
   */
  if (currentWorkspace) {
    const useCase = getFirstUseCaseOfFeatureConfigs(currentWorkspace?.features || []);
    // get workspace the only use case
    if (useCase && useCase !== ALL_USE_CASE_ID) {
      currentNavGroup = navGroupsMap[useCase];
    }
    const navGroupBreadcrumb: ChromeBreadcrumb = {
      text: currentNavGroup?.title,
      onClick: () => {
        // current nav group links are sorted, we don't need to sort it again here
        if (currentNavGroup?.navLinks[0].id) {
          core.application.navigateToApp(currentNavGroup?.navLinks[0].id);
        }
      },
    };
    const homeBreadcrumb: ChromeBreadcrumb = {
      text: 'Home',
      onClick: () => {
        core.application.navigateToApp('home');
      },
    };

    core.chrome.setBreadcrumbsEnricher((breadcrumbs) => {
      if (!breadcrumbs || !breadcrumbs.length) return breadcrumbs;

      const workspaceBreadcrumb: ChromeBreadcrumb = {
        text: currentWorkspace.name,
        onClick: () => {
          core.application.navigateToApp(WORKSPACE_DETAIL_APP_ID);
        },
      };
      if (useCase === ALL_USE_CASE_ID) {
        if (currentNavGroup && currentNavGroup.id !== DEFAULT_NAV_GROUPS.all.id) {
          return [homeBreadcrumb, workspaceBreadcrumb, navGroupBreadcrumb, ...breadcrumbs];
        } else {
          return [homeBreadcrumb, workspaceBreadcrumb, ...breadcrumbs];
        }
      } else {
        return [homeBreadcrumb, navGroupBreadcrumb, ...breadcrumbs];
      }
    });
  }
}

export const getUseCaseUrl = (
  useCase: WorkspaceUseCase | undefined,
  workspace: WorkspaceObject,
  application: ApplicationStart,
  http: HttpSetup
): string => {
  const appId = useCase?.features?.[0].id || WORKSPACE_DETAIL_APP_ID;
  const useCaseURL = formatUrlWithWorkspaceId(
    application.getUrlForApp(appId, {
      absolute: false,
    }),
    workspace.id,
    http.basePath
  );
  return useCaseURL;
};

export const fetchDataSourceConnections = async (
  assignedDataSources: DataSource[],
  http: HttpSetup | undefined,
  notifications: NotificationsStart | undefined
) => {
  try {
    const directQueryConnectionsPromises = assignedDataSources.map((ds) =>
      getDirectQueryConnections(ds.id, http!).catch(() => [])
    );
    const directQueryConnectionsResult = await Promise.all(directQueryConnectionsPromises);
    const directQueryConnections = directQueryConnectionsResult.flat();
    return mergeDataSourcesWithConnections(
      assignedDataSources,
      directQueryConnections
    ).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    notifications?.toasts.addDanger(
      i18n.translate('workspace.detail.dataSources.error.message', {
        defaultMessage: 'Cannot fetch direct query connections',
      })
    );
    return [];
  }
};

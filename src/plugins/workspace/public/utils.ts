/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavGroupType, SavedObjectsStart, NavGroupItemInMap } from '../../../core/public';
import {
  App,
  AppCategory,
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
  WorkspaceObject,
  WorkspaceAvailability,
} from '../../../core/public';
import { DEFAULT_SELECTED_FEATURES_IDS } from '../common/constants';
import { WorkspaceUseCase } from './types';

const USE_CASE_PREFIX = 'use-case-';

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
  featureConfig: string,
  useCases: WorkspaceUseCase[]
) => {
  const useCase = useCases.find(({ id }) => id === getUseCaseFromFeatureConfig(featureConfig));
  if (useCase) {
    return useCase.features.includes(featureId);
  }
  return false;
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
    if (isFeatureIdInsideUseCase(id, featureConfig, useCases)) {
      matched = true;
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
        !DEFAULT_SELECTED_FEATURES_IDS.includes(id) &&
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

export const getDataSourcesList = (client: SavedObjectsStart['client'], workspaces: string[]) => {
  return client
    .find({
      type: 'data-source',
      fields: ['id', 'title'],
      perPage: 10000,
      workspaces,
    })
    .then((response) => {
      const objects = response?.savedObjects;
      if (objects) {
        return objects.map((source) => {
          const id = source.id;
          const title = source.get('title');
          return {
            id,
            title,
          };
        });
      } else {
        return [];
      }
    });
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
  features: navLinks.map((item) => item.id),
  systematic: type === NavGroupType.SYSTEM,
  order,
});

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
  if (
    a.features.length !== b.features.length ||
    a.features.some((featureId) => !b.features.includes(featureId))
  ) {
    return false;
  }
  return true;
};

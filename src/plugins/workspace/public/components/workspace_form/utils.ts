/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
} from '../../../../../core/public';
import { DEFAULT_SELECTED_FEATURES_IDS } from '../../../common/constants';

import { WorkspaceFeature, WorkspaceFeatureGroup, WorkspaceFormErrors } from './types';

export const isWorkspaceFeatureGroup = (
  featureOrGroup: WorkspaceFeature | WorkspaceFeatureGroup
): featureOrGroup is WorkspaceFeatureGroup => 'features' in featureOrGroup;

export const appendDefaultFeatureIds = (ids: string[]) => {
  // concat default checked ids and unique the result
  return Array.from(new Set(ids.concat(DEFAULT_SELECTED_FEATURES_IDS)));
};

export const isValidFormTextInput = (input?: string) => {
  /**
   * This regular expression is from the workspace form name and description field UI.
   * It only accepts below characters.
   **/
  const regex = /^[0-9a-zA-Z()_\[\]\-\s]+$/;
  return typeof input === 'string' && regex.test(input);
};

export const getNumberOfErrors = (formErrors: WorkspaceFormErrors) => {
  let numberOfErrors = 0;
  if (formErrors.name) {
    numberOfErrors += 1;
  }
  if (formErrors.description) {
    numberOfErrors += 1;
  }
  return numberOfErrors;
};

export const convertApplicationsToFeaturesOrGroups = (
  applications: Array<
    Pick<PublicAppInfo, 'id' | 'title' | 'category' | 'navLinkStatus' | 'chromeless'>
  >
) => {
  const UNDEFINED = 'undefined';

  // Filter out all hidden applications and management applications and default selected features
  const visibleApplications = applications.filter(
    ({ navLinkStatus, chromeless, category, id }) =>
      navLinkStatus !== AppNavLinkStatus.hidden &&
      !chromeless &&
      !DEFAULT_SELECTED_FEATURES_IDS.includes(id) &&
      category?.id !== DEFAULT_APP_CATEGORIES.management.id
  );

  /**
   *
   * Convert applications to features map, the map use category label as
   * map key and group all same category applications in one array after
   * transfer application to feature.
   *
   **/
  const categoryLabel2Features = visibleApplications.reduce<{
    [key: string]: WorkspaceFeature[];
  }>((previousValue, application) => {
    const label = application.category?.label || UNDEFINED;

    return {
      ...previousValue,
      [label]: [...(previousValue[label] || []), { id: application.id, name: application.title }],
    };
  }, {});

  /**
   *
   * Iterate all keys of categoryLabel2Features map, convert map to features or groups array.
   * Features with category label will be converted to feature groups. Features without "undefined"
   * category label will be converted to single features. Then append them to the result array.
   *
   **/
  return Object.keys(categoryLabel2Features).reduce<
    Array<WorkspaceFeature | WorkspaceFeatureGroup>
  >((previousValue, categoryLabel) => {
    const features = categoryLabel2Features[categoryLabel];
    if (categoryLabel === UNDEFINED) {
      return [...previousValue, ...features];
    }
    return [
      ...previousValue,
      {
        name: categoryLabel,
        features,
      },
    ];
  }, []);
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import {
  EuiText,
  EuiFlexItem,
  EuiCheckbox,
  EuiCheckboxGroup,
  EuiFlexGroup,
  EuiCheckboxGroupProps,
  EuiCheckboxProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { groupBy } from 'lodash';

import {
  AppNavLinkStatus,
  DEFAULT_APP_CATEGORIES,
  PublicAppInfo,
} from '../../../../../core/public';

import { WorkspaceFeature, WorkspaceFeatureGroup } from './types';
import { isDefaultCheckedFeatureId, isWorkspaceFeatureGroup } from './utils';

const libraryCategoryLabel = i18n.translate('core.ui.libraryNavList.label', {
  defaultMessage: 'Library',
});

interface WorkspaceFeatureSelectorProps {
  applications: PublicAppInfo[];
  selectedFeatures: string[];
  onChange: (newFeatures: string[]) => void;
}

export const WorkspaceFeatureSelector = ({
  applications,
  selectedFeatures,
  onChange,
}: WorkspaceFeatureSelectorProps) => {
  const featureOrGroups = useMemo(() => {
    const transformedApplications = applications.map((app) => {
      if (app.category?.id === DEFAULT_APP_CATEGORIES.opensearchDashboards.id) {
        return {
          ...app,
          category: {
            ...app.category,
            label: libraryCategoryLabel,
          },
        };
      }
      return app;
    });
    const category2Applications = groupBy(transformedApplications, 'category.label');
    return Object.keys(category2Applications).reduce<
      Array<WorkspaceFeature | WorkspaceFeatureGroup>
    >((previousValue, currentKey) => {
      const apps = category2Applications[currentKey];
      const features = apps
        .filter(
          ({ navLinkStatus, chromeless, category }) =>
            navLinkStatus !== AppNavLinkStatus.hidden &&
            !chromeless &&
            category?.id !== DEFAULT_APP_CATEGORIES.management.id
        )
        .map(({ id, title }) => ({
          id,
          name: title,
        }));
      if (features.length === 0) {
        return previousValue;
      }
      if (currentKey === 'undefined') {
        return [...previousValue, ...features];
      }
      return [
        ...previousValue,
        {
          name: apps[0].category?.label || '',
          features,
        },
      ];
    }, []);
  }, [applications]);

  const handleFeatureChange = useCallback<EuiCheckboxGroupProps['onChange']>(
    (featureId) => {
      if (!selectedFeatures.includes(featureId)) {
        onChange([...selectedFeatures, featureId]);
        return;
      }
      onChange(selectedFeatures.filter((selectedId) => selectedId !== featureId));
    },
    [selectedFeatures, onChange]
  );

  const handleFeatureCheckboxChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      handleFeatureChange(e.target.id);
    },
    [handleFeatureChange]
  );

  const handleFeatureGroupChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      const featureOrGroup = featureOrGroups.find(
        (item) => isWorkspaceFeatureGroup(item) && item.name === e.target.id
      );
      if (!featureOrGroup || !isWorkspaceFeatureGroup(featureOrGroup)) {
        return;
      }
      const groupFeatureIds = featureOrGroup.features.map((feature) => feature.id);
      // setSelectedFeatureIds((previousData) => {
      const notExistsIds = groupFeatureIds.filter((id) => !selectedFeatures.includes(id));
      // Check all not selected features if not been selected in current group.
      if (notExistsIds.length > 0) {
        onChange([...selectedFeatures, ...notExistsIds]);
        return;
      }
      // Need to un-check these features, if all features in group has been selected
      onChange(selectedFeatures.filter((featureId) => !groupFeatureIds.includes(featureId)));
    },
    [featureOrGroups, selectedFeatures, onChange]
  );

  return (
    <>
      {featureOrGroups.map((featureOrGroup) => {
        const features = isWorkspaceFeatureGroup(featureOrGroup) ? featureOrGroup.features : [];
        const selectedIds = selectedFeatures.filter((id) =>
          (isWorkspaceFeatureGroup(featureOrGroup)
            ? featureOrGroup.features
            : [featureOrGroup]
          ).find((item) => item.id === id)
        );
        const featureOrGroupId = isWorkspaceFeatureGroup(featureOrGroup)
          ? featureOrGroup.name
          : featureOrGroup.id;

        const categoryToDescription: { [key: string]: string } = {
          [libraryCategoryLabel]: i18n.translate(
            'workspace.form.featureVisibility.libraryCategory.Description',
            {
              defaultMessage: 'Workspace-owned library items',
            }
          ),
        };

        return (
          <EuiFlexGroup key={featureOrGroup.name}>
            <EuiFlexItem>
              <div>
                <EuiText>
                  <strong>{featureOrGroup.name}</strong>
                </EuiText>
                {isWorkspaceFeatureGroup(featureOrGroup) &&
                  categoryToDescription[featureOrGroup.name] && (
                    <EuiText>{categoryToDescription[featureOrGroup.name]}</EuiText>
                  )}
              </div>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiCheckbox
                id={featureOrGroupId}
                onChange={
                  isWorkspaceFeatureGroup(featureOrGroup)
                    ? handleFeatureGroupChange
                    : handleFeatureCheckboxChange
                }
                label={`${featureOrGroup.name}${
                  features.length > 0 ? ` (${selectedIds.length}/${features.length})` : ''
                }`}
                checked={selectedIds.length > 0}
                disabled={
                  !isWorkspaceFeatureGroup(featureOrGroup) &&
                  isDefaultCheckedFeatureId(featureOrGroup.id)
                }
                indeterminate={
                  isWorkspaceFeatureGroup(featureOrGroup) &&
                  selectedIds.length > 0 &&
                  selectedIds.length < features.length
                }
                data-test-subj={`workspaceForm-workspaceFeatureVisibility-${featureOrGroupId}`}
              />
              {isWorkspaceFeatureGroup(featureOrGroup) && (
                <EuiCheckboxGroup
                  options={featureOrGroup.features.map((item) => ({
                    id: item.id,
                    label: item.name,
                    disabled: isDefaultCheckedFeatureId(item.id),
                  }))}
                  idToSelectedMap={selectedIds.reduce(
                    (previousValue, currentValue) => ({
                      ...previousValue,
                      [currentValue]: true,
                    }),
                    {}
                  )}
                  onChange={handleFeatureChange}
                  style={{ marginLeft: 40 }}
                  data-test-subj={`workspaceForm-workspaceFeatureVisibility-featureWithCategory-${featureOrGroupId}`}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      })}
    </>
  );
};

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

import { PublicAppInfo } from '../../../../../core/public';

import { isWorkspaceFeatureGroup, convertApplicationsToFeaturesOrGroups } from './utils';

export interface WorkspaceFeatureSelectorProps {
  applications: Array<
    Pick<PublicAppInfo, 'id' | 'title' | 'category' | 'chromeless' | 'navLinkStatus'>
  >;
  selectedFeatures: string[];
  onChange: (newFeatures: string[]) => void;
}

export const WorkspaceFeatureSelector = ({
  applications,
  selectedFeatures,
  onChange,
}: WorkspaceFeatureSelectorProps) => {
  const featuresOrGroups = useMemo(() => convertApplicationsToFeaturesOrGroups(applications), [
    applications,
  ]);

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
      const featureOrGroup = featuresOrGroups.find(
        (item) => isWorkspaceFeatureGroup(item) && item.name === e.target.id
      );
      if (!featureOrGroup || !isWorkspaceFeatureGroup(featureOrGroup)) {
        return;
      }
      const groupFeatureIds = featureOrGroup.features.map((feature) => feature.id);
      const notExistsIds = groupFeatureIds.filter((id) => !selectedFeatures.includes(id));
      // Check all not selected features if not been selected in current group.
      if (notExistsIds.length > 0) {
        onChange([...selectedFeatures, ...notExistsIds]);
        return;
      }
      // Need to un-check these features, if all features in group has been selected
      onChange(selectedFeatures.filter((featureId) => !groupFeatureIds.includes(featureId)));
    },
    [featuresOrGroups, selectedFeatures, onChange]
  );

  return (
    <>
      {featuresOrGroups.map((featureOrGroup) => {
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

        return (
          <EuiFlexGroup key={featureOrGroup.name}>
            <EuiFlexItem>
              <div>
                <EuiText>
                  <strong>{featureOrGroup.name}</strong>
                </EuiText>
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

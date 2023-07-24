/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, FormEventHandler, useRef, useMemo } from 'react';
import { groupBy } from 'lodash';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiButton,
  EuiFlexItem,
  EuiCheckableCard,
  htmlIdGenerator,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiImage,
  EuiCheckbox,
  EuiCheckboxGroup,
  EuiCheckableCardProps,
  EuiCheckboxGroupProps,
  EuiCheckboxProps,
  EuiFieldTextProps,
  EuiColorPicker,
  EuiColorPickerProps,
  EuiComboBox,
  EuiComboBoxProps,
} from '@elastic/eui';

import { WorkspaceTemplate } from '../../../../../core/types';
import { App, AppNavLinkStatus, ApplicationStart } from '../../../../../core/public';
import { useApplications, useWorkspaceTemplate } from '../../hooks';
import { WORKSPACE_OP_TYPE_CREATE, WORKSPACE_OP_TYPE_UPDATE } from '../../../common/constants';
import {
  isFeatureDependBySelectedFeatures,
  getFinalFeatureIdsByDependency,
  generateFeatureDependencyMap,
} from '../utils/feature';

import { WorkspaceIconSelector } from './workspace_icon_selector';

interface WorkspaceFeature extends Pick<App, 'dependencies'> {
  id: string;
  name: string;
  templates: WorkspaceTemplate[];
}

interface WorkspaceFeatureGroup {
  name: string;
  features: WorkspaceFeature[];
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  features: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
}

type WorkspaceFormErrors = { [key in keyof WorkspaceFormData]?: string };

const isWorkspaceFeatureGroup = (
  featureOrGroup: WorkspaceFeature | WorkspaceFeatureGroup
): featureOrGroup is WorkspaceFeatureGroup => 'features' in featureOrGroup;

const workspaceHtmlIdGenerator = htmlIdGenerator();

const defaultVISThemeOptions = [{ label: 'Categorical', value: 'categorical' }];

interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormData) => void;
  defaultValues?: WorkspaceFormData;
  opType?: string;
}

export const WorkspaceForm = ({
  application,
  onSubmit,
  defaultValues,
  opType,
}: WorkspaceFormProps) => {
  const { workspaceTemplates, templateFeatureMap } = useWorkspaceTemplate(application);
  const applications = useApplications(application);

  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);
  const [icon, setIcon] = useState(defaultValues?.icon);
  const [defaultVISTheme, setDefaultVISTheme] = useState(defaultValues?.defaultVISTheme);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedFeatureIds, setSelectedFeatureIds] = useState(defaultValues?.features || []);
  const selectedTemplate = workspaceTemplates.find(
    (template) => template.id === selectedTemplateId
  );
  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const formIdRef = useRef<string>();
  const getFormData = () => ({
    name,
    description,
    features: selectedFeatureIds,
    color,
    icon,
    defaultVISTheme,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  const featureOrGroups = useMemo(() => {
    const category2Applications = groupBy(applications, 'category.label');
    return Object.keys(category2Applications).reduce<
      Array<WorkspaceFeature | WorkspaceFeatureGroup>
    >((previousValue, currentKey) => {
      const apps = category2Applications[currentKey];
      const features = apps
        .filter(
          ({ navLinkStatus, chromeless, featureGroup }) =>
            navLinkStatus !== AppNavLinkStatus.hidden &&
            !chromeless &&
            featureGroup?.includes('WORKSPACE')
        )
        .map(({ id, title, workspaceTemplate, dependencies }) => ({
          id,
          name: title,
          templates: workspaceTemplate || [],
          dependencies,
        }));
      if (features.length === 1 || currentKey === 'undefined') {
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

  const selectedDefaultVISThemeOptions = useMemo(
    () => defaultVISThemeOptions.filter((item) => item.value === defaultVISTheme),
    [defaultVISTheme]
  );

  const allFeatures = useMemo(
    () =>
      featureOrGroups.reduce<WorkspaceFeature[]>(
        (previousData, currentData) => [
          ...previousData,
          ...(isWorkspaceFeatureGroup(currentData) ? currentData.features : [currentData]),
        ],
        []
      ),
    [featureOrGroups]
  );

  const featureDependencies = useMemo(() => generateFeatureDependencyMap(allFeatures), [
    allFeatures,
  ]);

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleTemplateCardChange = useCallback<EuiCheckableCardProps['onChange']>(
    (e) => {
      const templateId = e.target.value;
      setSelectedTemplateId(templateId);
      setSelectedFeatureIds(
        getFinalFeatureIdsByDependency(
          allFeatures
            .filter(({ templates }) => !!templates.find((template) => template.id === templateId))
            .map((feature) => feature.id),
          featureDependencies
        )
      );
    },
    [allFeatures, featureDependencies]
  );

  const handleFeatureChange = useCallback<EuiCheckboxGroupProps['onChange']>(
    (featureId) => {
      setSelectedFeatureIds((previousData) => {
        if (!previousData.includes(featureId)) {
          return getFinalFeatureIdsByDependency([featureId], featureDependencies, previousData);
        }

        if (isFeatureDependBySelectedFeatures(featureId, previousData, featureDependencies)) {
          return previousData;
        }

        return previousData.filter((selectedId) => selectedId !== featureId);
      });
    },
    [featureDependencies]
  );

  const handleFeatureCheckboxChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      handleFeatureChange(e.target.id);
    },
    [handleFeatureChange]
  );

  const handleFeatureGroupChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      for (const featureOrGroup of featureOrGroups) {
        if (isWorkspaceFeatureGroup(featureOrGroup) && featureOrGroup.name === e.target.id) {
          const groupFeatureIds = featureOrGroup.features.map((feature) => feature.id);
          setSelectedFeatureIds((previousData) => {
            const notExistsIds = groupFeatureIds.filter((id) => !previousData.includes(id));
            if (notExistsIds.length > 0) {
              return getFinalFeatureIdsByDependency(
                notExistsIds,
                featureDependencies,
                previousData
              );
            }
            let groupRemainFeatureIds = groupFeatureIds;
            const outGroupFeatureIds = previousData.filter(
              (featureId) => !groupFeatureIds.includes(featureId)
            );

            while (true) {
              const lastRemainFeatures = groupRemainFeatureIds.length;
              groupRemainFeatureIds = groupRemainFeatureIds.filter((featureId) =>
                isFeatureDependBySelectedFeatures(
                  featureId,
                  [...outGroupFeatureIds, ...groupRemainFeatureIds],
                  featureDependencies
                )
              );
              if (lastRemainFeatures === groupRemainFeatureIds.length) {
                break;
              }
            }

            return [...outGroupFeatureIds, ...groupRemainFeatureIds];
          });
        }
      }
    },
    [featureOrGroups, featureDependencies]
  );

  const handleFormSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      const formData = getFormDataRef.current();
      if (!formData.name) {
        setFormErrors({ name: "Name can't be empty." });
        return;
      }
      setFormErrors({});
      onSubmit?.({ ...formData, name: formData.name });
    },
    [onSubmit]
  );

  const handleNameInputChange = useCallback<Required<EuiFieldTextProps>['onChange']>((e) => {
    setName(e.target.value);
  }, []);

  const handleDescriptionInputChange = useCallback<Required<EuiFieldTextProps>['onChange']>((e) => {
    setDescription(e.target.value);
  }, []);

  const handleColorChange = useCallback<Required<EuiColorPickerProps>['onChange']>((text) => {
    setColor(text);
  }, []);

  const handleIconChange = useCallback((newIcon: string) => {
    setIcon(newIcon);
  }, []);

  const handleDefaultVISThemeInputChange = useCallback<
    Required<EuiComboBoxProps<string>>['onChange']
  >((options) => {
    setDefaultVISTheme(options[0]?.value);
  }, []);

  return (
    <EuiForm id={formIdRef.current} onSubmit={handleFormSubmit} component="form">
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace details</h2>
        </EuiTitle>
        <EuiSpacer />
        <EuiFormRow label="Name" isInvalid={!!formErrors.name} error={formErrors.name}>
          <EuiFieldText value={name} onChange={handleNameInputChange} />
        </EuiFormRow>
        <EuiFormRow
          label={
            <>
              Description - <i>optional</i>
            </>
          }
        >
          <EuiFieldText value={description} onChange={handleDescriptionInputChange} />
        </EuiFormRow>
        <EuiFormRow label="Color" isInvalid={!!formErrors.color} error={formErrors.color}>
          <EuiColorPicker color={color} onChange={handleColorChange} />
        </EuiFormRow>
        <EuiFormRow label="Icon" isInvalid={!!formErrors.icon} error={formErrors.icon}>
          <WorkspaceIconSelector value={icon} onChange={handleIconChange} color={color} />
        </EuiFormRow>
        <EuiFormRow
          label="Default VIS Theme"
          isInvalid={!!formErrors.defaultVISTheme}
          error={formErrors.defaultVISTheme}
        >
          <EuiComboBox
            options={defaultVISThemeOptions}
            singleSelection
            onChange={handleDefaultVISThemeInputChange}
            selectedOptions={selectedDefaultVISThemeOptions}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace Template</h2>
        </EuiTitle>
        <EuiSpacer />
        <EuiFlexGrid columns={2}>
          {workspaceTemplates.map((template) => (
            <EuiFlexItem key={template.label}>
              <EuiCheckableCard
                id={workspaceHtmlIdGenerator()}
                title={template.label}
                label={template.label}
                value={template.id}
                checked={template.id === selectedTemplateId}
                onChange={handleTemplateCardChange}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>
        <EuiSpacer />
        {selectedTemplate && (
          <>
            <EuiTitle size="xs">
              <h3>Features</h3>
            </EuiTitle>
            <EuiSpacer />
            <EuiFlexGroup>
              {selectedTemplate.coverImage && (
                <EuiFlexItem>
                  <EuiImage src={selectedTemplate.coverImage} alt={selectedTemplate.label} />
                </EuiFlexItem>
              )}
              <EuiFlexItem>
                <EuiText>{selectedTemplate.description}</EuiText>
                <EuiTitle size="xs">
                  <h4>Key Features:</h4>
                </EuiTitle>
                <EuiSpacer />
                <EuiFlexGrid style={{ paddingLeft: 20, paddingRight: 100 }} columns={2}>
                  {templateFeatureMap.get(selectedTemplate.id)?.map((feature) => (
                    <EuiFlexItem key={feature.id}>• {feature.title}</EuiFlexItem>
                  ))}
                </EuiFlexGrid>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer />
          </>
        )}
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace features</h2>
        </EuiTitle>
        <EuiFlexGrid style={{ paddingLeft: 20, paddingTop: 20 }} columns={2}>
          {featureOrGroups.map((featureOrGroup) => {
            const features = isWorkspaceFeatureGroup(featureOrGroup) ? featureOrGroup.features : [];
            const selectedIds = selectedFeatureIds.filter((id) =>
              (isWorkspaceFeatureGroup(featureOrGroup)
                ? featureOrGroup.features
                : [featureOrGroup]
              ).find((item) => item.id === id)
            );
            return (
              <EuiFlexItem key={featureOrGroup.name}>
                <EuiCheckbox
                  id={
                    isWorkspaceFeatureGroup(featureOrGroup)
                      ? featureOrGroup.name
                      : featureOrGroup.id
                  }
                  onChange={
                    isWorkspaceFeatureGroup(featureOrGroup)
                      ? handleFeatureGroupChange
                      : handleFeatureCheckboxChange
                  }
                  label={`${featureOrGroup.name}${
                    features.length > 0 ? `(${selectedIds.length}/${features.length})` : ''
                  }`}
                  checked={selectedIds.length > 0}
                  indeterminate={
                    isWorkspaceFeatureGroup(featureOrGroup) &&
                    selectedIds.length > 0 &&
                    selectedIds.length < features.length
                  }
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
                  />
                )}
              </EuiFlexItem>
            );
          })}
        </EuiFlexGrid>
      </EuiPanel>
      <EuiSpacer />
      <EuiText textAlign="right">
        {opType === WORKSPACE_OP_TYPE_CREATE && (
          <EuiButton form={formIdRef.current} type="submit" fill>
            Create workspace
          </EuiButton>
        )}
        {opType === WORKSPACE_OP_TYPE_UPDATE && (
          <EuiButton form={formIdRef.current} type="submit" fill>
            Update workspace
          </EuiButton>
        )}
      </EuiText>
    </EuiForm>
  );
};

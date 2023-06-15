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
  EuiAccordion,
  EuiCheckbox,
  EuiCheckboxGroup,
  EuiCheckableCardProps,
  EuiCheckboxGroupProps,
  EuiCheckboxProps,
  EuiFieldTextProps,
} from '@elastic/eui';

import { WorkspaceTemplate } from '../../../../../core/types';
import { AppNavLinkStatus, ApplicationStart } from '../../../../../core/public';
import { useApplications, useWorkspaceTemplate } from '../../hooks';

interface WorkspaceFeature {
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
}

type WorkspaceFormErrors = { [key in keyof WorkspaceFormData]?: string };

const isWorkspaceFeatureGroup = (
  featureOrGroup: WorkspaceFeature | WorkspaceFeatureGroup
): featureOrGroup is WorkspaceFeatureGroup => 'features' in featureOrGroup;

const workspaceHtmlIdGenerator = htmlIdGenerator();

interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormData) => void;
  defaultValues?: WorkspaceFormData;
}
export const WorkspaceForm = ({ application, onSubmit, defaultValues }: WorkspaceFormProps) => {
  const { workspaceTemplates, templateFeatureMap } = useWorkspaceTemplate(application);
  const applications = useApplications(application);

  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
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
          ({ navLinkStatus, chromeless }) =>
            navLinkStatus !== AppNavLinkStatus.hidden && !chromeless
        )
        .map(({ id, title, workspaceTemplate }) => ({
          id,
          name: title,
          templates: workspaceTemplate || [],
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

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleTemplateCardChange = useCallback<EuiCheckableCardProps['onChange']>(
    (e) => {
      const templateId = e.target.value;
      setSelectedTemplateId(templateId);
      setSelectedFeatureIds(
        featureOrGroups.reduce<string[]>(
          (previousData, currentData) => [
            ...previousData,
            ...(isWorkspaceFeatureGroup(currentData) ? currentData.features : [currentData])
              .filter(({ templates }) => !!templates.find((template) => template.id === templateId))
              .map((feature) => feature.id),
          ],
          []
        )
      );
    },
    [featureOrGroups]
  );

  const handleFeatureChange = useCallback<EuiCheckboxGroupProps['onChange']>((featureId) => {
    setSelectedFeatureIds((previousData) =>
      previousData.includes(featureId)
        ? previousData.filter((id) => id !== featureId)
        : [...previousData, featureId]
    );
  }, []);

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
              return [...previousData, ...notExistsIds];
            }
            return previousData.filter((id) => !groupFeatureIds.includes(id));
          });
        }
      }
    },
    [featureOrGroups]
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

  return (
    <EuiForm id={formIdRef.current} onSubmit={handleFormSubmit} component="form">
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace details</h2>
        </EuiTitle>
        <EuiSpacer />
        <EuiFormRow label="Name" isInvalid={!!formErrors.name} error={formErrors.name}>
          <EuiFieldText onChange={handleNameInputChange} />
        </EuiFormRow>
        <EuiFormRow
          label={
            <>
              Description - <i>optional</i>
            </>
          }
        >
          <EuiFieldText onChange={handleDescriptionInputChange} />
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
        <EuiAccordion
          id={workspaceHtmlIdGenerator()}
          buttonContent={
            <>
              <EuiTitle size="xs">
                <h3>Advanced Options</h3>
              </EuiTitle>
            </>
          }
        >
          <EuiFlexGrid style={{ paddingLeft: 20, paddingTop: 20 }} columns={2}>
            {featureOrGroups.map((featureOrGroup) => {
              const features = isWorkspaceFeatureGroup(featureOrGroup)
                ? featureOrGroup.features
                : [];
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
        </EuiAccordion>
      </EuiPanel>
      <EuiSpacer />
      <EuiText textAlign="right">
        <EuiButton form={formIdRef.current} type="submit" fill>
          Create workspace
        </EuiButton>
      </EuiText>
    </EuiForm>
  );
};

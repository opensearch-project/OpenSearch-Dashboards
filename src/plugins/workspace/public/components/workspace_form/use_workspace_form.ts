/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, FormEventHandler, useRef, useMemo, useEffect } from 'react';
import { htmlIdGenerator, EuiFieldTextProps, EuiColorPickerProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useApplications } from '../../hooks';
import { featureMatchesConfig } from '../../utils';

import { WorkspaceFormTabs } from './constants';
import { WorkspaceFormProps, WorkspaceFormErrors } from './types';
import { appendDefaultFeatureIds, getNumberOfErrors, isValidFormTextInput } from './utils';

const workspaceHtmlIdGenerator = htmlIdGenerator();

export const useWorkspaceForm = ({ application, defaultValues, onSubmit }: WorkspaceFormProps) => {
  const applications = useApplications(application);
  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);

  const [selectedTab, setSelectedTab] = useState(WorkspaceFormTabs.FeatureVisibility);
  // The matched feature id list based on original feature config,
  // the feature category will be expanded to list of feature ids
  const defaultFeatures = useMemo(() => {
    // The original feature list, may contain feature id and category wildcard like @management, etc.
    const defaultOriginalFeatures = defaultValues?.features ?? [];
    return applications.filter(featureMatchesConfig(defaultOriginalFeatures)).map((app) => app.id);
  }, [defaultValues?.features, applications]);

  const defaultFeaturesRef = useRef(defaultFeatures);
  defaultFeaturesRef.current = defaultFeatures;

  const [selectedFeatureIds, setSelectedFeatureIds] = useState(
    appendDefaultFeatureIds(defaultFeatures)
  );

  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const numberOfErrors = useMemo(() => getNumberOfErrors(formErrors), [formErrors]);
  const formIdRef = useRef<string>();
  const getFormData = () => ({
    name,
    description,
    features: selectedFeatureIds,
    color,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleFormSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      let currentFormErrors: WorkspaceFormErrors = {};
      const formData = getFormDataRef.current();
      if (!formData.name) {
        currentFormErrors = {
          ...currentFormErrors,
          name: i18n.translate('workspace.form.detail.name.empty', {
            defaultMessage: "Name can't be empty.",
          }),
        };
      }
      if (formData.name && !isValidFormTextInput(formData.name)) {
        currentFormErrors = {
          ...currentFormErrors,
          name: i18n.translate('workspace.form.detail.name.invalid', {
            defaultMessage: 'Invalid workspace name',
          }),
        };
      }
      if (formData.description && !isValidFormTextInput(formData.description)) {
        currentFormErrors = {
          ...currentFormErrors,
          description: i18n.translate('workspace.form.detail.description.invalid', {
            defaultMessage: 'Invalid workspace description',
          }),
        };
      }
      setFormErrors(currentFormErrors);
      if (getNumberOfErrors(currentFormErrors) > 0) {
        return;
      }

      const featureConfigChanged =
        formData.features.length !== defaultFeatures.length ||
        formData.features.some((feat) => !defaultFeatures.includes(feat));

      if (!featureConfigChanged) {
        // If feature config not changed, set workspace feature config to the original value.
        // The reason why we do this is when a workspace feature is configured by wildcard,
        // such as `['@management']` or `['*']`. The form value `formData.features` will be
        // expanded to array of individual feature id, if the feature hasn't changed, we will
        // set the feature config back to the original value so that category wildcard won't
        // expanded to feature ids
        formData.features = defaultValues?.features ?? [];
      }

      onSubmit?.({ ...formData, name: formData.name! });
    },
    [defaultFeatures, onSubmit, defaultValues?.features]
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

  const handleTabFeatureClick = useCallback(() => {
    setSelectedTab(WorkspaceFormTabs.FeatureVisibility);
  }, []);

  const handleFeaturesChange = useCallback((featureIds: string[]) => {
    setSelectedFeatureIds(featureIds);
  }, []);

  useEffect(() => {
    // When applications changed, reset form feature selection to original value
    setSelectedFeatureIds(appendDefaultFeatureIds(defaultFeaturesRef.current));
  }, [applications]);

  return {
    formId: formIdRef.current,
    formData: getFormData(),
    formErrors,
    selectedTab,
    applications,
    numberOfErrors,
    handleFormSubmit,
    handleColorChange,
    handleFeaturesChange,
    handleNameInputChange,
    handleTabFeatureClick,
    handleDescriptionInputChange,
  };
};

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSwitch,
  EuiColorPicker,
  EuiSelect,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiHorizontalRule,
  EuiBasicTable,
  EuiIcon,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiAccordion,
  EuiCheckboxGroup,
  EuiTextArea,
  EuiLoadingSpinner,
} from '@elastic/eui';

import { DashboardAnnotation } from '../../../types/dashboard_annotations';
import { DashboardAnnotationsService } from '../../../services/dashboard_annotations_service';
import { HttpStart } from '../../../../../../../core/public';
import { DataPublicPluginStart } from '../../../../../../data/public';

interface AnnotationsModalProps {
  onClose: () => void;
  onSave: (annotations: DashboardAnnotation[]) => void;
  dashboardId?: string;
  annotationsService: DashboardAnnotationsService;
  dashboardPanels?: any[];
  savedObjects?: any;
  http: HttpStart;
  data: DataPublicPluginStart;
}

interface FormData {
  name: string;
  enabled: boolean;
  color: string;
  showIn: 'all' | 'selected' | 'except';
  selectedVisualizations: string[];
  queryType: 'time-regions' | 'ppl-query';
  fromWeekday: string; // 'everyday' or weekday id (0-6)
  fromTime: string;
  toWeekday: string; // 'everyday' or weekday id (0-6)
  toTime: string;
  pplQuery: string;
  pplResultCount: number;
  pplDataset: string;
}

const SHOW_IN_OPTIONS = [
  { value: 'all', text: 'All visualizations' },
  { value: 'selected', text: 'Selected visualizations' },
  { value: 'except', text: 'All visualizations except' },
];

const QUERY_TYPE_OPTIONS = [
  { value: 'time-regions', text: 'Time regions' },
  { value: 'ppl-query', text: 'PPL Query' },
];

const TIME_OPTIONS = Array.from({ length: 24 * 60 }, (_, i) => {
  const hours = Math.floor(i / 60);
  const minutes = i % 60;
  const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { value, text: value };
}).filter((_, i) => i % 15 === 0);

// From weekday options including everyday and specific days
const FROM_WEEKDAY_OPTIONS = [
  { value: 'everyday', text: 'Everyday' },
  { value: '1', text: 'Monday' },
  { value: '2', text: 'Tuesday' },
  { value: '3', text: 'Wednesday' },
  { value: '4', text: 'Thursday' },
  { value: '5', text: 'Friday' },
  { value: '6', text: 'Saturday' },
  { value: '0', text: 'Sunday' },
];

// To weekday options (only specific days, no everyday)
const TO_WEEKDAY_OPTIONS = [
  { value: '1', text: 'Monday' },
  { value: '2', text: 'Tuesday' },
  { value: '3', text: 'Wednesday' },
  { value: '4', text: 'Thursday' },
  { value: '5', text: 'Friday' },
  { value: '6', text: 'Saturday' },
  { value: '0', text: 'Sunday' },
];

export const AnnotationsModal: React.FC<AnnotationsModalProps> = ({
  onClose,
  onSave,
  dashboardId,
  annotationsService,
  dashboardPanels = [],
  savedObjects,
  http,
  data,
}) => {
  const [annotations, setAnnotations] = useState<DashboardAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [testingPPL, setTestingPPL] = useState(false);
  const [pplTestResult, setPplTestResult] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    enabled: true,
    color: '#FF6B6B',
    showIn: 'all',
    selectedVisualizations: [],
    queryType: 'time-regions',
    fromWeekday: 'everyday',
    fromTime: '09:00',
    toWeekday: 'everyday',
    toTime: '17:00',
    pplQuery: '',
    pplResultCount: 0,
    pplDataset: '',
  });

  const accordionId = 'annotationForm';
  const [visualizationTitles, setVisualizationTitles] = useState<Record<string, string>>({});
  const [dataViews, setDataViews] = useState<Array<{ value: string; text: string }>>([]);

  const visualizationOptions = React.useMemo(() => {
    return dashboardPanels.map((panel, index) => {
      const panelId = panel.panelIndex || panel.id || `panel-${index}`;
      let displayName = visualizationTitles[panelId];

      if (!displayName) {
        if (panel.type === 'explore') {
          displayName = `Explore Chart ${index + 1}`;
        } else {
          displayName = `${panel.type || 'Explore'} ${index + 1}`;
        }
      }

      return {
        id: panelId,
        label: displayName,
        type: panel.type || 'explore',
        panelIndex: panel.panelIndex,
        savedObjectId: panel.id,
      };
    });
  }, [dashboardPanels, visualizationTitles]);

  useEffect(() => {
    const loadVisualizationTitles = async () => {
      if (!dashboardPanels.length || !savedObjects) return;

      const titles: Record<string, string> = {};

      for (let index = 0; index < dashboardPanels.length; index++) {
        const panel = dashboardPanels[index];
        const panelId = panel.panelIndex || panel.id || `panel-${index}`;
        let displayName;

        if (panel.id) {
          const savedObject = await savedObjects.client.get(panel.type || 'explore', panel.id);
          const title = savedObject.attributes?.title;

          if (title && typeof title === 'string' && title.trim()) {
            displayName = title.trim();
          }
        }

        if (!displayName) {
          if (panel.type === 'explore') {
            displayName = `Explore Chart ${index + 1}`;
          } else {
            displayName = `${panel.type || 'Panel'} ${index + 1}`;
          }
        }

        titles[panelId] = displayName;
      }

      setVisualizationTitles(titles);
    };

    loadVisualizationTitles();
  }, [dashboardPanels, savedObjects]);

  // Load existing annotations when modal opens
  useEffect(() => {
    if (dashboardId && annotationsService) {
      setLoading(true);
      annotationsService
        .getAnnotations(dashboardId)
        .then(setAnnotations)
        .catch()
        .finally(() => setLoading(false));
    }
  }, [dashboardId, annotationsService]);

  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === 'fromWeekday' && value === 'everyday') {
        newData.toWeekday = 'everyday';
      } else if (field === 'fromWeekday' && value !== 'everyday' && prev.toWeekday === 'everyday') {
        newData.toWeekday = value;
      }

      return newData;
    });
  }, []);

  // Load data views for PPL dataset selection
  useEffect(() => {
    const loadDataViews = async () => {
      const allDataViews = await data.dataViews.getIdsWithTitle();
      const options = allDataViews.map((dv) => ({
        value: dv.id,
        text: dv.title,
      }));
      setDataViews(options);
    };

    loadDataViews();
  }, [data.dataViews]);

  // Set default dataset when dataViews are loaded and no dataset is selected
  useEffect(() => {
    if (dataViews.length > 0 && !formData.pplDataset) {
      handleFormChange('pplDataset', dataViews[0].value);
    }
  }, [dataViews, formData.pplDataset, handleFormChange]);

  const resetForm = () => {
    setFormData({
      name: '',
      enabled: true,
      color: '#FF6B6B',
      showIn: 'all',
      selectedVisualizations: [],
      queryType: 'time-regions',
      fromWeekday: 'everyday',
      fromTime: '09:00',
      toWeekday: 'everyday',
      toTime: '17:00',
      pplQuery: '',
      pplResultCount: 0,
      pplDataset: '',
    });
    setEditingId(null);
  };

  const handleAddAnnotation = () => {
    const newAnnotation: DashboardAnnotation = {
      id: editingId || `annotation-${Date.now()}`,
      name: formData.name,
      type: 'builtInRule',
      enabled: formData.enabled,
      showAnnotations: formData.enabled,
      defaultColor: formData.color,
      showIn: formData.showIn,
      selectedVisualizations: formData.selectedVisualizations,
      query:
        formData.queryType === 'ppl-query'
          ? {
              // PPL query - only include PPL-specific fields
              queryType: formData.queryType,
              pplQuery: formData.pplQuery,
              pplResultCount: formData.pplResultCount,
              pplDataset: formData.pplDataset,
            }
          : {
              // Time regions query - include time-related fields
              queryType: formData.queryType,
              fromType:
                formData.fromWeekday === 'everyday' ? ('everyday' as const) : ('weekdays' as const),
              fromWeekdays: formData.fromWeekday === 'everyday' ? [] : [formData.fromWeekday],
              fromTime: formData.fromTime,
              toType:
                formData.toWeekday === 'everyday' ? ('everyday' as const) : ('weekdays' as const),
              toWeekdays: formData.toWeekday === 'everyday' ? [] : [formData.toWeekday],
              toTime: formData.toTime,
            },
      createdAt: editingId
        ? annotations.find((a) => a.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: editingId ? new Date().toISOString() : undefined,
    };

    if (editingId) {
      // Edit existing
      setAnnotations((prev) => prev.map((ann) => (ann.id === editingId ? newAnnotation : ann)));
    } else {
      // Add new
      setAnnotations((prev) => [...prev, newAnnotation]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEditAnnotation = (annotation: DashboardAnnotation) => {
    setFormData({
      name: annotation.name,
      enabled: annotation.enabled,
      color: annotation.defaultColor,
      showIn: annotation.showIn,
      selectedVisualizations: annotation.selectedVisualizations,
      queryType: annotation.query.queryType,
      fromWeekday:
        annotation.query.fromType === 'everyday'
          ? 'everyday'
          : annotation.query.fromWeekdays?.[0] || 'everyday',
      fromTime: annotation.query.fromTime || '',
      toWeekday:
        annotation.query.toType === 'everyday'
          ? 'everyday'
          : annotation.query.toWeekdays?.[0] || 'everyday',
      toTime: annotation.query.toTime || '',
      pplQuery: annotation.query.pplQuery || '',
      pplResultCount: annotation.query.pplResultCount || 0,
      pplDataset: annotation.query.pplDataset || '',
    });
    setEditingId(annotation.id);
    setShowAddForm(true);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    setDeleteConfirmId(null);
  };

  const handleToggleAnnotation = (id: string, enabled: boolean) => {
    setAnnotations((prev) => prev.map((ann) => (ann.id === id ? { ...ann, enabled } : ann)));
  };

  const handleTestPPLQuery = async () => {
    if (!formData.pplQuery || !formData.pplQuery.trim()) {
      setPplTestResult('Please enter a PPL query');
      return;
    }

    if (!formData.pplDataset) {
      setPplTestResult('Please select a dataset');
      return;
    }

    setTestingPPL(true);
    setPplTestResult(null);

    try {
      // Get the selected DataView
      await data.dataViews.ensureDefaultDataView();
      const dataView = await data.dataViews.get(formData.pplDataset);
      if (!dataView) {
        throw new Error('Dataset not found');
      }

      // Convert DataView to dataset format
      const dataset = await data.dataViews.convertToDataset(dataView);

      // Create query object with dataset
      const queryObject = {
        query: formData.pplQuery,
        language: 'PPL' as const,
        dataset,
      };

      // Apply getQueryWithSource logic
      const getQueryWithSource = (query: typeof queryObject) => {
        const queryString = typeof query.query === 'string' ? query.query : '';
        const lowerCaseQuery = queryString.toLowerCase();
        const hasSource = /^[^|]*\bsource\s*=/.test(lowerCaseQuery);
        const hasDescribe = /^\s*describe\s+/.test(lowerCaseQuery);
        const hasShow = /^\s*show\s+/.test(lowerCaseQuery);

        let datasetTitle: string;
        if (query.dataset && ['INDEXES', 'INDEX_PATTERN'].includes(query.dataset.type)) {
          if (hasSource) {
            // Replace source=anything with source=`anything`
            const updatedQuery = queryString.replace(
              /(\bsource\s*=\s*)([^`\s][^\s|]*)/gi,
              '$1`$2`'
            );
            return { ...query, query: updatedQuery };
          }
          datasetTitle = `\`${query.dataset.title}\``;
        } else {
          datasetTitle = query.dataset?.title || '';
        }

        if (hasSource || hasDescribe || hasShow) {
          return { ...query, query: queryString };
        }

        let queryStringWithSource: string;
        if (queryString.trim() === '') {
          queryStringWithSource = `source = ${datasetTitle}`;
        } else {
          queryStringWithSource = `source = ${datasetTitle} ${queryString}`;
        }

        return {
          ...query,
          query: queryStringWithSource,
        };
      };

      const queryWithSource = getQueryWithSource(queryObject);

      // Create search source
      const searchSource = await data.search.searchSource.create();
      const filters = data.query.filterManager.getFilters();

      // Set up time range filter
      const timeRangeSearchSource = await data.search.searchSource.create();
      const timefilter = data.query.timefilter.timefilter;
      timeRangeSearchSource.setField('filter', () => {
        return timefilter.createFilter(dataView);
      });

      searchSource.setParent(timeRangeSearchSource);

      // Prepare query
      const queryStringWithExecutedQuery = {
        ...data.query.queryString.getQuery(),
        query: queryWithSource.query,
        language: 'PPL',
      };

      // Set fields
      searchSource.setFields({
        index: dataView,
        size: 100,
        query: queryStringWithExecutedQuery || null,
        highlightAll: true,
        version: true,
        filter: filters,
      });

      // Execute
      const response = await searchSource.fetch({
        withLongNumeralsSupport: false,
      });

      // Handle response
      if (response && (response as any).datarows) {
        const resultCount = (response as any).datarows.length;
        handleFormChange('pplResultCount', resultCount);
        setPplTestResult(`Query executed successfully. Found ${resultCount} results.`);
      } else if (response && response.hits && response.hits.hits) {
        const resultCount = response.hits.hits.length;
        handleFormChange('pplResultCount', resultCount);
        setPplTestResult(`Query executed successfully. Found ${resultCount} results.`);
      } else {
        setPplTestResult('Query executed successfully but no results found.');
        handleFormChange('pplResultCount', 0);
      }
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred';
      if (error?.body?.message) {
        try {
          const parsedError = JSON.parse(error.body.message);
          errorMessage =
            parsedError?.error?.details || parsedError?.error?.reason || error.body.message;
        } catch {
          errorMessage = error.body.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setPplTestResult(`Query failed: ${errorMessage}`);
      handleFormChange('pplResultCount', 0);
    } finally {
      setTestingPPL(false);
    }
  };

  const handleSaveAll = async () => {
    if (!dashboardId || !annotationsService) {
      return;
    }

    setLoading(true);
    try {
      await annotationsService.saveAnnotations(dashboardId, annotations);
      onSave(annotations);

      onClose();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderVisualizationSelector = () => {
    if (formData.showIn === 'all') return null;

    const title =
      formData.showIn === 'selected' ? 'Select visualizations:' : 'Exclude visualizations:';

    if (visualizationOptions.length === 0) {
      return (
        <EuiFormRow label={title}>
          <EuiPanel paddingSize="s" color="subdued">
            <EuiText size="s" color="subdued">
              <p>No visualizations found in this dashboard</p>
            </EuiText>
          </EuiPanel>
        </EuiFormRow>
      );
    }

    // Convert visualization options to checkbox format
    const checkboxOptions = visualizationOptions.map((viz) => ({
      id: viz.id,
      label: `${viz.label} (${viz.type})`,
    }));

    // Create selected map from current form data
    const idToSelectedMap = visualizationOptions.reduce((acc, viz) => {
      acc[viz.id] = formData.selectedVisualizations.includes(viz.id);
      return acc;
    }, {} as Record<string, boolean>);

    const handleVisualizationChange = (optionId: string) => {
      const currentSelected = formData.selectedVisualizations;
      const isCurrentlySelected = currentSelected.includes(optionId);

      const newSelected = isCurrentlySelected
        ? currentSelected.filter((id) => id !== optionId)
        : [...currentSelected, optionId];

      handleFormChange('selectedVisualizations', newSelected);
    };

    return (
      <EuiFormRow label={title}>
        <EuiCheckboxGroup
          options={checkboxOptions}
          idToSelectedMap={idToSelectedMap}
          onChange={handleVisualizationChange}
        />
      </EuiFormRow>
    );
  };

  const renderFromSelector = () => {
    return (
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false} style={{ minWidth: '200px' }}>
          <EuiSelect
            options={FROM_WEEKDAY_OPTIONS}
            value={formData.fromWeekday}
            onChange={(e) => handleFormChange('fromWeekday', e.target.value)}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: '120px' }}>
          <EuiSelect
            options={TIME_OPTIONS}
            value={formData.fromTime}
            onChange={(e) => handleFormChange('fromTime', e.target.value)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderToSelector = () => {
    // Get available options based on fromWeekday selection
    const getToWeekdayOptions = () => {
      if (formData.fromWeekday === 'everyday') {
        // If from is everyday, to can only be time selection (no weekday selection)
        return [];
      } else {
        // If from is a specific weekday, to can be any specific weekday
        return TO_WEEKDAY_OPTIONS;
      }
    };

    const toWeekdayOptions = getToWeekdayOptions();

    return (
      <EuiFlexGroup gutterSize="s">
        {toWeekdayOptions.length > 0 && (
          <EuiFlexItem grow={false} style={{ minWidth: '200px' }}>
            <EuiSelect
              options={toWeekdayOptions}
              value={formData.toWeekday}
              onChange={(e) => handleFormChange('toWeekday', e.target.value)}
            />
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false} style={{ minWidth: '120px' }}>
          <EuiSelect
            options={TIME_OPTIONS}
            value={formData.toTime}
            onChange={(e) => handleFormChange('toTime', e.target.value)}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const renderPPLQuerySection = () => {
    return (
      <>
        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.pplDataset', {
            defaultMessage: 'Dataset',
          })}
          helpText={i18n.translate('dashboard.annotations.modal.pplDatasetHelp', {
            defaultMessage: 'Select the dataset to query for annotations.',
          })}
        >
          <EuiSelect
            options={[{ value: '', text: 'Select a dataset...' }, ...dataViews]}
            value={formData.pplDataset}
            onChange={(e) => handleFormChange('pplDataset', e.target.value)}
            disabled={dataViews.length === 0}
          />
        </EuiFormRow>

        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.pplQuery', {
            defaultMessage: 'PPL Query',
          })}
          helpText={i18n.translate('dashboard.annotations.modal.pplQueryHelp', {
            defaultMessage:
              'Enter a PPL query that returns timestamp data for annotations. Example: | WHERE Carrier = "BeatsWest" | FIELDS timestamp',
          })}
        >
          <EuiTextArea
            value={formData.pplQuery}
            onChange={(e) => handleFormChange('pplQuery', e.target.value)}
            placeholder="| WHERE your_condition | FIELDS timestamp"
            rows={3}
          />
        </EuiFormRow>

        <EuiFormRow>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButton
                onClick={handleTestPPLQuery}
                isLoading={testingPPL}
                disabled={!formData.pplQuery.trim() || !formData.pplDataset || testingPPL}
                size="s"
              >
                {testingPPL ? 'Testing...' : 'Test Query'}
              </EuiButton>
            </EuiFlexItem>
            {testingPPL && (
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner size="m" />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFormRow>

        {pplTestResult && (
          <EuiFormRow>
            <EuiText size="s" color={pplTestResult.includes('failed') ? 'danger' : 'success'}>
              <p>{pplTestResult}</p>
            </EuiText>
          </EuiFormRow>
        )}
      </>
    );
  };

  // Annotations table columns
  const columns = [
    {
      field: 'name',
      name: 'Name',
      render: (name: string, item: DashboardAnnotation) => (
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiIcon type="dot" color={item.defaultColor} />
          </EuiFlexItem>
          <EuiFlexItem>
            <strong>{name}</strong>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'enabled',
      name: 'Enabled',
      width: '80px',
      render: (enabled: boolean, item: DashboardAnnotation) => (
        <EuiSwitch
          compressed
          checked={enabled}
          onChange={(e) => handleToggleAnnotation(item.id, e.target.checked)}
          showLabel={false}
          label=""
        />
      ),
    },
    {
      field: 'query',
      name: 'Type',
      width: '120px',
      render: (query: DashboardAnnotation['query']) =>
        query.queryType === 'ppl-query' ? 'PPL Query' : 'Time regions',
    },
    {
      name: 'Actions',
      width: '100px',
      render: (item: DashboardAnnotation) => (
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="pencil"
              onClick={() => handleEditAnnotation(item)}
              aria-label="Edit annotation"
              color="primary"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="trash"
              onClick={() => setDeleteConfirmId(item.id)}
              aria-label="Delete annotation"
              color="danger"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  const renderAnnotationForm = () => (
    <EuiAccordion
      id={accordionId}
      buttonContent={
        <EuiTitle size="s">
          <span>{editingId ? 'Edit Annotation' : 'Add New Annotation'}</span>
        </EuiTitle>
      }
      isLoading={false}
      onToggle={() => {
        if (!showAddForm) {
          resetForm();
        }
        setShowAddForm(!showAddForm);
      }}
      forceState={showAddForm ? 'open' : 'closed'}
    >
      <EuiSpacer size="m" />
      <EuiForm component="form">
        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.name', {
            defaultMessage: 'Name',
          })}
        >
          <EuiFieldText
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="Enter annotation name"
          />
        </EuiFormRow>

        <EuiFormRow>
          <EuiSwitch
            label={i18n.translate('dashboard.annotations.modal.enabled', {
              defaultMessage: 'Enabled',
            })}
            checked={formData.enabled}
            onChange={(e) => handleFormChange('enabled', e.target.checked)}
          />
        </EuiFormRow>

        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.color', {
            defaultMessage: 'Color',
          })}
        >
          <EuiColorPicker
            color={formData.color}
            onChange={(color) => handleFormChange('color', color)}
          />
        </EuiFormRow>

        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.showIn', {
            defaultMessage: 'Show in',
          })}
        >
          <EuiSelect
            options={SHOW_IN_OPTIONS}
            value={formData.showIn}
            onChange={(e) => handleFormChange('showIn', e.target.value)}
          />
        </EuiFormRow>

        {renderVisualizationSelector()}

        <EuiHorizontalRule />

        <EuiFormRow
          label={i18n.translate('dashboard.annotations.modal.queryType', {
            defaultMessage: 'Query Type',
          })}
        >
          <EuiSelect
            options={QUERY_TYPE_OPTIONS}
            value={formData.queryType}
            onChange={(e) => handleFormChange('queryType', e.target.value)}
          />
        </EuiFormRow>

        {formData.queryType === 'time-regions' && (
          <>
            <EuiFormRow
              label={i18n.translate('dashboard.annotations.modal.from', {
                defaultMessage: 'From',
              })}
            >
              {renderFromSelector()}
            </EuiFormRow>

            <EuiFormRow
              label={i18n.translate('dashboard.annotations.modal.to', {
                defaultMessage: 'To',
              })}
            >
              {renderToSelector()}
            </EuiFormRow>
          </>
        )}

        {formData.queryType === 'ppl-query' && renderPPLQuerySection()}

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={handleAddAnnotation} fill disabled={!formData.name.trim()}>
              {editingId ? 'Update' : 'Add'} Annotation
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
            >
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
    </EuiAccordion>
  );

  return (
    <>
      <EuiModal onClose={onClose} style={{ width: '800px', maxWidth: '90vw' }}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {i18n.translate('dashboard.annotations.modal.title', {
              defaultMessage: 'Dashboard Annotations',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiTitle size="s">
            <h3>Annotations ({annotations.length})</h3>
          </EuiTitle>
          <EuiSpacer size="m" />

          {annotations.length === 0 ? (
            <EuiPanel paddingSize="l" color="subdued">
              <EuiText textAlign="center" color="subdued">
                <p>No annotations configured.</p>
              </EuiText>
            </EuiPanel>
          ) : (
            <EuiBasicTable items={annotations} columns={columns} hasActions={true} />
          )}

          <EuiSpacer size="l" />

          {/* Add/Edit Form */}
          {renderAnnotationForm()}
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose}>
            {i18n.translate('dashboard.annotations.modal.cancel', {
              defaultMessage: 'Cancel',
            })}
          </EuiButtonEmpty>

          <EuiButton onClick={handleSaveAll} fill isLoading={loading} disabled={loading}>
            {i18n.translate('dashboard.annotations.modal.saveAll', {
              defaultMessage: 'Save All ({count})',
              values: { count: annotations.length },
            })}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>

      {deleteConfirmId && (
        <EuiConfirmModal
          title="Delete annotation?"
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDeleteAnnotation(deleteConfirmId)}
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          buttonColor="danger"
        >
          <p>This action cannot be undone.</p>
        </EuiConfirmModal>
      )}
    </>
  );
};

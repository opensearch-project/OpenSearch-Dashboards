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

import React, { useState, useEffect } from 'react';
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
} from '@elastic/eui';

import { DashboardAnnotation } from '../../../types/dashboard_annotations';
import { DashboardAnnotationsService } from '../../../services/dashboard_annotations_service';

interface AnnotationsModalProps {
  onClose: () => void;
  onSave: (annotations: DashboardAnnotation[]) => void;
  dashboardId?: string;
  annotationsService: DashboardAnnotationsService;
  dashboardPanels?: any[];
  savedObjects?: any;
}

interface FormData {
  name: string;
  enabled: boolean;
  color: string;
  showIn: 'all' | 'selected' | 'except';
  selectedVisualizations: string[];
  queryType: 'time-regions';
  fromWeekday: string; // 'everyday' or weekday id (0-6)
  fromTime: string;
  toWeekday: string; // 'everyday' or weekday id (0-6)
  toTime: string;
}

const SHOW_IN_OPTIONS = [
  { value: 'all', text: 'All visualizations' },
  { value: 'selected', text: 'Selected visualizations' },
  { value: 'except', text: 'All visualizations except' },
];

const QUERY_TYPE_OPTIONS = [{ value: 'time-regions', text: 'Time regions' }];

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
}) => {
  const [annotations, setAnnotations] = useState<DashboardAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
  });

  const accordionId = 'annotationForm';
  const [visualizationTitles, setVisualizationTitles] = useState<Record<string, string>>({});

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

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === 'fromWeekday' && value === 'everyday') {
        newData.toWeekday = 'everyday';
      } else if (field === 'fromWeekday' && value !== 'everyday' && prev.toWeekday === 'everyday') {
        newData.toWeekday = value;
      }

      return newData;
    });
  };

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
      query: {
        queryType: formData.queryType,
        fromType: formData.fromWeekday === 'everyday' ? 'everyday' : 'weekdays',
        fromWeekdays: formData.fromWeekday === 'everyday' ? [] : [formData.fromWeekday],
        fromTime: formData.fromTime,
        toType: formData.toWeekday === 'everyday' ? 'everyday' : 'weekdays',
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
          : annotation.query.fromWeekdays[0] || 'everyday',
      fromTime: annotation.query.fromTime,
      toWeekday:
        annotation.query.toType === 'everyday'
          ? 'everyday'
          : annotation.query.toWeekdays[0] || 'everyday',
      toTime: annotation.query.toTime,
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

  const handleSaveAll = async () => {
    if (!dashboardId || !annotationsService) {
      return;
    }

    setLoading(true);
    try {
      await annotationsService.saveAnnotations(dashboardId, annotations);

      // Use setTimeout to ensure onSave callback doesn't block the modal close
      setTimeout(() => {
        onSave(annotations);
      }, 100);

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
      field: 'queryType',
      name: 'Type',
      width: '120px',
      render: () => 'Time regions',
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

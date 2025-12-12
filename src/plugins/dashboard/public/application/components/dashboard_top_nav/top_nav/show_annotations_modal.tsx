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

import React from 'react';
import { HttpStart, OverlayRef } from '../../../../../../../core/public';
import { toMountPoint } from '../../../../../../opensearch_dashboards_react/public';
import { AnnotationsModal } from './annotations_modal';
import { DashboardAnnotation } from '../../../types/dashboard_annotations';
import { DashboardAnnotationsService } from '../../../services/dashboard_annotations_service';
import { DataPublicPluginStart } from '../../../../../../data/public';

let currentModal: OverlayRef | null = null;

export function showAnnotationsModal(
  overlays: any,
  dashboardId: string,
  annotationsService: DashboardAnnotationsService,
  dashboardPanels: any[],
  savedObjects: any,
  http: HttpStart,
  data: DataPublicPluginStart,
  onSave?: (annotations: DashboardAnnotation[]) => void
) {
  if (currentModal) {
    currentModal.close();
  }

  const closeModal = () => {
    if (currentModal) {
      currentModal.close();
      currentModal = null;
    }
  };

  const handleSave = (annotations: DashboardAnnotation[]) => {
    if (onSave) {
      onSave(annotations);
    }
  };

  currentModal = overlays.openModal(
    toMountPoint(
      <AnnotationsModal
        onClose={closeModal}
        onSave={handleSave}
        dashboardId={dashboardId}
        annotationsService={annotationsService}
        dashboardPanels={dashboardPanels}
        savedObjects={savedObjects}
        http={http}
        data={data}
      />
    ),
    {
      'data-test-subj': 'dashboardAnnotationsModal',
    }
  );
}

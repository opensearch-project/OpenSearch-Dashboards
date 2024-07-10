/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { FieldSelector } from './field_selector';

import './index.scss';
import { ConfigPanel, ConfigPanelProps } from './config_panel';
import { DropboxDisplay } from './dropbox';
import { Schemas } from '../../../../../vis_default_editor/public';
import { VisualizationType } from '../../../services/type_service/visualization_type';

export const DATA_TAB_ID = 'data_tab';

export interface SchemaDisplayStates {
  [key: string]: DropboxDisplay[];
}

export interface DataTabProps extends ConfigPanelProps {
  vizType: VisualizationType;
}

export const DataTab = ({
  vizType,
  editingState,
  schemas,
  aggProps,
  activeSchemaFields,
  setActiveSchemaFields,
  isDragging,
}: DataTabProps) => {
  useEffect(() => {
    const newState = schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
    const updatedState = { ...newState, ...activeSchemaFields };
    setActiveSchemaFields(updatedState);
    // This useEffect hook should run whenever the upstream params corresponding to schemas and vizType changes hence disabling the eslint which asks to include activeSchemaFields as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas, vizType]);

  return (
    <div className="vbDataTab">
      <FieldSelector />
      <ConfigPanel
        schemas={schemas}
        editingState={editingState}
        aggProps={aggProps}
        activeSchemaFields={activeSchemaFields}
        setActiveSchemaFields={setActiveSchemaFields}
        isDragging={isDragging}
      />
    </div>
  );
};

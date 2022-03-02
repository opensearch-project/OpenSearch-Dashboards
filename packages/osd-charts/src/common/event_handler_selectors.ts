/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { LayerValue, SettingsSpec, Spec } from '../specs';
import { PointerStates } from '../state/chart_state';
import { isClicking } from '../state/utils';
import { SeriesIdentifier } from './series_id';

/** @internal */
export const getOnElementClickSelector = (prev: { click: PointerStates['lastClick'] }) => (
  spec: Spec | null,
  lastClick: PointerStates['lastClick'],
  settings: SettingsSpec,
  pickedShapes: LayerValue[][],
): void => {
  if (!spec) {
    return;
  }
  if (!settings.onElementClick) {
    return;
  }
  const nextPickedShapesLength = pickedShapes.length;
  if (nextPickedShapesLength > 0 && isClicking(prev.click, lastClick) && settings && settings.onElementClick) {
    const elements = pickedShapes.map<[Array<LayerValue>, SeriesIdentifier]>((values) => [
      values,
      {
        specId: spec.id,
        key: `spec{${spec.id}}`,
      },
    ]);
    settings.onElementClick(elements);
  }
  prev.click = lastClick;
};

/** @internal */
export const getOnElementOutSelector = (prev: { pickedShapes: number | null }) => (
  spec: Spec | null,
  pickedShapes: LayerValue[][],
  settings: SettingsSpec,
): void => {
  if (!spec) {
    return;
  }
  if (!settings.onElementOut) {
    return;
  }
  const nextPickedShapes = pickedShapes.length;

  if (prev.pickedShapes !== null && prev.pickedShapes > 0 && nextPickedShapes === 0) {
    settings.onElementOut();
  }
  prev.pickedShapes = nextPickedShapes;
};

function isOverElement(prevPickedShapes: Array<Array<LayerValue>> = [], nextPickedShapes: Array<Array<LayerValue>>) {
  if (nextPickedShapes.length === 0) {
    return;
  }
  if (nextPickedShapes.length !== prevPickedShapes.length) {
    return true;
  }
  return !nextPickedShapes.every((nextPickedShapeValues, index) => {
    const prevPickedShapeValues = prevPickedShapes[index];
    if (prevPickedShapeValues === null) {
      return false;
    }
    if (prevPickedShapeValues.length !== nextPickedShapeValues.length) {
      return false;
    }
    return nextPickedShapeValues.every((layerValue, i) => {
      const prevPickedValue = prevPickedShapeValues[i];
      if (!prevPickedValue) {
        return false;
      }
      return layerValue.value === prevPickedValue.value && layerValue.groupByRollup === prevPickedValue.groupByRollup;
    });
  });
}

/** @internal */
export const getOnElementOverSelector = (prev: { pickedShapes: LayerValue[][] }) => (
  spec: Spec | null,
  nextPickedShapes: LayerValue[][],
  settings: SettingsSpec,
): void => {
  if (!spec) {
    return;
  }
  if (!settings.onElementOver) {
    return;
  }

  if (isOverElement(prev.pickedShapes, nextPickedShapes)) {
    const elements = nextPickedShapes.map<[Array<LayerValue>, SeriesIdentifier]>((values) => [
      values,
      {
        specId: spec.id,
        key: `spec{${spec.id}}`,
      },
    ]);
    settings.onElementOver(elements);
  }
  prev.pickedShapes = nextPickedShapes;
};

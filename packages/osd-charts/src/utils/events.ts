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

import { Scale } from '../scales';
import { BrushEndListener, isPointerOverEvent, PointerEvent, PointerOverEvent, HeatmapSpec } from '../specs';
import { DragState } from '../state/chart_state';

/** @internal */
export function isValidPointerOverEvent(
  mainScale: Scale,
  event: PointerEvent | null | undefined,
): event is PointerOverEvent {
  return isPointerOverEvent(event) && (event.unit === undefined || event.unit === mainScale.unit);
}

/** @internal */
export interface DragCheckProps {
  onBrushEnd: BrushEndListener | HeatmapSpec['config']['onBrushEnd'] | undefined;
  lastDrag: DragState | null;
}

/** @internal */
export function hasDragged(prevProps: DragCheckProps | null, nextProps: DragCheckProps | null) {
  if (nextProps === null) {
    return false;
  }
  if (!nextProps.onBrushEnd) {
    return false;
  }
  const prevLastDrag = prevProps !== null ? prevProps.lastDrag : null;
  const nextLastDrag = nextProps !== null ? nextProps.lastDrag : null;

  if (prevLastDrag === null && nextLastDrag !== null) {
    return true;
  }
  if (prevLastDrag !== null && nextLastDrag !== null && prevLastDrag.end.time !== nextLastDrag.end.time) {
    return true;
  }
  return false;
}

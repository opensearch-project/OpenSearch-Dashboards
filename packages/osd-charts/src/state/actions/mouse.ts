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
 * under the License. */

import { Point } from '../../utils/point';

/** @internal */
export const ON_POINTER_MOVE = 'ON_POINTER_MOVE';

/** @internal */
export const ON_MOUSE_DOWN = 'ON_MOUSE_DOWN';

/** @internal */
export const ON_MOUSE_UP = 'ON_MOUSE_UP';

interface MouseDownAction {
  type: typeof ON_MOUSE_DOWN;
  position: Point;
  time: number;
}
interface MouseUpAction {
  type: typeof ON_MOUSE_UP;
  position: Point;
  time: number;
}

interface PointerMoveAction {
  type: typeof ON_POINTER_MOVE;
  position: Point;
  time: number;
}

/**
 * Action called on mouse button down event
 * @param position the x and y position (native event offsetX, offsetY)
 * @param time the timestamp of the event (native event timeStamp)
 * @internal
 */
export function onMouseDown(position: Point, time: number): MouseDownAction {
  return { type: ON_MOUSE_DOWN, position, time };
}

/**
 * Action called on mouse button up event
 * @param position the x and y position (native event offsetX, offsetY)
 * @param time the timestamp of the event (native event timeStamp)
 * @internal
 */
export function onMouseUp(position: Point, time: number): MouseUpAction {
  return { type: ON_MOUSE_UP, position, time };
}

/**
 * Action called with the mouse coordinates relatives to the chart container (exclude the legend)
 * @param position the x and y position (native event offsetX, offsetY)
 * @param time the timestamp of the event (native event timeStamp)
 * @internal
 */
export function onPointerMove(position: Point, time: number): PointerMoveAction {
  return { type: ON_POINTER_MOVE, position, time };
}

/** @internal */
export type MouseActions = MouseDownAction | MouseUpAction | PointerMoveAction;

import { Point } from '../../utils/point';

export const ON_POINTER_MOVE = 'ON_POINTER_MOVE';
export const ON_MOUSE_DOWN = 'ON_MOUSE_DOWN';
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
 */
export function onMouseDown(position: Point, time: number): MouseDownAction {
  return { type: ON_MOUSE_DOWN, position, time };
}

/**
 * Action called on mouse button up event
 * @param position the x and y position (native event offsetX, offsetY)
 * @param time the timestamp of the event (native event timeStamp)
 */
export function onMouseUp(position: Point, time: number): MouseUpAction {
  return { type: ON_MOUSE_UP, position, time };
}

/**
 * Action called with the mouse coordinates relatives to the chart container (exclude the legend)
 * @param position the x and y position (native event offsetX, offsetY)
 * @param time the timestamp of the event (native event timeStamp)
 */
export function onPointerMove(position: Point, time: number): PointerMoveAction {
  return { type: ON_POINTER_MOVE, position, time };
}

export type MouseActions = MouseDownAction | MouseUpAction | PointerMoveAction;

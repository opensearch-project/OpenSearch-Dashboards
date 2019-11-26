import { CursorEvent } from '../specs';
import { Scale } from './scales/scales';

export function isValidExternalPointerEvent(event: CursorEvent, mainScale: Scale): boolean {
  return event.unit === undefined || event.unit === mainScale.unit;
}

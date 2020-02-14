import { PointerEvent, isPointerOverEvent, PointerOverEvent } from '../specs';
import { Scale } from '../scales';

export function isValidPointerOverEvent(
  mainScale: Scale,
  event: PointerEvent | null | undefined,
): event is PointerOverEvent {
  return isPointerOverEvent(event) && (event.unit === undefined || event.unit === mainScale.unit);
}

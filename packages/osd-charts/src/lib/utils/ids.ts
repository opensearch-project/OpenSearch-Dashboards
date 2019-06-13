/* eslint @typescript-eslint/no-empty-interface: off */
import { iso, Newtype } from 'newtype-ts';

export interface GroupId extends Newtype<{ readonly GroupId: unique symbol }, string> {}
export interface AxisId extends Newtype<{ readonly AxisId: unique symbol }, string> {}
export interface SpecId extends Newtype<{ readonly SpecId: unique symbol }, string> {}
export interface AnnotationId extends Newtype<{ readonly AnnotationId: unique symbol }, string> {}

const groupIdIso = iso<GroupId>();
const axisIdIso = iso<AxisId>();
const specIdIso = iso<SpecId>();
const annotationIdIso = iso<AnnotationId>();

export function getGroupId(id: string): GroupId {
  return groupIdIso.wrap(id);
}
export function getAxisId(id: string): AxisId {
  return axisIdIso.wrap(id);
}
export function getSpecId(id: string): SpecId {
  return specIdIso.wrap(id);
}
export function getAnnotationId(id: string): AnnotationId {
  return annotationIdIso.wrap(id);
}

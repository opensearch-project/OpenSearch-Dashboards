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

import { TAU } from '../../../../common/constants';
import {
  Circline,
  CirclineArc,
  CirclinePredicate,
  Coordinate,
  Distance,
  PointObject,
  Radian,
  Radius,
  RingSectorConstruction,
  trueBearingToStandardPositionAngle,
} from '../../../../common/geometry';
import { Config } from '../types/config_types';
import { AngleFromTo, LayerFromTo, ShapeTreeNode } from '../types/viewmodel_types';

function euclideanDistance({ x: x1, y: y1 }: PointObject, { x: x2, y: y2 }: PointObject): Distance {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function fullyContained(c1: Circline, c2: Circline): boolean {
  return euclideanDistance(c1, c2) + c2.r <= c1.r;
}

function noOverlap(c1: Circline, c2: Circline): boolean {
  return euclideanDistance(c1, c2) >= c1.r + c2.r;
}

function circlineIntersect(c1: Circline, c2: Circline): PointObject[] {
  const d = Math.sqrt((c1.x - c2.x) * (c1.x - c2.x) + (c1.y - c2.y) * (c1.y - c2.y));
  if (c1.r + c2.r >= d && d >= Math.abs(c1.r - c2.r)) {
    const a1 = d + c1.r + c2.r;
    const a2 = d + c1.r - c2.r;
    const a3 = d - c1.r + c2.r;
    const a4 = -d + c1.r + c2.r;
    const area = Math.sqrt(a1 * a2 * a3 * a4) / 4;

    const xAux1 = (c1.x + c2.x) / 2 + ((c2.x - c1.x) * (c1.r * c1.r - c2.r * c2.r)) / (2 * d * d);
    const xAux2 = (2 * (c1.y - c2.y) * area) / (d * d);
    const x1 = xAux1 + xAux2;
    const x2 = xAux1 - xAux2;

    const yAux1 = (c1.y + c2.y) / 2 + ((c2.y - c1.y) * (c1.r * c1.r - c2.r * c2.r)) / (2 * d * d);
    const yAux2 = (2 * (c1.x - c2.x) * area) / (d * d);
    const y1 = yAux1 - yAux2;
    const y2 = yAux1 + yAux2;

    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }
  return [];
}

function circlineValidSectors(refC: CirclinePredicate, c: CirclineArc): CirclineArc[] {
  const { inside } = refC;
  const { x, y, r, from, to } = c;
  const fullContainment = fullyContained(refC, c);
  const fullyOutside = noOverlap(refC, c) || fullyContained(c, refC);

  // handle clear cases

  // nothing kept:
  if ((inside && fullContainment) || (!inside && fullyOutside)) {
    return [];
  }

  // the entire sector is kept
  if ((inside && fullyOutside) || (!inside && fullContainment)) {
    return [c];
  }

  // now we know there's intersection and we're supposed to get back two distinct points
  const circlineIntersections = circlineIntersect(refC, c);
  // These conditions don't happen; kept for documentation purposes:
  // if (circlineIntersections.length !== 2) throw new Error('Problem in intersection calculation.')
  // if (from > to) throw new Error('From/to problem in intersection calculation.')
  if (circlineIntersections.length !== 2) return [];
  const [p1, p2] = circlineIntersections;
  const aPre1 = Math.atan2(p1.y - c.y, p1.x - c.x);
  const aPre2 = Math.atan2(p2.y - c.y, p2.x - c.x);
  const a1p = Math.max(from, Math.min(to, aPre1 < 0 ? aPre1 + TAU : aPre1));
  const a2p = Math.max(from, Math.min(to, aPre2 < 0 ? aPre2 + TAU : aPre2));
  const a1 = Math.min(a1p, a2p);
  const a2 = a1p === a2p ? TAU : Math.max(a1p, a2p); // make a2 drop out in next step

  // imperative, slightly optimized buildup of `breakpoints` as it's in the hot loop:
  const breakpoints = [from];
  if (from < a1 && a1 < to) breakpoints.push(a1);
  if (from < a2 && a2 < to) breakpoints.push(a2);
  breakpoints.push(to);

  const predicate = inside ? noOverlap : fullyContained;

  // imperative, slightly optimized buildup of `result` as it's in the hot loop:
  const result = [];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    // eslint-disable-next-line no-shadow
    const from = breakpoints[i];
    // eslint-disable-next-line no-shadow
    const to = breakpoints[i + 1];
    const midAngle = (from + to) / 2; // no winding clip ie. `meanAngle()` would be wrong here
    const xx = x + r * Math.cos(midAngle);
    const yy = y + r * Math.sin(midAngle);
    if (predicate(refC, { x: xx, y: yy, r: 0 })) result.push({ x, y, r, from, to });
  }
  return result;
}

/** @internal */
export function conjunctiveConstraint(constraints: RingSectorConstruction, c: CirclineArc): CirclineArc[] {
  // imperative, slightly optimized buildup of `valids` as it's in the hot loop:
  let valids = [c];
  for (let i = 0; i < constraints.length; i++) {
    const refC = constraints[i]; // reference circle
    const nextValids: CirclineArc[] = [];
    for (let j = 0; j < valids.length; j++) {
      const cc = valids[j];
      const currentValids = circlineValidSectors(refC, cc);
      nextValids.push(...currentValids);
    }
    valids = nextValids;
  }
  return valids;
}

/** @internal */
export const INFINITY_RADIUS = 1e4; // far enough for a sub-2px precision on a 4k screen, good enough for text bounds; 64 bit floats still work well with it

/** @internal */
export function angleToCircline(
  midRadius: Radius,
  alpha: Radian,
  direction: 1 | -1 /* 1 for clockwise and -1 for anticlockwise circline */,
) {
  const sectorRadiusLineX = Math.cos(alpha) * midRadius;
  const sectorRadiusLineY = Math.sin(alpha) * midRadius;
  const normalAngle = alpha + (direction * Math.PI) / 2;
  const x = sectorRadiusLineX + INFINITY_RADIUS * Math.cos(normalAngle);
  const y = sectorRadiusLineY + INFINITY_RADIUS * Math.sin(normalAngle);
  return { x, y, r: INFINITY_RADIUS, inside: false, from: 0, to: TAU };
}

function ringSectorStartAngle(d: AngleFromTo): Radian {
  return trueBearingToStandardPositionAngle(d.x0 + Math.max(0, d.x1 - d.x0 - TAU / 2) / 2);
}

function ringSectorEndAngle(d: AngleFromTo): Radian {
  return trueBearingToStandardPositionAngle(d.x1 - Math.max(0, d.x1 - d.x0 - TAU / 2) / 2);
}

function ringSectorInnerRadius(innerRadius: Radian, ringThickness: Distance) {
  return (d: LayerFromTo): Radius => innerRadius + d.y0 * ringThickness;
}

function ringSectorOuterRadius(innerRadius: Radian, ringThickness: Distance) {
  return (d: LayerFromTo): Radius => innerRadius + (d.y0 + 1) * ringThickness;
}

/** @internal */
export function ringSectorConstruction(config: Config, innerRadius: Radius, ringThickness: Distance) {
  return (ringSector: ShapeTreeNode): RingSectorConstruction => {
    const {
      circlePadding,
      radialPadding,
      fillOutside,
      radiusOutside,
      fillRectangleWidth,
      fillRectangleHeight,
    } = config;
    const radiusGetter = fillOutside ? ringSectorOuterRadius : ringSectorInnerRadius;
    const geometricInnerRadius = radiusGetter(innerRadius, ringThickness)(ringSector);
    const innerR = geometricInnerRadius + circlePadding * 2;
    const outerR = Math.max(
      innerR,
      ringSectorOuterRadius(innerRadius, ringThickness)(ringSector) - circlePadding + (fillOutside ? radiusOutside : 0),
    );
    const startAngle = ringSectorStartAngle(ringSector);
    const endAngle = ringSectorEndAngle(ringSector);
    const innerCircline = { x: 0, y: 0, r: innerR, inside: true, from: 0, to: TAU };
    const outerCircline = { x: 0, y: 0, r: outerR, inside: false, from: 0, to: TAU };
    const midRadius = (innerR + outerR) / 2;
    const sectorStartCircle = angleToCircline(midRadius, startAngle - radialPadding, -1);
    const sectorEndCircle = angleToCircline(midRadius, endAngle + radialPadding, 1);
    const outerRadiusFromRectangleWidth = fillRectangleWidth / 2;
    const outerRadiusFromRectanglHeight = fillRectangleHeight / 2;
    const fullCircle = ringSector.x0 === 0 && ringSector.x1 === TAU && geometricInnerRadius === 0;
    const sectorCirclines = [
      ...(fullCircle && innerRadius === 0 ? [] : [innerCircline]),
      outerCircline,
      ...(fullCircle ? [] : [sectorStartCircle, sectorEndCircle]),
    ];
    const rectangleCirclines =
      outerRadiusFromRectangleWidth === Infinity && outerRadiusFromRectanglHeight === Infinity
        ? []
        : [
            { x: INFINITY_RADIUS - outerRadiusFromRectangleWidth, y: 0, r: INFINITY_RADIUS, inside: true },
            { x: -INFINITY_RADIUS + outerRadiusFromRectangleWidth, y: 0, r: INFINITY_RADIUS, inside: true },
            { x: 0, y: INFINITY_RADIUS - outerRadiusFromRectanglHeight, r: INFINITY_RADIUS, inside: true },
            { x: 0, y: -INFINITY_RADIUS + outerRadiusFromRectanglHeight, r: INFINITY_RADIUS, inside: true },
          ];
    return [...sectorCirclines, ...rectangleCirclines];
  };
}
/** @internal */
export function makeRowCircline(
  cx: Coordinate,
  cy: Coordinate,
  radialOffset: Distance,
  rotation: Radian,
  fontSize: number,
  offsetSign: -1 | 0 | 1,
) {
  const r = INFINITY_RADIUS;
  const offset = (offsetSign * fontSize) / 2;
  const topRadius = r - offset;
  const x = cx + topRadius * Math.cos(-rotation + TAU / 4);
  const y = cy + topRadius * Math.cos(-rotation + TAU / 2);
  return { r: r + radialOffset, x, y };
}

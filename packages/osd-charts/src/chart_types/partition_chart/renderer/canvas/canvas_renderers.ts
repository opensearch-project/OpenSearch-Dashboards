import { Coordinate, Pixels } from '../../layout/types/geometry_types';
import { addOpacity } from '../../layout/utils/calcs';
import {
  LinkLabelVM,
  OutsideLinksViewModel,
  QuadViewModel,
  RowSet,
  ShapeViewModel,
  TextRow,
} from '../../layout/types/viewmodel_types';
import { TAU } from '../../layout/utils/math';
import { PartitionLayout } from '../../layout/types/config_types';
import { cssFontShorthand } from '../../layout/utils/measure';

// the burnout avoidance in the center of the pie
const LINE_WIDTH_MULT = 10; // border can be a maximum 1/LINE_WIDTH_MULT - th of the sector angle, otherwise the border would dominate
const TAPER_OFF_LIMIT = 50; // taper off within a radius of TAPER_OFF_LIMIT to avoid burnout in the middle of the pie when there are hundreds of pies

// withContext abstracts out the otherwise error-prone save/restore pairing; it can be nested and/or put into sequence
// The idea is that you just set what's needed for the enclosed snippet, which may temporarily override values in the
// outer withContext. Example: we use a +y = top convention, so when doing text rendering, y has to be flipped (ctx.scale)
// otherwise the text will render upside down.
function withContext(ctx: CanvasRenderingContext2D, fun: (ctx: CanvasRenderingContext2D) => void) {
  ctx.save();
  fun(ctx);
  ctx.restore();
}

function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: Coordinate,
  height: Coordinate /*, backgroundColor: string*/,
) {
  withContext(ctx, (ctx) => {
    // two steps, as the backgroundColor may have a non-one opacity
    // todo we should avoid `fillRect` by setting the <canvas> element background via CSS
    ctx.clearRect(-width, -height, 2 * width, 2 * height); // remove past contents
    // ctx.fillStyle = backgroundColor;
    // ctx.fillRect(-width, -height, 2 * width, 2 * height); // new background
  });
}

function renderTextRow(ctx: CanvasRenderingContext2D, { fontSize, fillTextColor, rotation }: RowSet) {
  return (currentRow: TextRow) => {
    const crx = currentRow.rowCentroidX - (Math.cos(rotation) * currentRow.length) / 2;
    const cry = -currentRow.rowCentroidY + (Math.sin(rotation) * currentRow.length) / 2;
    withContext(ctx, (ctx) => {
      ctx.scale(1, -1);
      ctx.translate(crx, cry);
      ctx.rotate(-rotation);
      ctx.fillStyle = fillTextColor;
      currentRow.rowWords.forEach((box) => {
        ctx.font = cssFontShorthand(box, fontSize);
        ctx.fillText(box.text, box.width / 2 + box.wordBeginning, 0);
      });
    });
  };
}

function renderTextRows(ctx: CanvasRenderingContext2D, rowSet: RowSet) {
  rowSet.rows.forEach(renderTextRow(ctx, rowSet));
}

function renderRowSets(ctx: CanvasRenderingContext2D, rowSets: RowSet[]) {
  rowSets.forEach((rowSet: RowSet) => renderTextRows(ctx, rowSet));
}

function renderTaperedBorder(
  ctx: CanvasRenderingContext2D,
  { strokeWidth, fillColor, x0, x1, y0px, y1px }: QuadViewModel,
) {
  const X0 = x0 - TAU / 4;
  const X1 = x1 - TAU / 4;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  // only draw circular arcs if it would be distinguishable from a straight line ie. angle is not very small
  ctx.arc(0, 0, y0px, X0, X0);
  ctx.arc(0, 0, y1px, X0, X1, false);
  ctx.arc(0, 0, y0px, X1, X0, true);
  ctx.fill();
  if (strokeWidth > 0.001 && !(x0 === 0 && x1 === TAU)) {
    // canvas2d uses a default of 1 if the lineWidth is assigned 0, so we use a small value to test, to avoid it
    // ... and also don't draw a separator if we have a single sector that's the full ring (eg. single-fact-row pie)
    // outer arc
    ctx.lineWidth = strokeWidth;
    const tapered = x1 - x0 < (15 * TAU) / 360; // burnout seems visible, and tapering invisible, with less than 15deg
    if (tapered) {
      ctx.beginPath();
      ctx.arc(0, 0, y1px, X0, X1, false);
      ctx.stroke();

      // inner arc
      ctx.beginPath();
      ctx.arc(0, 0, y0px, X1, X0, true);
      ctx.stroke();

      ctx.fillStyle = 'white';

      // each side (radial 'line') is modeled as a pentagon (some lines can be short arcs though)
      ctx.beginPath();
      const yThreshold = Math.max(TAPER_OFF_LIMIT, (LINE_WIDTH_MULT * strokeWidth) / (X1 - X0));
      const beta = strokeWidth / yThreshold; // angle where strokeWidth equals the lineWidthMult limit at a radius of yThreshold
      ctx.arc(0, 0, y0px, X0, X0 + beta * (yThreshold / y0px));
      ctx.arc(0, 0, yThreshold, X0 + beta, X0 + beta);
      ctx.arc(0, 0, y1px, X0 + beta * (yThreshold / y1px), X0, true);
      ctx.arc(0, 0, y0px, X0, X0);
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }
}

function renderSectors(ctx: CanvasRenderingContext2D, quadViewModel: QuadViewModel[]) {
  withContext(ctx, (ctx) => {
    ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
    quadViewModel.forEach((quad: QuadViewModel) => {
      if (quad.x0 === quad.x1) return; // no slice will be drawn, and it avoids some division by zero as well
      renderTaperedBorder(ctx, quad);
    });
  });
}

function renderRectangles(ctx: CanvasRenderingContext2D, quadViewModel: QuadViewModel[]) {
  withContext(ctx, (ctx) => {
    ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
    quadViewModel.forEach(({ strokeWidth, fillColor, x0, x1, y0px, y1px }) => {
      // only draw a shape if it would show up at all
      if (x1 - x0 >= 1 && y1px - y0px >= 1) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x0, y0px);
        ctx.lineTo(x0, y1px);
        ctx.lineTo(x1, y1px);
        ctx.lineTo(x1, y0px);
        ctx.lineTo(x0, y0px);
        ctx.fill();
        if (strokeWidth > 0.001) {
          // Canvas2d stroke ignores an exact zero line width
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    });
  });
}

// order of rendering is important; determined by the order of layers in the array
function renderLayers(ctx: CanvasRenderingContext2D, layers: Array<(ctx: CanvasRenderingContext2D) => void>) {
  layers.forEach((renderLayer) => renderLayer(ctx));
}

function renderFillOutsideLinks(
  ctx: CanvasRenderingContext2D,
  outsideLinksViewModel: OutsideLinksViewModel[],
  linkLabelTextColor: string,
  linkLabelLineWidth: Pixels,
) {
  withContext(ctx, (ctx) => {
    ctx.lineWidth = linkLabelLineWidth;
    ctx.strokeStyle = linkLabelTextColor;
    outsideLinksViewModel.forEach(({ points }) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    });
  });
}

function renderLinkLabels(
  ctx: CanvasRenderingContext2D,
  linkLabelFontSize: Pixels,
  linkLabelLineWidth: Pixels,
  fontFamily: string,
  linkLabelTextColor: string,
  viewModels: LinkLabelVM[],
) {
  withContext(ctx, (ctx) => {
    ctx.lineWidth = linkLabelLineWidth;
    ctx.strokeStyle = linkLabelTextColor;
    ctx.fillStyle = linkLabelTextColor;
    ctx.font = `${400} ${linkLabelFontSize}px ${fontFamily}`;
    viewModels.forEach(({ link, translate, textAlign, text, valueText }: LinkLabelVM) => {
      ctx.beginPath();
      ctx.moveTo(...link[0]);
      link.slice(1).forEach((point) => ctx.lineTo(...point));
      ctx.stroke();
      withContext(ctx, (ctx) => {
        ctx.translate(...translate);
        ctx.scale(1, -1); // flip for text rendering not to be upside down
        ctx.textAlign = textAlign;
        // only use a colon if both text and valueText are non-zero length strings
        ctx.fillText(text + (text && valueText ? ': ' : '') + valueText, 0, 0);
      });
    });
  });
}

export function renderPartitionCanvas2d(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  { config, quadViewModel, rowSets, outsideLinksViewModel, linkLabelViewModels, diskCenter }: ShapeViewModel,
) {
  const { sectorLineWidth, linkLabel, fontFamily /*, backgroundColor*/ } = config;

  const linkLabelTextColor = addOpacity(linkLabel.textColor, linkLabel.textOpacity);

  withContext(ctx, (ctx) => {
    // set some defaults for the overall rendering

    // let's set the devicePixelRatio once and for all; then we'll never worry about it again
    ctx.scale(dpr, dpr);

    // all texts are currently center-aligned because
    //     - the calculations manually compute and lay out text (word) boxes, so we can choose whatever
    //     - but center/middle has mathematical simplicity and the most unassuming thing
    //     - due to using the math x/y convention (+y is up) while Canvas uses screen convention (+y is down)
    //         text rendering must be y-flipped, which is a bit easier this way
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(diskCenter.x, diskCenter.y);
    // this applies the mathematical x/y conversion (+y is North) which is easier when developing geometry
    // functions - also, all renderers have flexibility (eg. SVG scale) and WebGL NDC is also +y up
    // - in any case, it's possible to refactor for a -y = North convention if that's deemed preferable
    ctx.scale(1, -1);

    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'white'; // todo make it configurable just like sectorLineWidth
    ctx.lineWidth = sectorLineWidth;

    // painter's algorithm, like that of SVG: the sequence determines what overdraws what; first element of the array is drawn first
    // (of course, with SVG, it's for ambiguous situations only, eg. when 3D transforms with different Z values aren't used, but
    // unlike SVG and esp. WebGL, Canvas2d doesn't support the 3rd dimension well, see ctx.transform / ctx.setTransform).
    // The layers are callbacks, because of the need to not bake in the `ctx`, it feels more composable and uncoupled this way.
    renderLayers(ctx, [
      // clear the canvas
      (ctx: CanvasRenderingContext2D) => clearCanvas(ctx, 200000, 200000 /*, backgroundColor*/),

      // bottom layer: sectors (pie slices, ring sectors etc.)
      (ctx: CanvasRenderingContext2D) =>
        config.partitionLayout === PartitionLayout.treemap
          ? renderRectangles(ctx, quadViewModel)
          : renderSectors(ctx, quadViewModel),

      // all the fill-based, potentially multirow text, whether inside or outside the sector
      (ctx: CanvasRenderingContext2D) => renderRowSets(ctx, rowSets),

      // the link lines for the outside-fill text
      (ctx: CanvasRenderingContext2D) =>
        renderFillOutsideLinks(ctx, outsideLinksViewModel, linkLabelTextColor, linkLabel.lineWidth),

      // all the text and link lines for single-row outside texts
      (ctx: CanvasRenderingContext2D) =>
        renderLinkLabels(
          ctx,
          linkLabel.fontSize,
          linkLabel.lineWidth,
          fontFamily,
          linkLabelTextColor,
          linkLabelViewModels,
        ),
    ]);
  });
}

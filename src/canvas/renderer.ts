import type { DrawOp, Renderer } from "../core/renderer";

// Reference Canvas2D renderer. Ships with the OSS build. TeachBoard provides
// its own Renderer (drawing through its canvas pipeline) against the same
// interface — this file is intentionally the only place that touches a 2D
// context, so the engine stays portable.

export interface CanvasRendererOpts {
  background?: string;
  /** Place scene origin (0,0) at the canvas centre (Manim-style). */
  centerOrigin?: boolean;
}

export class CanvasRenderer implements Renderer {
  private ctx: CanvasRenderingContext2D;
  private bg: string;
  private center: boolean;

  constructor(ctx: CanvasRenderingContext2D, opts: CanvasRendererOpts = {}) {
    this.ctx = ctx;
    this.bg = opts.background ?? "#FBFAF6";
    this.center = opts.centerOrigin ?? true;
  }

  clear(width: number, height: number): void {
    const { ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.bg === "transparent" || this.bg === "none") {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = this.bg;
      ctx.fillRect(0, 0, width, height);
    }
    if (this.center) ctx.translate(width / 2, height / 2);
  }

  draw(op: DrawOp): void {
    if (op.kind === "poly") this.drawPoly(op);
    else this.drawText(op);
  }

  private drawPoly(op: Extract<DrawOp, { kind: "poly" }>): void {
    const { ctx } = this;
    if (op.points.length < 2 || op.opacity <= 0) return;

    const path = new Path2D();
    path.moveTo(op.points[0].x, op.points[0].y);
    for (let i = 1; i < op.points.length; i++)
      path.lineTo(op.points[i].x, op.points[i].y);
    if (op.closed) path.closePath();

    ctx.save();
    ctx.globalAlpha = op.opacity;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // fill fades in with the draw-on so it doesn't pop before the outline.
    if (op.fill && op.draw > 0) {
      ctx.globalAlpha = op.opacity * op.draw * op.draw;
      ctx.fillStyle = op.fill;
      ctx.fill(path);
      ctx.globalAlpha = op.opacity;
    }

    ctx.strokeStyle = op.stroke;
    ctx.lineWidth = op.strokeWidth;
    if (op.draw < 1) {
      const len = polyLength(op.points, op.closed);
      ctx.setLineDash([len, len]);
      ctx.lineDashOffset = len * (1 - op.draw);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke(path);
    ctx.restore();
  }

  private drawText(op: Extract<DrawOp, { kind: "text" }>): void {
    const { ctx } = this;
    if (op.opacity <= 0) return;
    const shown =
      op.reveal >= 1 ? op.text : op.text.slice(0, Math.ceil(op.text.length * op.reveal));
    ctx.save();
    ctx.globalAlpha = op.opacity;
    ctx.fillStyle = op.color;
    ctx.font = `${op.size}px ${op.font}`;
    ctx.textAlign = op.align;
    ctx.textBaseline = "middle";
    ctx.fillText(shown, op.x, op.y);
    ctx.restore();
  }
}

function polyLength(pts: { x: number; y: number }[], closed: boolean): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  if (closed && pts.length > 1)
    len += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  return len;
}

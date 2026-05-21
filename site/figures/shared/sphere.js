// Sphere-drawing primitives, lifted from svg-gen/build.js into a reusable
// module. Every figure that draws on the sphere uses these to share viewpoint,
// sample point, and style across pages.

import svgGen from '@mlitwin/svg-gen';
import { Matrix } from '@mlitwin/svg-gen/matrix/matrix.js';

export const R = 250;

// Single fixed sample point shared across every figure (per the plan).
// theta_0 = 13 pi / 32 (polar from +Y), phi_0 = 29 pi / 32 (azimuth around Y).
// These match the values used in the svg-gen build for visual continuity.
const N_REF = 32;
export const SAMPLE_POINT = {
  thetaIndex: 13,   // theta = thetaIndex * pi / N_REF
  phiIndex: 29,     // phi   = phiIndex   * pi / N_REF
  N: N_REF,
};
export const SAMPLE_THETA = SAMPLE_POINT.thetaIndex * Math.PI / SAMPLE_POINT.N;
export const SAMPLE_PHI = SAMPLE_POINT.phiIndex * Math.PI / SAMPLE_POINT.N;

// Shared perspective: eye on the +Z axis, clipping plane slightly in front.
const Z = 2500;
const eye = { x: 0, y: 0, z: Z };
const clipCenter = { x: 0, y: 0, z: R * R / Z };
const clipNorm = Math.sqrt(
  (eye.x - clipCenter.x) ** 2 +
  (eye.y - clipCenter.y) ** 2 +
  (eye.z - clipCenter.z) ** 2
);
const clipNormal = {
  x: (eye.x - clipCenter.x) / clipNorm,
  y: (eye.y - clipCenter.y) / clipNorm,
  z: (eye.z - clipCenter.z) / clipNorm,
};
export const PERSPECTIVE = {
  eye,
  clip: {
    plane: {
      point: [clipCenter.x, clipCenter.y, clipCenter.z],
      normal: [clipNormal.x, clipNormal.y, clipNormal.z],
    },
  },
};

// Color palette (hard-coded per the plan; no CSS theming yet).
export const COLORS = {
  grid: '#333333',         // generic lat/long lines
  accent: '#1f8a3e',       // equator / prime meridian highlight
  longArrow: '#d6a700',    // basis vector along longitude (yellow)
  latArrow: '#1d63c4',     // basis vector along latitude (blue)
  meridian: '#c0392b',     // meridian-from-pole arc (red)
};

export function makeContext(opts = {}) {
  return {
    s: new svgGen({}),
    skew: opts.skew ?? 0,
  };
}

// Range helper inclusive on both ends.
function range(first, last) {
  const out = [];
  for (let i = first; i <= last; i++) out.push(i);
  return out;
}

// One circle of latitude at index i (out of n) from the south pole.
function latitudeCircle(context, i, n) {
  const l = i * Math.PI / n;
  const dy = Math.round(Math.sin(l) * R);
  const r = Math.abs(Math.cos(l) * R);
  const isEquator = i === 0;
  const transform = [
    { op: 'Translate', args: { vec: [0, dy, 0] } },
    { op: 'Rotate', args: { axes: 'X', angle: Math.PI / 2 } },
  ];
  return context.s.circle({
    cx: 0,
    cy: 0,
    r,
    fill: 'none',
    stroke: isEquator ? COLORS.accent : COLORS.grid,
    'stroke-width': isEquator ? 2 : 1,
  }).With({ perspective: { transform: Matrix.Identity(4).Transform(transform) } });
}

// One full great-circle "longitude" at index i (out of n) from the prime
// meridian, optionally rotated by `context.skew` around the Z axis so the
// poles of these circles do not coincide with the true poles.
function longitudeCircle(context, i, n) {
  const l = i * Math.PI / n;
  const isPrime = i === n;
  const transform = [
    { op: 'Rotate', args: { axes: 'Z', angle: context.skew } },
    { op: 'Rotate', args: { axes: 'Y', angle: l } },
  ];
  return context.s.circle({
    cx: 0,
    cy: 0,
    r: R,
    fill: 'none',
    stroke: isPrime ? COLORS.accent : COLORS.grid,
    'stroke-width': isPrime ? 2 : 1,
  }).With({ perspective: { transform: Matrix.Identity(4).Transform(transform) } });
}

// A short arc on the sphere along constant phi (a meridian segment from the
// north pole down to the sample point). Used as the "basis vector along
// theta" indicator.
function longitudeArc(context, phi, theta) {
  const x = Math.sin(theta) * R;
  const y = Math.cos(theta) * R;
  const d = `M 0 -${R} A ${R} ${R} 0 0 1 ${x} ${-y}`;
  const transform = [
    { op: 'Rotate', args: { axes: 'Y', angle: -(Math.PI / 2 - phi) } },
  ];
  return context.s.path({
    d,
    fill: 'none',
    stroke: COLORS.longArrow,
    'stroke-width': 3,
    'marker-end': 'url(#arrowhead-yellow)',
  }).With({ perspective: { transform: Matrix.Identity(4).Transform(transform) } });
}

// A short arc on the sphere along constant theta (a latitude segment),
// running from the prime meridian to the sample point.
function latitudeArc(context, phi, theta) {
  const dy = Math.cos(theta) * R;
  const r = Math.abs(Math.sin(theta) * R);
  const x = r * Math.sin(phi);
  const y = r * Math.cos(phi);
  const transform = [
    { op: 'Translate', args: { vec: [0, -dy, 0] } },
    { op: 'Rotate', args: { axes: 'X', angle: Math.PI / 2 } },
  ];
  const d = `M ${r} 0 A ${r} ${r} 0 0 1 ${x} ${-y}`;
  return context.s.path({
    d,
    fill: 'none',
    stroke: COLORS.latArrow,
    'stroke-width': 3,
    'marker-end': 'url(#arrowhead-blue)',
  }).With({ perspective: { transform: Matrix.Identity(4).Transform(transform) } });
}

function arrowheadMarker(s, id, color) {
  return s.marker({
    id,
    markerWidth: 12,
    markerHeight: 8,
    refX: 10,
    refY: 4,
    orient: 'auto',
    markerUnits: 'userSpaceOnUse',
  }, [
    s.polygon({ points: '0 0, 10 4, 0 8', fill: color }),
  ]);
}

// Build a sphere SVG with optional latitude/longitude grids and a sample
// point marked with its two coordinate-basis directions.
export function makeSphere({ skew = 0, showBasis = true, n = 32, title = '' } = {}) {
  const context = makeContext({ skew });
  const s = context.s;
  const N = n;
  const phi = SAMPLE_PHI;
  const theta = SAMPLE_THETA;

  const children = [
    s.defs({}, [
      arrowheadMarker(s, 'arrowhead-yellow', COLORS.longArrow),
      arrowheadMarker(s, 'arrowhead-blue', COLORS.latArrow),
    ]),
  ];
  if (title) children.push(s.title({}, title));
  children.push(
    ...range(0, N).map(i => longitudeCircle(context, i, N)),
    ...range(-N, N).map(i => latitudeCircle(context, i, N)),
  );
  if (showBasis) {
    children.push(longitudeArc(context, phi, theta));
    children.push(latitudeArc(context, phi, theta));
  }

  return s.svg({
    width: 360,
    height: 360,
    viewBox: '-300 -300 600 600',
  }, children).With({ perspective: PERSPECTIVE });
}

// Draw a labeled arrow inside a tangent-plane diagram. The label is placed
// beyond the arrow's tip, offset along the arrow's own direction so it never
// overlaps the arrowhead. Coordinates are in the diagram's user space.
function tangentArrow(s, origin, tip, label, opts = {}) {
  const color = opts.color ?? '#111111';
  const markerId = opts.markerId ?? 'arrowhead-black';
  const labelGap = opts.labelGap ?? 18;
  const dx = tip.x - origin.x;
  const dy = tip.y - origin.y;
  const len = Math.hypot(dx, dy) || 1;
  const lx = tip.x + (dx / len) * labelGap;
  const ly = tip.y + (dy / len) * labelGap;
  const lineOpts = {
    x1: origin.x, y1: origin.y, x2: tip.x, y2: tip.y,
    stroke: color, 'stroke-width': opts.strokeWidth ?? 3,
    'marker-end': `url(#${markerId})`,
  };
  if (opts.dashed) lineOpts['stroke-dasharray'] = '6 4';
  return [
    s.line(lineOpts),
    s.text({
      x: lx,
      y: ly,
      'font-size': '20',
      'font-family': 'serif',
      'font-style': 'italic',
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: color,
    }, label),
  ];
}

// Build a tangent-plane diagram with two arrows representing a basis pair.
// `angle` is the angle between them (radians). `lengths = [len1, len2]` sets
// the visual length of each arrow (in user units). Labels are drawn near the
// arrowheads.
export function makeTangentPlane({
  angle = Math.PI / 2,
  lengths = [1, 1],
  labels = ['e₁', 'e₂'],
  title = '',
} = {}) {
  const s = new svgGen({});
  const scale = 160;
  const origin = { x: 40, y: 220 };
  const tip1 = {
    x: origin.x + scale * lengths[0],
    y: origin.y,
  };
  const tip2 = {
    x: origin.x + scale * lengths[1] * Math.cos(angle),
    y: origin.y - scale * lengths[1] * Math.sin(angle),
  };
  const children = [
    s.defs({}, [
      arrowheadMarker(s, 'arrowhead-black', '#111111'),
    ]),
  ];
  if (title) children.push(s.title({}, title));
  children.push(...tangentArrow(s, origin, tip1, labels[0]));
  children.push(...tangentArrow(s, origin, tip2, labels[1]));
  return s.svg({
    width: 280,
    height: 250,
    viewBox: '0 0 280 250',
  }, children);
}

// Draw the coordinate basis (∂_1, ∂_2) and its dual basis (e^1, e^2) for a
// 2D oblique coordinate system. `angle` is the angle between ∂_1 and ∂_2.
// The dual basis is computed from the matrix relation e^i(∂_j) = δ^i_j —
// e^1 is perpendicular to ∂_2; e^2 is perpendicular to ∂_1.
export function makeDualBasis({
  angle = Math.PI / 3,
  title = '',
} = {}) {
  const s = new svgGen({});
  const scale = 130;
  const origin = { x: 150, y: 200 };

  // Coordinate basis in the diagram's user space.
  const e1 = { x: 1, y: 0 };
  const e2 = { x: Math.cos(angle), y: -Math.sin(angle) };  // y flipped for SVG

  // Dual basis: a^i e_j = δ^i_j. Solve [e1 e2]^T = I → dual = inv([e1 e2])^T.
  // 2x2 closed form.
  const det = e1.x * e2.y - e1.y * e2.x;
  const d1 = { x: e2.y / det, y: -e2.x / det };
  const d2 = { x: -e1.y / det, y: e1.x / det };

  function tip(v) {
    return { x: origin.x + scale * v.x, y: origin.y + scale * v.y };
  }

  const children = [
    s.defs({}, [
      arrowheadMarker(s, 'arrowhead-black', '#111111'),
      arrowheadMarker(s, 'arrowhead-grey', '#888888'),
    ]),
  ];
  if (title) children.push(s.title({}, title));

  children.push(...tangentArrow(s, origin, tip(e1), '∂θ̃', { color: '#111111' }));
  children.push(...tangentArrow(s, origin, tip(e2), '∂φ̃', { color: '#111111' }));
  children.push(...tangentArrow(s, origin, tip(d1), 'dθ̃', {
    color: '#888888', markerId: 'arrowhead-grey', dashed: true,
  }));
  children.push(...tangentArrow(s, origin, tip(d2), 'dφ̃', {
    color: '#888888', markerId: 'arrowhead-grey', dashed: true,
  }));

  return s.svg({
    width: 320,
    height: 310,
    viewBox: '-10 20 320 310',
  }, children);
}

// Draw the standard and skew coordinate bases superimposed at the same
// origin. Used to visualize the Jacobian connecting one chart to the other.
export function makeChartChange({
  standardAngle = Math.PI / 2,
  standardLengths = [1, 1],
  skewAngle = Math.PI / 3,
  skewLengths = [1, 1],
  title = '',
} = {}) {
  const s = new svgGen({});
  const scale = 140;
  const origin = { x: 80, y: 240 };

  function place(angleFromX, length) {
    return {
      x: origin.x + scale * length * Math.cos(angleFromX),
      y: origin.y - scale * length * Math.sin(angleFromX),
    };
  }

  const tipStdTheta = place(0, standardLengths[0]);
  const tipStdPhi = place(Math.PI / 2, standardLengths[1]);
  const tipSkewTheta = place(0, skewLengths[0]);
  const tipSkewPhi = place(skewAngle, skewLengths[1]);

  const children = [
    s.defs({}, [
      arrowheadMarker(s, 'arrowhead-black', '#111111'),
      arrowheadMarker(s, 'arrowhead-blue', COLORS.latArrow),
      arrowheadMarker(s, 'arrowhead-yellow', COLORS.longArrow),
    ]),
  ];
  if (title) children.push(s.title({}, title));

  // Standard basis in blue; tip ∂θ and ∂θ̃ overlap on the horizontal, so
  // we skip the standard θ label to avoid stacking.
  children.push(...tangentArrow(s, origin, tipStdTheta, '∂θ',
    { color: COLORS.latArrow, markerId: 'arrowhead-blue', labelGap: 14 }));
  children.push(...tangentArrow(s, origin, tipStdPhi, '∂φ',
    { color: COLORS.latArrow, markerId: 'arrowhead-blue' }));
  children.push(...tangentArrow(s, origin, tipSkewTheta, '∂θ̃',
    { color: COLORS.longArrow, markerId: 'arrowhead-yellow', labelGap: 32 }));
  children.push(...tangentArrow(s, origin, tipSkewPhi, '∂φ̃',
    { color: COLORS.longArrow, markerId: 'arrowhead-yellow' }));

  return s.svg({
    width: 300,
    height: 270,
    viewBox: '0 30 300 270',
  }, children);
}

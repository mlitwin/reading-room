import { parseToText } from '@mlitwin/svg-gen';
import { makeTangentPlane } from '../shared/sphere.js';

// In the standard chart at the sample point, the two basis vectors are
// orthogonal; the latitude basis is sin(theta_0) shorter than the longitude
// basis (theta_0 = 13 pi / 32). The exact lengths shown here are
// (|partial_theta|, |partial_phi|) = (1, sin(13 pi/32)).
const svg = makeTangentPlane({
  angle: Math.PI / 2,
  lengths: [1, Math.sin(13 * Math.PI / 32)],
  labels: ['∂θ', '∂φ'],
  title: 'Tangent basis at the sample point (standard chart)',
});

process.stdout.write(parseToText(svg));

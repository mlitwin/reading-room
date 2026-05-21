import { parseToText } from '@mlitwin/svg-gen';
import { makeTangentPlane } from '../shared/sphere.js';

// In the skew chart at the sample point the two basis vectors are no longer
// orthogonal. Exact angle is worked out in the markdown; visualization here
// picks a clearly-oblique value (about 60 degrees) so the reader can see the
// shear at a glance.
const svg = makeTangentPlane({
  angle: Math.PI / 3,
  lengths: [1, Math.sin(13 * Math.PI / 32)],
  labels: ['∂θ̃', '∂φ̃'],
  title: 'Tangent basis at the sample point (skew chart)',
});

process.stdout.write(parseToText(svg));

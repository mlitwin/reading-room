import { parseToText } from '@mlitwin/svg-gen';
import { makeSphere } from '../shared/sphere.js';

const svg = makeSphere({
  skew: Math.PI / 8,
  showBasis: true,
  title: 'Sphere with skewed lat/long grid and tangent basis vectors',
});

process.stdout.write(parseToText(svg));

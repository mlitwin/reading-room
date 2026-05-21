import { parseToText } from '@mlitwin/svg-gen';
import { makeSphere } from '../shared/sphere.js';

const svg = makeSphere({
  skew: 0,
  showBasis: true,
  title: 'Sphere with standard lat/long grid and tangent basis vectors',
});

process.stdout.write(parseToText(svg));

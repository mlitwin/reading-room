import { parseToText } from '@mlitwin/svg-gen';
import { makeChartChange } from '../shared/sphere.js';

// Both bases at the same point. Blue: standard chart, orthogonal. Yellow:
// skew chart, oblique. The Jacobian of the chart change is the linear map
// that takes one to the other.
const SAMPLE_LATITUDE_LEN = Math.sin(13 * Math.PI / 32);

const svg = makeChartChange({
  standardAngle: Math.PI / 2,
  standardLengths: [1, SAMPLE_LATITUDE_LEN],
  skewAngle: Math.PI / 3,
  skewLengths: [1, SAMPLE_LATITUDE_LEN],
  title: 'Standard and skew coordinate bases at the sample point',
});

process.stdout.write(parseToText(svg));

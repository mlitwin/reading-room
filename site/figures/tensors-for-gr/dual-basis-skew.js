import { parseToText } from '@mlitwin/svg-gen';
import { makeDualBasis } from '../shared/sphere.js';

// Skew tangent plane with both the coordinate basis ∂θ̃, ∂φ̃ (solid) and the
// dual basis dθ̃, dφ̃ (dashed). The dual basis is perpendicular to the
// "wrong" coordinate axis — dθ̃ ⟂ ∂φ̃ and dφ̃ ⟂ ∂θ̃ — which is the
// geometric content of e^i(∂_j) = δ^i_j when the basis is oblique.
const svg = makeDualBasis({
  angle: Math.PI / 3,
  title: 'Coordinate basis and dual basis in the skew chart',
});

process.stdout.write(parseToText(svg));

/*
 * Brand colours for drawing code: three.js scenes, SVG art and canvas maps.
 * CSS uses the tokens of the same names in app/globals.css; change both
 * together.
 *
 * Cold and near-monochrome: blue-black grounds, slate-teal surfaces, cool
 * white type, an aqua glow, and a deeper teal as the second light.
 */
export const palette = {
  ink: "#04090b",
  card: "#0c1619",
  fg: "#eef5f6",
  cyan: "#1ad5ec",
  teal: "#1b8aa3",
  /** Cool white for key lights and highlights. */
  key: "#e4f4f7",
  /** Distance haze in the 3D scenes. */
  mist: "#071419",
} as const;

/**
 * A drawing on a mat board, standing on a cylinder.
 *
 * Three things only, each with a reason:
 *  1. a slight bend, because the card sits on the curve of the ring and paper
 *     on a curve bends;
 *  2. `contain` mapping, because a drawing's proportions are part of it and
 *     must never be cropped to fit a slot;
 *  3. aerial falloff, because a card further away has more of the room's air
 *     in front of it. That is what builds the depth hierarchy — not a fog
 *     colour chosen to look moody.
 *
 * No chromatic aberration, no noise, no rainbow. Nothing is applied to the
 * artwork itself.
 */
export const matCardVertex = /* glsl */ `
uniform float uBend;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 transformed = position;
  transformed.z -= transformed.x * transformed.x * uBend;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`

export const matCardFragment = /* glsl */ `
precision mediump float;

uniform sampler2D uMap;
uniform float uImageAspect;
uniform float uMatAspect;
uniform float uDepth;      // 0 = far side of the ring, 1 = facing the viewer
uniform vec3 uMat;
uniform vec3 uGround;
uniform vec3 uEdge;

varying vec2 vUv;

const float INSET = 0.075;

/*
 * How much of the page's own colour sits in front of a card, and how quickly
 * it thins out as the card turns towards the viewer.
 *
 * The first version washed 35% of a cream ground over a card at the side of
 * the drum, which does not read as distance — it reads as a translucent sheet
 * laid over the artwork. These values leave a card that is facing you
 * untouched and take about 7% off one turned side-on, which is enough to sort
 * the depth out and little enough to keep the drawings the drawings.
 */
const float AIR = 0.26;
const float AIR_FALLOFF = 0.45;

void main() {
  // the window cut in the mat
  vec2 frame = (vUv - INSET) / (1.0 - 2.0 * INSET);

  // contain: the whole drawing, never cropped
  vec2 uv = frame;
  if (uImageAspect > uMatAspect) {
    uv.y = (frame.y - 0.5) * (uImageAspect / uMatAspect) + 0.5;
  } else {
    uv.x = (frame.x - 0.5) * (uMatAspect / uImageAspect) + 0.5;
  }

  float inFrame = step(0.0, frame.x) * step(frame.x, 1.0) * step(0.0, frame.y) * step(frame.y, 1.0);
  float inImage = inFrame * step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);

  vec3 colour = mix(uMat, texture2D(uMap, clamp(uv, 0.0, 1.0)).rgb, inImage);

  // a hairline where the mat meets the print, so an edge exists at any size
  float border = inFrame * (1.0 - inImage);
  colour = mix(colour, uEdge, border * 0.16);

  // and one around the card, so overlapping cards stay legible as objects
  vec2 d = min(vUv, 1.0 - vUv);
  float rim = 1.0 - smoothstep(0.0, 0.01, min(d.x, d.y));
  colour = mix(colour, uEdge, rim * 0.28);

  /*
   * No accent on the card. Which drawing is in register is stated in words,
   * in the readout beside the drum; putting it on the card as well meant every
   * slot showing that artwork lit up, and with fifteen drawings across
   * thirty-three slots that is three glowing edges at once.
   */

  // air in front of the card, thinning as it turns to face the viewer
  float recede = pow(clamp(uDepth, 0.0, 1.0), AIR_FALLOFF);
  colour = mix(uGround, colour, 1.0 - AIR * (1.0 - recede));

  gl_FragColor = vec4(colour, 1.0);

  /*
   * Encode to the renderer's output colour space. This is not optional and it
   * is easy to miss: three tags these textures sRGB, which makes the GPU
   * decode them to linear on sample, and a THREE.Color built from a hex string
   * is converted to linear too — so everything above is linear light. Nothing
   * converts it back for a ShaderMaterial. Without this line linear values are
   * written straight into an sRGB framebuffer: the mats survive, because they
   * are nearly white, but every midtone in the artwork is crushed. The result
   * is flat, muddy drawings behind what looks like a haze.
   */
  #include <colorspace_fragment>
}
`

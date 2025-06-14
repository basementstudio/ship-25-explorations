precision highp float;

uniform sampler2D baseMap;
// Bloom configuration uniforms
uniform float bloomThreshold; // Brightness threshold (default: 0.8)
uniform float bloomIntensity; // Bloom strength (default: 0.5)
uniform float bloomRadius; // Bloom radius (default: 0.5)
uniform int bloomSamples; // Number of samples (default: 16)

in vec2 vUv;
out vec4 fragColor;

// Pseudo-random function based on UV coordinates
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Second random function with different seed values
float random2(vec2 st) {
  return fract(sin(dot(st.xy, vec2(78.233, 19.8745))) * 35794.351);
}

// Function to determine if a pixel is bright enough for bloom
vec3 extractBrightness(vec3 color) {
  // Perceptual luminance calculation (standard Rec. 709 coefficients)
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

  // Apply threshold and scale
  return luminance > bloomThreshold
    ? color * (luminance - bloomThreshold)
    : vec3(0.0);
}

// Golden angle in radians (approximately 2.4 radians)
#define GOLDEN_ANGLE (2.39996323)

// Gaussian function for weighting samples
float gaussian(float distance, float sigma) {
  return exp(-(distance * distance) / (2.0 * sigma * sigma));
}

// Vogel disk sampling function for bloom with Gaussian weighting
vec3 sampleBloom(vec2 uv, float radius) {
  vec3 bloomColor = vec3(0.0);
  vec2 pixelSize = 1.0 / vec2(textureSize(baseMap, 0));
  float totalWeight = 0.0;
  float sigma = radius * 0.1; // Adjust sigma based on radius

  // Sample the center pixel
  vec3 centerColor = texture(baseMap, uv).rgb;
  float centerWeight = gaussian(0.0, sigma);
  bloomColor += extractBrightness(centerColor) * centerWeight;
  totalWeight += centerWeight;

  // Generate a random rotation angle unique to this pixel
  float pixelRandomRotation = random(uv) * 6.28318; // 2*PI

  // Sample additional points in a Vogel disk pattern with per-pixel random rotation
  for (int i = 0; i < bloomSamples; i++) {
    float angle = float(i) * GOLDEN_ANGLE + pixelRandomRotation;
    float r = sqrt(float(i)) / sqrt(float(bloomSamples));

    // Generate a random radius variation between 0.5 and 1.0 of the original radius
    float radiusVariation =
      0.5 + 0.5 * random2(uv + vec2(float(i) * 0.1, pixelRandomRotation));
    float variedRadius = radius * radiusVariation;

    vec2 offset = vec2(cos(angle), sin(angle)) * r * variedRadius * pixelSize;

    // Calculate Gaussian weight based on distance from center
    float distance = length(offset) / (radius * pixelSize.x);
    float weight = gaussian(distance, sigma);

    vec3 sampleColor = texture(baseMap, uv + offset).rgb;
    bloomColor += extractBrightness(sampleColor) * weight;
    totalWeight += weight;
  }

  // Normalize by total weight
  bloomColor /= totalWeight;
  return bloomColor * bloomIntensity;
}

void main() {
  // Sample the original image
  vec4 originalColor = texture(baseMap, vUv);

  // Apply bloom effect
  vec3 bloom = sampleBloom(vUv, bloomRadius);

  // Add bloom to original color
  fragColor = vec4(originalColor.rgb + bloom, originalColor.a);
}

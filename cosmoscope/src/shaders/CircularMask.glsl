precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_cursor;
uniform float u_radius;
uniform float u_feather;
uniform vec4 u_color;
uniform float u_intensity;

void main() {
  vec2 coord = gl_FragCoord.xy;
  float dist = distance(coord, u_cursor);
  float mask = smoothstep(u_radius, u_radius - u_feather, dist);
  float alpha = (1.0 - mask) * u_color.a * u_intensity;
  gl_FragColor = vec4(u_color.rgb, alpha);
}

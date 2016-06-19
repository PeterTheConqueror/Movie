precision mediump float;

varying vec2 v_texCoord1;
varying vec2 v_texCoord2;
varying vec2 v_alphatexCoord;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_alphatexture;

void main() {
  vec4 tex1 = texture2D(u_texture1, v_texCoord1);
  vec4 tex2 = texture2D(u_texture2, v_texCoord2);
  float alpha = texture2D(u_alphatexture, v_alphatexCoord).a;
  vec4 frag = alpha * tex1 + (1.0 - alpha) * tex2;
  gl_FragColor = vec4(alpha * tex1.rgb + (1.0 - alpha) * tex2.rgb, 0.85);
  //gl_FragColor = alpha * tex1 + (1.0 - alpha) * tex2;
}

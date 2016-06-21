precision mediump float;

varying vec2 v_texCoord1;
varying vec2 v_texCoord2;
varying vec2 v_alphatexCoord;

uniform bool u_useSecond;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_alphatexture;

void main() {
  float alpha = texture2D(u_alphatexture, v_alphatexCoord).a;
  if(u_useSecond){
    gl_FragColor = vec4(
      alpha * texture2D(u_texture1, v_texCoord1).rgb
    + (1.0 - alpha) * texture2D(u_texture2, v_texCoord2).rgb
    , 0.85);
  }else{
    gl_FragColor = vec4(alpha * texture2D(u_texture1, v_texCoord1).rgb, alpha);
  }
}

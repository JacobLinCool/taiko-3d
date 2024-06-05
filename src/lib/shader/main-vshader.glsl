attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec2 a_TexCoord;

uniform mat4 u_MvpMatrix;
uniform mat4 u_modelMatrix;
uniform mat4 u_normalMatrix;

varying vec3 v_Normal;
varying vec3 v_PositionInWorld;
varying vec2 v_TexCoord;
varying mat3 v_TBN;

void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_PositionInWorld = (u_modelMatrix * a_Position).xyz;
    v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    v_TexCoord = a_TexCoord;

    // Compute tangent and bitangent
    vec3 pos1 = vec3(u_modelMatrix * (a_Position + vec4(1.0, 0.0, 0.0, 0.0)));
    vec3 pos2 = vec3(u_modelMatrix * (a_Position + vec4(0.0, 1.0, 0.0, 0.0)));
    vec2 texCoord1 = a_TexCoord + vec2(1.0, 0.0);
    vec2 texCoord2 = a_TexCoord + vec2(0.0, 1.0);

    vec3 edge1 = pos1 - v_PositionInWorld;
    vec3 edge2 = pos2 - v_PositionInWorld;
    vec2 deltaUV1 = texCoord1 - v_TexCoord;
    vec2 deltaUV2 = texCoord2 - v_TexCoord;

    float f = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);

    vec3 tangent = f * (deltaUV2.y * edge1 - deltaUV1.y * edge2);
    vec3 bitangent = f * (-deltaUV2.x * edge1 + deltaUV1.x * edge2);

    v_TBN = mat3(normalize(tangent), normalize(bitangent), v_Normal);
}

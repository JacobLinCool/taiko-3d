precision highp float;

uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;
uniform vec3 u_ViewPosition;
uniform float u_Ka;
uniform float u_Kd;
uniform float u_Ks;
uniform vec3 u_Color;
uniform float u_shininess;
uniform int u_mode;
uniform sampler2D u_Sampler;
uniform samplerCube u_CubeSampler;
uniform sampler2D u_NormalMap;
uniform bool u_UseNormalMap;

varying vec3 v_Normal;
varying vec3 v_PositionInWorld;
varying vec2 v_TexCoord;
varying mat3 v_TBN;

void main() {
    vec3 ambientLightColor = u_Color.rgb;
    vec3 diffuseLightColor = u_Color.rgb * 0.8 + u_LightColor * 0.2;
    if(u_mode == 2) {
        vec3 texColor = texture2D(u_Sampler, v_TexCoord).rgb;
        if(texColor == vec3(0.0, 0.0, 0.0)) {
            texColor = u_Color;
        }
        ambientLightColor = texColor;
        diffuseLightColor = texColor;
    }
    if(u_mode == 3) {
        vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
        vec3 normal = normalize(v_Normal);
        vec3 R = reflect(-V, normal);
        gl_FragColor = vec4(0.78 * textureCube(u_CubeSampler, R).rgb + 0.3 * u_Color, 1.0);
        return;
    }

    vec3 specularLightColor = u_LightColor;

    vec3 ambient = ambientLightColor * u_Ka;

    vec3 normal = normalize(v_Normal);
    if(u_UseNormalMap) {
        vec3 tangentNormal = texture2D(u_NormalMap, v_TexCoord).rgb * 2.0 - 1.0;
        normal = normalize(v_TBN * tangentNormal);
    }

    // Debugging: Output the normal value to the fragment color
    // Uncomment the line below to see the normal map values directly
    // gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);

    vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

    vec3 specular = vec3(0.0, 0.0, 0.0);
    if(nDotL > 0.0) {
        vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
        vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
        float specAngle = clamp(dot(R, V), 0.0, 1.0);
        specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor;
    }

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

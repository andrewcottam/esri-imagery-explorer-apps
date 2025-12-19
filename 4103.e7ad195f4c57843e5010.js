"use strict";(self.webpackChunkimagery_explorer_apps=self.webpackChunkimagery_explorer_apps||[]).push([[4103],{3525:function(e,t,o){o.d(t,{W:function(){return a},Y:function(){return l}});var a,r,i=o(17420),n=o(62462),s=o(33763);function l(e,t){switch(t.normalType){case a.Compressed:e.attributes.add(s.r.NORMALCOMPRESSED,"vec2"),e.vertex.code.add(n.H`vec3 decompressNormal(vec2 normal) {
float z = 1.0 - abs(normal.x) - abs(normal.y);
return vec3(normal + sign(normal) * min(z, 0.0), z);
}
vec3 normalModel() {
return decompressNormal(normalCompressed);
}`);break;case a.Attribute:e.attributes.add(s.r.NORMAL,"vec3"),e.vertex.code.add(n.H`vec3 normalModel() {
return normal;
}`);break;case a.ScreenDerivative:e.fragment.code.add(n.H`vec3 screenDerivativeNormal(vec3 positionView) {
return normalize(cross(dFdx(positionView), dFdy(positionView)));
}`);break;default:(0,i.Xb)(t.normalType);case a.COUNT:}}(r=a||(a={}))[r.Attribute=0]="Attribute",r[r.Compressed=1]="Compressed",r[r.ScreenDerivative=2]="ScreenDerivative",r[r.COUNT=3]="COUNT"},12668:function(e,t,o){o.d(t,{D:function(){return F},b:function(){return B}});var a=o(76982),r=o(47635),i=o(29785),n=o(77788),s=o(29592),l=o(31790),c=o(32728),d=o(3525),u=o(79887),m=o(51229),h=o(73713),v=o(83143),p=o(11255),f=o(36261),g=o(50710),x=o(87646),b=o(28382),w=o(40574),M=o(23605),T=o(75762),y=o(35212),S=o(73229),C=o(85807),O=o(69563),N=o(24578),E=o(73349),z=o(79377),I=o(69952),H=o(64802),A=o(92121),_=o(19635),L=o(62462),G=o(19778),P=o(82955),R=o(33763),D=o(288),V=o(43398),W=o(76221);function B(e){const t=new V.N5,{attributes:o,vertex:B,fragment:F,varyings:j}=t,{output:U,normalType:Y,offsetBackfaces:Z,instancedColor:q,spherical:J,receiveShadows:k,snowCover:X,pbrMode:$,textureAlphaPremultiplied:K,instancedDoublePrecision:Q,hasVertexColors:ee,hasVertexTangents:te,hasColorTexture:oe,hasNormalTexture:ae,hasNormalTextureTransform:re,hasColorTextureTransform:ie,hasBloom:ne}=e;if((0,I.NB)(B,e),o.add(R.r.POSITION,"vec3"),j.add("vpos","vec3",{invariant:!0}),t.include(N.A,e),t.include(c.B,e),t.include(p.G,e),t.include(O.q2,e),!(0,n.RN)(U))return t.include(f.E,e),t;t.include(O.Sx,e),t.include(O.MU,e),t.include(O.O1,e),t.include(O.QM,e),(0,I.yu)(B,e),t.include(d.Y,e),t.include(l.d,e);const se=Y===d.W.Attribute||Y===d.W.Compressed;return se&&Z&&t.include(i.M),t.include(g.W,e),t.include(v.Mh,e),q&&t.attributes.add(R.r.INSTANCECOLOR,"vec4"),j.add("vPositionLocal","vec3"),t.include(m.U,e),t.include(r.oD,e),t.include(u.K,e),t.include(h.c,e),B.uniforms.add(new A.E("externalColor",(e=>"ignore"===e.colorMixMode?a.Un:e.externalColor))),j.add("vcolorExt","vec4"),t.include(C.Z,e),B.main.add(L.H`
    forwardNormalizedVertexColor();
    vcolorExt = externalColor;
    ${(0,L.If)(q,"vcolorExt *= instanceColor * 0.003921568627451;")}
    vcolorExt *= vvColor();
    vcolorExt *= getSymbolColor();
    forwardColorMixMode();

    vpos = getVertexInLocalOriginSpace();
    vPositionLocal = vpos - view[3].xyz;
    vpos = subtractOrigin(vpos);
    ${(0,L.If)(se,"vNormalWorld = dpNormal(vvLocalNormal(normalModel()));")}
    vpos = addVerticalOffset(vpos, localOrigin);
    ${(0,L.If)(te,"vTangent = dpTransformVertexTangent(tangent);")}
    gl_Position = transformPosition(proj, view, vpos);
    ${(0,L.If)(se&&Z,"gl_Position = offsetBackfacingClipPosition(gl_Position, vpos, vNormalWorld, cameraPosition);")}

    forwardViewPosDepth((view * vec4(vpos, 1.0)).xyz);
    forwardLinearDepth();
    forwardTextureCoordinates();
    forwardColorUV();
    forwardNormalUV();
    forwardEmissiveUV();
    forwardOcclusionUV();
    forwardMetallicRoughnessUV();

    if (vcolorExt.a < ${L.H.float(W.Q)}) {
      gl_Position = vec4(1e38, 1e38, 1e38, 1.0);
    }
  `),t.include(b.kA,e),F.include(x.n,e),t.include(E.S,e),t.include(Q?S.G:S.Bz,e),F.include(s.HQ,e),t.include(D.z,e),(0,I.yu)(F,e),F.uniforms.add(B.uniforms.get("localOrigin"),new H.t("ambient",(e=>e.ambient)),new H.t("diffuse",(e=>e.diffuse)),new _.m("opacity",(e=>e.opacity)),new _.m("layerOpacity",(e=>e.layerOpacity))),oe&&F.uniforms.add(new G.N("tex",(e=>e.texture))),t.include(y._Z,e),F.include(T.c,e),F.include(z.N),t.include(M.r,e),F.include(P.b,e),(0,b.a8)(F),(0,b.eU)(F),(0,w.O4)(F),F.main.add(L.H`
    discardBySlice(vpos);
    discardByTerrainDepth();
    ${oe?L.H`
            vec4 texColor = texture(tex, ${ie?"colorUV":"vuv0"});
            ${(0,L.If)(K,"texColor.rgb /= texColor.a;")}
            discardOrAdjustAlpha(texColor);`:L.H`vec4 texColor = vec4(1.0);`}
    shadingParams.viewDirection = normalize(vpos - cameraPosition);
    ${Y===d.W.ScreenDerivative?L.H`vec3 normal = screenDerivativeNormal(vPositionLocal);`:L.H`shadingParams.normalView = vNormalWorld;
                vec3 normal = shadingNormal(shadingParams);`}
    applyPBRFactors();
    float ssao = evaluateAmbientOcclusionInverse() * getBakedOcclusion();

    vec3 posWorld = vpos + localOrigin;

      float additionalAmbientScale = additionalDirectedAmbientLight(posWorld);
      float shadow = ${k?"max(lightingGlobalFactor * (1.0 - additionalAmbientScale), readShadowMap(vpos, linearDepth))":(0,L.If)(J,"lightingGlobalFactor * (1.0 - additionalAmbientScale)","0.0")};

    vec3 matColor = max(ambient, diffuse);
    vec3 albedo = mixExternalColor(${(0,L.If)(ee,"vColor.rgb *")} matColor, texColor.rgb, vcolorExt.rgb, int(colorMixMode));
    float opacity_ = layerOpacity * mixExternalOpacity(${(0,L.If)(ee,"vColor.a * ")} opacity, texColor.a, vcolorExt.a, int(colorMixMode));
    ${ae?`mat3 tangentSpace = computeTangentSpace(${te?"normal":"normal, vpos, vuv0"});\n            vec3 shadingNormal = computeTextureNormal(tangentSpace, ${re?"normalUV":"vuv0"});`:"vec3 shadingNormal = normal;"}
    vec3 normalGround = ${J?"normalize(posWorld);":"vec3(0.0, 0.0, 1.0);"}

    ${(0,L.If)(X,L.H`
          float snow = getSnow(normal, normalGround);
          albedo = mix(albedo, vec3(1), snow);
          shadingNormal = mix(shadingNormal, normal, snow);
          ssao = mix(ssao, 1.0, snow);`)}

    vec3 additionalLight = ssao * mainLightIntensity * additionalAmbientScale * ambientBoostFactor * lightingGlobalFactor;

    ${$===y.A9.Normal||$===y.A9.Schematic?L.H`
            float additionalAmbientIrradiance = additionalAmbientIrradianceFactor * mainLightIntensity[2];
            vec4 emission = ${ne?"vec4(0.0)":"getEmissions(albedo)"};
            ${(0,L.If)(X,"mrr = applySnowToMRR(mrr, snow);\n                 emission = snowCoverForEmissions(emission, snow);")}
            vec3 shadedColor = evaluateSceneLightingPBR(shadingNormal, albedo, shadow, 1.0 - ssao, additionalLight, shadingParams.viewDirection, normalGround, mrr, emission, additionalAmbientIrradiance);`:L.H`vec3 shadedColor = evaluateSceneLighting(shadingNormal, albedo, shadow, 1.0 - ssao, additionalLight);`}
    vec4 finalColor = vec4(shadedColor, opacity_);
    outputColorHighlightOID(finalColor, vpos, albedo ${(0,L.If)(X,", snow")});
  `),t}const F=Object.freeze(Object.defineProperty({__proto__:null,build:B},Symbol.toStringTag,{value:"Module"}))},14103:function(e,t,o){o.d(t,{$U:function(){return L},fs:function(){return P},ty:function(){return R}});var a=o(80347),r=o(19913),i=o(30361),n=o(84456),s=o(7724),l=o(77788),c=o(3525),d=o(6750),u=o(23605),m=o(35212),h=o(84618),v=o(10875),p=o(71678),f=o(31272),g=o(8445),x=o(17555),b=o(15449),w=o(33763),M=o(72559),T=o(66356),y=o(73395),S=o(83244),C=o(82392),O=o(51229),N=o(67069),E=o(18693);class z extends E.E{constructor(e){super(),this.spherical=e,this.alphaDiscardMode=v.sf.Opaque,this.doubleSidedMode=u.W.None,this.pbrMode=m.A9.Disabled,this.cullFace=v.s2.None,this.normalType=c.W.Attribute,this.customDepthTest=v.it.Less,this.emissionSource=d.ZX.None,this.hasVertexColors=!1,this.hasSymbolColors=!1,this.hasVerticalOffset=!1,this.hasColorTexture=!1,this.hasMetallicRoughnessTexture=!1,this.hasOcclusionTexture=!1,this.hasNormalTexture=!1,this.hasScreenSizePerspective=!1,this.hasVertexTangents=!1,this.hasOccludees=!1,this.instancedDoublePrecision=!1,this.hasModelTransformation=!1,this.offsetBackfaces=!1,this.vvSize=!1,this.vvColor=!1,this.receiveShadows=!1,this.receiveAmbientOcclusion=!1,this.textureAlphaPremultiplied=!1,this.instanced=!1,this.instancedColor=!1,this.writeDepth=!0,this.transparent=!1,this.enableOffset=!0,this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.snowCover=!1,this.hasBloom=!1,this.hasColorTextureTransform=!1,this.hasEmissionTextureTransform=!1,this.hasNormalTextureTransform=!1,this.hasOcclusionTextureTransform=!1,this.hasMetallicRoughnessTextureTransform=!1,this.occlusionPass=!1,this.hasVvInstancing=!0,this.useCustomDTRExponentForWater=!1,this.useFillLights=!0,this.draped=!1}get textureCoordinateType(){return this.hasColorTexture||this.hasMetallicRoughnessTexture||this.emissionSource===d.ZX.Texture||this.hasOcclusionTexture||this.hasNormalTexture?O.I.Default:O.I.None}get objectAndLayerIdColorInstanced(){return this.instanced}get discardInvisibleFragments(){return this.transparent}}(0,C._)([(0,N.W)({count:v.sf.COUNT})],z.prototype,"alphaDiscardMode",void 0),(0,C._)([(0,N.W)({count:u.W.COUNT})],z.prototype,"doubleSidedMode",void 0),(0,C._)([(0,N.W)({count:m.A9.COUNT})],z.prototype,"pbrMode",void 0),(0,C._)([(0,N.W)({count:v.s2.COUNT})],z.prototype,"cullFace",void 0),(0,C._)([(0,N.W)({count:c.W.COUNT})],z.prototype,"normalType",void 0),(0,C._)([(0,N.W)({count:v.it.COUNT})],z.prototype,"customDepthTest",void 0),(0,C._)([(0,N.W)({count:d.ZX.COUNT})],z.prototype,"emissionSource",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasVertexColors",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasSymbolColors",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasVerticalOffset",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasColorTexture",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasMetallicRoughnessTexture",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasOcclusionTexture",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasNormalTexture",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasScreenSizePerspective",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasVertexTangents",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasOccludees",void 0),(0,C._)([(0,N.W)()],z.prototype,"instancedDoublePrecision",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasModelTransformation",void 0),(0,C._)([(0,N.W)()],z.prototype,"offsetBackfaces",void 0),(0,C._)([(0,N.W)()],z.prototype,"vvSize",void 0),(0,C._)([(0,N.W)()],z.prototype,"vvColor",void 0),(0,C._)([(0,N.W)()],z.prototype,"receiveShadows",void 0),(0,C._)([(0,N.W)()],z.prototype,"receiveAmbientOcclusion",void 0),(0,C._)([(0,N.W)()],z.prototype,"textureAlphaPremultiplied",void 0),(0,C._)([(0,N.W)()],z.prototype,"instanced",void 0),(0,C._)([(0,N.W)()],z.prototype,"instancedColor",void 0),(0,C._)([(0,N.W)()],z.prototype,"writeDepth",void 0),(0,C._)([(0,N.W)()],z.prototype,"transparent",void 0),(0,C._)([(0,N.W)()],z.prototype,"enableOffset",void 0),(0,C._)([(0,N.W)()],z.prototype,"terrainDepthTest",void 0),(0,C._)([(0,N.W)()],z.prototype,"cullAboveTerrain",void 0),(0,C._)([(0,N.W)()],z.prototype,"snowCover",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasBloom",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasColorTextureTransform",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasEmissionTextureTransform",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasNormalTextureTransform",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasOcclusionTextureTransform",void 0),(0,C._)([(0,N.W)()],z.prototype,"hasMetallicRoughnessTextureTransform",void 0);var I=o(21979),H=o(38716);class A extends S.R5{constructor(e,t){super(e,t,new I.$(H.R,(()=>o.e(6252).then(o.bind(o,56252))))),this.type="RealisticTreeTechnique"}}var _=o(76221);class L extends f.im{constructor(e,t){super(e,P),this.materialType="default",this.supportsEdges=!0,this.intersectDraped=void 0,this.produces=new Map([[b.N.OPAQUE_MATERIAL,e=>((0,l.iq)(e)||(0,l.PJ)(e))&&!this.transparent],[b.N.TRANSPARENT_MATERIAL,e=>((0,l.iq)(e)||(0,l.PJ)(e))&&this.transparent&&this.parameters.writeDepth],[b.N.TRANSPARENT_MATERIAL_WITHOUT_DEPTH,e=>((0,l.XY)(e)||(0,l.PJ)(e))&&this.transparent&&!this.parameters.writeDepth]]),this._vertexBufferLayout=function(e){const t=(0,s.BP)().vec3f(w.r.POSITION);return e.normalType===c.W.Compressed?t.vec2i16(w.r.NORMALCOMPRESSED,{glNormalized:!0}):t.vec3f(w.r.NORMAL),e.hasVertexTangents&&t.vec4f(w.r.TANGENT),(e.textureId||e.normalTextureId||e.metallicRoughnessTextureId||e.emissiveTextureId||e.occlusionTextureId)&&t.vec2f16(w.r.UV0),e.hasVertexColors&&t.vec4u8(w.r.COLOR),e.hasSymbolColors&&t.vec4u8(w.r.SYMBOLCOLOR),(0,h.E)()&&t.vec4u8(w.r.OLIDCOLOR),t}(this.parameters),this._configuration=new z(t.spherical)}isVisibleForOutput(e){return e!==l.V.Shadow&&e!==l.V.ShadowExcludeHighlight&&e!==l.V.ShadowHighlight||this.parameters.castShadows}get visible(){const{layerOpacity:e,colorMixMode:t,opacity:o,externalColor:a}=this.parameters;return e*("replace"===t?1:o)*("ignore"===t?1:a[3])>=_.Q}get _hasEmissiveBase(){return!!this.parameters.emissiveTextureId||!(0,a.q)(this.parameters.emissiveBaseColor,r.uY)}get hasEmissions(){return this.parameters.emissiveStrength>0&&(this.parameters.emissiveSource===i.YJ.Emissive&&this._hasEmissiveBase||this.parameters.emissiveSource===i.YJ.Color)}getConfiguration(e,t){const{parameters:o,_configuration:a}=this,{treeRendering:r,doubleSided:n,doubleSidedType:s}=o;return super.getConfiguration(e,t,this._configuration),a.hasNormalTexture=!r&&!!o.normalTextureId,a.hasColorTexture=!!o.textureId,a.hasVertexTangents=!r&&o.hasVertexTangents,a.instanced=o.isInstanced,a.instancedDoublePrecision=o.instancedDoublePrecision,a.vvSize=!!o.vvSize,a.hasVerticalOffset=null!=o.verticalOffset,a.hasScreenSizePerspective=null!=o.screenSizePerspective,a.hasSlicePlane=o.hasSlicePlane,a.alphaDiscardMode=o.textureAlphaMode,a.normalType=r?c.W.Attribute:o.normalType,a.transparent=this.transparent,a.writeDepth=o.writeDepth,a.customDepthTest=o.customDepthTest??v.it.Less,a.hasOccludees=t.hasOccludees,a.cullFace=o.hasSlicePlane?v.s2.None:o.cullFace,a.cullAboveTerrain=t.cullAboveTerrain,a.hasModelTransformation=!r&&null!=o.modelTransformation,a.hasVertexColors=o.hasVertexColors,a.hasSymbolColors=o.hasSymbolColors,a.doubleSidedMode=r?u.W.WindingOrder:n&&"normal"===s?u.W.View:n&&"winding-order"===s?u.W.WindingOrder:u.W.None,a.instancedColor=o.hasInstancedColor,(0,l.RN)(e)?(a.terrainDepthTest=t.terrainDepthTest,a.receiveShadows=o.receiveShadows,a.receiveAmbientOcclusion=o.receiveAmbientOcclusion&&null!=t.ssao):(a.terrainDepthTest=!1,a.receiveShadows=a.receiveAmbientOcclusion=!1),a.vvColor=!!o.vvColor,a.textureAlphaPremultiplied=!!o.textureAlphaPremultiplied,a.pbrMode=o.usePBR?o.isSchematic?m.A9.Schematic:m.A9.Normal:m.A9.Disabled,a.hasMetallicRoughnessTexture=!r&&!!o.metallicRoughnessTextureId,a.emissionSource=r?d.ZX.None:null!=o.emissiveTextureId&&o.emissiveSource===i.YJ.Emissive?d.ZX.Texture:o.usePBR?o.emissiveSource===i.YJ.Emissive?d.ZX.EmissiveColor:d.ZX.SymbolColor:d.ZX.None,a.hasOcclusionTexture=!r&&!!o.occlusionTextureId,a.offsetBackfaces=!(!this.transparent||!o.offsetTransparentBackfaces),a.oitPass=t.oitPass,a.enableOffset=t.camera.relativeElevation<g.xt,a.snowCover=t.snowCover,a.hasBloom=(0,l.LG)(e),a.hasColorTextureTransform=!!o.colorTextureTransformMatrix,a.hasNormalTextureTransform=!!o.normalTextureTransformMatrix,a.hasEmissionTextureTransform=!!o.emissiveTextureTransformMatrix,a.hasOcclusionTextureTransform=!!o.occlusionTextureTransformMatrix,a.hasMetallicRoughnessTextureTransform=!!o.metallicRoughnessTextureTransformMatrix,a}intersect(e,t,o,r,i,s){if(null!=this.parameters.verticalOffset){const e=o.camera;(0,a.i)(j,t[12],t[13],t[14]);let s=null;switch(o.viewingMode){case n.RT.Global:s=(0,a.n)(B,j);break;case n.RT.Local:s=(0,a.c)(B,W)}let l=0;const c=(0,a.d)(U,j,e.eye),d=(0,a.l)(c),u=(0,a.g)(c,c,1/d);let m=null;this.parameters.screenSizePerspective&&(m=(0,a.e)(s,u)),l+=(0,y.kE)(e,d,this.parameters.verticalOffset,m??0,this.parameters.screenSizePerspective),(0,a.g)(s,s,l),(0,a.o)(F,s,o.transform.inverseRotation),r=(0,a.d)(D,r,F),i=(0,a.d)(V,i,F)}(0,x.Uy)(e,o,r,i,(0,M.ou)(o.verticalOffset),s)}createGLMaterial(e){return new G(e)}createBufferWriter(){return new T.Z(this._vertexBufferLayout)}get transparent(){return R(this.parameters)}}class G extends p.m8{constructor(e){super({...e,...e.material.parameters})}beginSlot(e){this._material.setParameters({receiveShadows:e.shadowMap.enabled});const t=this._material.parameters;this.updateTexture(t.textureId);const o=e.camera.viewInverseTransposeMatrix;return(0,a.i)(t.origin,o[3],o[7],o[11]),this._material.setParameters(this.textureBindParameters),this.getTechnique(t.treeRendering?A:S.R5,e)}}class P extends S.uD{constructor(){super(...arguments),this.treeRendering=!1,this.hasVertexTangents=!1}}function R(e){const{drivenOpacity:t,opacity:o,externalColor:[a,r,i,n],layerOpacity:s,texture:l,textureId:c,textureAlphaMode:d,colorMixMode:u}=e;return t||o<1&&"replace"!==u||n<1&&"ignore"!==u||s<1||(null!=l||null!=c)&&d!==v.sf.Opaque&&d!==v.sf.Mask&&"replace"!==u}const D=(0,r.vt)(),V=(0,r.vt)(),W=(0,r.fA)(0,0,1),B=(0,r.vt)(),F=(0,r.vt)(),j=(0,r.vt)(),U=(0,r.vt)()},23605:function(e,t,o){o.d(t,{W:function(){return a},r:function(){return s}});var a,r,i=o(17420),n=o(62462);function s(e,t){const o=e.fragment;switch(o.code.add(n.H`struct ShadingNormalParameters {
vec3 normalView;
vec3 viewDirection;
} shadingParams;`),t.doubleSidedMode){case a.None:o.code.add(n.H`vec3 shadingNormal(ShadingNormalParameters params) {
return normalize(params.normalView);
}`);break;case a.View:o.code.add(n.H`vec3 shadingNormal(ShadingNormalParameters params) {
return dot(params.normalView, params.viewDirection) > 0.0 ? normalize(-params.normalView) : normalize(params.normalView);
}`);break;case a.WindingOrder:o.code.add(n.H`vec3 shadingNormal(ShadingNormalParameters params) {
return gl_FrontFacing ? normalize(params.normalView) : normalize(-params.normalView);
}`);break;default:(0,i.Xb)(t.doubleSidedMode);case a.COUNT:}}(r=a||(a={}))[r.None=0]="None",r[r.View=1]="View",r[r.WindingOrder=2]="WindingOrder",r[r.COUNT=3]="COUNT"},23932:function(e,t,o){o.d(t,{L:function(){return i}});var a=o(77788),r=o(62462);function i(e,t){switch(t.output){case a.V.Shadow:case a.V.ShadowHighlight:case a.V.ShadowExcludeHighlight:case a.V.ViewshedShadow:e.fragment.code.add(r.H`float _calculateFragDepth(const in float depth) {
const float SLOPE_SCALE = 2.0;
const float BIAS = 20.0 * .000015259;
float m = max(abs(dFdx(depth)), abs(dFdy(depth)));
return depth + SLOPE_SCALE * m + BIAS;
}
void outputDepth(float _linearDepth){
float fragDepth = _calculateFragDepth(_linearDepth);
gl_FragDepth = fragDepth;
}`)}}},26599:function(e,t,o){o.d(t,{S:function(){return h},b:function(){return m}});var a=o(28019),r=o(16937),i=o(37138),n=o(19635),s=o(62462),l=o(29247),c=o(19778),d=o(43398);const u=4;function m(){const e=new d.N5,t=e.fragment;e.include(a.c);const o=(u+1)/2,m=1/(2*o*o);return t.include(r.E),t.uniforms.add(new c.N("depthMap",(e=>e.depthTexture)),new l.o("tex",(e=>e.colorTexture)),new i.t("blurSize",(e=>e.blurSize)),new n.m("projScale",((e,t)=>{const o=t.camera.distance;return o>5e4?Math.max(0,e.projScale-(o-5e4)):e.projScale}))),t.code.add(s.H`
    void blurFunction(vec2 uv, float r, float center_d, float sharpness, inout float wTotal, inout float bTotal) {
      float c = texture(tex, uv).r;
      float d = linearDepthFromTexture(depthMap, uv);

      float ddiff = d - center_d;

      float w = exp(-r * r * ${s.H.float(m)} - ddiff * ddiff * sharpness);
      wTotal += w;
      bTotal += w * c;
    }
  `),e.outputs.add("fragBlur","float"),t.main.add(s.H`
    float b = 0.0;
    float w_total = 0.0;

    float center_d = linearDepthFromTexture(depthMap, uv);

    float sharpness = -0.05 * projScale / center_d;
    for (int r = -${s.H.int(u)}; r <= ${s.H.int(u)}; ++r) {
      float rf = float(r);
      vec2 uvOffset = uv + rf * blurSize;
      blurFunction(uvOffset, rf, center_d, sharpness, w_total, b);
    }
    fragBlur = b / w_total;`),e}const h=Object.freeze(Object.defineProperty({__proto__:null,build:m},Symbol.toStringTag,{value:"Module"}))},28382:function(e,t,o){o.d(t,{kA:function(){return x},a8:function(){return f},eU:function(){return g}});var a=o(36137),r=(o(6273),o(44118)),i=o(87646),n=o(40574),s=o(75762),l=o(35212),c=o(48425),d=o(70483),u=o(41281),m=o(62462),h=o(26858);function v(e){e.code.add(m.H`float mapChannel(float x, vec2 p) {
return (x < p.x) ? mix(0.0, p.y, x/p.x) : mix(p.y, 1.0, (x - p.x) / (1.0 - p.x) );
}`),e.code.add(m.H`vec3 blackLevelSoftCompression(vec3 color, float averageAmbientRadiance) {
vec2 p = vec2(0.02, 0.0075) * averageAmbientRadiance;
return vec3(mapChannel(color.x, p), mapChannel(color.y, p), mapChannel(color.z, p));
}`)}var p=o(16782);function f(e){e.constants.add("ambientBoostFactor","float",h.uH)}function g(e){e.uniforms.add(new u.U("lightingGlobalFactor",(e=>e.lighting.globalFactor)))}function x(e,t){const o=e.fragment,{pbrMode:h,spherical:x,hasColorTexture:b}=t;o.include(i.n,t),h!==l.A9.Disabled&&o.include(s.c,t),e.include(r.W,t),o.include(c.p),o.include(p.b,t);const w=!(h===l.A9.Schematic&&!b);switch(w&&o.include(v),o.code.add(m.H`
    const float GAMMA_SRGB = ${m.H.float(a.Tf)};
    const float INV_GAMMA_SRGB = 0.4761904;
    ${(0,m.If)(h!==l.A9.Disabled,"const float GROUND_REFLECTANCE = 0.2;")}
  `),f(o),g(o),(0,n.Gc)(o),o.code.add(m.H`
    float additionalDirectedAmbientLight(vec3 vPosWorld) {
      float vndl = dot(${x?m.H`normalize(vPosWorld)`:m.H`vec3(0.0, 0.0, 1.0)`}, mainLightDirection);
      return smoothstep(0.0, 1.0, clamp(vndl * 2.5, 0.0, 1.0));
    }
  `),(0,n.O4)(o),o.code.add(m.H`vec3 evaluateAdditionalLighting(float ambientOcclusion, vec3 vPosWorld) {
float additionalAmbientScale = additionalDirectedAmbientLight(vPosWorld);
return (1.0 - ambientOcclusion) * additionalAmbientScale * ambientBoostFactor * lightingGlobalFactor * mainLightIntensity;
}`),h){case l.A9.Disabled:case l.A9.WaterOnIntegratedMesh:case l.A9.Water:e.include(n.Vt),o.code.add(m.H`vec3 evaluateSceneLighting(vec3 normalWorld, vec3 albedo, float shadow, float ssao, vec3 additionalLight) {
vec3 mainLighting = applyShading(normalWorld, shadow);
vec3 ambientLighting = calculateAmbientIrradiance(normalWorld, ssao);
vec3 albedoLinear = pow(albedo, vec3(GAMMA_SRGB));
vec3 totalLight = mainLighting + ambientLighting + additionalLight;
totalLight = min(totalLight, vec3(PI));
vec3 outColor = vec3((albedoLinear / PI) * totalLight);
return pow(outColor, vec3(INV_GAMMA_SRGB));
}`);break;case l.A9.Normal:case l.A9.Schematic:o.code.add(m.H`const float fillLightIntensity = 0.25;
const float horizonLightDiffusion = 0.4;
const float additionalAmbientIrradianceFactor = 0.02;
vec3 evaluateSceneLightingPBR(vec3 normal, vec3 albedo, float shadow, float ssao, vec3 additionalLight,
vec3 viewDir, vec3 groundNormal, vec3 mrr, vec4 _emission,
float additionalAmbientIrradiance) {
vec3 viewDirection = -viewDir;
vec3 h = normalize(viewDirection + mainLightDirection);
PBRShadingInfo inputs;
inputs.NdotV = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0);
inputs.NdotNG = clamp(dot(normal, groundNormal), -1.0, 1.0);
vec3 reflectedView = normalize(reflect(viewDirection, normal));
inputs.RdotNG = clamp(dot(reflectedView, groundNormal), -1.0, 1.0);
inputs.albedoLinear = pow(albedo, vec3(GAMMA_SRGB));
inputs.ssao = ssao;
inputs.metalness = mrr[0];
inputs.roughness = clamp(mrr[1] * mrr[1], 0.001, 0.99);`),o.code.add(m.H`inputs.f0 = (0.16 * mrr[2] * mrr[2]) * (1.0 - inputs.metalness) + inputs.albedoLinear * inputs.metalness;
inputs.f90 = vec3(clamp(dot(inputs.f0, vec3(50.0 * 0.33)), 0.0, 1.0));
inputs.diffuseColor = inputs.albedoLinear * (vec3(1.0) - inputs.f0) * (1.0 - inputs.metalness);`),t.useFillLights?o.uniforms.add(new d.o("hasFillLights",(e=>e.enableFillLights))):o.constants.add("hasFillLights","bool",!1),o.code.add(m.H`vec3 ambientDir = vec3(5.0 * groundNormal[1] - groundNormal[0] * groundNormal[2], - 5.0 * groundNormal[0] - groundNormal[2] * groundNormal[1], groundNormal[1] * groundNormal[1] + groundNormal[0] * groundNormal[0]);
ambientDir = ambientDir != vec3(0.0) ? normalize(ambientDir) : normalize(vec3(5.0, -1.0, 0.0));
inputs.NdotAmbDir = hasFillLights ? abs(dot(normal, ambientDir)) : 1.0;
float NdotL = clamp(dot(normal, mainLightDirection), 0.001, 1.0);
vec3 mainLightIrradianceComponent = NdotL * (1.0 - shadow) * mainLightIntensity;
vec3 fillLightsIrradianceComponent = inputs.NdotAmbDir * mainLightIntensity * fillLightIntensity;
vec3 ambientLightIrradianceComponent = calculateAmbientIrradiance(normal, ssao) + additionalLight;
inputs.skyIrradianceToSurface = ambientLightIrradianceComponent + mainLightIrradianceComponent + fillLightsIrradianceComponent ;
inputs.groundIrradianceToSurface = GROUND_REFLECTANCE * ambientLightIrradianceComponent + mainLightIrradianceComponent + fillLightsIrradianceComponent ;`),o.uniforms.add(new u.U("lightingSpecularStrength",(e=>e.lighting.mainLight.specularStrength)),new u.U("lightingEnvironmentStrength",(e=>e.lighting.mainLight.environmentStrength))).code.add(m.H`vec3 horizonRingDir = inputs.RdotNG * groundNormal - reflectedView;
vec3 horizonRingH = normalize(viewDirection + horizonRingDir);
inputs.NdotH_Horizon = dot(normal, horizonRingH);
float NdotH = clamp(dot(normal, h), 0.0, 1.0);
vec3 mainLightRadianceComponent = lightingSpecularStrength * normalDistribution(NdotH, inputs.roughness) * mainLightIntensity * (1.0 - shadow);
vec3 horizonLightRadianceComponent = lightingEnvironmentStrength * normalDistribution(inputs.NdotH_Horizon, min(inputs.roughness + horizonLightDiffusion, 1.0)) * mainLightIntensity * fillLightIntensity;
vec3 ambientLightRadianceComponent = lightingEnvironmentStrength * calculateAmbientRadiance(ssao) + additionalLight;
float normalDirectionModifier = mix(1., min(mix(0.1, 2.0, (inputs.NdotNG + 1.) * 0.5), 1.0), clamp(inputs.roughness * 5.0, 0.0 , 1.0));
inputs.skyRadianceToSurface = (ambientLightRadianceComponent + horizonLightRadianceComponent) * normalDirectionModifier + mainLightRadianceComponent;
inputs.groundRadianceToSurface = 0.5 * GROUND_REFLECTANCE * (ambientLightRadianceComponent + horizonLightRadianceComponent) * normalDirectionModifier + mainLightRadianceComponent;
inputs.averageAmbientRadiance = ambientLightIrradianceComponent[1] * (1.0 + GROUND_REFLECTANCE);`),o.code.add(m.H`
        vec3 reflectedColorComponent = evaluateEnvironmentIllumination(inputs);
        vec3 additionalMaterialReflectanceComponent = inputs.albedoLinear * additionalAmbientIrradiance;
        vec3 emissionComponent = _emission.rgb == vec3(0.0) ? _emission.rgb : tonemapACES(pow(_emission.rgb, vec3(GAMMA_SRGB)));
        vec3 outColorLinear = reflectedColorComponent + additionalMaterialReflectanceComponent + emissionComponent;
        ${w?m.H`vec3 outColor = pow(blackLevelSoftCompression(outColorLinear, inputs.averageAmbientRadiance), vec3(INV_GAMMA_SRGB));`:m.H`vec3 outColor = pow(max(vec3(0.0), outColorLinear - 0.005 * inputs.averageAmbientRadiance), vec3(INV_GAMMA_SRGB));`}
        return outColor;
      }
    `);break;case l.A9.Simplified:case l.A9.TerrainWithWater:(0,n.Gc)(o),(0,n.O4)(o),o.code.add(m.H`const float roughnessTerrain = 0.5;
const float specularityTerrain = 0.5;
const vec3 fresnelReflectionTerrain = vec3(0.04);
vec3 evaluatePBRSimplifiedLighting(vec3 n, vec3 c, float shadow, float ssao, vec3 al, vec3 vd, vec3 nup) {
vec3 viewDirection = -vd;
vec3 h = normalize(viewDirection + mainLightDirection);
float NdotL = clamp(dot(n, mainLightDirection), 0.001, 1.0);
float NdotV = clamp(abs(dot(n, viewDirection)), 0.001, 1.0);
float NdotH = clamp(dot(n, h), 0.0, 1.0);
float NdotNG = clamp(dot(n, nup), -1.0, 1.0);
vec3 albedoLinear = pow(c, vec3(GAMMA_SRGB));
float lightness = 0.3 * albedoLinear[0] + 0.5 * albedoLinear[1] + 0.2 * albedoLinear[2];
vec3 f0 = (0.85 * lightness + 0.15) * fresnelReflectionTerrain;
vec3 f90 =  vec3(clamp(dot(f0, vec3(50.0 * 0.33)), 0.0, 1.0));
vec3 mainLightIrradianceComponent = (1. - shadow) * NdotL * mainLightIntensity;
vec3 ambientLightIrradianceComponent = calculateAmbientIrradiance(n, ssao) + al;
vec3 ambientSky = ambientLightIrradianceComponent + mainLightIrradianceComponent;
vec3 indirectDiffuse = ((1.0 - NdotNG) * mainLightIrradianceComponent + (1.0 + NdotNG ) * ambientSky) * 0.5;
vec3 outDiffColor = albedoLinear * (1.0 - f0) * indirectDiffuse / PI;
vec3 mainLightRadianceComponent = normalDistribution(NdotH, roughnessTerrain) * mainLightIntensity;
vec2 dfg = prefilteredDFGAnalytical(roughnessTerrain, NdotV);
vec3 specularColor = f0 * dfg.x + f90 * dfg.y;
vec3 specularComponent = specularityTerrain * specularColor * mainLightRadianceComponent;
vec3 outColorLinear = outDiffColor + specularComponent;
vec3 outColor = pow(outColorLinear, vec3(INV_GAMMA_SRGB));
return outColor;
}`);default:case l.A9.COUNT:}}},29785:function(e,t,o){o.d(t,{M:function(){return r}});var a=o(62462);function r(e){e.vertex.code.add(a.H`vec4 offsetBackfacingClipPosition(vec4 posClip, vec3 posWorld, vec3 normalWorld, vec3 camPosWorld) {
vec3 camToVert = posWorld - camPosWorld;
bool isBackface = dot(camToVert, normalWorld) > 0.0;
if (isBackface) {
posClip.z += 0.0000003 * posClip.w;
}
return posClip;
}`)}},32728:function(e,t,o){o.d(t,{B:function(){return b}});var a=o(82541),r=o(79441),i=o(26110),n=o(80347),s=o(19913),l=o(77788),c=o(30588),d=o(69952),u=o(9504),m=o(62462),h=o(19835),v=o(99040),p=o(33763),f=o(3016),g=o(13439);g.Y;const x=(0,r.vt)();function b(e,t){const{hasModelTransformation:o,instancedDoublePrecision:r,instanced:s,output:g,hasVertexTangents:b}=t;o&&(e.vertex.uniforms.add(new v.X("model",(e=>e.modelTransformation??i.zK))),e.vertex.uniforms.add(new h.k("normalLocalOriginFromModel",(e=>((0,a.Ge)(x,e.modelTransformation??i.zK),x))))),s&&r&&(e.attributes.add(p.r.INSTANCEMODELORIGINHI,"vec3"),e.attributes.add(p.r.INSTANCEMODELORIGINLO,"vec3"),e.attributes.add(p.r.INSTANCEMODEL,"mat3"),e.attributes.add(p.r.INSTANCEMODELNORMAL,"mat3"));const M=e.vertex;r&&(M.include(c.u,t),M.uniforms.add(new u.d("viewOriginHi",(e=>(0,f.Zo)((0,n.i)(w,e.camera.viewInverseTransposeMatrix[3],e.camera.viewInverseTransposeMatrix[7],e.camera.viewInverseTransposeMatrix[11]),w))),new u.d("viewOriginLo",(e=>(0,f.jA)((0,n.i)(w,e.camera.viewInverseTransposeMatrix[3],e.camera.viewInverseTransposeMatrix[7],e.camera.viewInverseTransposeMatrix[11]),w))))),M.code.add(m.H`
    vec3 getVertexInLocalOriginSpace() {
      return ${o?r?"(model * vec4(instanceModel * localPosition().xyz, 1.0)).xyz":"(model * localPosition()).xyz":r?"instanceModel * localPosition().xyz":"localPosition().xyz"};
    }

    vec3 subtractOrigin(vec3 _pos) {
      ${r?m.H`
          // Issue: (should be resolved now with invariant position) https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/56280
          vec3 originDelta = dpAdd(viewOriginHi, viewOriginLo, -instanceModelOriginHi, -instanceModelOriginLo);
          return _pos - originDelta;`:"return vpos;"}
    }
    `),M.code.add(m.H`
    vec3 dpNormal(vec4 _normal) {
      return normalize(${o?r?"normalLocalOriginFromModel * (instanceModelNormal * _normal.xyz)":"normalLocalOriginFromModel * _normal.xyz":r?"instanceModelNormal * _normal.xyz":"_normal.xyz"});
    }
    `),g===l.V.Normal&&((0,d.S7)(M),M.code.add(m.H`
    vec3 dpNormalView(vec4 _normal) {
      return normalize((viewNormal * ${o?r?"vec4(normalLocalOriginFromModel * (instanceModelNormal * _normal.xyz), 1.0)":"vec4(normalLocalOriginFromModel * _normal.xyz, 1.0)":r?"vec4(instanceModelNormal * _normal.xyz, 1.0)":"_normal"}).xyz);
    }
    `)),b&&M.code.add(m.H`
    vec4 dpTransformVertexTangent(vec4 _tangent) {
      ${o?r?"return vec4(normalLocalOriginFromModel * (instanceModelNormal * _tangent.xyz), _tangent.w);":"return vec4(normalLocalOriginFromModel * _tangent.xyz, _tangent.w);":r?"return vec4(instanceModelNormal * _tangent.xyz, _tangent.w);":"return _tangent;"}
    }`)}const w=(0,s.vt)()},36261:function(e,t,o){o.d(t,{E:function(){return b}});var a=o(47635),r=o(77788),i=o(29592),n=o(31790),s=o(3525),l=o(38587),c=o(51229),d=o(83143),u=o(23932),m=o(20524),h=o(24578),v=o(73349),p=o(69952),f=o(62462),g=o(19778),x=o(10875);function b(e,t){const{vertex:o,fragment:b,varyings:w}=e,{hasColorTexture:M,alphaDiscardMode:T}=t,y=M&&T!==x.sf.Opaque,{output:S,normalType:C,hasColorTextureTransform:O}=t;switch(S){case r.V.Depth:(0,p.NB)(o,t),e.include(n.d,t),b.include(i.HQ,t),e.include(c.U,t),y&&b.uniforms.add(new g.N("tex",(e=>e.texture))),o.main.add(f.H`vpos = getVertexInLocalOriginSpace();
vpos = subtractOrigin(vpos);
vpos = addVerticalOffset(vpos, localOrigin);
gl_Position = transformPosition(proj, view, vpos);
forwardTextureCoordinates();`),e.include(v.S,t),b.main.add(f.H`
        discardBySlice(vpos);
        ${(0,f.If)(y,f.H`vec4 texColor = texture(tex, ${O?"colorUV":"vuv0"});
                discardOrAdjustAlpha(texColor);`)}`);break;case r.V.Shadow:case r.V.ShadowHighlight:case r.V.ShadowExcludeHighlight:case r.V.ViewshedShadow:case r.V.ObjectAndLayerIdColor:(0,p.NB)(o,t),e.include(n.d,t),e.include(c.U,t),e.include(h.A,t),e.include(u.L,t),b.include(i.HQ,t),e.include(l.g,t),(0,a.xJ)(e),w.add("depth","float",{invariant:!0}),y&&b.uniforms.add(new g.N("tex",(e=>e.texture))),o.main.add(f.H`vpos = getVertexInLocalOriginSpace();
vpos = subtractOrigin(vpos);
vpos = addVerticalOffset(vpos, localOrigin);
gl_Position = transformPositionWithDepth(proj, view, vpos, nearFar, depth);
forwardTextureCoordinates();
forwardObjectAndLayerIdColor();`),e.include(v.S,t),b.main.add(f.H`
        discardBySlice(vpos);
        ${(0,f.If)(y,f.H`vec4 texColor = texture(tex, ${O?"colorUV":"vuv0"});
                discardOrAdjustAlpha(texColor);`)}
        ${S===r.V.ObjectAndLayerIdColor?f.H`outputObjectAndLayerIdColor();`:f.H`outputDepth(depth);`}`);break;case r.V.Normal:{(0,p.NB)(o,t),e.include(n.d,t),e.include(s.Y,t),e.include(d.Mh,t),e.include(c.U,t),e.include(h.A,t),y&&b.uniforms.add(new g.N("tex",(e=>e.texture))),C===s.W.ScreenDerivative&&w.add("vPositionView","vec3",{invariant:!0});const a=C===s.W.Attribute||C===s.W.Compressed;o.main.add(f.H`
        vpos = getVertexInLocalOriginSpace();
        ${a?f.H`vNormalWorld = dpNormalView(vvLocalNormal(normalModel()));`:f.H`vPositionView = (view * vec4(vpos, 1.0)).xyz;`}
        vpos = subtractOrigin(vpos);
        vpos = addVerticalOffset(vpos, localOrigin);
        gl_Position = transformPosition(proj, view, vpos);
        forwardTextureCoordinates();`),b.include(i.HQ,t),e.include(v.S,t),b.main.add(f.H`
        discardBySlice(vpos);
        ${(0,f.If)(y,f.H`vec4 texColor = texture(tex, ${O?"colorUV":"vuv0"});
                discardOrAdjustAlpha(texColor);`)}

        ${C===s.W.ScreenDerivative?f.H`vec3 normal = screenDerivativeNormal(vPositionView);`:f.H`vec3 normal = normalize(vNormalWorld);
                    if (gl_FrontFacing == false){
                      normal = -normal;
                    }`}
        fragColor = vec4(0.5 + 0.5 * normal, 1.0);`);break}case r.V.Highlight:(0,p.NB)(o,t),e.include(n.d,t),e.include(c.U,t),e.include(h.A,t),y&&b.uniforms.add(new g.N("tex",(e=>e.texture))),o.main.add(f.H`vpos = getVertexInLocalOriginSpace();
vpos = subtractOrigin(vpos);
vpos = addVerticalOffset(vpos, localOrigin);
gl_Position = transformPosition(proj, view, vpos);
forwardTextureCoordinates();`),b.include(i.HQ,t),e.include(v.S,t),e.include(m.Q,t),b.main.add(f.H`
        discardBySlice(vpos);
        ${(0,f.If)(y,f.H`vec4 texColor = texture(tex, ${O?"colorUV":"vuv0"});
                discardOrAdjustAlpha(texColor);`)}
        calculateOcclusionAndOutputHighlight();`)}}},38716:function(e,t,o){o.d(t,{R:function(){return P},b:function(){return G}});var a=o(47635),r=o(29785),i=o(77788),n=o(29592),s=o(31790),l=o(32728),c=o(3525),d=o(79887),u=o(51229),m=o(73713),h=o(11255),v=o(36261),p=o(87646),f=o(28382),g=o(40574),x=o(75762),b=o(35212),w=o(73229),M=o(85807),T=o(24578),y=o(73349),S=o(79377),C=o(69952),O=o(64802),N=o(92121),E=o(19635),z=o(62462),I=o(19778),H=o(33763),A=o(288),_=o(43398),L=o(76221);function G(e){const t=new _.N5,{attributes:o,vertex:G,fragment:P,varyings:R}=t,{output:D,offsetBackfaces:V,instancedColor:W,pbrMode:B,snowCover:F,spherical:j,hasBloom:U}=e,Y=B===b.A9.Normal||B===b.A9.Schematic;if((0,C.NB)(G,e),o.add(H.r.POSITION,"vec3"),R.add("vpos","vec3",{invariant:!0}),t.include(T.A,e),t.include(l.B,e),t.include(h.G,e),t.include(M.Z,e),(0,i.RN)(D)&&((0,C.yu)(t.vertex,e),t.include(c.Y,e),t.include(s.d,e),V&&t.include(r.M),W&&t.attributes.add(H.r.INSTANCECOLOR,"vec4"),R.add("vNormalWorld","vec3"),R.add("localvpos","vec3",{invariant:!0}),t.include(u.U,e),t.include(a.oD,e),t.include(d.K,e),t.include(m.c,e),G.uniforms.add(new N.E("externalColor",(e=>e.externalColor))),R.add("vcolorExt","vec4"),G.main.add(z.H`
      forwardNormalizedVertexColor();
      vcolorExt = externalColor;
      ${(0,z.If)(W,"vcolorExt *= instanceColor * 0.003921568627451;")}
      vcolorExt *= vvColor();
      vcolorExt *= getSymbolColor();
      forwardColorMixMode();

      bool alphaCut = vcolorExt.a < ${z.H.float(L.Q)};
      vpos = getVertexInLocalOriginSpace();
      localvpos = vpos - view[3].xyz;
      vpos = subtractOrigin(vpos);
      vNormalWorld = dpNormal(vvLocalNormal(normalModel()));
      vpos = addVerticalOffset(vpos, localOrigin);
      vec4 basePosition = transformPosition(proj, view, vpos);

      forwardViewPosDepth((view * vec4(vpos, 1.0)).xyz);
      forwardLinearDepth();
      forwardTextureCoordinates();

      gl_Position = alphaCut ? vec4(1e38, 1e38, 1e38, 1.0) :
      ${(0,z.If)(V,"offsetBackfacingClipPosition(basePosition, vpos, vNormalWorld, cameraPosition);","basePosition;")}
    `)),(0,i.RN)(D)){const{hasColorTexture:o,hasColorTextureTransform:a,receiveShadows:r}=e;t.include(f.kA,e),P.include(p.n,e),t.include(y.S,e),t.include(e.instancedDoublePrecision?w.G:w.Bz,e),P.include(n.HQ,e),t.include(A.z,e),(0,C.yu)(P,e),(0,g.Gc)(P),(0,f.a8)(P),(0,f.eU)(P),P.uniforms.add(G.uniforms.get("localOrigin"),G.uniforms.get("view"),new O.t("ambient",(e=>e.ambient)),new O.t("diffuse",(e=>e.diffuse)),new E.m("opacity",(e=>e.opacity)),new E.m("layerOpacity",(e=>e.layerOpacity))),o&&P.uniforms.add(new I.N("tex",(e=>e.texture))),t.include(b._Z,e),P.include(x.c,e),P.include(S.N),(0,g.O4)(P),P.main.add(z.H`
      discardBySlice(vpos);
      discardByTerrainDepth();
      vec4 texColor = ${o?`texture(tex, ${a?"colorUV":"vuv0"})`:" vec4(1.0)"};
      ${(0,z.If)(o,`${(0,z.If)(e.textureAlphaPremultiplied,"texColor.rgb /= texColor.a;")}\n        discardOrAdjustAlpha(texColor);`)}
      vec3 viewDirection = normalize(vpos - cameraPosition);
      applyPBRFactors();
      float ssao = evaluateAmbientOcclusionInverse();
      ssao *= getBakedOcclusion();

      float additionalAmbientScale = additionalDirectedAmbientLight(vpos + localOrigin);
      vec3 additionalLight = ssao * mainLightIntensity * additionalAmbientScale * ambientBoostFactor * lightingGlobalFactor;
      float shadow = ${r?"max(lightingGlobalFactor * (1.0 - additionalAmbientScale), readShadowMap(vpos, linearDepth))":j?"lightingGlobalFactor * (1.0 - additionalAmbientScale)":"0.0"};
      vec3 matColor = max(ambient, diffuse);
      ${e.hasVertexColors?z.H`vec3 albedo = mixExternalColor(vColor.rgb * matColor, texColor.rgb, vcolorExt.rgb, int(colorMixMode));
             float opacity_ = layerOpacity * mixExternalOpacity(vColor.a * opacity, texColor.a, vcolorExt.a, int(colorMixMode));`:z.H`vec3 albedo = mixExternalColor(matColor, texColor.rgb, vcolorExt.rgb, int(colorMixMode));
             float opacity_ = layerOpacity * mixExternalOpacity(opacity, texColor.a, vcolorExt.a, int(colorMixMode));`}
      ${(0,z.If)(F,"albedo = mix(albedo, vec3(1), 0.9);")}
      ${z.H`vec3 shadingNormal = normalize(vNormalWorld);
             albedo *= 1.2;
             vec3 viewForward = vec3(view[0][2], view[1][2], view[2][2]);
             float alignmentLightView = clamp(dot(viewForward, -mainLightDirection), 0.0, 1.0);
             float transmittance = 1.0 - clamp(dot(viewForward, shadingNormal), 0.0, 1.0);
             float treeRadialFalloff = vColor.r;
             float backLightFactor = 0.5 * treeRadialFalloff * alignmentLightView * transmittance * (1.0 - shadow);
             additionalLight += backLightFactor * mainLightIntensity;`}
      ${(0,z.If)(Y,`vec3 normalGround = ${j?"normalize(vpos + localOrigin)":"vec3(0.0, 0.0, 1.0)"};`)}
      ${Y?z.H`float additionalAmbientIrradiance = additionalAmbientIrradianceFactor * mainLightIntensity[2];
                 ${(0,z.If)(F,z.H`mrr = applySnowToMRR(mrr, 1.0)`)}
            vec4 emission = ${F||U?"vec4(0.0)":"getEmissions(albedo)"};
            vec3 shadedColor = evaluateSceneLightingPBR(shadingNormal, albedo, shadow, 1.0 - ssao, additionalLight, viewDirection, normalGround, mrr, emission, additionalAmbientIrradiance);`:z.H`vec3 shadedColor = evaluateSceneLighting(shadingNormal, albedo, shadow, 1.0 - ssao, additionalLight);`}
      vec4 finalColor = vec4(shadedColor, opacity_);
      outputColorHighlightOID(finalColor, vpos, albedo ${(0,z.If)(F,", 1.0")});`)}return t.include(v.E,e),t}const P=Object.freeze(Object.defineProperty({__proto__:null,build:G},Symbol.toStringTag,{value:"Module"}))},43300:function(e,t,o){o.d(t,{S:function(){return b},b:function(){return f},g:function(){return g}});var a=o(53334),r=o(56560),i=o(28019),n=o(16937),s=o(36288),l=o(33),c=o(66579),d=o(41281),u=o(19635),m=o(62462),h=o(19778),v=o(43398);const p=16;function f(){const e=new v.N5,t=e.fragment;return e.include(i.c),e.include(s.Ir),t.include(n.E),t.uniforms.add(new d.U("radius",(e=>g(e.camera)))).code.add(m.H`vec3 sphere[16] = vec3[16](
vec3(0.186937, 0.0, 0.0),
vec3(0.700542, 0.0, 0.0),
vec3(-0.864858, -0.481795, -0.111713),
vec3(-0.624773, 0.102853, -0.730153),
vec3(-0.387172, 0.260319, 0.007229),
vec3(-0.222367, -0.642631, -0.707697),
vec3(-0.01336, -0.014956, 0.169662),
vec3(0.122575, 0.1544, -0.456944),
vec3(-0.177141, 0.85997, -0.42346),
vec3(-0.131631, 0.814545, 0.524355),
vec3(-0.779469, 0.007991, 0.624833),
vec3(0.308092, 0.209288,0.35969),
vec3(0.359331, -0.184533, -0.377458),
vec3(0.192633, -0.482999, -0.065284),
vec3(0.233538, 0.293706, -0.055139),
vec3(0.417709, -0.386701, 0.442449)
);
float fallOffFunction(float vv, float vn, float bias) {
float f = max(radius * radius - vv, 0.0);
return f * f * f * max(vn - bias, 0.0);
}`),t.code.add(m.H`float aoValueFromPositionsAndNormal(vec3 C, vec3 n_C, vec3 Q) {
vec3 v = Q - C;
float vv = dot(v, v);
float vn = dot(normalize(v), n_C);
return fallOffFunction(vv, vn, 0.1);
}`),e.outputs.add("fragOcclusion","float"),t.uniforms.add(new h.N("normalMap",(e=>e.normalTexture)),new h.N("depthMap",(e=>e.depthTexture)),new u.m("projScale",(e=>e.projScale)),new h.N("rnm",(e=>e.noiseTexture)),new c.G("rnmScale",((e,t)=>(0,a.hZ)(x,t.camera.fullWidth/e.noiseTexture.descriptor.width,t.camera.fullHeight/e.noiseTexture.descriptor.height))),new u.m("intensity",(e=>e.intensity)),new l.E("screenSize",(e=>(0,a.hZ)(x,e.camera.fullWidth,e.camera.fullHeight)))).main.add(m.H`
    float depth = depthFromTexture(depthMap, uv);

    // Early out if depth is out of range, such as in the sky
    if (depth >= 1.0 || depth <= 0.0) {
      fragOcclusion = 1.0;
      return;
    }

    // get the normal of current fragment
    ivec2 iuv = ivec2(uv * vec2(textureSize(normalMap, 0)));
    vec4 norm4 = texelFetch(normalMap, iuv, 0);
    if(norm4.a != 1.0) {
      fragOcclusion = 1.0;
      return;
    }
    vec3 norm = normalize(norm4.xyz * 2.0 - 1.0);

    float currentPixelDepth = linearizeDepth(depth);
    vec3 currentPixelPos = reconstructPosition(gl_FragCoord.xy, currentPixelDepth);

    float sum = 0.0;
    vec3 tapPixelPos;

    vec3 fres = normalize(2.0 * texture(rnm, uv * rnmScale).xyz - 1.0);

    // note: the factor 2.0 should not be necessary, but makes ssao much nicer.
    // bug or deviation from CE somewhere else?
    float ps = projScale / (2.0 * currentPixelPos.z * zScale.x + zScale.y);

    for(int i = 0; i < ${m.H.int(p)}; ++i) {
      vec2 unitOffset = reflect(sphere[i], fres).xy;
      vec2 offset = vec2(-unitOffset * radius * ps);

      // don't use current or very nearby samples
      if( abs(offset.x) < 2.0 || abs(offset.y) < 2.0){
        continue;
      }

      vec2 tc = vec2(gl_FragCoord.xy + offset);
      if (tc.x < 0.0 || tc.y < 0.0 || tc.x > screenSize.x || tc.y > screenSize.y) continue;
      vec2 tcTap = tc / screenSize;
      float occluderFragmentDepth = linearDepthFromTexture(depthMap, tcTap);

      tapPixelPos = reconstructPosition(tc, occluderFragmentDepth);

      sum += aoValueFromPositionsAndNormal(currentPixelPos, norm, tapPixelPos);
    }

    // output the result
    float A = max(1.0 - sum * intensity / float(${m.H.int(p)}), 0.0);

    // Anti-tone map to reduce contrast and drag dark region farther: (x^0.2 + 1.2 * x^4) / 2.2
    A = (pow(A, 0.2) + 1.2 * A * A * A * A) / 2.2;

    fragOcclusion = A;
  `),e}function g(e){return Math.max(10,20*e.computeScreenPixelSizeAtDist(Math.abs(4*e.relativeElevation)))}const x=(0,r.vt)(),b=Object.freeze(Object.defineProperty({__proto__:null,build:f,getRadius:g},Symbol.toStringTag,{value:"Module"}))},44118:function(e,t,o){o.d(t,{W:function(){return u}});var a=o(80347),r=o(19913),i=o(74772),n=o(76982),s=o(35212),l=o(9504),c=o(70751),d=o(62462);function u(e,t){const o=e.fragment,r=void 0!==t.lightingSphericalHarmonicsOrder?t.lightingSphericalHarmonicsOrder:2;0===r?(o.uniforms.add(new l.d("lightingAmbientSH0",(({lighting:e})=>(0,a.i)(m,e.sh.r[0],e.sh.g[0],e.sh.b[0])))),o.code.add(d.H`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec3 ambientLight = 0.282095 * lightingAmbientSH0;
return ambientLight * (1.0 - ambientOcclusion);
}`)):1===r?(o.uniforms.add(new c.I("lightingAmbientSH_R",(({lighting:e})=>(0,i.s)(h,e.sh.r[0],e.sh.r[1],e.sh.r[2],e.sh.r[3]))),new c.I("lightingAmbientSH_G",(({lighting:e})=>(0,i.s)(h,e.sh.g[0],e.sh.g[1],e.sh.g[2],e.sh.g[3]))),new c.I("lightingAmbientSH_B",(({lighting:e})=>(0,i.s)(h,e.sh.b[0],e.sh.b[1],e.sh.b[2],e.sh.b[3])))),o.code.add(d.H`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec4 sh0 = vec4(
0.282095,
0.488603 * normal.x,
0.488603 * normal.z,
0.488603 * normal.y
);
vec3 ambientLight = vec3(
dot(lightingAmbientSH_R, sh0),
dot(lightingAmbientSH_G, sh0),
dot(lightingAmbientSH_B, sh0)
);
return ambientLight * (1.0 - ambientOcclusion);
}`)):2===r&&(o.uniforms.add(new l.d("lightingAmbientSH0",(({lighting:e})=>(0,a.i)(m,e.sh.r[0],e.sh.g[0],e.sh.b[0]))),new c.I("lightingAmbientSH_R1",(({lighting:e})=>(0,i.s)(h,e.sh.r[1],e.sh.r[2],e.sh.r[3],e.sh.r[4]))),new c.I("lightingAmbientSH_G1",(({lighting:e})=>(0,i.s)(h,e.sh.g[1],e.sh.g[2],e.sh.g[3],e.sh.g[4]))),new c.I("lightingAmbientSH_B1",(({lighting:e})=>(0,i.s)(h,e.sh.b[1],e.sh.b[2],e.sh.b[3],e.sh.b[4]))),new c.I("lightingAmbientSH_R2",(({lighting:e})=>(0,i.s)(h,e.sh.r[5],e.sh.r[6],e.sh.r[7],e.sh.r[8]))),new c.I("lightingAmbientSH_G2",(({lighting:e})=>(0,i.s)(h,e.sh.g[5],e.sh.g[6],e.sh.g[7],e.sh.g[8]))),new c.I("lightingAmbientSH_B2",(({lighting:e})=>(0,i.s)(h,e.sh.b[5],e.sh.b[6],e.sh.b[7],e.sh.b[8])))),o.code.add(d.H`vec3 calculateAmbientIrradiance(vec3 normal, float ambientOcclusion) {
vec3 ambientLight = 0.282095 * lightingAmbientSH0;
vec4 sh1 = vec4(
0.488603 * normal.x,
0.488603 * normal.z,
0.488603 * normal.y,
1.092548 * normal.x * normal.y
);
vec4 sh2 = vec4(
1.092548 * normal.y * normal.z,
0.315392 * (3.0 * normal.z * normal.z - 1.0),
1.092548 * normal.x * normal.z,
0.546274 * (normal.x * normal.x - normal.y * normal.y)
);
ambientLight += vec3(
dot(lightingAmbientSH_R1, sh1),
dot(lightingAmbientSH_G1, sh1),
dot(lightingAmbientSH_B1, sh1)
);
ambientLight += vec3(
dot(lightingAmbientSH_R2, sh2),
dot(lightingAmbientSH_G2, sh2),
dot(lightingAmbientSH_B2, sh2)
);
return ambientLight * (1.0 - ambientOcclusion);
}`),t.pbrMode!==s.A9.Normal&&t.pbrMode!==s.A9.Schematic||o.code.add(d.H`const vec3 skyTransmittance = vec3(0.9, 0.9, 1.0);
vec3 calculateAmbientRadiance(float ambientOcclusion)
{
vec3 ambientLight = 1.2 * (0.282095 * lightingAmbientSH0) - 0.2;
return ambientLight *= (1.0 - ambientOcclusion) * skyTransmittance;
}`))}const m=(0,r.vt)(),h=(0,n.vt)()},50710:function(e,t,o){o.d(t,{W:function(){return p}});var a=o(79441),r=o(56560),i=o(51229),n=o(2169),s=o(23605),l=o(66579),c=o(62462),d=o(19835),u=o(29247),m=o(19778),h=o(33763),v=o(78455);function p(e,t){const o=e.fragment,{hasVertexTangents:p,doubleSidedMode:f,hasNormalTexture:g,textureCoordinateType:x,bindType:b,hasNormalTextureTransform:w}=t;p?(e.attributes.add(h.r.TANGENT,"vec4"),e.varyings.add("vTangent","vec4"),f===s.W.WindingOrder?o.code.add(c.H`mat3 computeTangentSpace(vec3 normal) {
float tangentHeadedness = gl_FrontFacing ? vTangent.w : -vTangent.w;
vec3 tangent = normalize(gl_FrontFacing ? vTangent.xyz : -vTangent.xyz);
vec3 bitangent = cross(normal, tangent) * tangentHeadedness;
return mat3(tangent, bitangent, normal);
}`):o.code.add(c.H`mat3 computeTangentSpace(vec3 normal) {
float tangentHeadedness = vTangent.w;
vec3 tangent = normalize(vTangent.xyz);
vec3 bitangent = cross(normal, tangent) * tangentHeadedness;
return mat3(tangent, bitangent, normal);
}`)):o.code.add(c.H`mat3 computeTangentSpace(vec3 normal, vec3 pos, vec2 st) {
vec3 Q1 = dFdx(pos);
vec3 Q2 = dFdy(pos);
vec2 stx = dFdx(st);
vec2 sty = dFdy(st);
float det = stx.t * sty.s - sty.t * stx.s;
vec3 T = stx.t * Q2 - sty.t * Q1;
T = T - normal * dot(normal, T);
T *= inversesqrt(max(dot(T,T), 1.e-10));
vec3 B = sign(det) * cross(normal, T);
return mat3(T, B, normal);
}`),g&&x!==i.I.None&&(e.include(n.r,t),o.uniforms.add(b===v.c.Pass?new m.N("normalTexture",(e=>e.textureNormal)):new u.o("normalTexture",(e=>e.textureNormal))),w&&(o.uniforms.add(new l.G("scale",(e=>e.scale??r.Un))),o.uniforms.add(new d.k("normalTextureTransformMatrix",(e=>e.normalTextureTransformMatrix??a.zK)))),o.code.add(c.H`vec3 computeTextureNormal(mat3 tangentSpace, vec2 uv) {
vec3 rawNormal = textureLookup(normalTexture, uv).rgb * 2.0 - 1.0;`),w&&o.code.add(c.H`mat3 normalRotation = mat3(normalTextureTransformMatrix[0][0]/scale[0], normalTextureTransformMatrix[0][1]/scale[1], 0.0,
normalTextureTransformMatrix[1][0]/scale[0], normalTextureTransformMatrix[1][1]/scale[1], 0.0,
0.0, 0.0, 0.0 );
rawNormal.xy = (normalRotation * vec3(rawNormal.x, rawNormal.y, 1.0)).xy;`),o.code.add(c.H`return tangentSpace * rawNormal;
}`))}},69563:function(e,t,o){o.d(t,{MU:function(){return c},O1:function(){return d},QM:function(){return u},Sx:function(){return l},q2:function(){return s}});var a=o(79441),r=o(51229),i=o(62462),n=o(19835);function s(e,t){t.hasColorTextureTransform?(e.varyings.add("colorUV","vec2"),e.vertex.uniforms.add(new n.k("colorTextureTransformMatrix",(e=>e.colorTextureTransformMatrix??a.zK))).code.add(i.H`void forwardColorUV(){
colorUV = (colorTextureTransformMatrix * vec3(vuv0, 1.0)).xy;
}`)):e.vertex.code.add(i.H`void forwardColorUV(){}`)}function l(e,t){t.hasNormalTextureTransform&&t.textureCoordinateType!==r.I.None?(e.varyings.add("normalUV","vec2"),e.vertex.uniforms.add(new n.k("normalTextureTransformMatrix",(e=>e.normalTextureTransformMatrix??a.zK))).code.add(i.H`void forwardNormalUV(){
normalUV = (normalTextureTransformMatrix * vec3(vuv0, 1.0)).xy;
}`)):e.vertex.code.add(i.H`void forwardNormalUV(){}`)}function c(e,t){t.hasEmissionTextureTransform&&t.textureCoordinateType!==r.I.None?(e.varyings.add("emissiveUV","vec2"),e.vertex.uniforms.add(new n.k("emissiveTextureTransformMatrix",(e=>e.emissiveTextureTransformMatrix??a.zK))).code.add(i.H`void forwardEmissiveUV(){
emissiveUV = (emissiveTextureTransformMatrix * vec3(vuv0, 1.0)).xy;
}`)):e.vertex.code.add(i.H`void forwardEmissiveUV(){}`)}function d(e,t){t.hasOcclusionTextureTransform&&t.textureCoordinateType!==r.I.None?(e.varyings.add("occlusionUV","vec2"),e.vertex.uniforms.add(new n.k("occlusionTextureTransformMatrix",(e=>e.occlusionTextureTransformMatrix??a.zK))).code.add(i.H`void forwardOcclusionUV(){
occlusionUV = (occlusionTextureTransformMatrix * vec3(vuv0, 1.0)).xy;
}`)):e.vertex.code.add(i.H`void forwardOcclusionUV(){}`)}function u(e,t){t.hasMetallicRoughnessTextureTransform&&t.textureCoordinateType!==r.I.None?(e.varyings.add("metallicRoughnessUV","vec2"),e.vertex.uniforms.add(new n.k("metallicRoughnessTextureTransformMatrix",(e=>e.metallicRoughnessTextureTransformMatrix??a.zK))).code.add(i.H`void forwardMetallicRoughnessUV(){
metallicRoughnessUV = (metallicRoughnessTextureTransformMatrix * vec3(vuv0, 1.0)).xy;
}`)):e.vertex.code.add(i.H`void forwardMetallicRoughnessUV(){}`)}},73229:function(e,t,o){o.d(t,{Bz:function(){return b},G:function(){return x},QR:function(){return g}});var a=o(19913),r=o(70751),i=o(62462),n=o(43809),s=o(78455),l=o(29162);class c extends l.n{constructor(e,t,o){super(e,"mat4",s.c.Draw,((o,a,r,i)=>o.setUniformMatrix4fv(e,t(a,r,i))),o)}}class d extends l.n{constructor(e,t,o){super(e,"mat4",s.c.Pass,((o,a,r)=>o.setUniformMatrix4fv(e,t(a,r))),o)}}var u=o(13439);u.Y;function m(e){e.fragment.uniforms.add(new d("shadowMapMatrix",((e,t)=>t.shadowMap.getShadowMapMatrices(e.origin)),4)),v(e)}function h(e){e.fragment.uniforms.add(new c("shadowMapMatrix",((e,t)=>t.shadowMap.getShadowMapMatrices(e.origin)),4)),v(e)}function v(e){const{fragment:t}=e;t.uniforms.add(new r.I("cascadeDistances",(e=>e.shadowMap.cascadeDistances)),new n.W("numCascades",(e=>e.shadowMap.numCascades))),t.code.add(i.H`const vec3 invalidShadowmapUVZ = vec3(0.0, 0.0, -1.0);
vec3 lightSpacePosition(vec3 _vpos, mat4 mat) {
vec4 lv = mat * vec4(_vpos, 1.0);
lv.xy /= lv.w;
return 0.5 * lv.xyz + vec3(0.5);
}
vec2 cascadeCoordinates(int i, ivec2 textureSize, vec3 lvpos) {
float xScale = float(textureSize.y) / float(textureSize.x);
return vec2((float(i) + lvpos.x) * xScale, lvpos.y);
}
vec3 calculateUVZShadow(in vec3 _worldPos, in float _linearDepth, in ivec2 shadowMapSize) {
int i = _linearDepth < cascadeDistances[1] ? 0 : _linearDepth < cascadeDistances[2] ? 1 : _linearDepth < cascadeDistances[3] ? 2 : 3;
if (i >= numCascades) {
return invalidShadowmapUVZ;
}
mat4 shadowMatrix = i == 0 ? shadowMapMatrix[0] : i == 1 ? shadowMapMatrix[1] : i == 2 ? shadowMapMatrix[2] : shadowMapMatrix[3];
vec3 lvpos = lightSpacePosition(_worldPos, shadowMatrix);
if (lvpos.z >= 1.0 || lvpos.x < 0.0 || lvpos.x > 1.0 || lvpos.y < 0.0 || lvpos.y > 1.0) {
return invalidShadowmapUVZ;
}
vec2 uvShadow = cascadeCoordinates(i, shadowMapSize, lvpos);
return vec3(uvShadow, lvpos.z);
}`)}function p(e){e.fragment.code.add(i.H`float readShadowMapUVZ(vec3 uvzShadow, sampler2DShadow _shadowMap) {
return texture(_shadowMap, uvzShadow);
}`)}class f extends l.n{constructor(e,t){super(e,"sampler2DShadow",s.c.Bind,((o,a)=>o.bindTexture(e,t(a))))}}class g extends u.Y{constructor(){super(...arguments),this.origin=(0,a.vt)()}}function x(e,t){t.receiveShadows&&(e.include(m),w(e))}function b(e,t){t.receiveShadows&&(e.include(h),w(e))}function w(e){e.include(p);const{fragment:t}=e;t.uniforms.add(new f("shadowMap",(e=>e.shadowMap.depthTexture))),t.code.add(i.H`float readShadowMap(const in vec3 _worldPos, float _linearDepth) {
vec3 uvzShadow = calculateUVZShadow(_worldPos, _linearDepth, textureSize(shadowMap,0));
if (uvzShadow.z < 0.0) {
return 0.0;
}
return readShadowMapUVZ(uvzShadow, shadowMap);
}`)}},73349:function(e,t,o){o.d(t,{S:function(){return s}});o(20146);var a=o(19635),r=o(62462),i=o(10875),n=o(76221);function s(e,t){l(e,t,new a.m("textureAlphaCutoff",(e=>e.textureAlphaCutoff)))}function l(e,t,o){const a=e.fragment,s=t.alphaDiscardMode,l=s===i.sf.Blend;s!==i.sf.Mask&&s!==i.sf.MaskBlend||a.uniforms.add(o),a.code.add(r.H`
    void discardOrAdjustAlpha(inout vec4 color) {
      ${s===i.sf.Opaque?"color.a = 1.0;":`if (color.a < ${l?r.H.float(n.Q):"textureAlphaCutoff"}) {\n              discard;\n             } ${(0,r.If)(s===i.sf.Mask,"else { color.a = 1.0; }")}`}
    }
  `)}},79377:function(e,t,o){o.d(t,{N:function(){return n}});var a=o(96153),r=o(83660),i=o(62462);function n(e){e.include(r.a),e.code.add(i.H`
    vec3 mixExternalColor(vec3 internalColor, vec3 textureColor, vec3 externalColor, int mode) {
      // workaround for artifacts in macOS using Intel Iris Pro
      // see: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/10475
      vec3 internalMixed = internalColor * textureColor;
      vec3 allMixed = internalMixed * externalColor;

      if (mode == ${i.H.int(a.k5.Multiply)}) {
        return allMixed;
      }
      if (mode == ${i.H.int(a.k5.Ignore)}) {
        return internalMixed;
      }
      if (mode == ${i.H.int(a.k5.Replace)}) {
        return externalColor;
      }

      // tint (or something invalid)
      float vIn = rgb2v(internalMixed);
      vec3 hsvTint = rgb2hsv(externalColor);
      vec3 hsvOut = vec3(hsvTint.x, hsvTint.y, vIn * hsvTint.z);
      return hsv2rgb(hsvOut);
    }

    float mixExternalOpacity(float internalOpacity, float textureOpacity, float externalOpacity, int mode) {
      // workaround for artifacts in macOS using Intel Iris Pro
      // see: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/10475
      float internalMixed = internalOpacity * textureOpacity;
      float allMixed = internalMixed * externalOpacity;

      if (mode == ${i.H.int(a.k5.Ignore)}) {
        return internalMixed;
      }
      if (mode == ${i.H.int(a.k5.Replace)}) {
        return externalOpacity;
      }

      // multiply or tint (or something invalid)
      return allMixed;
    }
  `)}},79887:function(e,t,o){o.d(t,{K:function(){return l}});var a=o(89458),r=o(62462),i=o(88531),n=o(33763),s=o(73395);function l(e,t){t.hasSymbolColors?(e.include(a.A),e.attributes.add(n.r.SYMBOLCOLOR,"vec4"),e.varyings.add("colorMixMode","mediump float"),e.vertex.code.add(r.H`int symbolColorMixMode;
vec4 getSymbolColor() {
return decodeSymbolColor(symbolColor, symbolColorMixMode) * 0.003921568627451;
}
void forwardColorMixMode() {
colorMixMode = float(symbolColorMixMode) + 0.5;
}`)):(e.fragment.uniforms.add(new i.c("colorMixMode",(e=>s.Um[e.colorMixMode]))),e.vertex.code.add(r.H`vec4 getSymbolColor() { return vec4(1.0); }
void forwardColorMixMode() {}`))}},82955:function(e,t,o){o.d(t,{b:function(){return r}});var a=o(62462);function r(e,t){t.snowCover&&(e.code.add(a.H`float getSnow(vec3 normal, vec3 normalGround) {
return smoothstep(0.5, 0.55, dot(normal, normalGround));
}`),e.code.add(a.H`vec3 applySnowToMRR(vec3 mrr, float snow) {
return mix(mrr, vec3(0.0, 1.0, 0.04), snow);
}
vec4 snowCoverForEmissions(vec4 emission, float snow) {
return mix(emission, vec4(0.0), snow);
}`))}},83143:function(e,t,o){o.d(t,{Mh:function(){return u},Zo:function(){return m},gy:function(){return h}});var a=o(17420),r=o(79441),i=o(76982),n=o(3525),s=o(41359),l=o(62462),c=o(26746),d=o(19835);function u(e,t){switch(t.normalType){case n.W.Attribute:case n.W.Compressed:e.include(n.Y,t),e.varyings.add("vNormalWorld","vec3"),e.varyings.add("vNormalView","vec3"),e.vertex.uniforms.add(new c.h("transformNormalGlobalFromModel",(e=>e.transformNormalGlobalFromModel)),new d.k("transformNormalViewFromGlobal",(e=>e.transformNormalViewFromGlobal))),e.vertex.code.add(l.H`void forwardNormal() {
vNormalWorld = transformNormalGlobalFromModel * normalModel();
vNormalView = transformNormalViewFromGlobal * vNormalWorld;
}`);break;case n.W.ScreenDerivative:e.vertex.code.add(l.H`void forwardNormal() {}`);break;default:(0,a.Xb)(t.normalType);case n.W.COUNT:}}class m extends s.dO{constructor(){super(...arguments),this.transformNormalViewFromGlobal=(0,r.vt)()}}class h extends s.EM{constructor(){super(...arguments),this.transformNormalGlobalFromModel=(0,r.vt)(),this.toMapSpace=(0,i.vt)()}}},83244:function(e,t,o){o.d(t,{R5:function(){return T},V:function(){return M},uD:function(){return w}});var a=o(19913),r=o(76982),i=o(30361),n=o(77788),s=o(3525),l=o(83143),c=o(21979),d=o(50837),u=o(10875),m=o(31272),h=o(8445),v=o(28116),p=o(40327),f=o(12668),g=o(68716),x=o(15651),b=o(76221);class w extends l.Zo{constructor(){super(...arguments),this.isSchematic=!1,this.usePBR=!1,this.mrrFactors=p.mb,this.hasVertexColors=!1,this.hasSymbolColors=!1,this.doubleSided=!1,this.doubleSidedType="normal",this.cullFace=u.s2.Back,this.isInstanced=!1,this.hasInstancedColor=!1,this.emissiveStrength=0,this.emissiveSource=i.YJ.Color,this.emissiveBaseColor=a.uY,this.instancedDoublePrecision=!1,this.normalType=s.W.Attribute,this.receiveShadows=!0,this.receiveAmbientOcclusion=!0,this.castShadows=!0,this.ambient=(0,a.CN)(.2,.2,.2),this.diffuse=(0,a.CN)(.8,.8,.8),this.externalColor=(0,r.fA)(1,1,1,1),this.colorMixMode="multiply",this.opacity=1,this.layerOpacity=1,this.origin=(0,a.vt)(),this.hasSlicePlane=!1,this.offsetTransparentBackfaces=!1,this.vvSize=null,this.vvColor=null,this.vvOpacity=null,this.vvSymbolAnchor=null,this.vvSymbolRotationMatrix=null,this.modelTransformation=null,this.drivenOpacity=!1,this.writeDepth=!0,this.customDepthTest=u.it.Less,this.textureAlphaMode=u.sf.Blend,this.textureAlphaCutoff=b.Q,this.textureAlphaPremultiplied=!1,this.renderOccluded=m.m$.Occlude,this.isDecoration=!1}}class M extends l.gy{constructor(){super(...arguments),this.origin=(0,a.vt)(),this.slicePlaneLocalOrigin=this.origin}}class T extends d.w{constructor(e,t,a=new c.$(f.D,(()=>o.e(1084).then(o.bind(o,41084))))){super(e,t,a),this.type="DefaultMaterialTechnique"}_makePipeline(e,t){const{oitPass:o,output:a,transparent:r,cullFace:i,customDepthTest:s,hasOccludees:l}=e;return(0,x.Ey)({blending:(0,n.RN)(a)&&r?(0,h.Yf)(o):null,culling:S(e)?(0,x.Xt)(i):null,depthTest:{func:(0,h.K_)(o,y(s))},depthWrite:(0,h.z5)(e),drawBuffers:(0,d.L)(a,(0,h.m6)(o,a)),colorWrite:x.kn,stencilWrite:l?v.v0:null,stencilTest:l?t?v.a9:v.qh:null,polygonOffset:(0,h.mE)(e)})}initializePipeline(e){return this._occludeePipelineState=this._makePipeline(e,!0),this._makePipeline(e,!1)}getPipeline(e){return e?this._occludeePipelineState:super.getPipeline()}}function y(e){return e===u.it.Lequal?g.MT.LEQUAL:g.MT.LESS}function S(e){return e.cullFace!==u.s2.None||!e.hasSlicePlane&&!e.transparent&&!e.doubleSidedMode}},87646:function(e,t,o){o.d(t,{n:function(){return R}});var a=o(62462),r=o(96384),i=o(82392),n=o(4506),s=o(57725),l=o(61985),c=o(67900),d=o(81482),u=(o(6273),o(80861),o(67498),o(26325)),m=o(53334),h=o(28251),v=o(84586),p=o(91886),f=o(60060),g=o(21979),x=o(50837),b=o(26599),w=o(15651);class M extends x.w{constructor(e,t){super(e,t,new g.$(b.S,(()=>o.e(3271).then(o.bind(o,43271)))))}initializePipeline(){return(0,w.Ey)({colorWrite:w.kn})}}var T=o(56560),y=o(13439);class S extends y.Y{constructor(){super(...arguments),this.projScale=1}}class C extends S{constructor(){super(...arguments),this.intensity=1}}class O extends y.Y{}class N extends O{constructor(){super(...arguments),this.blurSize=(0,T.vt)()}}var E=o(43300);class z extends x.w{constructor(e,t){super(e,t,new g.$(E.S,(()=>o.e(1348).then(o.bind(o,81348)))))}initializePipeline(){return(0,w.Ey)({colorWrite:w.kn})}}var I=o(10875),H=o(68716),A=o(22497),_=o(88416);const L=2;let G=class extends v.A{constructor(e){super(e),this.consumes={required:["normals"]},this.produces=h.OG.SSAO,this.isEnabled=()=>!1,this._enableTime=(0,c.l5)(0),this._passParameters=new C,this._drawParameters=new N}initialize(){const e=Uint8Array.from(atob("eXKEvZaUc66cjIKElE1jlJ6MjJ6Ufkl+jn2fcXp5jBx7c6KEflSGiXuXeW6OWs+tfqZ2Yot2Y7Zzfo2BhniEj3xoiXuXj4eGZpqEaHKDWjSMe7palFlzc3BziYOGlFVzg6Zzg7CUY5JrjFF7eYJ4jIKEcyyEonSXe7qUfqZ7j3xofqZ2c4R5lFZ5Y0WUbppoe1l2cIh2ezyUho+BcHN2cG6DbpqJhqp2e1GcezhrdldzjFGUcyxjc3aRjDyEc1h7Sl17c6aMjH92pb6Mjpd4dnqBjMOEhqZleIOBYzB7gYx+fnqGjJuEkWlwnCx7fGl+c4hjfGyRe5qMlNOMfnqGhIWHc6OMi4GDc6aMfqZuc6aMzqJzlKZ+lJ6Me3qRfoFue0WUhoR5UraEa6qMkXiPjMOMlJOGe7JrUqKMjK6MeYRzdod+Sl17boiPc6qEeYBlcIh2c1WEe7GDiWCDa0WMjEmMdod+Y0WcdntzhmN8WjyMjKJjiXtzgYxYaGd+a89zlEV7e2GJfnd+lF1rcK5zc4p5cHuBhL6EcXp5eYB7fnh8iX6HjIKEeaxuiYOGc66RfG2Ja5hzjlGMjEmMe9OEgXuPfHyGhPeEdl6JY02McGuMfnqGhFiMa3WJfnx2l4hwcG1uhmN8c0WMc39og1GBbrCEjE2EZY+JcIh2cIuGhIWHe0mEhIVrc09+gY5+eYBlnCyMhGCDl3drfmmMgX15aGd+gYx+fnuRfnhzY1SMsluJfnd+hm98WtNrcIuGh4SEj0qPdkqOjFF7jNNjdnqBgaqUjMt7boeBhnZ4jDR7c5pze4GGjEFrhLqMjHyMc0mUhKZze4WEa117kWlwbpqJjHZ2eX2Bc09zeId+e0V7WlF7jHJ2l72BfId8l3eBgXyBe897jGl7c66cgW+Xc76EjKNbgaSEjGx4fId8jFFjgZB8cG6DhlFziZhrcIh2fH6HgUqBgXiPY8dahGFzjEmMhEFre2dxhoBzc5SGfleGe6alc7aUeYBlhKqUdlp+cH5za4OEczxza0Gcc4J2jHZ5iXuXjH2Jh5yRjH2JcFx+hImBjH+MpddCl3dreZeJjIt8ZW18bm1zjoSEeIOBlF9oh3N7hlqBY4+UeYFwhLJjeYFwaGd+gUqBYxiEYot2fqZ2ondzhL6EYyiEY02Ea0VjgZB8doaGjHxoc66cjEGEiXuXiXWMiZhreHx8frGMe75rY02Ec5pzfnhzlEp4a3VzjM+EhFFza3mUY7Zza1V5e2iMfGyRcziEhDyEkXZ2Y4OBnCx7g5t2eyBjgV6EhEFrcIh2dod+c4Z+nJ5zjm15jEmUeYxijJp7nL6clIpjhoR5WrZraGd+fnuRa6pzlIiMg6ZzfHx5foh+eX1ufnB5eX1ufnB5aJt7UqKMjIh+e3aBfm5lbYSBhGFze6J4c39oc0mUc4Z+e0V7fKFVe0WEdoaGY02Ec4Z+Y02EZYWBfH6HgU1+gY5+hIWUgW+XjJ57ebWRhFVScHuBfJ6PhBx7WqJzlM+Ujpd4gHZziX6HjHmEgZN+lJt5boiPe2GJgX+GjIGJgHZzeaxufnB5hF2JtdN7jJ57hp57hK6ElFVzg6ZzbmiEbndzhIWHe3uJfoFue3qRhJd2j3xoc65zlE1jc3p8lE1jhniEgXJ7e657vZaUc3qBh52BhIF4aHKDa9drgY5+c52GWqZzbpqJe8tjnM+UhIeMfo2BfGl+hG1zSmmMjKJjZVaGgX15c1lze0mEp4OHa3mUhIWHhDyclJ6MeYOJkXiPc0VzhFiMlKaEboSJa5Jze41re3qRhn+HZYWBe0mEc4p5fnORbox5lEp4hGFjhGGEjJuEc1WEhLZjeHeGa7KlfHx2hLaMeX1ugY5+hIWHhKGPjMN7c1WEho1zhoBzZYx7fnhzlJt5exyUhFFziXtzfmmMa6qMYyiEiXxweV12kZSMeWqXSl17fnhzxmmMrVGEe1mcc4p5eHeGjK6MgY5+doaGa6pzlGV7g1qBh4KHkXiPeW6OaKqafqZ2eXZ5e1V7jGd7boSJc3BzhJd2e0mcYot2h1RoY8dahK6EQmWEWjx7e1l2lL6UgXyBdnR4eU9zc0VreX1umqaBhld7fo2Bc6KEc5Z+hDyEcIeBWtNrfHyGe5qMhMuMe5qMhEGEbVVupcNzg3aHhIF4boeBe0mEdlptc39ofFl5Y8uUlJOGiYt2UmGEcyxjjGx4jFF7a657ZYWBnElzhp57iXtrgZN+tfOEhIOBjE2HgU1+e8tjjKNbiWCDhE15gUqBgYN7fnqGc66ce9d7iYSBj0qPcG6DnGGcT3eGa6qMZY+JlIiMl4hwc3aRdnqBlGV7eHJ2hLZjfnuRhDyEeX6MSk17g6Z+c6aUjHmEhIF4gXyBc76EZW18fGl+fkl+jCxrhoVwhDyUhIqGlL2DlI6EhJd2tdN7eYORhEGMa2Faa6pzc3Bzc4R5lIRznM+UY9eMhDycc5Z+c4p5c4iGY117pb6MgXuPrbJafnx2eYOJeXZ5e657hDyEcziElKZjfoB5eHeGj4WRhGGEe6KGeX1utTStc76EhFGJnCyMa5hzfH6HnNeceYB7hmN8gYuMhIVrczSMgYF8h3N7c5pza5hzjJqEYIRdgYuMlL2DeYRzhGGEeX1uhLaEc4iGeZ1zdl6JhrVteX6Me2iMfm5lWqJzSpqEa6pzdnmchHx2c6OMhNdrhoR5g3aHczxzeW52gV6Ejm15frGMc0Vzc4Z+l3drfniJe+9rWq5rlF1rhGGEhoVwe9OEfoh+e7pac09+c3qBY0lrhDycdnp2lJ6MiYOGhGCDc3aRlL2DlJt5doaGdnp2gYF8gWeOjF2Uc4R5c5Z+jEmMe7KEc4mEeYJ4dmyBe0mcgXiPbqJ7eYB7fmGGiYSJjICGlF1reZ2PnElzbpqJfH6Hc39oe4WEc5eJhK6EhqyJc3qBgZB8c09+hEmEaHKDhFGJc5SGiXWMUpaEa89zc6OMnCyMiXtrho+Be5qMc7KEjJ57dmN+hKGPjICGbmiEe7prdod+hGCDdnmchBx7eX6MkXZ2hGGEa657hm98jFFjY5JreYOJgY2EjHZ2a295Y3FajJ6Mc1J+YzB7e4WBjF2Uc4R5eV12gYxzg1qBeId+c9OUc5pzjFFjgY5+hFiMlIaPhoR5lIpjjIKBlNdSe7KEeX2BfrGMhIqGc65zjE2UhK6EklZ+QmWEeziMWqZza3VzdnR4foh+gYF8n3iJiZhrnKp7gYF8eId+lJ6Me1lrcIuGjKJjhmN8c66MjFF7a6prjJ6UnJ5zezyUfruRWlF7nI5zfHyGe657h4SEe8tjhBx7jFFjc09+c39ojICMeZeJeXt+YzRzjHZ2c0WEcIeBeXZ5onSXkVR+gYJ+eYFwdldzgYF7eX2BjJ6UiXuXlE1jh4SEe1mchLJjc4Z+hqZ7eXZ5bm1zlL6Ue5p7iWeGhKqUY5pzjKJjcIeBe8t7gXyBYIRdlEp4a3mGnK6EfmmMZpqEfFl5gYxzjKZuhGFjhoKGhHx2fnx2eXuMe3aBiWeGvbKMe6KGa5hzYzB7gZOBlGV7hmN8hqZlYot2Y117a6pzc6KEfId8foB5rctrfneJfJ6PcHN2hFiMc5pzjH92c0VzgY2EcElzdmCBlFVzg1GBc65zY4OBboeBcHiBeYJ4ewxzfHx5lIRzlEmEnLKEbk1zfJ6PhmN8eYBljBiEnMOEiXxwezyUcIeBe76EdsKEeX2BdnR4jGWUrXWMjGd7fkl+j4WRlEGMa5Jzho+BhDyEfnqMeXt+g3aHlE1jczClhNN7ZW18eHx8hGFjZW18iXWMjKJjhH57gYuMcIuGWjyMe4ZtjJuExmmMj4WRdntzi4GDhFFzYIRdnGGcjJp7Y0F7e4WEkbCGiX57fnSHa657a6prhBCMe3Z+SmmMjH92eHJ2hK6EY1FzexhrvbKMnI5za4OEfnd+eXuMhImBe897hLaMjN+EfG+BeIOBhF1+eZeJi4GDkXZ2eXKEgZ6Ejpd4c2GHa1V5e5KUfqZuhCx7jKp7lLZrg11+hHx2hFWUoot2nI5zgbh5mo9zvZaUe3qRbqKMfqZ2kbCGhFiM"),(e=>e.charCodeAt(0))),t=new _.R;t.wrapMode=H.pF.CLAMP_TO_EDGE,t.pixelFormat=H.Ab.RGB,t.wrapMode=H.pF.REPEAT,t.hasMipmap=!0,t.width=32,t.height=32,this._passParameters.noiseTexture=new A.g(this.renderingContext,t,e),this.techniques.precompile(z),this.techniques.precompile(M),this.addHandles((0,l.wB)((()=>this.isEnabled()),(()=>this._enableTime=(0,c.l5)(0))))}destroy(){this._passParameters.noiseTexture=(0,s.WD)(this._passParameters.noiseTexture)}render(e){const t=e.find((({name:e})=>"normals"===e)),o=t?.getTexture(),a=t?.getTexture(H.nI);if(!o||!a)return;const r=this.techniques.get(z),i=this.techniques.get(M);if(!r.compiled||!i.compiled)return this._enableTime=(0,c.l5)(performance.now()),void this.requestRender(I.C7.UPDATE);0===this._enableTime&&(this._enableTime=(0,c.l5)(performance.now()));const s=this.renderingContext,l=this.view.qualitySettings.fadeDuration,d=this.bindParameters,u=d.camera,v=u.relativeElevation,g=(0,n.qE)((f.b-v)/(f.b-f.O),0,1),x=l>0?Math.min(l,performance.now()-this._enableTime)/l:1,b=x*g;this._passParameters.normalTexture=o,this._passParameters.depthTexture=a,this._passParameters.projScale=1/u.computeScreenPixelSizeAtDist(1),this._passParameters.intensity=4*P/(0,E.g)(u)**6*b;const w=u.fullViewport[2],T=u.fullViewport[3],y=this.fboCache.acquire(w,T,"ssao input",p.NV.RG8UNORM);s.bindFramebuffer(y.fbo),s.setViewport(0,0,w,T),s.bindTechnique(r,d,this._passParameters,this._drawParameters),s.screen.draw();const S=Math.round(w/L),C=Math.round(T/L),O=this.fboCache.acquire(S,C,"ssao blur",p.NV.R8UNORM);s.bindFramebuffer(O.fbo),this._drawParameters.colorTexture=y.getTexture(),(0,m.hZ)(this._drawParameters.blurSize,0,L/T),s.bindTechnique(i,d,this._passParameters,this._drawParameters),s.setViewport(0,0,S,C),s.screen.draw(),y.release();const N=this.fboCache.acquire(S,C,h.OG.SSAO,p.NV.R8UNORM);return s.bindFramebuffer(N.fbo),s.setViewport(0,0,w,T),s.setClearColor(1,1,1,0),s.clear(H.NV.COLOR),this._drawParameters.colorTexture=O.getTexture(),(0,m.hZ)(this._drawParameters.blurSize,L/w,0),s.bindTechnique(i,d,this._passParameters,this._drawParameters),s.setViewport(0,0,S,C),s.screen.draw(),s.setViewport4fv(u.fullViewport),O.release(),x<1&&this.requestRender(I.C7.UPDATE),N}};(0,i._)([(0,d.MZ)()],G.prototype,"consumes",void 0),(0,i._)([(0,d.MZ)()],G.prototype,"produces",void 0),(0,i._)([(0,d.MZ)({constructOnly:!0})],G.prototype,"isEnabled",void 0),G=(0,i._)([(0,u.$)("esri.views.3d.webgl-engine.effects.ssao.SSAO")],G);const P=.5;function R(e,t){t.receiveAmbientOcclusion?(e.uniforms.add(new r.x("ssaoTex",(e=>e.ssao?.getTexture()))),e.constants.add("blurSizePixelsInverse","float",1/L),e.code.add(a.H`float evaluateAmbientOcclusionInverse() {
vec2 ssaoTextureSizeInverse = 1.0 / vec2(textureSize(ssaoTex, 0));
return texture(ssaoTex, gl_FragCoord.xy * blurSizePixelsInverse * ssaoTextureSizeInverse).r;
}
float evaluateAmbientOcclusion() {
return 1.0 - evaluateAmbientOcclusionInverse();
}`)):e.code.add(a.H`float evaluateAmbientOcclusionInverse() { return 1.0; }
float evaluateAmbientOcclusion() { return 0.0; }`)}},89458:function(e,t,o){o.d(t,{A:function(){return i}});var a=o(96153),r=o(62462);function i(e){e.vertex.code.add(r.H`
    vec4 decodeSymbolColor(vec4 symbolColor, out int colorMixMode) {
      float symbolAlpha = 0.0;

      const float maxTint = 85.0;
      const float maxReplace = 170.0;
      const float scaleAlpha = 3.0;

      if (symbolColor.a > maxReplace) {
        colorMixMode = ${r.H.int(a.k5.Multiply)};
        symbolAlpha = scaleAlpha * (symbolColor.a - maxReplace);
      } else if (symbolColor.a > maxTint) {
        colorMixMode = ${r.H.int(a.k5.Replace)};
        symbolAlpha = scaleAlpha * (symbolColor.a - maxTint);
      } else if (symbolColor.a > 0.0) {
        colorMixMode = ${r.H.int(a.k5.Tint)};
        symbolAlpha = scaleAlpha * symbolColor.a;
      } else {
        colorMixMode = ${r.H.int(a.k5.Multiply)};
        symbolAlpha = 0.0;
      }

      return vec4(symbolColor.r, symbolColor.g, symbolColor.b, symbolAlpha);
    }
  `)}},96153:function(e,t,o){o.d(t,{Eb:function(){return n},_j:function(){return s},k5:function(){return a}});var a,r,i=o(4506);function n(e){switch(e){case"multiply":default:return a.Multiply;case"ignore":return a.Ignore;case"replace":return a.Replace;case"tint":return a.Tint}}function s(e,t,o){if(null==e||t===a.Ignore)return o[0]=255,o[1]=255,o[2]=255,void(o[3]=255);const r=(0,i.qE)(Math.round(e[3]*c),0,c),n=0===r||t===a.Tint?0:t===a.Replace?d:u;o[0]=(0,i.qE)(Math.round(e[0]*l),0,l),o[1]=(0,i.qE)(Math.round(e[1]*l),0,l),o[2]=(0,i.qE)(Math.round(e[2]*l),0,l),o[3]=r+n}(r=a||(a={}))[r.Multiply=1]="Multiply",r[r.Ignore=2]="Ignore",r[r.Replace=3]="Replace",r[r.Tint=4]="Tint";const l=255,c=85,d=c,u=2*c}}]);
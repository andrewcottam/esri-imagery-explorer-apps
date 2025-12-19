"use strict";(self.webpackChunkimagery_explorer_apps=self.webpackChunkimagery_explorer_apps||[]).push([[2872],{7792:function(e,t,n){n.d(t,{V:function(){return i}});var r=n(78455),o=n(29162);class i extends o.n{constructor(e,t){super(e,"vec4",r.c.Draw,((n,r,o)=>n.setUniform4fv(e,t(r,o))))}}},11519:function(e,t,n){n.d(t,{CN:function(){return c},I9:function(){return h},PY:function(){return l},Q_:function(){return a},m9:function(){return d},ny:function(){return u},sZ:function(){return f}});n(6273);var r=n(39637),o=n(76982),i=n(77658),s=n(68716);const a=128,c=.5,l=(0,o.CN)(c/2,c/2,1-c/2,1-c/2);function u(e){return"cross"===e||"x"===e}function f(e,t=a,n=t*c,r=0){const{data:o,parameters:s}=h(e,t,n,r);return new i.g(o,s)}function h(e,t=a,n=t*c,r=0){return{data:d(e,t,n,r),parameters:{mipmap:!1,wrap:{s:s.pF.CLAMP_TO_EDGE,t:s.pF.CLAMP_TO_EDGE},width:t,height:t,components:4,noUnpackFlip:!0,reloadable:!0}}}function d(e,t=a,n=t*c,r=0){switch(e){case"circle":default:return function(e,t){const n=e/2-.5;return w(e,g(n,n,t/2))}(t,n);case"square":return function(e,t){return p(e,t,!1)}(t,n);case"cross":return function(e,t,n=0){return v(e,t,!1,n)}(t,n,r);case"x":return function(e,t,n=0){return v(e,t,!0,n)}(t,n,r);case"kite":return function(e,t){return p(e,t,!0)}(t,n);case"triangle":return function(e,t){return w(e,O(e/2,t,t/2))}(t,n);case"arrow":return function(e,t){const n=t,r=t/2,o=e/2,i=.8*n,s=g(o,(e-t)/2-i,Math.sqrt(i*i+r*r)),a=O(o,n,r);return w(e,((e,t)=>Math.max(a(e,t),-s(e,t))))}(t,n)}}function p(e,t,n){return n&&(t/=Math.SQRT2),w(e,((r,o)=>{let i=r-.5*e+.25,s=.5*e-o-.75;if(n){const e=(i+s)/Math.SQRT2;s=(s-i)/Math.SQRT2,i=e}return Math.max(Math.abs(i),Math.abs(s))-.5*t}))}function v(e,t,n,r=0){t-=r,n&&(t*=Math.SQRT2);const o=.5*t;return w(e,((t,i)=>{let s,a=t-.5*e,c=.5*e-i-1;if(n){const e=(a+c)/Math.SQRT2;c=(c-a)/Math.SQRT2,a=e}return a=Math.abs(a),c=Math.abs(c),s=a>c?a>o?Math.sqrt((a-o)*(a-o)+c*c):c:c>o?Math.sqrt(a*a+(c-o)*(c-o)):a,s-=r/2,s}))}function g(e,t,n){return(r,o)=>{const i=r-e,s=o-t;return Math.sqrt(i*i+s*s)-n}}function O(e,t,n){const r=Math.sqrt(t*t+n*n);return(o,i)=>{const s=Math.abs(o-e)-n,a=i-e+t/2+.75,c=(t*s+n*a)/r,l=-a;return Math.max(c,l)}}function w(e,t){const n=new Uint8Array(4*e*e);for(let o=0;o<e;o++)for(let i=0;i<e;i++){const s=i+e*o;let a=t(i,o);a=a/e+.5,(0,r.U)(a,n,4*s)}return n}},16075:function(e,t,n){n.d(t,{y:function(){return l}});var r=n(65895),o=n(86316),i=n(70751),s=n(41281),a=n(62462),c=n(96384);function l(e){e.vertex.uniforms.add(new s.U("renderTransparentlyOccludedHUD",(e=>e.hudRenderStyle===o.D.Occluded?1:e.hudRenderStyle===o.D.NotOccluded?0:.75)),new i.I("viewport",(e=>e.camera.fullViewport)),new c.x("hudVisibilityTexture",(e=>e.hudVisibility?.getTexture()))),e.vertex.include(r.K),e.vertex.code.add(a.H`bool testHUDVisibility(vec4 posProj) {
vec4 posProjCenter = alignToPixelCenter(posProj, viewport.zw);
vec4 occlusionPixel = texture(hudVisibilityTexture, .5 + .5 * posProjCenter.xy / posProjCenter.w);
if (renderTransparentlyOccludedHUD > 0.5) {
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g * renderTransparentlyOccludedHUD < 1.0;
}
return occlusionPixel.r * occlusionPixel.g > 0.0 && occlusionPixel.g == 1.0;
}`)}},30165:function(e,t,n){n.d(t,{H:function(){return r},o:function(){return o}});class r{constructor(){this.verticalOffset=0,this.selectionMode=!1,this.hud=!0,this.selectOpaqueTerrainOnly=!0,this.invisibleTerrain=!1,this.backfacesTerrain=!0,this.isFiltered=!1,this.filteredLayerViewUids=[],this.store=o.ALL,this.normalRequired=!0,this.excludeLabels=!1}}var o;!function(e){e[e.MIN=0]="MIN",e[e.MINMAX=1]="MINMAX",e[e.ALL=2]="ALL"}(o||(o={}))},33409:function(e,t,n){var r;n.d(t,{d:function(){return r}}),function(e){e[e.OBJECT=0]="OBJECT",e[e.HUD=1]="HUD",e[e.TERRAIN=2]="TERRAIN",e[e.OVERLAY=3]="OVERLAY",e[e.I3S=4]="I3S",e[e.PCL=5]="PCL",e[e.LOD=6]="LOD",e[e.VOXEL=7]="VOXEL",e[e.TILES3D=8]="TILES3D"}(r||(r={}))},40476:function(e,t,n){n.d(t,{R:function(){return h},i:function(){return f}});var r=n(25336),o=n(26110),i=n(80347),s=n(19913),a=n(74772),c=n(76982),l=n(63918),u=n(33409);class f{get ray(){return this._ray}get distanceInRenderSpace(){return null==this.distance?null:((0,i.g)(d,this.ray.direction,this.distance),(0,i.l)(d))}withinDistance(e){return!!h(this)&&this.distanceInRenderSpace<=e}getIntersectionPoint(e){return!!h(this)&&((0,i.g)(d,this.ray.direction,this.distance),(0,i.f)(e,this.ray.origin,d),!0)}getTransformedNormal(e){return(0,i.c)(p,this.normal),p[3]=0,(0,a.t)(p,p,this.transformation),(0,i.c)(e,p),(0,i.n)(e,e)}constructor(e){this.intersector=u.d.OBJECT,this.normal=(0,s.vt)(),this.transformation=(0,o.vt)(),this._ray=(0,l.vt)(),this.init(e)}init(e){this.distance=this.target=this.drapedLayerOrder=this.renderPriority=null,this.intersector=u.d.OBJECT,(0,l.C)(e,this._ray)}set(e,t,n,a,c,l,u){this.intersector=e,this.distance=n,(0,i.c)(this.normal,a??s.Cb),(0,r.C)(this.transformation,c??o.zK),this.target=t,this.drapedLayerOrder=l,this.renderPriority=u}copy(e){(0,l.C)(e.ray,this._ray),this.intersector=e.intersector,this.distance=e.distance,this.target=e.target,this.drapedLayerOrder=e.drapedLayerOrder,this.renderPriority=e.renderPriority,(0,i.c)(this.normal,e.normal),(0,r.C)(this.transformation,e.transformation)}}function h(e){return null!=e?.distance}const d=(0,s.vt)(),p=(0,c.vt)()},65895:function(e,t,n){n.d(t,{K:function(){return i}});var r=n(70483),o=n(62462);function i(e){e.uniforms.add(new r.o("alignPixelEnabled",(e=>e.alignPixelEnabled))),e.code.add(o.H`vec4 alignToPixelCenter(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.500123) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = (floor(xy * widthHeight) + vec2(0.5)) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`),e.code.add(o.H`vec4 alignToPixelOrigin(vec4 clipCoord, vec2 widthHeight) {
if (!alignPixelEnabled)
return clipCoord;
vec2 xy = vec2(0.5) + 0.5 * clipCoord.xy / clipCoord.w;
vec2 pixelSz = vec2(1.0) / widthHeight;
vec2 ij = floor((xy + 0.5 * pixelSz) * widthHeight) * pixelSz;
vec2 result = (ij * 2.0 - vec2(1.0)) * clipCoord.w;
return vec4(result, clipCoord.zw);
}`)}},73682:function(e,t,n){n.d(t,{$2:function(){return T},$C:function(){return y},Hj:function(){return M},Mh:function(){return P},W$:function(){return O},pW:function(){return x},t8:function(){return A},vY:function(){return S}});var r=n(5262),o=n(25336),i=n(26110),s=n(19913),a=n(74772),c=n(76982),l=n(34008),u=n(46373),f=n(2532),h=n(23064),d=n(11021),p=n(28364),v=n(82320),g=n(96124);function O(e,t){if("point"===e.type)return m(e,t,!1);if((0,g.gr)(e))switch(e.type){case"extent":return m(e.center,t,!1);case"polygon":return m(e.centroid,t,!1);case"polyline":return m(w(e),t,!0);case"mesh":return m((0,p.MW)(e.vertexSpace,e.spatialReference)??e.extent.center,t,!1);case"multipoint":return}else switch(e.type){case"extent":return m(function(e){return(0,v.T)(.5*(e.xmax+e.xmin),.5*(e.ymax+e.ymin),null!=e.zmin&&null!=e.zmax&&isFinite(e.zmin)&&isFinite(e.zmax)?.5*(e.zmax+e.zmin):void 0,e.spatialReference)}(e),t,!0);case"polygon":return m(function(e){const t=e.rings[0];if(!t||0===t.length)return null;const n=(0,h.S8)(e.rings,!!e.hasZ);return(0,v.T)(n[0],n[1],n[2],e.spatialReference)}(e),t,!0);case"polyline":return m(w(e),t,!0);case"multipoint":return}}function w(e){const t=e.paths[0];if(!t||0===t.length)return null;const n=(0,d.$H)(t,(0,d.Yl)(t)/2);return(0,v.T)(n[0],n[1],n[2],e.spatialReference)}function m(e,t,n){const r=n?e:(0,g.EL)(e);return t&&e?(0,l.projectPoint)(e,r,t)?r:null:r}function A(e,t,n,r=0){if(e){t||(t=(0,f.vt)());const o=e;let i=.5*o.width*(n-1),s=.5*o.height*(n-1);return o.width<1e-7*o.height?i+=s/20:o.height<1e-7*o.width&&(s+=i/20),(0,a.s)(t,o.xmin-i-r,o.ymin-s-r,o.xmax+i+r,o.ymax+s+r),t}return null}function y(e,t,n=null){const r=(0,c.o8)(c.Un);return null!=e&&(r[0]=e[0],r[1]=e[1],r[2]=e[2]),null!=t?r[3]=t:null!=e&&e.length>3&&(r[3]=e[3]),n&&(r[0]*=n,r[1]*=n,r[2]*=n,r[3]*=n),r}function x(e=s.Un,t,n,r=1){const o=new Array(3);if(null==t||null==n)o[0]=1,o[1]=1,o[2]=1;else{let r,i=0;for(let s=2;s>=0;s--){const a=e[s],c=null!=a,l=0===s&&!r&&!c,u=n[s];let f;"symbol-value"===a||l?f=0!==u?t[s]/u:1:c&&"proportional"!==a&&isFinite(a)&&(f=0!==u?a/u:1),null!=f&&(o[s]=f,r=f,i=Math.max(i,Math.abs(f)))}for(let e=2;e>=0;e--)null==o[e]?o[e]=r:0===o[e]&&(o[e]=.001*i)}for(let e=2;e>=0;e--)o[e]/=r;return(0,s.ci)(o)}function M(e){return P(function(e){return null!=e.isPrimitive}(e)?[e.width,e.depth,e.height]:e)?null:"Symbol sizes may not be negative values"}function P(e){const t=e=>null==e||e>=0;return Array.isArray(e)?e.every(t):t(e)}function T(e,t,n,r=(0,i.vt)()){return e&&(0,o.Qr)(r,r,-e/180*Math.PI),t&&(0,o.eL)(r,r,t/180*Math.PI),n&&(0,o.Z8)(r,r,n/180*Math.PI),r}function S(e,t,n){if(null!=n.minDemResolution)return n.minDemResolution;const o=(0,r.GA)(t),i=(0,u.VL)(e)*o,s=(0,u.yr)(e)*o,a=(0,u.uJ)(e)*(t.isGeographic?1:o);return 0===i&&0===s&&0===a?n.minDemResolutionForPoints:.01*Math.max(i,s,a)}},74316:function(e,t,n){n.d(t,{zC:function(){return oe},C1:function(){return P},EE:function(){return J},YG:function(){return W},nW:function(){return Z},td:function(){return R},_B:function(){return ne},Nq:function(){return ee},DJ:function(){return k},Y6:function(){return Y},uX:function(){return $},Z8:function(){return te},CM:function(){return q},Gj:function(){return Q},Ho:function(){return B},Nb:function(){return K},Xl:function(){return se},xh:function(){return re}});var r,o=n(80347),i=n(6590),s=n(19913),a=n(75644),c=n(68435),l=n(51831),u=n(87368),f=n(63918),h=n(10941);!function(e){e.length=function(e,t){const n=e[t],r=e[t+1],o=e[t+2];return Math.sqrt(n*n+r*r+o*o)},e.normalize=function(e,t){const n=e[t],r=e[t+1],o=e[t+2],i=1/Math.sqrt(n*n+r*r+o*o);e[t]*=i,e[t+1]*=i,e[t+2]*=i},e.scale=function(e,t,n){e[t]*=n,e[t+1]*=n,e[t+2]*=n},e.add=function(e,t,n,r,o,i=t){(o=o||e)[i]=e[t]+n[r],o[i+1]=e[t+1]+n[r+1],o[i+2]=e[t+2]+n[r+2]},e.subtract=function(e,t,n,r,o,i=t){(o=o||e)[i]=e[t]-n[r],o[i+1]=e[t+1]-n[r+1],o[i+2]=e[t+2]-n[r+2]}}(r||(r={}));var d=n(16869),p=n(26421),v=n(33763),g=n(58816);const O=r,w=[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]],m=[0,0,1,-1,0,0,1,0,0,0,-1,0,0,1,0,0,0,-1],A=[0,0,1,0,1,1,0,1],y=[0,1,2,2,3,0,4,0,3,3,7,4,1,5,6,6,2,1,1,0,4,4,5,1,3,2,6,6,7,3,5,4,7,7,6,5],x=new Array(36);for(let e=0;e<6;e++)for(let t=0;t<6;t++)x[6*e+t]=e;const M=new Array(36);for(let e=0;e<6;e++)M[6*e]=0,M[6*e+1]=1,M[6*e+2]=2,M[6*e+3]=2,M[6*e+4]=3,M[6*e+5]=0;function P(e,t){Array.isArray(t)||(t=[t,t,t]);const n=new Array(24);for(let e=0;e<8;e++)n[3*e]=w[e][0]*t[0],n[3*e+1]=w[e][1]*t[1],n[3*e+2]=w[e][2]*t[2];return new d.V(e,[[v.r.POSITION,new h.n(n,y,3,!0)],[v.r.NORMAL,new h.n(m,x,3)],[v.r.UV0,new h.n(A,M,2)]])}const T=[[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],[0,-.5,0],[0,.5,0]],S=[0,1,-1,1,1,0,0,1,1,-1,1,0,0,-1,-1,1,-1,0,0,-1,1,-1,-1,0],b=[5,1,0,5,2,1,5,3,2,5,0,3,4,0,1,4,1,2,4,2,3,4,3,0],I=[0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7];function R(e,t){Array.isArray(t)||(t=[t,t,t]);const n=new Array(18);for(let e=0;e<6;e++)n[3*e]=T[e][0]*t[0],n[3*e+1]=T[e][1]*t[1],n[3*e+2]=T[e][2]*t[2];return new d.V(e,[[v.r.POSITION,new h.n(n,b,3,!0)],[v.r.NORMAL,new h.n(S,I,3)]])}const C=(0,i.fA)(-.5,0,-.5),V=(0,i.fA)(.5,0,-.5),N=(0,i.fA)(0,0,.5),D=(0,i.fA)(0,.5,0),L=(0,i.vt)(),z=(0,i.vt)(),E=(0,i.vt)(),H=(0,i.vt)(),U=(0,i.vt)();(0,o.d)(L,C,D),(0,o.d)(z,C,V),(0,o.h)(E,L,z),(0,o.n)(E,E),(0,o.d)(L,V,D),(0,o.d)(z,V,N),(0,o.h)(H,L,z),(0,o.n)(H,H),(0,o.d)(L,N,D),(0,o.d)(z,N,C),(0,o.h)(U,L,z),(0,o.n)(U,U);const F=[C,V,N,D],G=[0,-1,0,E[0],E[1],E[2],H[0],H[1],H[2],U[0],U[1],U[2]],_=[0,1,2,3,1,0,3,2,1,3,0,2],j=[0,0,0,1,1,1,2,2,2,3,3,3];function B(e,t){Array.isArray(t)||(t=[t,t,t]);const n=new Array(12);for(let e=0;e<4;e++)n[3*e]=F[e][0]*t[0],n[3*e+1]=F[e][1]*t[1],n[3*e+2]=F[e][2]*t[2];return new d.V(e,[[v.r.POSITION,new h.n(n,_,3,!0)],[v.r.NORMAL,new h.n(G,j,3)]])}function q(e,t,n,r,o={uv:!0}){const i=-Math.PI,s=2*Math.PI,a=-Math.PI/2,u=Math.PI,f=Math.max(3,Math.floor(n)),p=Math.max(2,Math.floor(r)),g=(f+1)*(p+1),O=(0,c.oe)(3*g),w=(0,c.oe)(3*g),m=(0,c.oe)(2*g),A=[];let y=0;for(let e=0;e<=p;e++){const n=[],r=e/p,o=a+r*u,c=Math.cos(o);for(let e=0;e<=f;e++){const a=e/f,l=i+a*s,u=Math.cos(l)*c,h=Math.sin(o),d=-Math.sin(l)*c;O[3*y]=u*t,O[3*y+1]=h*t,O[3*y+2]=d*t,w[3*y]=u,w[3*y+1]=h,w[3*y+2]=d,m[2*y]=a,m[2*y+1]=r,n.push(y),++y}A.push(n)}const x=new Array;for(let e=0;e<p;e++)for(let t=0;t<f;t++){const n=A[e][t],r=A[e][t+1],o=A[e+1][t+1],i=A[e+1][t];0===e?(x.push(n),x.push(o),x.push(i)):e===p-1?(x.push(n),x.push(r),x.push(o)):(x.push(n),x.push(r),x.push(o),x.push(o),x.push(i),x.push(n))}const M=[[v.r.POSITION,new h.n(O,x,3,!0)],[v.r.NORMAL,new h.n(w,x,3,!0)]];return o.uv&&M.push([v.r.UV0,new h.n(m,x,2,!0)]),o.offset&&(M[0][0]=v.r.OFFSET,M.push([v.r.POSITION,new h.n(Float64Array.from(o.offset),(0,l.EH)(x.length),3,!0)])),new d.V(e,M)}function $(e,t,n,r){const o=Y(t,n,r);return new d.V(e,o)}function Y(e,t,n){const r=e;let o,i;if(n)o=[0,-1,0,1,0,0,0,0,1,-1,0,0,0,0,-1,0,1,0],i=[0,1,2,0,2,3,0,3,4,0,4,1,1,5,2,2,5,3,3,5,4,4,5,1];else{const e=r*(1+Math.sqrt(5))/2;o=[-r,e,0,r,e,0,-r,-e,0,r,-e,0,0,-r,e,0,r,e,0,-r,-e,0,r,-e,e,0,-r,e,0,r,-e,0,-r,-e,0,r],i=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1]}for(let t=0;t<o.length;t+=3)O.scale(o,t,e/O.length(o,t));let s={};function a(t,n){t>n&&([t,n]=[n,t]);const r=t.toString()+"."+n.toString();if(s[r])return s[r];let i=o.length;return o.length+=3,O.add(o,3*t,o,3*n,o,i),O.scale(o,i,e/O.length(o,i)),i/=3,s[r]=i,i}for(let e=0;e<t;e++){const e=i.length,t=new Array(4*e);for(let n=0;n<e;n+=3){const e=i[n],r=i[n+1],o=i[n+2],s=a(e,r),c=a(r,o),l=a(o,e),u=4*n;t[u]=e,t[u+1]=s,t[u+2]=l,t[u+3]=r,t[u+4]=c,t[u+5]=s,t[u+6]=o,t[u+7]=l,t[u+8]=c,t[u+9]=s,t[u+10]=c,t[u+11]=l}i=t,s={}}const l=(0,c.Wz)(o);for(let e=0;e<l.length;e+=3)O.normalize(l,e);return[[v.r.POSITION,new h.n((0,c.Wz)(o),i,3,!0)],[v.r.NORMAL,new h.n(l,i,3,!0)]]}function k(e,{normal:t,position:n,color:r,rotation:o,size:i,centerOffsetAndDistance:a,uvi:c,featureAttribute:u,objectAndLayerIdColor:f=null}={}){const p=n?(0,s.o8)(n):(0,s.vt)(),O=t?(0,s.o8)(t):(0,s.fA)(0,0,1),w=r?[255*r[0],255*r[1],255*r[2],r.length>3?255*r[3]:255]:[255,255,255,255],m=null!=i&&2===i.length?i:[1,1],A=null!=o?[o]:[0],y=(0,l.EH)(1),x=[[v.r.POSITION,new h.n(p,y,3,!0)],[v.r.NORMAL,new h.n(O,y,3,!0)],[v.r.COLOR,new h.n(w,y,4,!0)],[v.r.SIZE,new h.n(m,y,2)],[v.r.ROTATION,new h.n(A,y,1,!0)]];if(c&&x.push([v.r.UVI,new h.n(c,y,c.length)]),null!=a){const e=[a[0],a[1],a[2],a[3]];x.push([v.r.CENTEROFFSETANDDISTANCE,new h.n(e,y,4)])}if(u){const e=[u[0],u[1],u[2],u[3]];x.push([v.r.FEATUREATTRIBUTE,new h.n(e,y,4)])}return new d.V(e,x,null,g.d.Point,f)}const X=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]];function Q(e,t=X){const n=new Array(12);for(let e=0;e<4;e++)for(let r=0;r<3;r++)n[3*e+r]=t[e][r];const r=[0,1,2,2,3,0],o=[0,0,0,0,0,0],i=[[v.r.POSITION,new h.n(n,r,3,!0)],[v.r.NORMAL,new h.n([0,0,1],o,3,!0)],[v.r.UV0,new h.n([0,0,1,0,1,1,0,1],r,2,!0)],[v.r.COLOR,new h.n([255,255,255,255],o,4,!0)]];return new d.V(e,i)}function W(e,t,n,r,o=!0,s=!0){let a=0;const l=t,u=e;let f=(0,i.fA)(0,a,0),d=(0,i.fA)(0,a+u,0),p=(0,i.fA)(0,-1,0),g=(0,i.fA)(0,1,0);r&&(a=u,d=(0,i.fA)(0,0,0),f=(0,i.fA)(0,a,0),p=(0,i.fA)(0,1,0),g=(0,i.fA)(0,-1,0));const O=[d,f],w=[p,g],m=n+2,A=Math.sqrt(u*u+l*l);if(r)for(let e=n-1;e>=0;e--){const t=e*(2*Math.PI/n),r=(0,i.fA)(Math.cos(t)*l,a,Math.sin(t)*l);O.push(r);const o=(0,i.fA)(u*Math.cos(t)/A,-l/A,u*Math.sin(t)/A);w.push(o)}else for(let e=0;e<n;e++){const t=e*(2*Math.PI/n),r=(0,i.fA)(Math.cos(t)*l,a,Math.sin(t)*l);O.push(r);const o=(0,i.fA)(u*Math.cos(t)/A,l/A,u*Math.sin(t)/A);w.push(o)}const y=new Array,x=new Array;if(o){for(let e=3;e<O.length;e++)y.push(1),y.push(e-1),y.push(e),x.push(0),x.push(0),x.push(0);y.push(O.length-1),y.push(2),y.push(1),x.push(0),x.push(0),x.push(0)}if(s){for(let e=3;e<O.length;e++)y.push(e),y.push(e-1),y.push(0),x.push(e),x.push(e-1),x.push(1);y.push(0),y.push(2),y.push(O.length-1),x.push(1),x.push(2),x.push(w.length-1)}const M=(0,c.oe)(3*m);for(let e=0;e<m;e++)M[3*e]=O[e][0],M[3*e+1]=O[e][1],M[3*e+2]=O[e][2];const P=(0,c.oe)(3*m);for(let e=0;e<m;e++)P[3*e]=w[e][0],P[3*e+1]=w[e][1],P[3*e+2]=w[e][2];return[[v.r.POSITION,new h.n(M,y,3,!0)],[v.r.NORMAL,new h.n(P,x,3,!0)]]}function J(e,t,n,r,o,i=!0,s=!0){return new d.V(e,W(t,n,r,o,i,s))}function Z(e,t,n,r,s,a,l){const u=s?(0,i.o8)(s):(0,i.fA)(1,0,0),f=a?(0,i.o8)(a):(0,i.fA)(0,0,0);l??=!0;const p=(0,i.vt)();(0,o.n)(p,u);const g=(0,i.vt)();(0,o.g)(g,p,Math.abs(t));const O=(0,i.vt)();(0,o.g)(O,g,-.5),(0,o.f)(O,O,f);const w=(0,i.fA)(0,1,0);Math.abs(1-(0,o.e)(p,w))<.2&&(0,o.i)(w,0,0,1);const m=(0,i.vt)();(0,o.h)(m,p,w),(0,o.n)(m,m),(0,o.h)(w,m,p);const A=2*r+(l?2:0),y=r+(l?2:0),x=(0,c.oe)(3*A),M=(0,c.oe)(3*y),P=(0,c.oe)(2*A),T=new Array(3*r*(l?4:2)),S=new Array(3*r*(l?4:2));l&&(x[3*(A-2)]=O[0],x[3*(A-2)+1]=O[1],x[3*(A-2)+2]=O[2],P[2*(A-2)]=0,P[2*(A-2)+1]=0,x[3*(A-1)]=x[3*(A-2)]+g[0],x[3*(A-1)+1]=x[3*(A-2)+1]+g[1],x[3*(A-1)+2]=x[3*(A-2)+2]+g[2],P[2*(A-1)]=1,P[2*(A-1)+1]=1,M[3*(y-2)]=-p[0],M[3*(y-2)+1]=-p[1],M[3*(y-2)+2]=-p[2],M[3*(y-1)]=p[0],M[3*(y-1)+1]=p[1],M[3*(y-1)+2]=p[2]);const b=(e,t,n)=>{T[e]=t,S[e]=n};let I=0;const R=(0,i.vt)(),C=(0,i.vt)();for(let e=0;e<r;e++){const t=e*(2*Math.PI/r);(0,o.g)(R,w,Math.sin(t)),(0,o.g)(C,m,Math.cos(t)),(0,o.f)(R,R,C),M[3*e]=R[0],M[3*e+1]=R[1],M[3*e+2]=R[2],(0,o.g)(R,R,n),(0,o.f)(R,R,O),x[3*e]=R[0],x[3*e+1]=R[1],x[3*e+2]=R[2],P[2*e]=e/r,P[2*e+1]=0,x[3*(e+r)]=x[3*e]+g[0],x[3*(e+r)+1]=x[3*e+1]+g[1],x[3*(e+r)+2]=x[3*e+2]+g[2],P[2*(e+r)]=e/r,P[2*e+1]=1;const i=(e+1)%r;b(I++,e,e),b(I++,e+r,e),b(I++,i,i),b(I++,i,i),b(I++,e+r,e),b(I++,i+r,i)}if(l){for(let e=0;e<r;e++){const t=(e+1)%r;b(I++,A-2,y-2),b(I++,e,y-2),b(I++,t,y-2)}for(let e=0;e<r;e++){const t=(e+1)%r;b(I++,e+r,y-1),b(I++,A-1,y-1),b(I++,t+r,y-1)}}const V=[[v.r.POSITION,new h.n(x,T,3,!0)],[v.r.NORMAL,new h.n(M,S,3,!0)],[v.r.UV0,new h.n(P,T,2,!0)]];return new d.V(e,V)}function K(e,t,n,r,o,i){r=r||10,o=null==o||o,(0,p.vA)(t.length>1);const s=[],a=[];for(let e=0;e<r;e++){s.push([0,-e-1,-(e+1)%r-1]);const t=e/r*2*Math.PI;a.push([Math.cos(t)*n,Math.sin(t)*n])}return ee(e,a,t,[[0,0,0]],s,o,i)}function ee(e,t,n,r,a,l,p=(0,i.fA)(0,0,0)){const g=t.length,O=(0,c.oe)(n.length*g*3+(6*r.length||0)),w=(0,c.oe)(n.length*g*3+(r?6:0)),m=new Array,A=new Array;let y=0,x=0;const M=(0,s.vt)(),P=(0,s.vt)(),T=(0,s.vt)(),S=(0,s.vt)(),b=(0,s.vt)(),I=(0,s.vt)(),R=(0,s.vt)(),C=(0,s.vt)(),V=(0,s.vt)(),N=(0,s.vt)(),D=(0,s.vt)(),L=(0,s.vt)(),z=(0,s.vt)(),E=(0,u.vt)();(0,o.i)(V,0,1,0),(0,o.d)(P,n[1],n[0]),(0,o.n)(P,P),l?((0,o.f)(C,n[0],p),(0,o.n)(T,C)):(0,o.i)(T,0,0,1),se(P,T,V,V,b,T,ae),(0,o.c)(S,T),(0,o.c)(L,b);for(let e=0;e<r.length;e++)(0,o.g)(I,b,r[e][0]),(0,o.g)(C,T,r[e][2]),(0,o.f)(I,I,C),(0,o.f)(I,I,n[0]),O[y++]=I[0],O[y++]=I[1],O[y++]=I[2];w[x++]=-P[0],w[x++]=-P[1],w[x++]=-P[2];for(let e=0;e<a.length;e++)m.push(a[e][0]>0?a[e][0]:-a[e][0]-1+r.length),m.push(a[e][1]>0?a[e][1]:-a[e][1]-1+r.length),m.push(a[e][2]>0?a[e][2]:-a[e][2]-1+r.length),A.push(0),A.push(0),A.push(0);let H=r.length;const U=r.length-1;for(let e=0;e<n.length;e++){let r=!1;e>0&&((0,o.c)(M,P),e<n.length-1?((0,o.d)(P,n[e+1],n[e]),(0,o.n)(P,P)):r=!0,(0,o.f)(N,M,P),(0,o.n)(N,N),(0,o.f)(D,n[e-1],S),(0,u.O_)(n[e],N,E),(0,u.Ui)(E,(0,f.LV)(D,M),C)?((0,o.d)(C,C,n[e]),(0,o.n)(T,C),(0,o.h)(b,N,T),(0,o.n)(b,b)):se(N,S,L,V,b,T,ae),(0,o.c)(S,T),(0,o.c)(L,b)),l&&((0,o.f)(C,n[e],p),(0,o.n)(z,C));for(let i=0;i<g;i++)if((0,o.g)(I,b,t[i][0]),(0,o.g)(C,T,t[i][1]),(0,o.f)(I,I,C),(0,o.n)(R,I),w[x++]=R[0],w[x++]=R[1],w[x++]=R[2],(0,o.f)(I,I,n[e]),O[y++]=I[0],O[y++]=I[1],O[y++]=I[2],!r){const e=(i+1)%g;m.push(H+i),m.push(H+g+i),m.push(H+e),m.push(H+e),m.push(H+g+i),m.push(H+g+e);for(let e=0;e<6;e++){const t=m.length-6;A.push(m[t+e]-U)}}H+=g}const F=n[n.length-1];for(let e=0;e<r.length;e++)(0,o.g)(I,b,r[e][0]),(0,o.g)(C,T,r[e][1]),(0,o.f)(I,I,C),(0,o.f)(I,I,F),O[y++]=I[0],O[y++]=I[1],O[y++]=I[2];const G=x/3;w[x++]=P[0],w[x++]=P[1],w[x++]=P[2];const _=H-g;for(let e=0;e<a.length;e++)m.push(a[e][0]>=0?H+a[e][0]:-a[e][0]-1+_),m.push(a[e][2]>=0?H+a[e][2]:-a[e][2]-1+_),m.push(a[e][1]>=0?H+a[e][1]:-a[e][1]-1+_),A.push(G),A.push(G),A.push(G);const j=[[v.r.POSITION,new h.n(O,m,3,!0)],[v.r.NORMAL,new h.n(w,A,3,!0)]];return new d.V(e,j)}function te(e,t,n,r){(0,p.vA)(t.length>1,"createPolylineGeometry(): polyline needs at least 2 points"),(0,p.vA)(3===t[0].length,"createPolylineGeometry(): malformed vertex"),(0,p.vA)(null==n||n.length===t.length,"createPolylineGeometry: need same number of points and normals"),(0,p.vA)(null==n||3===n[0].length,"createPolylineGeometry(): malformed normal");const o=(0,a.jh)(3*t.length),i=new Array(2*(t.length-1));let s=0,u=0;for(let e=0;e<t.length;e++){for(let n=0;n<3;n++)o[s++]=t[e][n];e>0&&(i[u++]=e-1,i[u++]=e)}const f=[[v.r.POSITION,new h.n(o,i,3,!0)]];if(n){const e=(0,c.oe)(3*n.length);let r=0;for(let o=0;o<t.length;o++)for(let t=0;t<3;t++)e[r++]=n[o][t];f.push([v.r.NORMAL,new h.n(e,i,3,!0)])}return r&&f.push([v.r.COLOR,new h.n(r,(0,l.tM)(r.length/4),4)]),new d.V(e,f,null,g.d.Line)}function ne(e,t,n,r,o,i=0){const s=new Array(18),a=[[-n,i,o/2],[r,i,o/2],[0,t+i,o/2],[-n,i,-o/2],[r,i,-o/2],[0,t+i,-o/2]];for(let e=0;e<6;e++)s[3*e]=a[e][0],s[3*e+1]=a[e][1],s[3*e+2]=a[e][2];return new d.V(e,[[v.r.POSITION,new h.n(s,[0,1,2,3,0,2,2,5,3,1,4,5,5,2,1,1,0,3,3,4,1,4,3,5],3,!0)]])}function re(e,t){const n=e.getMutableAttribute(v.r.POSITION).data;for(let e=0;e<n.length;e+=3){const r=n[e],i=n[e+1],s=n[e+2];(0,o.i)(ce,r,i,s),(0,o.t)(ce,ce,t),n[e]=ce[0],n[e+1]=ce[1],n[e+2]=ce[2]}}function oe(e,t=e){const n=e.attributes,r=n.get(v.r.POSITION).data,o=n.get(v.r.NORMAL).data;if(o){const e=t.getMutableAttribute(v.r.NORMAL).data;for(let t=0;t<o.length;t+=3){const n=o[t+1];e[t+1]=-o[t+2],e[t+2]=n}}if(r){const e=t.getMutableAttribute(v.r.POSITION).data;for(let t=0;t<r.length;t+=3){const n=r[t+1];e[t+1]=-r[t+2],e[t+2]=n}}}function ie(e,t,n,r,i){return!(Math.abs((0,o.e)(t,e))>i||((0,o.h)(n,e,t),(0,o.n)(n,n),(0,o.h)(r,n,e),(0,o.n)(r,r),0))}function se(e,t,n,r,o,i,s){return ie(e,t,o,i,s)||ie(e,n,o,i,s)||ie(e,r,o,i,s)}const ae=.99619469809,ce=(0,s.vt)()},75423:function(e,t,n){function r(e){return"point"===e.type}n.d(t,{v:function(){return r}})},80002:function(e,t,n){n.d(t,{W:function(){return o}});var r=n(62462);function o(e){e.code.add(r.H`const float MAX_RGBA_FLOAT =
255.0 / 256.0 +
255.0 / 256.0 / 256.0 +
255.0 / 256.0 / 256.0 / 256.0 +
255.0 / 256.0 / 256.0 / 256.0 / 256.0;
const vec4 FIXED_POINT_FACTORS = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
vec4 float2rgba(const float value) {
float valueInValidDomain = clamp(value, 0.0, MAX_RGBA_FLOAT);
vec4 fixedPointU8 = floor(fract(valueInValidDomain * FIXED_POINT_FACTORS) * 256.0);
const float toU8AsFloat = 1.0 / 255.0;
return fixedPointU8 * toU8AsFloat;
}`),e.code.add(r.H`const vec4 RGBA_TO_FLOAT_FACTORS = vec4(
255.0 / (256.0),
255.0 / (256.0 * 256.0),
255.0 / (256.0 * 256.0 * 256.0),
255.0 / (256.0 * 256.0 * 256.0 * 256.0)
);
float rgbaTofloat(vec4 rgba) {
return dot(rgba, RGBA_TO_FLOAT_FACTORS);
}`),e.code.add(r.H`const vec4 uninterpolatedRGBAToFloatFactors = vec4(
1.0 / 256.0,
1.0 / 256.0 / 256.0,
1.0 / 256.0 / 256.0 / 256.0,
1.0 / 256.0 / 256.0 / 256.0 / 256.0
);
float uninterpolatedRGBAToFloat(vec4 rgba) {
return (dot(round(rgba * 255.0), uninterpolatedRGBAToFloatFactors) - 0.5) * 2.0;
}`)}},86316:function(e,t,n){var r;n.d(t,{D:function(){return r}}),function(e){e[e.Occluded=0]="Occluded",e[e.NotOccluded=1]="NotOccluded",e[e.Both=2]="Both",e[e.COUNT=3]="COUNT"}(r||(r={}))},87331:function(e,t,n){n.d(t,{Q:function(){return h},R:function(){return f}});var r=n(11255),o=n(15510),i=n(69952),s=n(70751),a=n(41281),c=n(19635),l=n(62462),u=n(33763);const f=.5;function h(e,t){e.include(o.Y6),e.attributes.add(u.r.POSITION,"vec3"),e.attributes.add(u.r.NORMAL,"vec3"),e.attributes.add(u.r.CENTEROFFSETANDDISTANCE,"vec4");const n=e.vertex;(0,i.NB)(n,t),(0,i.yu)(n,t),n.uniforms.add(new s.I("viewport",(e=>e.camera.fullViewport)),new c.m("polygonOffset",(e=>e.shaderPolygonOffset)),new a.U("cameraGroundRelative",(e=>e.camera.aboveGround?1:-1))),t.hasVerticalOffset&&(0,r.V)(n),n.code.add(l.H`struct ProjectHUDAux {
vec3 posModel;
vec3 posView;
vec3 vnormal;
float distanceToCamera;
float absCosAngle;
};`),n.code.add(l.H`
    float applyHUDViewDependentPolygonOffset(float pointGroundDistance, float absCosAngle, inout vec3 posView) {
      float pointGroundSign = ${t.terrainDepthTest?l.H.float(0):l.H`sign(pointGroundDistance)`};
      if (pointGroundSign == 0.0) {
        pointGroundSign = cameraGroundRelative;
      }

      // cameraGroundRelative is -1 if camera is below ground, 1 if above ground
      // groundRelative is 1 if both camera and symbol are on the same side of the ground, -1 otherwise
      float groundRelative = cameraGroundRelative * pointGroundSign;

      // view angle dependent part of polygon offset emulation: we take the absolute value because the sign that is
      // dropped is instead introduced using the ground-relative position of the symbol and the camera
      if (polygonOffset > .0) {
        float cosAlpha = clamp(absCosAngle, 0.01, 1.0);
        float tanAlpha = sqrt(1.0 - cosAlpha * cosAlpha) / cosAlpha;
        float factor = (1.0 - tanAlpha / viewport[2]);

        // same side of the terrain
        if (groundRelative > 0.0) {
          posView *= factor;
        }
        // opposite sides of the terrain
        else {
          posView /= factor;
        }
      }

      return groundRelative;
    }
  `),t.draped&&!t.hasVerticalOffset||(0,i.S7)(n),t.draped||(n.uniforms.add(new a.U("perDistancePixelRatio",(e=>Math.tan(e.camera.fovY/2)/(e.camera.fullViewport[2]/2)))),n.code.add(l.H`
    void applyHUDVerticalGroundOffset(vec3 normalModel, inout vec3 posModel, inout vec3 posView) {
      float distanceToCamera = length(posView);

      // Compute offset in world units for a half pixel shift
      float pixelOffset = distanceToCamera * perDistancePixelRatio * ${l.H.float(f)};

      // Apply offset along normal in the direction away from the ground surface
      vec3 modelOffset = normalModel * cameraGroundRelative * pixelOffset;

      // Apply the same offset also on the view space position
      vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;

      posModel += modelOffset;
      posView += viewOffset;
    }
  `)),t.screenCenterOffsetUnitsEnabled&&(0,i.Nz)(n),t.hasScreenSizePerspective&&(0,o.OH)(n),n.code.add(l.H`
    vec4 projectPositionHUD(out ProjectHUDAux aux) {
      vec3 centerOffset = centerOffsetAndDistance.xyz;
      float pointGroundDistance = centerOffsetAndDistance.w;

      aux.posModel = position;
      aux.posView = (view * vec4(aux.posModel, 1.0)).xyz;
      aux.vnormal = normal;
      ${t.draped?"":"applyHUDVerticalGroundOffset(aux.vnormal, aux.posModel, aux.posView);"}

      // Screen sized offset in world space, used for example for line callouts
      // Note: keep this implementation in sync with the CPU implementation, see
      //   - MaterialUtil.verticalOffsetAtDistance
      //   - HUDMaterial.applyVerticalOffsetTransformation

      aux.distanceToCamera = length(aux.posView);

      vec3 viewDirObjSpace = normalize(cameraPosition - aux.posModel);
      float cosAngle = dot(aux.vnormal, viewDirObjSpace);

      aux.absCosAngle = abs(cosAngle);

      ${t.hasScreenSizePerspective&&(t.hasVerticalOffset||t.screenCenterOffsetUnitsEnabled)?"vec3 perspectiveFactor = screenSizePerspectiveScaleFactor(aux.absCosAngle, aux.distanceToCamera, screenSizePerspectiveAlignment);":""}

      ${t.hasVerticalOffset?t.hasScreenSizePerspective?"float verticalOffsetScreenHeight = applyScreenSizePerspectiveScaleFactorFloat(verticalOffset.x, perspectiveFactor);":"float verticalOffsetScreenHeight = verticalOffset.x;":""}

      ${t.hasVerticalOffset?l.H`
            float worldOffset = clamp(verticalOffsetScreenHeight * verticalOffset.y * aux.distanceToCamera, verticalOffset.z, verticalOffset.w);
            vec3 modelOffset = aux.vnormal * worldOffset;
            aux.posModel += modelOffset;
            vec3 viewOffset = (viewNormal * vec4(modelOffset, 1.0)).xyz;
            aux.posView += viewOffset;
            // Since we elevate the object, we need to take that into account
            // in the distance to ground
            pointGroundDistance += worldOffset;`:""}

      float groundRelative = applyHUDViewDependentPolygonOffset(pointGroundDistance, aux.absCosAngle, aux.posView);

      ${t.screenCenterOffsetUnitsEnabled?"":l.H`
            // Apply x/y in view space, but z in screen space (i.e. along posView direction)
            aux.posView += vec3(centerOffset.x, centerOffset.y, 0.0);

            // Same material all have same z != 0.0 condition so should not lead to
            // branch fragmentation and will save a normalization if it's not needed
            if (centerOffset.z != 0.0) {
              aux.posView -= normalize(aux.posView) * centerOffset.z;
            }
          `}

      vec4 posProj = proj * vec4(aux.posView, 1.0);

      ${t.screenCenterOffsetUnitsEnabled?t.hasScreenSizePerspective?"float centerOffsetY = applyScreenSizePerspectiveScaleFactorFloat(centerOffset.y, perspectiveFactor);":"float centerOffsetY = centerOffset.y;":""}

      ${t.screenCenterOffsetUnitsEnabled?"posProj.xy += vec2(centerOffset.x, centerOffsetY) * pixelRatio * 2.0 / viewport.zw * posProj.w;":""}

      // constant part of polygon offset emulation
      posProj.z -= groundRelative * polygonOffset * posProj.w;
      return posProj;
    }
  `)}}}]);
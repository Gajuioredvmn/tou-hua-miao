// ================= 迷你 WebGL：3D 小模型場景 =================
// 世界座標：1 單位 = 1 格。X 往東、Y 往上、Z 往南（地圖往下）。相機永遠從南邊斜上方往北看。
const M4 = {
  persp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  },
  lookAt(e, c, u) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1,
    ]);
  },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[i + k * 4] * b[k + j * 4];
      o[i + j * 4] = s;
    }
    return o;
  },
};

const GLSL_HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;
const NPL = 10, NSL = 3;
const LIT_VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUV;
uniform mat4 uVP;
varying vec3 vPos; varying vec3 vNor; varying vec2 vUV;
void main() { vPos = aPos; vNor = aNor; vUV = aUV; gl_Position = uVP * vec4(aPos, 1.0); }`;
const LIT_FS = GLSL_HEAD + `
#define NP ${NPL}
#define NS ${NSL}
uniform sampler2D uTex;
uniform vec3 uAmb; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol;
uniform vec4 uPL[NP]; uniform vec3 uPLc[NP];
uniform vec4 uSL[NS]; uniform vec4 uSLd[NS]; uniform vec3 uSLc[NS];
uniform vec3 uFogCol; uniform vec2 uFog; uniform vec3 uCam;
uniform float uAlphaTest; uniform float uUnlit; uniform vec4 uTint; uniform vec3 uMinLight; uniform float uAlpha; uniform float uToon;
varying vec3 vPos; varying vec3 vNor; varying vec2 vUV;
void main() {
  vec4 tex = texture2D(uTex, vUV) * uTint;
  tex.a *= uAlpha;
  if (tex.a < uAlphaTest) discard;
  vec3 n = normalize(vNor);
  float sky = n.y * 0.5 + 0.5;
  vec3 light = uAmb + uSkyCol * sky + uSunCol * max(dot(n, uSunDir), 0.0);
  vec3 pts = vec3(0.0);
  for (int i = 0; i < NP; i++) {
    vec3 d = uPL[i].xyz - vPos; float dist = length(d) + 0.0001;
    float att = clamp(1.0 - dist / uPL[i].w, 0.0, 1.0); att *= att;
    pts += uPLc[i] * att * (0.35 + 0.65 * max(dot(n, d / dist), 0.0));
  }
  for (int i = 0; i < NS; i++) {
    vec3 d = uSL[i].xyz - vPos; float dist = length(d) + 0.0001; vec3 l = d / dist;
    float c = dot(-l, uSLd[i].xyz);
    float cone = smoothstep(uSLd[i].w, uSLd[i].w + 0.12, c);
    float att = clamp(1.0 - dist / uSL[i].w, 0.0, 1.0);
    pts += uSLc[i] * cone * att * (0.4 + 0.6 * max(dot(n, l), 0.0));
  }
  // 卡通一點：光池邊緣做出柔和的階層
  float pl = max(max(pts.r, pts.g), pts.b);
  float band = pl > 0.001 ? (floor(pl * 3.0 + 0.6) / 3.0) / pl : 0.0;
  pts *= mix(1.0, clamp(band, 0.0, 1.6), uToon);
  light = max(light + pts, uMinLight);
  vec3 col = mix(tex.rgb * light, tex.rgb, uUnlit);
  float f = clamp((length(vPos - uCam) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  gl_FragColor = vec4(mix(col, uFogCol, f * f), tex.a);
}`;
const COL_VS = `
attribute vec3 aPos; attribute vec4 aCol; attribute vec2 aUV;
uniform mat4 uVP; varying vec4 vCol; varying vec2 vUV;
void main() { vCol = aCol; vUV = aUV; gl_Position = uVP * vec4(aPos, 1.0); }`;
const COL_FS = GLSL_HEAD + `
uniform sampler2D uTex; varying vec4 vCol; varying vec2 vUV;
void main() { gl_FragColor = texture2D(uTex, vUV) * vCol; }`;
// 後製
const PP_VS = `
attribute vec2 aPos; varying vec2 vUV;
void main() { vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const DOWN_FS = GLSL_HEAD + `
uniform sampler2D uTex; uniform vec2 uPx; uniform float uThresh; uniform float uKnee; varying vec2 vUV;
void main() {
  vec3 c = texture2D(uTex, vUV + uPx * vec2(-1.0, -1.0)).rgb + texture2D(uTex, vUV + uPx * vec2(1.0, -1.0)).rgb
         + texture2D(uTex, vUV + uPx * vec2(-1.0, 1.0)).rgb + texture2D(uTex, vUV + uPx * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  if (uThresh > 0.0) { float b = max(max(c.r, c.g), c.b); float k = smoothstep(uThresh - uKnee, uThresh + uKnee, b); c *= k; }
  gl_FragColor = vec4(c, 1.0);
}`;
const BLUR_FS = GLSL_HEAD + `
uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUV;
void main() {
  vec3 c = texture2D(uTex, vUV).rgb * 0.2270270270;
  c += (texture2D(uTex, vUV + uDir * 1.3846153846).rgb + texture2D(uTex, vUV - uDir * 1.3846153846).rgb) * 0.3162162162;
  c += (texture2D(uTex, vUV + uDir * 3.2307692308).rgb + texture2D(uTex, vUV - uDir * 3.2307692308).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;
const COMP_FS = GLSL_HEAD + `
uniform sampler2D uScene; uniform sampler2D uBloom; uniform sampler2D uBlur;
uniform float uBloomK; uniform vec2 uTilt; uniform float uVig; uniform vec3 uGrade; uniform float uSat; uniform vec2 uAspect;
varying vec2 vUV;
void main() {
  vec3 s = texture2D(uScene, vUV).rgb;
  vec3 bl = texture2D(uBlur, vUV).rgb;
  float y = vUV.y;
  float m = smoothstep(uTilt.x, uTilt.x - 0.22, y) + smoothstep(uTilt.y, uTilt.y + 0.18, y);
  vec3 c = mix(s, bl, clamp(m, 0.0, 1.0));
  c += texture2D(uBloom, vUV).rgb * uBloomK;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat) * uGrade;
  vec2 q = (vUV - 0.5) * uAspect;
  c *= 1.0 - uVig * smoothstep(0.35, 1.05, length(q));
  gl_FragColor = vec4(c, 1.0);
}`;

const GL3 = {
  ok: false, gl: null, cv: null, gen: 1, aa: false, maxTex: 2048, cssW: 1, cssH: 1, pr: 1, pitch: 0.9,
  init(canvas) {
    try {
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
      if (!gl) return false;
      this.gl = gl; this.cv = canvas;
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; }, false);
      canvas.addEventListener('webglcontextrestored', () => { this.setup(); }, false);
      return this.setup();
    } catch (e) { console.error(e); return false; }
  },
  setup() {
    const gl = this.gl;
    this.gen++;
    this.texMap = new WeakMap();
    this.lit = this.program(LIT_VS, LIT_FS, ['aPos', 'aNor', 'aUV']);
    this.col = this.program(COL_VS, COL_FS, ['aPos', 'aCol', 'aUV']);
    if (!this.lit || !this.col) return false;
    this.ppDown = this.program(PP_VS, DOWN_FS, ['aPos']);
    this.ppBlur = this.program(PP_VS, BLUR_FS, ['aPos']);
    this.ppComp = this.program(PP_VS, COMP_FS, ['aPos']);
    this.white = makeCanvas(2, 2); { const g = this.white.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); }
    this.dynBuf = gl.createBuffer(); this.colBuf = gl.createBuffer();
    this.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    const attr = gl.getContextAttributes();
    this.aa = !!(attr && attr.antialias) && (gl.getParameter(gl.SAMPLES) || 0) > 1;
    this.fbos = null; this.post = !!(this.ppDown && this.ppBlur && this.ppComp);
    this.ok = true;
    return true;
  },
  program(vs, fs, attrs) {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f);
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(p)); return null; }
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace('[0]', ''); u[name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  },
  // 貼圖：canvas 第一次用到時上傳；canvas.__dirty = true 時重傳
  tex(canvas) {
    const gl = this.gl;
    let e = this.texMap.get(canvas);
    if (e && !canvas.__dirty) return e;
    if (!e) { e = gl.createTexture(); this.texMap.set(canvas, e); }
    gl.bindTexture(gl.TEXTURE_2D, e);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    const pow2 = (canvas.width & (canvas.width - 1)) === 0 && (canvas.height & (canvas.height - 1)) === 0;
    const filt = canvas.__pixel ? gl.NEAREST : gl.LINEAR;
    if (canvas.__mip && pow2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    const wrap = canvas.__repeat && pow2 ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    canvas.__dirty = false;
    return e;
  },
  resize(cssW, cssH, dpr) {
    this.cssW = cssW; this.cssH = cssH;
    // 像素預算：太大的螢幕降一點解析度，手機才跑得動
    let pr = Math.min(dpr || 1, 2);
    const budget = 2.4e6;
    if (cssW * cssH * pr * pr > budget) pr = Math.sqrt(budget / (cssW * cssH));
    this.pr = Math.max(0.75, pr);
    this.cv.width = Math.round(cssW * this.pr); this.cv.height = Math.round(cssH * this.pr);
    this.cv.style.width = cssW + 'px'; this.cv.style.height = cssH + 'px';
    this.aspect = cssW / cssH;
    this.fbos = null;
  },
  // 相機：看著 target，從南邊上方往下看
  camera(tx, ty, tz, dist, pitch, fov) {
    const e = [tx, ty + Math.sin(pitch) * dist, tz + Math.cos(pitch) * dist];
    this.camPos = e; this.fov = fov; this.pitch = pitch; this.target = [tx, ty, tz]; this.dist = dist;
    this.V = M4.lookAt(e, [tx, ty, tz], [0, 1, 0]);
    this.P = M4.persp(fov, this.aspect, Math.max(0.5, dist * 0.2), dist * 3 + 40);
    this.VP = M4.mul(this.P, this.V);
  },
  // 世界座標 → 螢幕（CSS 像素）
  project(x, y, z) {
    const m = this.VP;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(cx / cw * 0.5 + 0.5) * this.cssW, (1 - (cy / cw * 0.5 + 0.5)) * this.cssH, cw];
  },
  // 一個 frame。env = {clear, amb, sky, sunDir, sunCol, fogCol, fog, toon, points:[{x,y,z,r,c}], spots:[{x,y,z,r,dx,dy,dz,cos,c}]}
  begin(env) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    const c = env.clear; gl.clearColor(c[0], c[1], c[2], 1);
    gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    const L = this.lit; gl.useProgram(L.p);
    gl.uniformMatrix4fv(L.u.uVP, false, this.VP);
    gl.uniform3fv(L.u.uAmb, env.amb); gl.uniform3fv(L.u.uSkyCol, env.sky || [0, 0, 0]);
    gl.uniform3fv(L.u.uSunDir, env.sunDir); gl.uniform3fv(L.u.uSunCol, env.sunCol);
    gl.uniform3fv(L.u.uFogCol, env.fogCol || c); gl.uniform2fv(L.u.uFog, env.fog || [500, 600]); gl.uniform3fv(L.u.uCam, this.camPos);
    gl.uniform1f(L.u.uToon, env.toon || 0);
    const P = (env.points || []).slice(0, NPL), S = (env.spots || []).slice(0, NSL);
    const pl = new Float32Array(NPL * 4), plc = new Float32Array(NPL * 3);
    for (let i = 0; i < NPL; i++) { const p = P[i]; if (p) { pl.set([p.x, p.y, p.z, p.r], i * 4); plc.set(p.c, i * 3); } else pl[i * 4 + 3] = 0.001; }
    gl.uniform4fv(L.u.uPL, pl); gl.uniform3fv(L.u.uPLc, plc);
    const sl = new Float32Array(NSL * 4), sld = new Float32Array(NSL * 4), slc = new Float32Array(NSL * 3);
    for (let i = 0; i < NSL; i++) { const s = S[i]; if (s) { sl.set([s.x, s.y, s.z, s.r], i * 4); sld.set([s.dx, s.dy, s.dz, s.cos], i * 4); slc.set(s.c, i * 3); } else { sl[i * 4 + 3] = 0.001; sld[i * 4 + 3] = 2; } }
    gl.uniform4fv(L.u.uSL, sl); gl.uniform4fv(L.u.uSLd, sld); gl.uniform3fv(L.u.uSLc, slc);
    gl.uniform1i(L.u.uTex, 0);
    this.env = env;
  },
  useLit(o) {
    const gl = this.gl, L = this.lit;
    gl.useProgram(L.p);
    gl.uniform1f(L.u.uAlphaTest, o.alphaTest === undefined ? 0.5 : o.alphaTest);
    gl.uniform1f(L.u.uUnlit, o.unlit || 0);
    gl.uniform4fv(L.u.uTint, o.tint || [1, 1, 1, 1]);
    gl.uniform3fv(L.u.uMinLight, o.minLight || [0, 0, 0]);
    gl.uniform1f(L.u.uAlpha, o.alpha === undefined ? 1 : o.alpha);
  },
  blend(mode) {
    const gl = this.gl;
    if (!mode) { gl.disable(gl.BLEND); gl.depthMask(true); return; }
    gl.enable(gl.BLEND); gl.depthMask(false);
    if (mode === 'add') gl.blendFunc(gl.SRC_ALPHA, gl.ONE); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  },
  bindLitAttribs(buf) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
  },
  // 靜態網格：[x,y,z, nx,ny,nz, u,v] 一個頂點 8 個數
  mesh(verts) { return { data: new Float32Array(verts), n: verts.length / 8, buf: null, gen: 0 }; },
  upload(m) {
    const gl = this.gl;
    if (m.gen === this.gen && m.buf) return;
    m.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, m.buf); gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW); m.gen = this.gen;
  },
  drawMesh(m, canvas, o = {}) {
    if (!m || !m.n) return;
    const gl = this.gl;
    this.upload(m);
    this.useLit(o);
    if (o.blend) this.blend(o.blend);
    if (o.cull) gl.enable(gl.CULL_FACE);
    if (o.a2c && this.aa) gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    this.bindLitAttribs(m.buf);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex(canvas || this.white));
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
    if (o.a2c && this.aa) gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    if (o.cull) gl.disable(gl.CULL_FACE);
    if (o.blend) this.blend(null);
  },
  // 立牌：list = [{img, v(48 floats), tint, minLight, unlit, alpha}]
  drawSprites(list, o = {}) {
    if (!list.length) return;
    const gl = this.gl, L = this.lit;
    const data = new Float32Array(list.length * 48);
    list.forEach((s, i) => data.set(s.v, i * 48));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const a2c = this.aa && o.a2c !== false && !o.blend;
    this.useLit({ alphaTest: o.alphaTest === undefined ? (a2c ? 0.1 : 0.5) : o.alphaTest });
    if (o.blend) this.blend(o.blend);
    if (a2c) gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    this.bindLitAttribs(this.dynBuf);
    gl.activeTexture(gl.TEXTURE0);
    let lastTint = null, lastMin = null, lastUnlit = 0, lastAlpha = 1;
    list.forEach((s, i) => {
      const tint = s.tint || null, mn = s.minLight || null, un = s.unlit || 0, al = s.alpha === undefined ? 1 : s.alpha;
      if (tint !== lastTint) { gl.uniform4fv(L.u.uTint, tint || [1, 1, 1, 1]); lastTint = tint; }
      if (mn !== lastMin) { gl.uniform3fv(L.u.uMinLight, mn || [0, 0, 0]); lastMin = mn; }
      if (un !== lastUnlit) { gl.uniform1f(L.u.uUnlit, un); lastUnlit = un; }
      if (al !== lastAlpha) { gl.uniform1f(L.u.uAlpha, al); lastAlpha = al; }
      gl.bindTexture(gl.TEXTURE_2D, this.tex(s.img));
      gl.drawArrays(gl.TRIANGLES, i * 6, 6);
    });
    if (a2c) gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    if (o.blend) this.blend(null);
  },
  // 彩色三角形（光錐、聲波、影子、光暈）：[x,y,z, r,g,b,a, u,v]
  drawColor(verts, canvas, mode = 'alpha', o = {}) {
    if (!verts.length) return;
    const gl = this.gl, C = this.col;
    gl.useProgram(C.p);
    gl.uniformMatrix4fv(C.u.uVP, false, this.VP); gl.uniform1i(C.u.uTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colBuf); gl.bufferData(gl.ARRAY_BUFFER, verts instanceof Float32Array ? verts : new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 28);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex(canvas || this.white));
    this.blend(mode);
    if (o.depthTest === false) gl.disable(gl.DEPTH_TEST);
    if (o.offset) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); }
    if (o.depthFunc) gl.depthFunc(gl[o.depthFunc]);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 9);
    if (o.depthFunc) gl.depthFunc(gl.LEQUAL);
    if (o.offset) gl.disable(gl.POLYGON_OFFSET_FILL);
    if (o.depthTest === false) gl.enable(gl.DEPTH_TEST);
    this.blend(null);
    gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
  },
  // 透過牆看到的剪影
  drawSilhouettes(list, rgba) {
    if (!list.length) return;
    const gl = this.gl, L = this.lit;
    const data = new Float32Array(list.length * 48);
    list.forEach((s, i) => data.set(s.v, i * 48));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    this.useLit({ alphaTest: 0.5, unlit: 1, tint: [0, 0, 0, 1] });
    this.blend('alpha');
    gl.depthFunc(gl.GREATER);
    this.bindLitAttribs(this.dynBuf);
    gl.activeTexture(gl.TEXTURE0);
    list.forEach((s, i) => {
      gl.uniform4fv(L.u.uTint, s.sil || rgba);
      gl.bindTexture(gl.TEXTURE_2D, this.tex(s.img));
      gl.drawArrays(gl.TRIANGLES, i * 6, 6);
    });
    gl.depthFunc(gl.LEQUAL);
    this.blend(null);
  },
  // ---------- 後製：光暈 + 移軸模糊 + 暗角 ----------
  makeFbo(w, h) {
    const gl = this.gl;
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok ? { f, t, w, h } : null;
  },
  ensurePost() {
    if (this.fbos && this.fbos.gen === this.gen) return !!this.fbos.ok;
    const gl = this.gl, W = this.cv.width, H = this.cv.height;
    const q = Math.max(1, Math.round(W / 4)), r = Math.max(1, Math.round(H / 4));
    const sc = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, sc);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, W, H, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = { gen: this.gen, scene: sc, W, H, a: this.makeFbo(q, r), b: this.makeFbo(q, r), c: this.makeFbo(q, r), d: this.makeFbo(q, r) };
    fb.ok = !!(fb.a && fb.b && fb.c && fb.d);
    this.fbos = fb;
    return fb.ok;
  },
  pass(prog, target, setup) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null);
    gl.viewport(0, 0, target ? target.w : this.cv.width, target ? target.h : this.cv.height);
    gl.useProgram(prog.p);
    setup(prog.u);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },
  postFx(o) {
    if (!this.post || !o || !this.ensurePost()) return;
    const gl = this.gl, F = this.fbos;
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, F.scene);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, F.W, F.H);
    const px = [1 / F.W, 1 / F.H];
    const down = (src, dst, th) => this.pass(this.ppDown, dst, u => { gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform1i(u.uTex, 0); gl.uniform2fv(u.uPx, px); gl.uniform1f(u.uThresh, th); gl.uniform1f(u.uKnee, 0.12); });
    const blur = (src, dst, dx, dy) => this.pass(this.ppBlur, dst, u => { gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform1i(u.uTex, 0); gl.uniform2fv(u.uDir, [dx / src.w, dy / src.h]); });
    // 光暈
    down(F.scene, F.a, o.thresh === undefined ? 0.72 : o.thresh);
    blur(F.a, F.b, 1, 0); blur(F.b, F.a, 0, 1); blur(F.a, F.b, 2, 0); blur(F.b, F.a, 0, 2);
    // 景深模糊
    down(F.scene, F.c, 0);
    blur(F.c, F.d, 1, 0); blur(F.d, F.c, 0, 1);
    this.pass(this.ppComp, null, u => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, F.scene); gl.uniform1i(u.uScene, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, F.a.t); gl.uniform1i(u.uBloom, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, F.c.t); gl.uniform1i(u.uBlur, 2);
      gl.uniform1f(u.uBloomK, o.bloom === undefined ? 0.8 : o.bloom);
      gl.uniform2fv(u.uTilt, o.tilt || [0.22, 0.86]);
      gl.uniform1f(u.uVig, o.vig === undefined ? 0.35 : o.vig);
      gl.uniform3fv(u.uGrade, o.grade || [1, 1, 1]);
      gl.uniform1f(u.uSat, o.sat === undefined ? 1.05 : o.sat);
      const a = this.cssW / this.cssH;
      gl.uniform2fv(u.uAspect, a > 1 ? [1, 1 / a] : [a, 1]);
    });
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  },
};

// 網格組合器：把四邊形依貼圖分組，最後各自建成一個網格
class MeshBuilder {
  constructor() { this.groups = new Map(); }
  arr(canvas) { let g = this.groups.get(canvas); if (!g) { g = []; this.groups.set(canvas, g); } return g; }
  // p0 左上、p1 右上、p2 右下、p3 左下（從正面看）；uv = [u0,v0,u1,v1]
  quad(canvas, p0, p1, p2, p3, n, uv) {
    const g = this.arr(canvas);
    if (!n) {
      const ax = p3[0] - p0[0], ay = p3[1] - p0[1], az = p3[2] - p0[2], bx = p1[0] - p0[0], by = p1[1] - p0[1], bz = p1[2] - p0[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1;
      n = [nx / l, ny / l, nz / l];
    }
    const [u0, v0, u1, v1] = uv || [0, 0, 1, 1];
    const V = (p, u, v) => g.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v);
    V(p0, u0, v0); V(p3, u0, v1); V(p2, u1, v1);
    V(p0, u0, v0); V(p2, u1, v1); V(p1, u1, v0);
  }
  tri(canvas, a, b, c, n, ua, ub, uc) {
    const g = this.arr(canvas);
    if (!n) {
      const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1;
      n = [nx / l, ny / l, nz / l];
    }
    for (const [p, uv] of [[a, ua], [b, ub], [c, uc]]) g.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1]);
  }
  // 方盒：f = {top, front(+z), back(-z), left(-x), right(+x)}，每面 {img, uv}
  box(x0, y0, z0, x1, y1, z1, f) {
    if (f.top) this.quad(f.top.img, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], f.top.uv);
    if (f.front) this.quad(f.front.img, [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1], [0, 0, 1], f.front.uv);
    if (f.back) this.quad(f.back.img, [x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0], [0, 0, -1], f.back.uv);
    if (f.left) this.quad(f.left.img, [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0], [-1, 0, 0], f.left.uv);
    if (f.right) this.quad(f.right.img, [x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [1, 0, 0], f.right.uv);
  }
  // 直立圓柱（水塔、電線桿）
  cyl(img, cx, y0, cz, r, h, segs = 14, uv = [0, 0, 1, 1], cap) {
    const g = this.arr(img);
    const [u0, v0, u1, v1] = uv;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const x0 = cx + Math.sin(a0) * r, z0 = cz + Math.cos(a0) * r, x1 = cx + Math.sin(a1) * r, z1 = cz + Math.cos(a1) * r;
      const n0 = [Math.sin(a0), 0, Math.cos(a0)], n1 = [Math.sin(a1), 0, Math.cos(a1)];
      const ua = u0 + (u1 - u0) * (i / segs), ub = u0 + (u1 - u0) * ((i + 1) / segs);
      const P = (x, y, z, n, u, v) => g.push(x, y, z, n[0], n[1], n[2], u, v);
      P(x0, y0 + h, z0, n0, ua, v0); P(x0, y0, z0, n0, ua, v1); P(x1, y0, z1, n1, ub, v1);
      P(x0, y0 + h, z0, n0, ua, v0); P(x1, y0, z1, n1, ub, v1); P(x1, y0 + h, z1, n1, ub, v0);
    }
    if (cap) {
      const c = this.arr(cap.img); const [cu0, cv0, cu1, cv1] = cap.uv || [0, 0, 1, 1];
      const cu = (cu0 + cu1) / 2, cvv = (cv0 + cv1) / 2, ru = (cu1 - cu0) / 2, rv = (cv1 - cv0) / 2;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
        const P = (x, z, u, v) => c.push(x, y0 + h, z, 0, 1, 0, u, v);
        P(cx, cz, cu, cvv);
        P(cx + Math.sin(a0) * r, cz + Math.cos(a0) * r, cu + Math.sin(a0) * ru, cvv + Math.cos(a0) * rv);
        P(cx + Math.sin(a1) * r, cz + Math.cos(a1) * r, cu + Math.sin(a1) * ru, cvv + Math.cos(a1) * rv);
      }
    }
  }
  build() {
    const out = [];
    for (const [img, verts] of this.groups) if (verts.length) out.push({ img, mesh: GL3.mesh(verts) });
    return out;
  }
}

// 立牌：直立、面向相機，高度補償俯角，底部中心在 (x, 0, z)
// w, h 是「看起來」的寬高（格），lift 是離地高度（也是看起來的）
function billboard(img, x, z, w, h, o = {}) {
  const k = 1 / Math.cos(GL3.pitch || 0.9);
  const lift = (o.lift || 0) * k, H = h * k;
  const x0 = x - w * (o.ax === undefined ? 0.5 : o.ax), x1 = x0 + w;
  const yb = lift, yt = lift + H;
  const zz = z + (o.dz || 0);
  const ny = 0.35, nz = 0.94;
  const [ua, ub] = o.flip ? [1, 0] : [0, 1];
  const v0 = o.v0 || 0, v1 = o.v1 === undefined ? 1 : o.v1;
  const v = new Float32Array(48);
  const P = (i, px, py, pz, u, vv) => { v.set([px, py, pz, 0, ny, nz, u, vv], i * 8); };
  P(0, x0, yt, zz, ua, v0); P(1, x0, yb, zz, ua, v1); P(2, x1, yb, zz, ub, v1);
  P(3, x0, yt, zz, ua, v0); P(4, x1, yb, zz, ub, v1); P(5, x1, yt, zz, ub, v0);
  return { img, v, tint: o.tint, minLight: o.minLight, unlit: o.unlit, alpha: o.alpha, sil: o.sil, z: zz };
}
// 地上的四邊形（花瓣、影子貼花）：中心 (x, z)，寬 w、深 d、旋轉 rot
function groundQuad(out, x, z, w, d, rot, col, y = 0.015) {
  const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
  const P = (u, v) => [x + (u * c - v * s), y, z + (u * s + v * c)];
  const a = P(-w / 2, -d / 2), b = P(w / 2, -d / 2), e = P(w / 2, d / 2), f = P(-w / 2, d / 2);
  const [r, g, bb, al] = col;
  out.push(
    ...a, r, g, bb, al, 0, 0, ...f, r, g, bb, al, 0, 1, ...e, r, g, bb, al, 1, 1,
    ...a, r, g, bb, al, 0, 0, ...e, r, g, bb, al, 1, 1, ...b, r, g, bb, al, 1, 0,
  );
}
// 立起來、面向相機的光暈（加法混色）
function glowQuad(out, x, y, z, r, col) {
  const [cr, cg, cb, ca] = col;
  const P = (dx, dy) => [x + dx, y + dy * Math.cos(GL3.pitch), z - dy * Math.sin(GL3.pitch)];
  const a = P(-r, r), b = P(r, r), e = P(r, -r), f = P(-r, -r);
  out.push(
    ...a, cr, cg, cb, ca, 0, 0, ...f, cr, cg, cb, ca, 0, 1, ...e, cr, cg, cb, ca, 1, 1,
    ...a, cr, cg, cb, ca, 0, 0, ...e, cr, cg, cb, ca, 1, 1, ...b, cr, cg, cb, ca, 1, 0,
  );
}

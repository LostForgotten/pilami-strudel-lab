import {CollisionAudio} from './collisions.mjs';
import {CollisionGlow} from './glow.mjs';
import {NeighborLights} from './diffusion.mjs';
import {LocalOcclusion} from './occlusion.mjs';
var Mt = class {
  constructor(e = 128) {
    (this.max = 0),
      (this.n = 0),
      (this.R = 2.6),
      (this.rim = 1.8),
      (this.rimR = Math.sqrt(this.R * this.R - (this.R - this.rim) ** 2)),
      (this.stepID = 1),
      (this.contactCount = 0),
      (this.totalContacts = 0),
      (this.time = 0),
      (this.phase = 0),
      (this.drive = 0),
      (this.big = {
        p: new Float64Array([0, 0.59, 0.26]),
        v: new Float64Array(3),
        w: new Float64Array(3),
        q: new Float64Array([0, 0, 0, 1]),
        r: 0.48,
      }),
      (this.randState = 7),
      (this.gridDirty = !0),
      (this.spawnLevel = 0),
      (this.pairTests = 0),
      this.ensureCapacity(e);
  }
  ensureCapacity(e) {
    if (e <= this.max) return;
    let a = Math.max(16, this.max);
    for (; a < e; ) a *= 2;
    for (let o of ["p", "old", "v", "w", "q", "r", "base", "mass", "hue"]) {
      let c = this[o],
        l = o === "q" ? 4 : ["p", "old", "v", "w"].includes(o) ? 3 : 1,
        d = new Float64Array(a * l);
      if ((c && d.set(c), o === "q"))
        for (let f = this.max; f < a; f++) d[f * 4 + 3] = 1;
      this[o] = d;
    }
    let t = new Uint8Array(a);
    this.inside && t.set(this.inside),
      (this.inside = t),
      (this.max = a),
      (this.contacts = new Float64Array(a * 32 * 7));
    let i = 1;
    for (; i < a * 128; ) i *= 2;
    for (
      this.seenEpoch = new Uint32Array(i),
        this.seenKey = new Float64Array(i),
        this.seenMask = i - 1,
        i = 1;
      i < a * 4;

    )
      i *= 2;
    (this.gridHeads = new Int32Array(i)),
      (this.gridNext = new Int32Array(a)),
      (this.gridCoord = new Int32Array(a * 3)),
      (this.gridMask = i - 1),
      (this.gridDirty = !0);
  }
  bucket(e, a, t) {
    return (
      (Math.imul(e, 73856093) ^
        Math.imul(a, 19349663) ^
        Math.imul(t, 83492791)) &
      this.gridMask
    );
  }
  buildGrid(e = 0) {
    let a = e;
    for (let t = 0; t < this.n; t++) a = Math.max(a, this.r[t]);
    (this.gridMaxR = a),
      (this.cellSize = Math.max(1e-6, a * 2.05)),
      this.gridHeads.fill(-1);
    for (let t = 0; t < this.n; t++) this.r[t] > 0 && this.insertGrid(t);
    this.gridDirty = !1;
  }
  insertGrid(e) {
    let a = e * 3,
      t = Math.floor(this.p[a] / this.cellSize),
      i = Math.floor(this.p[a + 1] / this.cellSize),
      o = Math.floor(this.p[a + 2] / this.cellSize),
      c = this.bucket(t, i, o);
    (this.gridCoord[a] = t),
      (this.gridCoord[a + 1] = i),
      (this.gridCoord[a + 2] = o),
      (this.gridNext[e] = this.gridHeads[c]),
      (this.gridHeads[c] = e);
  }
  canSpawn(e, a, t, i) {
    if (i <= 0) return !0;
    let o = Math.min(0.012, Math.max(1e-9, Math.max(i, this.gridMaxR) * 0.075)),
      c = Math.floor(e / this.cellSize),
      l = Math.floor(a / this.cellSize),
      d = Math.floor(t / this.cellSize),
      f = Math.ceil((i + this.gridMaxR + o) / this.cellSize);
    for (let p = -f; p <= f; p++)
      for (let F = -f; F <= f; F++)
        for (let y = -f; y <= f; y++) {
          let P = c + y,
            s = l + F,
            n = d + p;
          for (
            let u = this.gridHeads[this.bucket(P, s, n)];
            u !== -1;
            u = this.gridNext[u]
          ) {
            let h = u * 3;
            if (
              this.gridCoord[h] !== P ||
              this.gridCoord[h + 1] !== s ||
              this.gridCoord[h + 2] !== n
            )
              continue;
            let M = e - this.p[h],
              E = a - this.p[h + 1],
              x = t - this.p[h + 2],
              v = i + this.r[u] + o;
            if (M * M + E * E + x * x < v * v) return !1;
          }
        }
    return !0;
  }
  radiusFor(base, size, variation = 0.16) {
    // Reuse the seeded size sample drawn once at birth. Changing the spread
    // morphs stable targets, without resampling every frame or changing hues.
    const sample=(base/0.16-1)/0.16;
    return 0.16*Math.max(0,size)*Math.max(0,1+Math.max(0,variation)*sample);
  }
  setCount(e, a = 1, variation = 0.16) {
    if (!Number.isFinite(e) || e < 0)
      throw Error("Nombre_Billes doit \xEAtre un entier fini positif.");
    if (((e = Math.floor(e)), this.ensureCapacity(e), e < this.n))
      (this.n = e), (this.gridDirty = !0);
    else if (e > this.n) for (this.spawnLevel = 0; this.n < e; ) this.add(a,variation);
  }
  random() {
    let e = (this.randState += 1831565813);
    return (
      (e = Math.imul(e ^ (e >>> 15), e | 1)),
      (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
      ((e ^ (e >>> 14)) >>> 0) / 4294967296
    );
  }
  reset(e = 7, a = 54, t = 1, i = 0.48, variation = 0.16) {
    (this.randState = Math.round(e) >>> 0),
      (this.wanderState = (Math.round(e) ^ 2654435769) >>> 0 || 2738958700),
      (this.randomPhase = 0),
      (this.wander = new Float64Array(8));
    for (let o = 0; o < 4; o++) this.wanderPoint(o * 2);
    (this.n = 0),
      (this.time = this.phase = this.drive = 0),
      this.v.fill(0),
      this.inside.fill(1),
      (this.big.r = i),
      this.big.p.set([
        0,
        this.R - Math.sqrt((this.R - i - 0.003) ** 2 - 0.26 ** 2) + 0.04,
        0.26,
      ]),
      this.big.v.fill(0),
      this.big.w.fill(0),
      this.big.q.set([0, 0, 0, 1]),
      (this.gridDirty = !0),
      (this.spawnLevel = 0),
      this.setCount(a, t, variation);
  }
  add(e = 1, variation = 0.16) {
    this.ensureCapacity(this.n + 1), this.gridDirty && this.buildGrid();
    let a = this.n,
      t = 0.16 * (0.84 + 0.32 * this.random()),
      i = this.radiusFor(t,e,variation);
    i * 2 > this.cellSize && this.buildGrid(i);
    let o,
      c,
      l,
      d = !1;
    for (; !d; ) {
      for (let p = 0; p < 128; p++) {
        let F = this.random() * Math.PI * 2,
          y =
            Math.sqrt(this.random()) *
            Math.min(2.05, 1.65 + this.spawnLevel * 0.08);
        if (
          ((o = Math.cos(F) * y),
          (l = Math.sin(F) * y),
          (c =
            this.R -
            Math.sqrt(Math.max(0.01, (this.R - i - 0.003) ** 2 - y * y)) +
            0.08 +
            this.random() * 0.85 +
            this.spawnLevel * 0.22 * e),
          !(
            Math.hypot(
              o - this.big.p[0],
              c - this.big.p[1],
              l - this.big.p[2],
            ) <
            i + this.big.r + 0.015
          ) && this.canSpawn(o, c, l, i))
        ) {
          d = !0;
          break;
        }
      }
      d || this.spawnLevel++;
    }
    let f = a * 3;
    return (
      (this.p[f] = o),
      (this.p[f + 1] = c),
      (this.p[f + 2] = l),
      this.v.fill(0, f, f + 3),
      this.w.fill(0, f, f + 3),
      this.q.set([0, 0, 0, 1], a * 4),
      (this.base[a] = t),
      (this.r[a] = i),
      (this.mass[a] = i > 0 ? (0.16 / Math.max(i, 1e-12)) ** 3 : 0),
      (this.hue[a] = (a * 0.61803398875 + this.random() * 0.09) % 1),
      (this.inside[a] = 1),
      this.n++,
      (this.gridMaxR = Math.max(this.gridMaxR, i)),
      i > 0 && this.insertGrid(a),
      !0
    );
  }
  contact(e, a, t, i, o, c) {
    let l = e * (this.max + 3) + (a < 0 ? this.max - a - 1 : a),
      d =
        (Math.imul(e + 1, 73856093) ^ Math.imul(a + 4, 19349663)) &
        this.seenMask;
    for (; this.seenEpoch[d] === this.stepID; ) {
      if (this.seenKey[d] === l) return;
      d = (d + 1) & this.seenMask;
    }
    if (
      ((this.seenEpoch[d] = this.stepID),
      (this.seenKey[d] = l),
      (this.contactCount + 1) * 7 > this.contacts.length)
    ) {
      let p = new Float64Array(this.contacts.length * 2);
      p.set(this.contacts), (this.contacts = p);
    }
    let f = this.contactCount++ * 7;
    (this.contacts[f] = e),
      (this.contacts[f + 1] = a),
      (this.contacts[f + 2] = t),
      (this.contacts[f + 3] = i),
      (this.contacts[f + 4] = o),
      (this.contacts[f + 5] = c),
      (this.contacts[f + 6] = 0);
  }
  boundary(e, a) {
    let t = e * 3,
      i = this.p,
      o = this.r[e],
      c = this.v,
      l = i[t],
      d = i[t + 1],
      f = i[t + 2],
      p = Math.hypot(l, f);
    d - o > this.rim &&
      (p > this.rimR + o
        ? (this.inside[e] = 0)
        : p < this.rimR - o && (this.inside[e] = 1));
    let F = l,
      y = d - this.R,
      P = f,
      s = Math.hypot(F, y, P),
      n = 0,
      u = 0;
    if (
      s > 1e-9 &&
      (this.R + (this.R * y) / s <= this.rim + 0.001 &&
        (this.inside[e] && s > this.R - o && ((n = -1), (u = s - (this.R - o))),
        !this.inside[e] &&
          s < this.R + 0.07 + o &&
          ((n = 1), (u = this.R + 0.07 + o - s))),
      u > 0)
    ) {
      let M = (n * F) / s,
        E = (n * y) / s,
        x = (n * P) / s;
      (i[t] += M * u),
        (i[t + 1] += E * u),
        (i[t + 2] += x * u),
        a &&
          this.contact(
            e,
            -1,
            M,
            E,
            x,
            c[t] * M + c[t + 1] * E + c[t + 2] * x,
            this.max * this.max + e,
          );
    }
    if (
      p > 1e-9 &&
      ((F = i[t] - (i[t] / p) * this.rimR),
      (y = i[t + 1] - this.rim),
      (P = i[t + 2] - (i[t + 2] / p) * this.rimR),
      (s = Math.hypot(F, y, P)),
      (u = o + 0.035 - s),
      u > 0 && s > 1e-9)
    ) {
      let h = F / s,
        M = y / s,
        E = P / s;
      (i[t] += h * u),
        (i[t + 1] += M * u),
        (i[t + 2] += E * u),
        a &&
          this.contact(
            e,
            -1,
            h,
            M,
            E,
            c[t] * h + c[t + 1] * M + c[t + 2] * E,
            this.max * this.max + e,
          );
    }
    (u = -0.11 + o - i[t + 1]),
      u > 0 &&
        ((i[t + 1] += u),
        a &&
          this.contact(
            e,
            -3,
            0,
            1,
            0,
            c[t + 1],
            this.max * this.max + this.max * 2 + e,
          ));
  }
  wanderRandom() {
    let e = this.wanderState;
    return (
      (e ^= e << 13),
      (e ^= e >>> 17),
      (e ^= e << 5),
      (this.wanderState = e >>> 0),
      (e >>> 0) / 4294967296
    );
  }
  wanderPoint(e) {
    let a = this.wanderRandom() * Math.PI * 2,
      t = Math.sqrt(this.wanderRandom()) * 0.9;
    (this.wander[e] = Math.cos(a) * t), (this.wander[e + 1] = Math.sin(a) * t);
  }
  spline(e, a) {
    let t = this.wander,
      i = t[e],
      o = t[e + 2],
      c = t[e + 4],
      l = t[e + 6];
    return (
      0.5 *
      (2 * o +
        (-i + c) * a +
        (2 * i - 5 * o + 4 * c - l) * a * a +
        (-i + 3 * o - 3 * c + l) * a * a * a)
    );
  }
  moveBig(e, a) {
    let t = Math.max(0, Math.min(1, a.drive || 0)),
      i = t > this.drive ? 0.055 : 0.32;
    this.drive += (t - this.drive) * (1 - Math.exp(-e / i));
    let o = Math.max(0, Math.min(1, a.randomMode ?? 0)),
      c = Math.max(0, Math.min(1, this.drive + o * (a.autonomy ?? 0.35))),
      l = a.speed ?? 1,
      d = Math.max(
        -1.55,
        Math.min(1.55, 1.3 * (a.amplitude ?? 1) * (0.2 + 0.8 * c)),
      );
    this.phase += e * l * c * 1.9;
    let f = Math.max(0, Math.min(0.7, a.bigRadius ?? 0.48));
    this.big.r += Math.max(-e * 0.6, Math.min(e * 0.6, f - this.big.r));
    let p = Math.sin(this.phase) * d,
      F = Math.cos(this.phase) * d;
    if (o > 0) {
      for (
        this.randomPhase += e * l * (a.randomSpeed ?? 1) * 0.4 * c;
        this.randomPhase >= 1;

      )
        (this.randomPhase -= 1),
          this.wander.copyWithin(0, 2),
          this.wanderPoint(6);
      for (; this.randomPhase < 0; )
        (this.randomPhase += 1),
          this.wander.copyWithin(2, 0, 6),
          this.wanderPoint(0);
      let z = Math.max(
          -1.55,
          Math.min(
            1.55,
            (0.6 + 0.9 * c) * (a.amplitude ?? 1) * (a.randomAmplitude ?? 1),
          ),
        ),
        H = this.spline(0, this.randomPhase),
        X = this.spline(1, this.randomPhase),
        K = Math.hypot(H, X);
      K > 1 && ((H /= K), (X /= K)),
        (p = p * (1 - o) + H * z * o),
        (F = F * (1 - o) + X * z * o);
    }
    let y = Math.hypot(p, F),
      P =
        this.R -
        Math.sqrt(Math.max(0.05, (this.R - this.big.r - 0.003) ** 2 - y * y)) +
        0.04 +
        c * (a.lift ?? 0.12) * (0.5 + 0.5 * Math.sin(this.phase * 1.73)),
      s = this.big.p,
      n = this.big.v,
      u = p - s[0],
      h = P - s[1],
      M = F - s[2],
      E = Math.hypot(u, h, M),
      x = E > 1e-9 ? Math.min(1, (e * Math.abs(l) * (0.4 + 2.7 * c)) / E) : 0,
      v = s[0],
      D = s[1],
      N = s[2];
    (s[0] += u * x), (s[1] += h * x), (s[2] += M * x);
    let O = Math.hypot(s[0], s[1] - this.R, s[2]);
    if (
      this.big.r > 0 &&
      O > this.R - this.big.r &&
      this.R + (this.R * (s[1] - this.R)) / O <= this.rim
    ) {
      let z = (this.R - this.big.r) / O;
      (s[0] *= z), (s[1] = this.R + (s[1] - this.R) * z), (s[2] *= z);
    }
    (n[0] = (s[0] - v) / e), (n[1] = (s[1] - D) / e), (n[2] = (s[2] - N) / e);
    let _ = this.big.w,
      C = Math.hypot(s[0], s[1] - this.R, s[2]) || 1,
      L = -s[0] / C,
      tt = (this.R - s[1]) / C,
      Y = -s[2] / C;
    if (this.big.r > 0) {
      let z = 1 / this.big.r;
      (_[0] = (tt * n[2] - Y * n[1]) * z),
        (_[1] = (Y * n[0] - L * n[2]) * z),
        (_[2] = (L * n[1] - tt * n[0]) * z);
    } else _.fill(0);
    this.integrateRotation(this.big.q, 0, _, 0, e);
  }
  integrateRotation(e, a, t, i, o) {
    let c = Math.hypot(t[i], t[i + 1], t[i + 2]);
    if (c < 1e-12) return;
    let l = c * o * 0.5,
      d = Math.sin(l) / c,
      f = t[i] * d,
      p = t[i + 1] * d,
      F = t[i + 2] * d,
      y = Math.cos(l),
      P = e[a],
      s = e[a + 1],
      n = e[a + 2],
      u = e[a + 3],
      h = y * P + f * u + p * n - F * s,
      M = y * s - f * n + p * u + F * P,
      E = y * n + f * s - p * P + F * u,
      x = y * u - f * P - p * s - F * n,
      v = 1 / Math.hypot(h, M, E, x);
    (e[a] = h * v), (e[a + 1] = M * v), (e[a + 2] = E * v), (e[a + 3] = x * v);
  }
  step(e, a = {}) {
    if (!(e > 0 && e <= 1 / 60))
      throw Error("Fixed physics step must be <= 1/60 s");
    let t = this.p,
      i = this.v,
      o = this.w,
      c = this.n,
      l = this.big;
    this.stepID++,
      this.stepID === 4294967295 && (this.seenEpoch.fill(0), (this.stepID = 1)),
      (this.contactCount = 0),
      (this.pairTests = 0),
      this.old.set(t),
      (this.time += e),
      a.stirrer !== !1 && this.moveBig(e, a);
    let d = a.gravity ?? 9.81,
      f = Math.exp(Math.max(-50, Math.min(50, -(a.damping ?? 0.24) * e))),
      p = Math.max(0, a.size ?? 1);
    for (let s = 0; s < c; s++) {
      let n = s * 3,
        u = this.radiusFor(this.base[s],p,a.sizeVariation??0.16);
      if (
        ((this.r[s] += Math.max(-e * 0.24, Math.min(e * 0.24, u - this.r[s]))),
        (this.mass[s] =
          this.r[s] > 0 ? (0.16 / Math.max(this.r[s], 1e-12)) ** 3 : 0),
        this.r[s] === 0)
      ) {
        i[n] = i[n + 1] = i[n + 2] = o[n] = o[n + 1] = o[n + 2] = 0;
        continue;
      }
      (o[n] *= f),
        (o[n + 1] *= f),
        (o[n + 2] *= f),
        (i[n] *= f),
        (i[n + 1] = (i[n + 1] - d * e) * f),
        (i[n + 2] *= f);
      let h = Math.hypot(i[n], i[n + 1], i[n + 2]);
      if (h > 8) {
        let M = 8 / h;
        (i[n] *= M), (i[n + 1] *= M), (i[n + 2] *= M);
      }
      (t[n] += i[n] * e),
        (t[n + 1] += i[n + 1] * e),
        (t[n + 2] += i[n + 2] * e);
    }
    let F = Math.max(1, Math.min(14, Math.round(a.iterations ?? 8)));
    for (let s = 0; s < F; s++) {
      for (let n = 0; n < c; n++) {
        let u = n * 3;
        if (
          this.r[n] !== 0 &&
          (a.boundary !== !1 && this.boundary(n, !0),
          a.stirrer !== !1 && l.r > 0)
        ) {
          let h = t[u] - l.p[0],
            M = t[u + 1] - l.p[1],
            E = t[u + 2] - l.p[2],
            x = Math.hypot(h, M, E),
            v = this.r[n] + l.r - x;
          if (v > 0) {
            x < 1e-9 && ((h = 1), (M = 0), (E = 0), (x = 1));
            let D = h / x,
              N = M / x,
              O = E / x;
            (t[u] += D * v),
              (t[u + 1] += N * v),
              (t[u + 2] += O * v),
              this.contact(
                n,
                -2,
                D,
                N,
                O,
                (i[u] - l.v[0]) * D +
                  (i[u + 1] - l.v[1]) * N +
                  (i[u + 2] - l.v[2]) * O,
                this.max * this.max + this.max + n,
              );
          }
        }
      }
      this.buildGrid();
      for (let n = 0; n < c; n++) {
        if (this.r[n] === 0) continue;
        let u = n * 3,
          h = this.gridCoord[u],
          M = this.gridCoord[u + 1],
          E = this.gridCoord[u + 2];
        for (let x = -1; x <= 1; x++)
          for (let v = -1; v <= 1; v++)
            for (let D = -1; D <= 1; D++) {
              let N = h + D,
                O = M + v,
                _ = E + x;
              for (
                let C = this.gridHeads[this.bucket(N, O, _)];
                C !== -1;
                C = this.gridNext[C]
              ) {
                let L = C * 3;
                if (
                  C <= n ||
                  this.gridCoord[L] !== N ||
                  this.gridCoord[L + 1] !== O ||
                  this.gridCoord[L + 2] !== _
                )
                  continue;
                this.pairTests++;
                let tt = t[u] - t[L],
                  Y = t[u + 1] - t[L + 1],
                  z = t[u + 2] - t[L + 2],
                  H = tt * tt + Y * Y + z * z,
                  X = this.r[n] + this.r[C];
                if (H < X * X) {
                  let K = Math.sqrt(H);
                  K < 1e-9 && ((tt = 1), (Y = 0), (z = 0), (K = 1));
                  let et = tt / K,
                    G = Y / K,
                    Z = z / K,
                    at = X - Math.sqrt(H),
                    st = this.mass[n],
                    it = this.mass[C],
                    J = at / (st + it);
                  (t[u] += et * J * st),
                    (t[u + 1] += G * J * st),
                    (t[u + 2] += Z * J * st),
                    (t[L] -= et * J * it),
                    (t[L + 1] -= G * J * it),
                    (t[L + 2] -= Z * J * it),
                    this.contact(
                      n,
                      C,
                      et,
                      G,
                      Z,
                      (i[u] - i[L]) * et +
                        (i[u + 1] - i[L + 1]) * G +
                        (i[u + 2] - i[L + 2]) * Z,
                    );
                }
              }
            }
      }
    }
    for (let s = 0; s < c * 3; s++) i[s] = (t[s] - this.old[s]) / e;
    let y = Math.max(0, Math.min(0.8, a.restitution ?? 0.28)),
      P = Math.max(0, Math.min(0.95, a.friction ?? 0.38));
    for (let s = 0; s < 2; s++)
      for (let n = 0; n < this.contactCount; n++) {
        let u = n * 7,
          h = this.contacts[u],
          M = this.contacts[u + 1],
          E = h * 3,
          x = M * 3,
          v = this.contacts[u + 2],
          D = this.contacts[u + 3],
          N = this.contacts[u + 4],
          O = this.contacts[u + 5],
          _ = this.mass[h],
          C = M >= 0 ? this.mass[M] : 0,
          L = M >= 0 ? i[x] : M === -2 ? l.v[0] : 0,
          tt = M >= 0 ? i[x + 1] : M === -2 ? l.v[1] : 0,
          Y = M >= 0 ? i[x + 2] : M === -2 ? l.v[2] : 0,
          z = i[E] - L,
          H = i[E + 1] - tt,
          X = i[E + 2] - Y,
          K = z * v + H * D + X * N,
          et = O < -0.35 ? -y * O : 0,
          G = Math.max(0, (et - K) / (_ + C));
        if (
          ((i[E] += v * G * _),
          (i[E + 1] += D * G * _),
          (i[E + 2] += N * G * _),
          M >= 0 &&
            ((i[x] -= v * G * C),
            (i[x + 1] -= D * G * C),
            (i[x + 2] -= N * G * C)),
          s === 0)
        ) {
          let Z = this.r[h],
            at = M >= 0 ? this.r[M] : M === -2 ? l.r : 0,
            st = M >= 0 ? o[x] : M === -2 ? l.w[0] : 0,
            it = M >= 0 ? o[x + 1] : M === -2 ? l.w[1] : 0,
            J = M >= 0 ? o[x + 2] : M === -2 ? l.w[2] : 0;
          (z -= Z * (o[E + 1] * N - o[E + 2] * D) + at * (it * N - J * D)),
            (H -= Z * (o[E + 2] * v - o[E] * N) + at * (J * v - st * N)),
            (X -= Z * (o[E] * D - o[E + 1] * v) + at * (st * D - it * v));
          let nt = z * v + H * D + X * N,
            Q = z - nt * v,
            R = H - nt * D,
            V = X - nt * N,
            ht = Math.hypot(Q, R, V);
          if (ht > 1e-9) {
            let ct = Math.min(
                ht / (3.5 * (_ + C)),
                P * Math.max(G, -O / (_ + C)),
              ),
              $ = ct / ht;
            (i[E] -= Q * $ * _),
              (i[E + 1] -= R * $ * _),
              (i[E + 2] -= V * $ * _),
              M >= 0 &&
                ((i[x] += Q * $ * C),
                (i[x + 1] += R * $ * C),
                (i[x + 2] += V * $ * C));
            let ut = (D * V - N * R) * $,
              mt = (N * Q - v * V) * $,
              pt = (v * R - D * Q) * $,
              W = (2.5 * _) / Z;
            if (
              ((o[E] += ut * W),
              (o[E + 1] += mt * W),
              (o[E + 2] += pt * W),
              M >= 0)
            ) {
              let rt = (2.5 * C) / at;
              (o[x] += ut * rt), (o[x + 1] += mt * rt), (o[x + 2] += pt * rt);
            }
          }
        }
      }
    for (let s = 0; s < c; s++)
      this.r[s] > 0 && this.integrateRotation(this.q, s * 4, o, s * 3, e);
    (this.totalContacts += this.contactCount), (this.gridDirty = !0);
  }
  stats() {
    let e = 0,
      a = 0,
      t = 0,
      i = 0,
      o = 0,
      c = !0;
    for (let l = 0; l < this.n; l++) {
      let d = l * 3;
      for (let p = 0; p < 3; p++)
        c &&
          (c =
            Number.isFinite(this.p[d + p]) &&
            Number.isFinite(this.v[d + p]) &&
            Number.isFinite(this.w[d + p]));
      for (let p = 0; p < 4; p++) c && (c = Number.isFinite(this.q[l * 4 + p]));
      this.mass[l] > 0 &&
        (i +=
          (this.v[d] ** 2 + this.v[d + 1] ** 2 + this.v[d + 2] ** 2) /
          (2 * this.mass[l])),
        this.inside[l] || o++;
      let f = Math.hypot(this.p[d], this.p[d + 1] - this.R, this.p[d + 2]);
      this.r[l] > 0 &&
        this.p[d + 1] < this.rim &&
        this.inside[l] &&
        (a = Math.max(a, f + this.r[l] - this.R)),
        this.r[l] > 0 &&
          this.big.r > 0 &&
          (t = Math.max(
            t,
            this.r[l] +
              this.big.r -
              Math.hypot(
                this.p[d] - this.big.p[0],
                this.p[d + 1] - this.big.p[1],
                this.p[d + 2] - this.big.p[2],
              ),
          ));
      for (let p = l + 1; p < this.n; p++)
        e = Math.max(
          e,
          this.r[l] +
            this.r[p] -
            Math.hypot(
              this.p[d] - this.p[p * 3],
              this.p[d + 1] - this.p[p * 3 + 1],
              this.p[d + 2] - this.p[p * 3 + 2],
            ),
        );
    }
    return {
      n: this.n,
      capacity: this.max,
      pairTests: this.pairTests,
      overlap: Math.max(0, e),
      wall: Math.max(0, a),
      bigOverlap: Math.max(0, t),
      energy: i,
      escaped: o,
      finite: c,
      contacts: this.contactCount,
      totalContacts: this.totalContacts,
      drive: this.drive,
      time: this.time,
    };
  }
};
var q = (A, e, a) => Math.max(e, Math.min(a, A));
function _t(A, e, a, t, i) {
  A.fill(0);
  let o = 1 / Math.tan(e / 2);
  return (
    (A[0] = o / a),
    (A[5] = o),
    (A[10] = (i + t) / (t - i)),
    (A[11] = -1),
    (A[14] = (2 * i * t) / (t - i)),
    A
  );
}
function Dt(A, e, a, t, i, o, c) {
  return (
    A.fill(0),
    (A[0] = 2 / (a - e)),
    (A[5] = 2 / (i - t)),
    (A[10] = -2 / (c - o)),
    (A[12] = -(a + e) / (a - e)),
    (A[13] = -(i + t) / (i - t)),
    (A[14] = -(c + o) / (c - o)),
    (A[15] = 1),
    A
  );
}
function Ft(A, e, a, t = [0, 1, 0]) {
  let i = e[0] - a[0],
    o = e[1] - a[1],
    c = e[2] - a[2],
    l = Math.hypot(i, o, c);
  l < 1e-12 && ((i = 0), (o = 0), (c = 1), (l = 1)),
    (i /= l),
    (o /= l),
    (c /= l);
  let d = t[1] * c - t[2] * o,
    f = t[2] * i - t[0] * c,
    p = t[0] * o - t[1] * i;
  (l = Math.hypot(d, f, p)),
    l < 1e-12 && ((d = -o), (f = i), (p = 0), (l = Math.hypot(d, f) || 1)),
    (d /= l),
    (f /= l),
    (p /= l);
  let F = o * p - c * f,
    y = c * d - i * p,
    P = i * f - o * d;
  return (
    A.set([
      d,
      F,
      i,
      0,
      f,
      y,
      o,
      0,
      p,
      P,
      c,
      0,
      -d * e[0] - f * e[1] - p * e[2],
      -F * e[0] - y * e[1] - P * e[2],
      -i * e[0] - o * e[1] - c * e[2],
      1,
    ]),
    A
  );
}
function At(A, e, a) {
  for (let t = 0; t < 4; t++)
    for (let i = 0; i < 4; i++)
      A[t * 4 + i] =
        e[i] * a[t * 4] +
        e[4 + i] * a[t * 4 + 1] +
        e[8 + i] * a[t * 4 + 2] +
        e[12 + i] * a[t * 4 + 3];
  return A;
}
function gt(A, e, a) {
  let t = (i) => {
    let o = (i + A * 12) % 12,
      c = e * Math.min(a, 1 - a);
    return a - c * Math.max(-1, Math.min(o - 3, 9 - o, 1));
  };
  return [t(0), t(8), t(4)];
}
var Ct = `#version 300 es
precision highp float;
layout(location=0)in vec3 position;layout(location=1)in vec3 normal;layout(location=2)in vec4 instancePose;layout(location=3)in vec3 instanceColor;layout(location=4)in vec4 instanceRotation;layout(location=5)in float instanceId;
uniform mat4 uVP,uLightVP;uniform vec3 uCenter,uColor;uniform vec4 uRotation;uniform float uScale,uInstanced;
out vec3 vWorld,vNormal,vLocal,vColor;out vec4 vShadow;
uniform float uBody;flat out int vBody;
vec3 turn(vec3 p,vec4 q){return p+2.*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
void main(){vec4 q=uInstanced>.5?instanceRotation:uRotation;vBody=int(uInstanced>.5?instanceId:uBody);vWorld=turn(position,q)*(uInstanced>.5?instancePose.w:uScale)+(uInstanced>.5?instancePose.xyz:uCenter);vNormal=turn(normal,q);vLocal=position;vColor=uInstanced>.5?instanceColor:uColor;vShadow=uLightVP*vec4(vWorld,1);gl_Position=uVP*vec4(vWorld,1);}`,
  St = `#version 300 es
precision highp float;
in vec3 vWorld,vNormal,vLocal,vColor;in vec4 vShadow;
flat in int vBody;uniform sampler2D uGlowTex;uniform int uGlowWidth;uniform float uGlowSize,uGlowIntensity,uGlowDiffusion;
uniform vec3 uGlowColor;uniform float uGlowColorMode;
uniform float uSpillRange;
uniform sampler2D uAOTex;uniform int uAOWidth;uniform float uAOIntensity,uAORange;
vec4 aoTexel(int i){return texelFetch(uAOTex,ivec2(i%uAOWidth,i/uAOWidth),0);}
float ambientVisibility(vec3 point,vec3 normal){
 if(vBody<0||uAOIntensity<=0.||uAORange<=0.)return 1.;
 vec4 header=aoTexel(vBody);int offset=int(header.x),count=int(header.y);float cover=0.;
 for(int i=0;i<count;i++){
  vec4 sphere=aoTexel(offset+i);vec3 delta=sphere.xyz-point;float d2=max(dot(delta,delta),1e-10),distance=sqrt(d2),gap=max(0.,distance-sphere.w);
  float reach=max(0.,1.-gap/uAORange),facing=max(0.,dot(normal,delta/distance));
  cover+=min(1.,sphere.w*sphere.w/d2)*facing*reach*reach;
 }
 float floorReach=max(0.,1.-max(0.,point.y+.11)/uAORange);
 cover+=max(0.,-normal.y)*floorReach*floorReach;
 return exp(-uAOIntensity*cover*1.5);
}
vec4 glowTexel(int i){return texelFetch(uGlowTex,ivec2(i%uGlowWidth,i/uGlowWidth),0);}
uniform vec3 uEye;uniform vec2 uSize;
uniform sampler2D uShadow,uScene;uniform float uKind,uOpacity,uRoughness,uExposure,uReflections,uBack,uUseScene,uMetal,uTexture,uTextureScale,uBallReflections,uMarker,uInstanced;
out vec4 result;
float shadow(){vec3 q=vShadow.xyz/vShadow.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z>1.)return 1.;float s=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)s+=q.z-.0018>texture(uShadow,q.xy+vec2(x,y)/768.).r?0.:1.;return .55+.45*s/9.;}
vec3 environment(vec3 r){
 vec3 sky=mix(vec3(.06,.09,.15),vec3(.55,.7,.88),clamp(r.y*.5+.5,0.,1.));
 float box=exp(-pow((r.x+.48)*7.,4.)-pow((r.y-.63)*3.5,4.));
 float strip=exp(-pow((r.x-.66)*18.,2.)-pow((r.y-.28)*2.8,4.));
 return sky*.24+vec3(8.,7.5,6.8)*box+vec3(3.2,4.1,5.5)*strip;
}
void main(){
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vWorld),L=normalize(vec3(-.45,.8,.5));
 float grain=0.;
 if(uKind>.5&&uKind<1.5&&uTexture>0.){
  vec3 q=normalize(vLocal)*uTextureScale*24.;
  vec3 bump=vec3(sin(q.y+sin(q.z*.8)),sin(q.z+sin(q.x*.7)),sin(q.x+sin(q.y*.9)));
  grain=dot(bump,vec3(.3333));N=normalize(N+(bump-N*dot(N,bump))*uTexture*.24);
 }
 float ao=ambientVisibility(vWorld,N);
 float nv=abs(dot(N,V)),fresnel=pow(1.-nv,3.),diff=max(dot(N,L),0.);
 float spec=pow(max(dot(N,normalize(V+L)),0.),mix(180.,12.,uRoughness))*(1.-.95*uRoughness);
 vec3 env=mix(environment(reflect(-V,N)),vec3(.26,.33,.42),uRoughness*uRoughness*.92),color,emission=vec3(0);float alpha=1.;
 if(uKind<.5){
  float vign=1./(1.+dot(vWorld.xz,vWorld.xz)*.022);
  color=vColor*(.4+.8*diff)*shadow()*vign+vec3(.008,.013,.022);
 }else if(uKind<1.5){
  color=vColor*(.42+.75*diff)*shadow()*(1.-uMetal);
  color+=(env*(.16+.64*fresnel+.7*uMetal)*(1.-.55*uRoughness)*mix(vec3(1),vColor,uMetal)
    +mix(vec3(1.,.97,.92),vColor,uMetal)*spec*2.4)*uBallReflections;
  color*=1.+uTexture*grain*.15;
  alpha=uOpacity>=.99999?1.:clamp(uOpacity*(.72+.28*fresnel)+.32*fresnel,0.,.98);
  alpha=mix(alpha,1.,uMetal);if(uInstanced>.5)alpha=1.-(1.-alpha)*(1.-.32*alpha);
  // Painted equator plus two unequal dots: a visible, asymmetric orientation
  // reference. Coordinates are attached to the body, not to the screen/time.
  vec3 local=normalize(vLocal);float edge=max(fwidth(local.y),.001);
  float band=1.-smoothstep(.055-edge,.055+edge,abs(local.y));
  float spot=dot(local,normalize(vec3(.8,.48,.35))),spot2=dot(local,normalize(vec3(-.45,.7,.55)));
  float aa=max(fwidth(spot),.0005),aa2=max(fwidth(spot2),.0005);
  float disc=smoothstep(.968-aa,.968+aa,spot),dot2=smoothstep(.99-aa2,.99+aa2,spot2);
  color=mix(color,color*.10+vec3(.004)*shadow(),uMarker*max(band,disc));
  color=mix(color,vec3(.88,.91,.95)*(.3+.7*diff)*shadow(),uMarker*max(smoothstep(.984-aa,.984+aa,spot),dot2));
  alpha=mix(alpha,max(alpha,.96),uMarker*max(band,max(disc,dot2)));
  color*=ao;
  float heat=0.,core=0.;
  if(vBody>=0&&uGlowIntensity>0.&&uGlowSize>0.){
   vec4 header=glowTexel(vBody);int offset=int(header.x),count=int(header.y);
   for(int i=0;i<count;i++){
    vec4 spot=glowTexel(offset+i);vec3 delta=local-spot.xyz;float d2=dot(delta,delta)/max(uGlowSize*uGlowSize,1e-8);
    heat+=spot.w*(exp(-d2*2.)+uGlowDiffusion*.12);core+=spot.w*exp(-d2*16.);
   }
   // Both the halo and its core inherit this body's own material color.
   vec3 tint=mix(vColor/max(max(vColor.r,vColor.g),max(vColor.b,.01)),uGlowColor,uGlowColorMode);
   emission=uGlowIntensity*(heat*2.5+core)*tint;
   alpha=mix(alpha,1.,1.-exp(-uGlowIntensity*(heat+core)*.4));
  }
  if(vBody>=0&&uSpillRange>0.){
   vec4 header=glowTexel(vBody);int offset=int(header.z),count=int(header.w);vec3 received=vec3(0);
   for(int i=0;i<count;i++){
    vec4 light=glowTexel(offset+i*2),source=glowTexel(offset+i*2+1);
    vec3 delta=light.xyz-vWorld;float distance=length(delta),gap=max(0.,distance-source.w);
    float falloff=pow(max(0.,1.-gap/uSpillRange),2.)/(1.+distance*distance/(source.w*source.w+.04));
    vec3 direction=delta/max(distance,1e-6);
    float diffuse=.12*ao+.88*max(dot(N,direction),0.);
    vec3 halfway=V+direction;halfway/=max(length(halfway),1e-6);
    float shine=pow(max(dot(N,halfway),0.),mix(100.,6.,uRoughness))*(1.-uRoughness)*uBallReflections*.45;
    received+=source.rgb*light.w*falloff*(diffuse*(.35+.65*vColor)+shine);
   }
   emission+=received;alpha=mix(alpha,1.,1.-exp(-max(max(received.r,received.g),received.b)*.25));
  }
  alpha*=uBack>.5?.32:1.;
 }else{
  color=vColor*.08+env*(.3+1.5*fresnel)*uReflections+vec3(1.)*spec*.7;
  alpha=clamp(uOpacity*(.12+3.1*fresnel),0.,.62);
 }
 vec3 ambient=max(color*uExposure,vec3(0)),lit=ambient+emission;
 vec3 mapped=lit/(1.+lit);
 // In per-body mode, compress emitted brightness with one scalar, preserving
 // RGB ratios even at high intensity instead of bleaching every hue to white.
 vec3 base=ambient/(1.+ambient);
 vec3 colored=base+(1.-base)*emission/(1.+max(max(emission.r,emission.g),emission.b));
 color=pow(mix(colored,mapped,uGlowColorMode),vec3(1./2.2));
 if(uKind>1.5&&uUseScene>.5){
  vec2 uv=gl_FragCoord.xy/uSize;vec2 offset=N.xy*.003*(1.-nv);
  color=mix(texture(uScene,clamp(uv+offset,vec2(0),vec2(1))).rgb,color,.45+.5*fresnel);
 }
 result=vec4(color,alpha);
}`,
  Pt = `#version 300 es
precision highp float;layout(location=0)in vec3 position;layout(location=2)in vec4 instancePose;uniform mat4 uVP;uniform vec3 uCenter;uniform float uScale,uInstanced;void main(){gl_Position=uVP*vec4(position*(uInstanced>.5?instancePose.w:uScale)+(uInstanced>.5?instancePose.xyz:uCenter),1);}`,
  Nt = `#version 300 es
precision highp float;void main(){}`;
async function zt(A, e) {
  let a = document.createElement("canvas");
  (a.width = 640), (a.height = 360);
  let t = a.getContext("webgl2", {
    alpha: !1,
    antialias: !1,
    depth: !0,
    stencil: !1,
    preserveDrawingBuffer: !0,
    powerPreference: "high-performance",
  });
  if (!t)
    throw Error(
      "Le bol n\xE9cessite WebGL 2. V\xE9rifie l\u2019acc\xE9l\xE9ration graphique.",
    );
  const collisionGlow=new CollisionGlow();
  const neighborLights=new NeighborLights();
  const localOcclusion=new LocalOcclusion();
  const collisionAudio=new CollisionAudio(A,{onImpact:(event,physics,config)=>collisionGlow.impact(event,physics,config)});
  let i = [],
    o = [],
    c = [],
    l = [],
    d = [],
    f = [],
    p = [],
    F = !1;
  function y() {
    collisionAudio.dispose();
    collisionGlow.reset();
    F ||
      ((F = !0),
      i.forEach((r) => t.deleteProgram(r)),
      o.forEach((r) => t.deleteShader(r)),
      c.forEach((r) => t.deleteBuffer(r)),
      l.forEach((r) => t.deleteVertexArray(r)),
      d.forEach((r) => t.deleteTexture(r)),
      f.forEach((r) => t.deleteFramebuffer(r)),
      p.forEach((r) => t.deleteRenderbuffer(r)),
      t.getExtension("WEBGL_lose_context")?.loseContext());
  }
  async function P(r, m) {
    let b = t.createProgram();
    i.push(b);
    let w = [];
    for (let [T, U] of [
      [t.VERTEX_SHADER, r],
      [t.FRAGMENT_SHADER, m],
    ]) {
      let I = t.createShader(T);
      w.push(I),
        o.push(I),
        t.shaderSource(I, U),
        t.compileShader(I),
        t.attachShader(b, I);
    }
    t.linkProgram(b);
    let S = t.getExtension("KHR_parallel_shader_compile"),
      k = performance.now();
    if (S)
      for (; !t.getProgramParameter(b, S.COMPLETION_STATUS_KHR); ) {
        if (performance.now() - k > 6e4)
          throw (y(), Error("Compilation du bol trop longue."));
        await new Promise((T) => setTimeout(T, 30));
      }
    if (!t.getProgramParameter(b, t.LINK_STATUS)) {
      let T =
        w.map((U) => t.getShaderInfoLog(U)).join(`
`) + t.getProgramInfoLog(b);
      throw (y(), Error(T));
    }
    return { p: b, u: Object.create(null) };
  }
  let s = await P(Ct, St),
    n = await P(Pt, Nt),
    u = await P(
      `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0,1);}`,
      `#version 300 es
precision highp float;uniform sampler2D uDepth;uniform vec2 uSize;void main(){gl_FragDepth=texture(uDepth,gl_FragCoord.xy/uSize).r;}`,
    ),
    h = (r, m) => (m in r.u || (r.u[m] = t.getUniformLocation(r.p, m)), r.u[m]);
  function M(r, m, b) {
    let w = t.createVertexArray();
    l.push(w), t.bindVertexArray(w);
    for (let [k, T] of [
      [r, 0],
      [m, 1],
    ]) {
      let U = t.createBuffer();
      c.push(U),
        t.bindBuffer(t.ARRAY_BUFFER, U),
        t.bufferData(t.ARRAY_BUFFER, new Float32Array(k), t.STATIC_DRAW),
        t.enableVertexAttribArray(T),
        t.vertexAttribPointer(T, 3, t.FLOAT, !1, 0, 0);
    }
    let S = t.createBuffer();
    return (
      c.push(S),
      t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, S),
      t.bufferData(t.ELEMENT_ARRAY_BUFFER, new Uint16Array(b), t.STATIC_DRAW),
      { vao: w, count: b.length }
    );
  }
  function E(r, m, b) {
    let w = [],
      S = [],
      k = [];
    for (let T = 0; T <= m; T++)
      for (let U = 0; U <= r; U++) {
        let I = b(U / r, T / m);
        w.push(...I.slice(0, 3)), S.push(...I.slice(3));
      }
    for (let T = 0; T < m; T++)
      for (let U = 0; U < r; U++) {
        let I = T * (r + 1) + U,
          j = I + r + 1;
        k.push(I, j, I + 1, j, j + 1, I + 1);
      }
    return M(w, S, k);
  }
  let x = E(28, 18, (r, m) => {
      let b = r * Math.PI * 2,
        w = m * Math.PI,
        S = -Math.cos(b) * Math.sin(w),
        k = Math.cos(w),
        T = Math.sin(b) * Math.sin(w);
      return [S, k, T, S, k, T];
    }),
    v = 2.6,
    D = 1.8,
    N = 2.67,
    O = Math.sqrt(v * v - (v - D) ** 2),
    _ = [];
  for (let r = 0; r <= 44; r++) {
    let m = Math.PI + ((Math.acos((D - v) / N) - Math.PI) * r) / 44;
    _.push([N * Math.sin(m), v + N * Math.cos(m)]);
  }
  for (let r = 0; r <= 44; r++) {
    let m =
      Math.acos((D - v) / v) + ((Math.PI - Math.acos((D - v) / v)) * r) / 44;
    _.push([v * Math.sin(m), v + v * Math.cos(m)]);
  }
  let C = E(96, _.length - 1, (r, m) => {
      let b = Math.round(m * (_.length - 1)),
        w = _[b],
        S = _[Math.max(0, b - 1)],
        k = _[Math.min(_.length - 1, b + 1)],
        T = k[0] - S[0],
        U = k[1] - S[1],
        I = Math.hypot(T, U) || 1,
        j = r * Math.PI * 2;
      return [
        w[0] * Math.cos(j),
        w[1],
        w[0] * Math.sin(j),
        (U * Math.cos(j)) / I,
        -T / I,
        (U * Math.sin(j)) / I,
      ];
    }),
    L = E(96, 10, (r, m) => {
      let b = r * Math.PI * 2,
        w = m * Math.PI * 2,
        S = O + 0.035 * Math.cos(w);
      return [
        S * Math.cos(b),
        D + 0.035 * Math.sin(w),
        S * Math.sin(b),
        Math.cos(w) * Math.cos(b),
        Math.sin(w),
        Math.cos(w) * Math.sin(b),
      ];
    }),
    tt = M(
      [-15, -0.112, -15, 15, -0.112, -15, 15, -0.112, 15, -15, -0.112, 15],
      [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      [0, 2, 1, 0, 3, 2],
    );
  function Y() {
    let r = t.createTexture();
    return (
      d.push(r),
      t.bindTexture(t.TEXTURE_2D, r),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE),
      r
    );
  }
  let z = Y();
  t.texImage2D(
    t.TEXTURE_2D,
    0,
    t.RGBA,
    1,
    1,
    0,
    t.RGBA,
    t.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  let H = Y();
  t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.NEAREST),
    t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.NEAREST),
    t.texImage2D(
      t.TEXTURE_2D,
      0,
      t.DEPTH_COMPONENT24,
      768,
      768,
      0,
      t.DEPTH_COMPONENT,
      t.UNSIGNED_INT,
      null,
    );
  let X = t.createFramebuffer();
  f.push(X),
    t.bindFramebuffer(t.FRAMEBUFFER, X),
    t.framebufferTexture2D(
      t.FRAMEBUFFER,
      t.DEPTH_ATTACHMENT,
      t.TEXTURE_2D,
      H,
      0,
    ),
    t.drawBuffers([t.NONE]),
    t.readBuffer(t.NONE);
  let K = Y(),
    et = t.createFramebuffer(),
    G = Y();
  f.push(et);
  let Z = new Float32Array(16),
    at = new Float32Array(16),
    st = new Float32Array(16),
    it = new Float32Array(16),
    J = new Float32Array(16),
    nt = new Float32Array(16),
    Q = new Float32Array(3);
  Dt(J, -4, 4, -4, 4, 0.5, 16),
    Ft(nt, [-3.5, 7, 4.5], [0, 0.4, 0]),
    At(it, J, nt);
  let R = new Mt(),
    V = { last: null, accumulator: 0, orbit: 0, frames: 0 },
    ht = null,
    ct = [0, 0];
  function $() {
    let r = A();
    return {
      ...r,
      count: Math.max(0, Math.round(r.count)),
      seed: Math.round(r.seed),
      size: q(r.size, 0, 1.4),
      bigRadius: q(r.bigRadius, 0, 0.7),
      drive: q(r.drive * r.sensitivity, 0, 1),
      gravity: Math.min(r.gravity, 18),
      restitution: q(r.restitution, 0, 0.8),
      friction: q(r.friction, 0, 0.9),
      damping: Math.min(r.damping, 2),
      speed: Math.min(r.speed, 2),
      amplitude: Math.min(r.amplitude, 1.4),
      lift: q(r.lift, 0, 0.5),
      iterations: q(Math.round(r.iterations), 1, 14),
      physicsSpeed: q(r.physicsSpeed, 0, 1.5),
    };
  }
  function ut(r) {
    collisionAudio.reset();
    collisionGlow.reset();
    R.reset(r.seed, r.count, r.size, r.bigRadius, r.sizeVariation??0.16),
      (ht = r.seed),
      (V.accumulator = 0);
    for (
      let m = 0;
      m < Math.floor(180 * Math.min(1, 160 / Math.max(1, r.count)));
      m++
    )
      R.step(1 / 120, { ...r, drive: 0 });
  }
  function mt(r, m) {
    if (
      !(r === ct[0] && m === ct[1]) &&
      ((a.width = r),
      (a.height = m),
      (ct = [r, m]),
      t.activeTexture(t.TEXTURE0),
      t.bindTexture(t.TEXTURE_2D, K),
      t.texImage2D(
        t.TEXTURE_2D,
        0,
        t.RGBA8,
        r,
        m,
        0,
        t.RGBA,
        t.UNSIGNED_BYTE,
        null,
      ),
      t.bindTexture(t.TEXTURE_2D, G),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.NEAREST),
      t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.NEAREST),
      t.texImage2D(
        t.TEXTURE_2D,
        0,
        t.DEPTH_COMPONENT24,
        r,
        m,
        0,
        t.DEPTH_COMPONENT,
        t.UNSIGNED_INT,
        null,
      ),
      t.bindFramebuffer(t.FRAMEBUFFER, et),
      t.framebufferTexture2D(
        t.FRAMEBUFFER,
        t.COLOR_ATTACHMENT0,
        t.TEXTURE_2D,
        K,
        0,
      ),
      t.framebufferTexture2D(
        t.FRAMEBUFFER,
        t.DEPTH_ATTACHMENT,
        t.TEXTURE_2D,
        G,
        0,
      ),
      t.checkFramebufferStatus(t.FRAMEBUFFER) !== t.FRAMEBUFFER_COMPLETE)
    )
      throw (y(), Error("Tampon de rendu du bol indisponible."));
  }
  let pt = [0, 0, 0, 1];
  function W(r, m, b, w, S, k, T = pt, body = -1) {
    t.uniform4fv(h(r, "uRotation"), T),
      t.uniform1f(h(r, "uBody"), body),
      t.uniform3f(h(r, "uCenter"), b, w, S),
      t.uniform1f(h(r, "uScale"), k),
      t.bindVertexArray(m.vao),
      t.drawElements(t.TRIANGLES, m.count, t.UNSIGNED_SHORT, 0);
  }
  let rt = [],
    lt = new Float64Array(128),
    ft = new Float32Array(128 * 12),
    dt = t.createBuffer();
  c.push(dt),
    t.bindBuffer(t.ARRAY_BUFFER, dt),
    t.bufferData(t.ARRAY_BUFFER, ft.byteLength, t.DYNAMIC_DRAW);
  function xt(r) {
    t.bindVertexArray(x.vao),
      t.bindBuffer(t.ARRAY_BUFFER, dt),
      t.enableVertexAttribArray(2),
      t.vertexAttribPointer(2, 4, t.FLOAT, !1, 48, r * 48),
      t.vertexAttribDivisor(2, 1),
      t.enableVertexAttribArray(3),
      t.vertexAttribPointer(3, 3, t.FLOAT, !1, 48, r * 48 + 16),
      t.vertexAttribDivisor(3, 1),
      t.enableVertexAttribArray(4),
      t.vertexAttribPointer(4, 4, t.FLOAT, !1, 48, r * 48 + 32),
      t.vertexAttribDivisor(4, 1),
      t.enableVertexAttribArray(5),
      t.vertexAttribPointer(5, 1, t.FLOAT, !1, 48, r * 48 + 28),
      t.vertexAttribDivisor(5, 1);
  }
  function Rt(r, m, b) {
    b < 1 ||
      (xt(m),
      t.uniform1f(h(r, "uInstanced"), 1),
      t.drawElementsInstanced(t.TRIANGLES, x.count, t.UNSIGNED_SHORT, 0, b),
      t.uniform1f(h(r, "uInstanced"), 0));
  }
  xt(0);
  const glowTexture=t.createTexture(),glowMax=t.getParameter(t.MAX_TEXTURE_SIZE);
  d.push(glowTexture);let glowSize=[0,0];
  const aoTexture=t.createTexture();d.push(aoTexture);let aoSize=[0,0];
  function uploadAO(config){
    const ao=localOcclusion.build(R,config,glowMax);t.activeTexture(t.TEXTURE4);t.bindTexture(t.TEXTURE_2D,aoTexture);
    if(ao.width!==aoSize[0]||ao.height!==aoSize[1]){
      t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST);t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST);
      t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE);t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);
      t.texImage2D(t.TEXTURE_2D,0,t.RGBA32F,ao.width,ao.height,0,t.RGBA,t.FLOAT,ao.data);aoSize=[ao.width,ao.height];
    }else t.texSubImage2D(t.TEXTURE_2D,0,0,0,ao.width,ao.height,t.RGBA,t.FLOAT,ao.data);
    t.uniform1i(h(s,'uAOTex'),4);t.uniform1i(h(s,'uAOWidth'),ao.width);
    t.uniform1f(h(s,'uAOIntensity'),config.aoEnabled>.5&&(config.aoQuality??6)>=1?Math.max(0,config.aoIntensity??1):0);
    t.uniform1f(h(s,'uAORange'),Math.max(0,config.aoRange??.4));
  }
  function uploadGlow(config){
    const custom=gt((((config.glowHue??.12)%1)+1)%1,1,1-q(config.glowSaturation??1,0,1)*.5);
    const colorFor=id=>{
      const rgb=id===-2?gt((((config.bigHue??.11)%1)+1)%1,q(config.bigSaturation??.65,0,1),.58):gt((((R.hue[id]+config.hue)%1)+1)%1,q(config.saturation,0,1),.52),peak=Math.max(.01,...rgb),mode=q(config.glowColorMode??0,0,1);
      return rgb.map((v,i)=>v/peak*(1-mode)+custom[i]*mode);
    };
    const neighbors=neighborLights.build(R,collisionGlow,config,colorFor);
    const glow=collisionGlow.pack(R,glowMax,neighbors);t.activeTexture(t.TEXTURE3);t.bindTexture(t.TEXTURE_2D,glowTexture);
    if(glow.width!==glowSize[0]||glow.height!==glowSize[1]){
      t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST);t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST);
      t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE);t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);
      t.texImage2D(t.TEXTURE_2D,0,t.RGBA32F,glow.width,glow.height,0,t.RGBA,t.FLOAT,glow.data);glowSize=[glow.width,glow.height];
    }else t.texSubImage2D(t.TEXTURE_2D,0,0,0,glow.width,glow.height,t.RGBA,t.FLOAT,glow.data);
    t.uniform1i(h(s,'uGlowTex'),3);t.uniform1i(h(s,'uGlowWidth'),glow.width);
    t.uniform1f(h(s,'uGlowSize'),Math.max(0,config.glowSize??.5));t.uniform1f(h(s,'uGlowIntensity'),collisionGlow.enabled(config)?Math.max(0,config.glowIntensity):0);
    t.uniform1f(h(s,'uGlowDiffusion'),q(config.glowDiffusion??.3,0,1));
    t.uniform1f(h(s,'uGlowColorMode'),q(config.glowColorMode??0,0,1));
    t.uniform1f(h(s,'uSpillRange'),config.spillEnabled>.5&&config.spillIntensity>0?Math.max(0,config.spillRange??.65):0);
    // gt is HSL: full HSL saturation and L=1-S/2 give HSV value 1,
    // from white at S=0 to a pure spectral color at S=1.
    t.uniform3fv(h(s,'uGlowColor'),gt((((config.glowHue??.12)%1)+1)%1,1,1-q(config.glowSaturation??1,0,1)*.5));
  }
  function bt(r) {
    let [m, b] = e();
    if ((mt(m, b), Math.abs(r.zoom) < 1e-12)) {
      t.bindFramebuffer(t.FRAMEBUFFER, null),
        t.viewport(0, 0, m, b),
        t.colorMask(!0, !0, !0, !0),
        t.depthMask(!0),
        t.clearColor(0.025, 0.04, 0.075, 1),
        t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT),
        V.frames++;
      return;
    }
    let w = r.cameraAngle + V.orbit,
      S = Math.min(r.cameraElevation, 1.25),
      k = 7.6 / r.zoom,
      panX = r.cameraPanX ?? 0,
      panY = r.cameraPanY ?? 0,
      targetX = panX*Math.cos(w)-panY*Math.sin(w)*Math.sin(S),
      targetY = 0.85+panY*Math.cos(S),
      targetZ = -panX*Math.sin(w)-panY*Math.cos(w)*Math.sin(S);
    Q.set([
      targetX + Math.sin(w) * Math.cos(S) * k,
      targetY + Math.sin(S) * k,
      targetZ + Math.cos(w) * Math.cos(S) * k,
    ]),
      Ft(
        st,
        Q,
        [targetX, targetY, targetZ],
        [-Math.sin(w) * Math.sin(S), Math.cos(S), -Math.cos(w) * Math.sin(S)],
      ),
      _t(at, Math.PI / 5, m / b, 0.05, Math.max(60, Math.abs(k) + 30)),
      At(Z, at, st);
    let T = R.n,
      U = T > 100,
      I = 0;
    if (T + 1 > lt.length) {
      let g = lt.length;
      for (; g < T + 1; ) g *= 2;
      (lt = new Float64Array(g)),
        (ft = new Float32Array(g * 12)),
        t.bindBuffer(t.ARRAY_BUFFER, dt),
        t.bufferData(t.ARRAY_BUFFER, ft.byteLength, t.DYNAMIC_DRAW);
    }
    rt.length = T + 1;
    for (let g = 0; g <= T; g++) {
      rt[g] = g;
      let B = g * 3,
        ot = g === T ? R.big.p[0] : R.p[B],
        Et = g === T ? R.big.p[1] : R.p[B + 1],
        vt = g === T ? R.big.p[2] : R.p[B + 2];
      lt[g] = (ot - Q[0]) ** 2 + (Et - Q[1]) ** 2 + (vt - Q[2]) ** 2;
    }
    if ((rt.sort((g, B) => lt[B] - lt[g]), U)) {
      let g = 0;
      for (let B of rt) {
        if (B === T) {
          I = g;
          continue;
        }
        let ot = B * 3,
          Et = g++ * 12,
          vt = gt(
            (((R.hue[B] + r.hue) % 1) + 1) % 1,
            q(r.saturation, 0, 1),
            0.52,
          );
        ft.set(
          [
            R.p[ot],
            R.p[ot + 1],
            R.p[ot + 2],
            R.r[B],
            ...vt,
            B,
            ...R.q.subarray(B * 4, B * 4 + 4),
          ],
          Et,
        );
      }
      t.bindBuffer(t.ARRAY_BUFFER, dt),
        t.bufferSubData(t.ARRAY_BUFFER, 0, ft.subarray(0, T * 12));
    }
    if (
      (t.enable(t.DEPTH_TEST),
      t.enable(t.CULL_FACE),
      t.cullFace(t.BACK),
      t.depthMask(!0),
      t.disable(t.BLEND),
      t.bindFramebuffer(t.FRAMEBUFFER, X),
      t.viewport(0, 0, 768, 768),
      t.clear(t.DEPTH_BUFFER_BIT),
      t.useProgram(n.p),
      t.uniformMatrix4fv(h(n, "uVP"), !1, it),
      t.uniform1f(h(n, "uInstanced"), 0),
      U)
    )
      Rt(n, 0, T);
    else
      for (let g = 0; g < T; g++) {
        let B = g * 3;
        W(n, x, R.p[B], R.p[B + 1], R.p[B + 2], R.r[g]);
      }
    W(n, x, ...R.big.p, R.big.r),
      t.bindFramebuffer(t.FRAMEBUFFER, et),
      t.viewport(0, 0, m, b),
      t.clearColor(0.025, 0.04, 0.075, 1),
      t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT),
      t.useProgram(s.p),
      uploadGlow(r),
      uploadAO(r),
      t.uniformMatrix4fv(h(s, "uVP"), !1, Z),
      t.uniformMatrix4fv(h(s, "uLightVP"), !1, it),
      t.uniform3fv(h(s, "uEye"), Q),
      t.uniform2f(h(s, "uSize"), m, b),
      t.uniform1f(h(s, "uInstanced"), 0),
      t.uniform1f(h(s, "uExposure"), q(r.light, 0, 2)),
      t.uniform1f(h(s, "uUseScene"), 0),
      t.uniform1f(h(s, "uReflections"), r.bowlReflections),
      t.activeTexture(t.TEXTURE0),
      t.bindTexture(t.TEXTURE_2D, z),
      t.uniform1i(h(s, "uScene"), 0),
      t.activeTexture(t.TEXTURE1),
      t.bindTexture(t.TEXTURE_2D, H),
      t.uniform1i(h(s, "uShadow"), 1),
      t.uniform1f(h(s, "uKind"), 0),
      t.uniform3f(h(s, "uColor"), 0.018, 0.03, 0.048),
      t.uniform1f(h(s, "uRoughness"), 0.6),
      t.uniform1f(h(s, "uBack"), 0),
      W(s, tt, 0, 0, 0, 1),
      t.enable(t.BLEND),
      t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA),
      t.depthMask(!1),
      t.cullFace(t.FRONT),
      t.uniform1f(h(s, "uKind"), 2),
      t.uniform1f(h(s, "uOpacity"), r.bowlOpacity),
      t.uniform1f(h(s, "uRoughness"), 0.055),
      t.uniform3f(h(s, "uColor"), 0.5, 0.8, 1),
      W(s, C, 0, 0, 0, 1),
      W(s, L, 0, 0, 0, 1),
      t.uniform1f(h(s, "uKind"), 1);
    function j(g = !1) {
      t.uniform1f(
        h(s, "uMetal"),
        q(g ? (r.bigMetal ?? 1) : (r.metal ?? 0), 0, 1),
      ),
        t.uniform1f(
          h(s, "uTexture"),
          q(g ? (r.bigTexture ?? 0) : (r.texture ?? 0), 0, 1),
        ),
        t.uniform1f(
          h(s, "uTextureScale"),
          Math.max(0, g ? (r.bigTextureScale ?? 1) : (r.textureScale ?? 1)),
        ),
        t.uniform1f(
          h(s, "uBallReflections"),
          Math.max(0, g ? (r.bigReflections ?? 1) : (r.ballReflections ?? 1)),
        ),
        t.uniform1f(
          h(s, "uMarker"),
          q(g ? (r.bigMarker ?? 0.9) : (r.marker ?? 0.8), 0, 1),
        ),
        t.uniform1f(
          h(s, "uOpacity"),
          1 -
            0.68 *
              q(
                g ? (r.bigTransparency ?? 0) : (r.transparency ?? 0.55),
                0,
                0.9,
              ),
        ),
        t.uniform1f(
          h(s, "uRoughness"),
          q(g ? (r.bigRoughness ?? 0.22) : (r.roughness ?? 0.12), 0, 1),
        );
    }
    let yt = () => {
      U && xt(0),
        j(!0),
        t.uniform3fv(
          h(s, "uColor"),
          gt(
            (((r.bigHue ?? 0.11) % 1) + 1) % 1,
            q(r.bigSaturation ?? 0.65, 0, 1),
            0.58,
          ),
        ),
        t.cullFace(t.FRONT),
        t.depthMask(!1),
        t.uniform1f(h(s, "uBack"), 1),
        W(s, x, ...R.big.p, R.big.r, R.big.q, R.n),
        t.cullFace(t.BACK),
        t.depthMask(!0),
        t.uniform1f(h(s, "uBack"), 0),
        W(s, x, ...R.big.p, R.big.r, R.big.q, R.n);
    };
    if (U)
      t.cullFace(t.BACK),
        t.depthMask(!0),
        t.uniform1f(h(s, "uBack"), 0),
        j(),
        Rt(s, 0, I),
        yt(),
        j(),
        Rt(s, I, T - I);
    else
      for (let g of rt) {
        if (g === T) {
          yt();
          continue;
        }
        let B = g * 3,
          ot = gt(
            (((R.hue[g] + r.hue) % 1) + 1) % 1,
            q(r.saturation, 0, 1),
            0.52,
          );
        j(),
          t.uniform3fv(h(s, "uColor"), ot),
          t.cullFace(t.FRONT),
          t.depthMask(!1),
          t.uniform1f(h(s, "uBack"), 1),
          W(
            s,
            x,
            R.p[B],
            R.p[B + 1],
            R.p[B + 2],
            R.r[g],
            R.q.subarray(g * 4, g * 4 + 4),
            g,
          ),
          t.cullFace(t.BACK),
          t.depthMask(!0),
          t.uniform1f(h(s, "uBack"), 0),
          W(
            s,
            x,
            R.p[B],
            R.p[B + 1],
            R.p[B + 2],
            R.r[g],
            R.q.subarray(g * 4, g * 4 + 4),
            g,
          );
      }
    t.disable(t.BLEND),
      t.bindFramebuffer(t.READ_FRAMEBUFFER, et),
      t.bindFramebuffer(t.DRAW_FRAMEBUFFER, null),
      t.blitFramebuffer(0, 0, m, b, 0, 0, m, b, t.COLOR_BUFFER_BIT, t.NEAREST),
      t.bindFramebuffer(t.FRAMEBUFFER, null),
      t.useProgram(u.p),
      t.activeTexture(t.TEXTURE2),
      t.bindTexture(t.TEXTURE_2D, G),
      t.uniform1i(h(u, "uDepth"), 2),
      t.uniform2f(h(u, "uSize"), m, b),
      t.disable(t.CULL_FACE),
      t.depthFunc(t.ALWAYS),
      t.depthMask(!0),
      t.colorMask(!1, !1, !1, !1),
      t.drawArrays(t.TRIANGLES, 0, 3),
      t.colorMask(!0, !0, !0, !0),
      t.depthFunc(t.LESS),
      t.enable(t.CULL_FACE),
      t.useProgram(s.p),
      t.enable(t.BLEND),
      t.depthMask(!1),
      t.cullFace(t.BACK),
      t.uniform1f(h(s, "uKind"), 2),
      t.uniform1f(h(s, "uOpacity"), r.bowlOpacity),
      t.uniform1f(h(s, "uRoughness"), 0.055),
      t.uniform1f(h(s, "uUseScene"), 1),
      t.uniform3f(h(s, "uColor"), 0.5, 0.8, 1),
      t.activeTexture(t.TEXTURE0),
      t.bindTexture(t.TEXTURE_2D, K),
      W(s, C, 0, 0, 0, 1),
      W(s, L, 0, 0, 0, 1),
      t.disable(t.BLEND),
      t.depthMask(!0),
      V.frames++;
  }
  function wt(r = 0) {
    if (F) return;
    let m = $(),
      b = q(Number(r) || 0, 0, 0.1);
    for (
      ht !== m.seed && ut(m),
        R.n !== m.count && R.setCount(m.count, m.size, m.sizeVariation??0.16),
        collisionGlow.tick(b,m,R),
        V.orbit += b * m.cameraSpeed,
        V.accumulator = Math.min(0.12, V.accumulator + b * m.physicsSpeed);
      V.accumulator >= 1 / 120;

    )
      {R.step(1 / 120, m);collisionAudio.collect(R,m);V.accumulator -= 1 / 120;}
    collisionAudio.flush(m);
    bt(m);
  }
  let Tt = $();
  return (
    ut(Tt),
    bt(Tt),
    {
      canvas: a,
      gl: t,
      physics: R,
      audio: collisionAudio,
      glow: collisionGlow,
      diffusion: neighborLights,
      occlusion: localOcclusion,
      clock: V,
      frame: wt,
      dispose: y,
      get dead() {
        return F;
      },
    }
  );
}
export { zt as createGlassBowl, Mt as BowlSimulation };

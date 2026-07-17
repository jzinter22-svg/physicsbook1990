/*
  2D vector — the foundational building block for every physics engine
  module (motion, force, momentum are all vector quantities).

  Instance methods MUTATE `this` and return it for chaining, matching the
  convention used by most real-time physics/game engines (three.js Vector2,
  Box2D's b2Vec2, Matter.js): a simulation stepping hundreds of vectors at
  60 FPS can't afford to allocate a new object per operation. Use `.clone()`
  first when you need to keep the original, or reach for the static helpers
  (`Vector2.add(a, b)`, etc.) when immutability is more convenient than speed.
*/
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  /** Add `v` scaled by `s` — the single most common op in an integrator (`x += v * dt`). */
  addScaled(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /** 2D "cross product" — a scalar (the z-component of the 3D cross product). */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  normalize() {
    const len = this.length();
    if (len > 1e-9) this.scale(1 / len);
    return this;
  }

  /** Angle in radians, measured counterclockwise from the +x axis. */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(radians) {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const { x, y } = this;
    this.x = x * cos - y * sin;
    this.y = x * sin + y * cos;
    return this;
  }

  /** The vector perpendicular to this one, rotated 90° counterclockwise. */
  perpendicular() {
    const { x, y } = this;
    this.x = -y;
    this.y = x;
    return this;
  }

  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  equals(v, epsilon = 1e-9) {
    return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
  }

  toObject() {
    return { x: this.x, y: this.y };
  }

  toString() {
    return `Vector2(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
  }

  static zero() {
    return new Vector2(0, 0);
  }

  static fromAngle(radians, length = 1) {
    return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
  }

  static add(a, b) {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static sub(a, b) {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static scale(a, s) {
    return new Vector2(a.x * s, a.y * s);
  }

  static dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  static distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  static lerp(a, b, t) {
    return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}

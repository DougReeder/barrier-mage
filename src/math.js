// math.js - math utilities for Barrier Mage
// A-Frame doesn't support any module system well, so functions are just defined globally.
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

try {
  THREE;   // in the browser, A-Frame includes threeJS
} catch (err) {
  THREE = require('../spec/support/three.min');
}


const rotAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3(0,0,1);


// ignores Z coordinate
function circleFrom3Points2D(p1, p2, p3) {
  const x12 = p1.x - p2.x;
  const x13 = p1.x - p3.x;

  const y12 = p1.y - p2.y;
  const y13 = p1.y - p3.y;

  const y31 = p3.y - p1.y;
  const y21 = p2.y - p1.y;

  const x31 = p3.x - p1.x;
  const x21 = p2.x - p1.x;

  // p1.x^2 - p3.x^2
  const sx13 = p1.x * p1.x - p3.x * p3.x;

  // p1.y^2 - p3.y^2
  const sy13 = p1.y * p1.y - p3.y * p3.y;

  const sx21 = p2.x * p2.x - p1.x * p1.x;
  const sy21 = p2.y * p2.y - p1.y * p1.y;

  const f = ((sx13) * (x12)
      + (sy13) * (x12)
      + (sx21) * (x13)
      + (sy21) * (x13))
      / (2 * ((y31) * (x12) - (y21) * (x13)));
  const g = ((sx13) * (y12)
      + (sy13) * (y12)
      + (sx21) * (y13)
      + (sy21) * (y13))
      / (2 * ((x31) * (y12) - (x21) * (y13)));

  const c = -(p1.x * p1.x) - (p1.y * p1.y) - 2 * g * p1.x - 2 * f * p1.y;

  const h = -g;
  const k = -f;
  const sqr_of_r = h * h + k * k - c;

  return [new THREE.Vector2(h, k), Math.sqrt(sqr_of_r)];   // center (2D) and radius
}

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
const plane = new THREE.Plane();
const aRel = new THREE.Vector2();
const cRel = new THREE.Vector2();

/**
 * When 4th arg is falsy, p1 is start and p3 is end.
 * When 4th arg is truthy, a circle is returned. (Still need 3 distinct points to determine plane.)
 * @param {THREE.Vector3} p1
 * @param {THREE.Vector3} p2
 * @param {THREE.Vector3} p3
 * @param {boolean} isCircle
 * @returns {{THREE.Vector3[], THREE.Vector3, number, number, number, THREE.Vector3}}
 */
function _curveFrom3Points(p1, p2, p3, isCircle = false) {
  a.copy(p1);
  b.copy(p2);
  c.copy(p3);

  // Rotates points into a plane parallel to X-Y
  plane.setFromCoplanarPoints(p1, p2, p3);
  let rotAngle = plane.normal.angleTo(zAxis);

  rotAxis.crossVectors(plane.normal, zAxis);
  if (rotAxis.length() > 0.00001) {   // rotates if normals not co-linear
    rotAxis.normalize();
    a.applyAxisAngle(rotAxis, rotAngle);
    b.applyAxisAngle(rotAxis, rotAngle);
    c.applyAxisAngle(rotAxis, rotAngle);
  }
  if (Math.abs(a.z - b.z) > 0.0001 || Math.abs(a.z - c.z) > 0.0001) {
    console.warn("points not coplanar:" + a + b + c);
  }
  const z = a.z;

  let [center2, radius] = circleFrom3Points2D(a, b, c);   // ignores Z coordinate

  aRel.set(a.x, a.y).sub(center2);
  const startAngle = aRel.angle();
  let endAngle;
  if (isCircle) {
    endAngle = startAngle + 2*Math.PI - 0.00001;
  } else {
    cRel.set(c.x, c.y).sub(center2);
    endAngle = cRel.angle();
  }

  // TODO: replace EllipseCurve with custom code to generate Vector3s directly
  const curve = new THREE.EllipseCurve(
      center2.x,  center2.y,            // ax, aY
      radius, radius,           // xRadius, yRadius
      startAngle,  endAngle,  // aStartAngle, aEndAngle
      false,            // aClockwise; always ccw because plane calculated by right hand rule
      0                 // aRotation
  );
  let arcAngle = endAngle - startAngle;
  if (arcAngle < 0) { arcAngle += 2 * Math.PI}
  const numPoints = Math.round(arcAngle * radius / 0.02);
  const points2D = curve.getPoints(numPoints);
  const points = points2D.map(p => new THREE.Vector3(p.x, p.y, z));

  const center3 = new THREE.Vector3(center2.x, center2.y, z);

  if (rotAxis.length() > 0.00001) {   // if not co-linear, reverses rotation
    center3.applyAxisAngle(rotAxis, -rotAngle);
    points.forEach(p => p.applyAxisAngle(rotAxis, -rotAngle));
  }

  return {points, center:center3, startAngle, endAngle, radius, normal: plane.normal};
}

/**
 * @param {THREE.Vector3} p1
 * @param {THREE.Vector3} p2
 * @param {THREE.Vector3} p3
 * @returns {{Arc, THREE.Vector3[], THREE.Vector3, number, number}}
 */
function arcFrom3Points(p1, p2, p3) {
  const {points, center, startAngle, endAngle} = _curveFrom3Points(p1, p2, p3);

  const midpoint = (points.length % 2 === 1) ?
      points[Math.floor(points.length/2)].clone() :
      points[points.length/2-1].clone().add(points[points.length/2]).divideScalar(2);

  const arc = new Arc(p1, midpoint, p3);

  return {arc, points, center, startAngle, endAngle};
}

/**
 * @param {THREE.Vector3} p1
 * @param {THREE.Vector3} p2
 * @param {THREE.Vector3} p3
 * @returns {{Circle, THREE.Vector3[]}}
 */
function circleFrom3Points(p1, p2, p3) {
  const {points, center, radius, normal} = _curveFrom3Points(p1, p2, p3, true);
  if (normal.z < 0) {
    normal.negate();
  } else if (normal.z === 0 && normal.y < 0) {
    normal.negate();
  } else if (normal.z === 0 && normal.y === 0 && normal.x < 0) {
    normal.negate();
  }

  const circle = new Circle(p1, p2, p3, center, radius, normal);

  return {circle, points}
}

const PI2 = Math.PI / 2;

/** Angle is not meaningful unless the segment has been rotated into the X-Y plane. */
class Segment {
  constructor(a, b, doReuse=false) {
    if (doReuse) {
      this._a = a;
      this._b = b;
    } else {
      this._a = a.clone();
      this._b = b.clone();
    }
  }

  get a() {
    return this._a;
  }

  get b() {
    return this._b;
  }

  get center() {
    return new THREE.Vector3((this._a.x + this._b.x) / 2, (this._a.y + this._b.y) / 2, (this._a.z+ this._b.z) / 2)
  }

  get length() {
    if (undefined === this._length) {
      this.calcLengthAndAngle();
    }
    return this._length
  }

  get angle() {
    if (undefined === this._angle) {
      this.calcLengthAndAngle();
    }
    return this._angle;
  }

  calcLengthAndAngle() {
    const dx = this._b.x - this._a.x;
    const dy = this._b.y - this._a.y;
    const dz = this._b.z - this._a.z;

    this._length = Math.sqrt(dx*dx + dy*dy + dz*dz);

    this._angle = Math.atan2(dy, dx);
    if (this._angle > PI2) {
      this._angle -= Math.PI;
    }
    if (this._angle <= -PI2) {
      this._angle += Math.PI;
    }
  }
}


class Arc {
  constructor(end1, midpoint, end2, doReuse = false) {
    if (!end1 || !midpoint || !end2) {
      throw new Error("end1, midpoint & end2 required");
    }
    if ('boolean' !== typeof doReuse) {
      throw new Error("4th argument to Arc must be boolean");
    }
    if (doReuse) {
      this._end1 = end1;
      this._midpoint = midpoint;
      this._end2 = end2;
    } else {
      this._end1 = end1.clone();
      this._midpoint = midpoint.clone();
      this._end2 = end2.clone();
    }
  }

  get end1() {
    return this._end1;
  }

  get midpoint() {
    return this._midpoint;
  }

  get end2() {
    return this._end2
  }
}


// noinspection JSUnresolvedFunction
class Circle {
  /**
   * Creates a Circle object.
   * This should only be called from circleFrom3Points(),
   *   or to clone an existing Circle.
   * @param {THREE.Vector3} p1
   * @param {THREE.Vector3} p2
   * @param {THREE.Vector3} p3
   * @param {THREE.Vector3} center
   * @param {number} radius
   * @param {THREE.Vector3} normal
   * @param {boolean} doReuse
   */
  constructor(p1, p2, p3, center, radius, normal, doReuse = false) {
    if (!(p1 instanceof  THREE.Vector3)) {
      throw new Error("guidepoint 1 must be Vector3");
    }
    if (!(p2 instanceof  THREE.Vector3)) {
      throw new Error("guidepoint 2 must be Vector3");
    }
    if (!(p3 instanceof  THREE.Vector3)) {
      throw new Error("guidepoint 3 must be Vector3");
    }
    if (!(center instanceof THREE.Vector3)) {
      throw new Error("center must be Vector3");
    }
    if (!Number.isFinite(radius) || !(radius >= 0)) {
      throw new Error("radius must be finite & non-negative");
    }
    if ('boolean' !== typeof doReuse) {
      throw new Error("doReuse must be boolean");
    }
    if (!(normal instanceof THREE.Vector3)) {
      throw new Error("normal must be Vector3");
    }
    if (doReuse) {
      this._p1 = p1;
      this._p2 = p2;
      this._p3 = p3;
      this._center = center;
      this._radius = radius;
      this._normal = normal;
    } else {
      this._p1 = p1.clone();
      this._p2 = p2.clone();
      this._p3 = p3.clone();
      this._center = center.clone();
      this._radius = radius;
      this._normal = normal.clone();
    }
  }

  /** @return {THREE.Vector3} the first guide point */
  get p1() {
    return this._p1;
  }

  /** @return {THREE.Vector3} the second guide point */
  get p2() {
    return this._p2;
  }

  /** @return {THREE.Vector3} the third guide point */
  get p3() {
    return this._p3;
  }

  /** @return {THREE.Vector3} the center point */
  get center() {
    return this._center;
  }

  /** @return {number} the radius */
  get radius() {
    return this._radius;
  }

  /** @return {THREE.Vector3} the normal to the plane */
  get normal() {
    return this._normal;
  }

  /** the template should be centered before calling this */
  scaleAndTranslate(scale, offset) {
    if (scale) {
      this._p1.multiplyScalar(scale);
      this._p2.multiplyScalar(scale);
      this._p3.multiplyScalar(scale);
      this._center.multiplyScalar(scale);
      this._radius *= scale;
      // normal is unchanged
    }
    if (offset) {
      this._p1.add(offset);
      this._p2.add(offset);
      this._p3.add(offset);
      this._center.add(offset);
      // normal and radius are unchanged
    }
  }
}


/** Sets 'out' to the mean coordinates of the points */
function calcCentroid(points, out) {
  out.set(0, 0, 0);
  points.forEach(point => {
    out.add(point);
  });
  out.divideScalar(points.length);
}


const centroidPt = new THREE.Vector3();
function centerPoints(points) {
  calcCentroid(points, centroidPt);
  points.forEach(p => {
    p.sub(centroidPt);
  });
}


function calcPlaneNormalPoints(points, normal) {
  if (points.length < 3) {
    throw new Error("Three points are required to determine a plane");
  }
  // finds the furthest point from the first
  let furthestInd = 0;
  let furthestDistSq = Number.NEGATIVE_INFINITY;
  points.forEach((point, i) => {
    let d = points[0].distanceToSquared(point);
    if (d > furthestDistSq) {
      furthestDistSq = d;
      furthestInd = i;
    }
  });

  // finds the point farthest off the line
  const line = new THREE.Line3(points[0], points[furthestInd]);
  const pointOnLine = new THREE.Vector3();
  let perpDistSq = Number.NEGATIVE_INFINITY;
  let thirdPt;
  points.forEach((point, i) => {
    if (i > 0 && i !== furthestInd) {
      line.closestPointToPoint(point, false, pointOnLine);
      let d = pointOnLine.distanceToSquared(point);
      if (d > perpDistSq) {
        perpDistSq = d;
        thirdPt = point;
      }
    }
  });

  // finds the plane
  // noinspection JSUnusedAssignment
  plane.setFromCoplanarPoints(points[0], points[furthestInd], thirdPt);

  normal.copy(plane.normal);
  if (normal.z < 0) {
    normal.multiplyScalar(-1);
  }
  return normal;
}

function calcPlaneNormal(segments, arcs, circles) {
  if (!(segments instanceof Array) || !(arcs instanceof Array)) {
    throw new Error("must pass array of segments and array of arcs to calcPlaneNormal");
  }
  const points = [];
  segments.forEach(segment => {
    points.push(segment.a, segment.b);
  });
  arcs.forEach(arc => {
    points.push(arc.end1, arc.midpoint, arc.end2);
  });
  circles.forEach(circle => {
    points.push(circle.p1, circle.p2, circle.p3);
  })

  const normal = new THREE.Vector3();
  calcPlaneNormalPoints(points, normal);

  return normal;
}

function centerAndSizeTemplate(template) {
  // centers guidepoints
  const center = new THREE.Vector3(0, 0, 0);
  template.segments.forEach(segment => {
    center.add(segment.a);
    center.add(segment.b);
  });
  template.arcs.forEach(arc => {
    center.add(arc.end1);
    center.add(arc.midpoint);
    center.add(arc.end2);
  });
  template.circles.forEach(circle => {
    center.add(circle.center);
  });
  center.divideScalar(template.segments.length * 2 + template.arcs.length * 3 + template.circles.length);

  template.segments.forEach(segment => {
    segment.a.sub(center);
    segment.b.sub(center);
  });
  template.arcs.forEach(arc => {
    arc.end1.sub(center);
    arc.midpoint.sub(center);
    arc.end2.sub(center);
  });
  center.negate();
  template.circles.forEach(circle => {
    circle.scaleAndTranslate(false, center);
  });

  template.size = template.segments.reduce((total, segment) => {
    return total + segment.a.length() + segment.b.length();
  }, 0);
  template.size += template.arcs.reduce((total, arc) => {
    return total + arc.end1.length() + arc.midpoint.length() + arc.end2.length();
  }, 0);
  template.size += template.circles.reduce((total, circle) => {
    // noinspection JSValidateTypes
    return total + circle.center.length() + circle.radius;
  }, 0);

  if (! (template.color instanceof THREE.Color)) {
    template.color = new THREE.Color(template.color || 'cyan');
  }

  return template;
}

const brimstoneDownTemplate = centerAndSizeTemplate({
  name: "brimstone down",
  segments: [
    new Segment(new THREE.Vector3(-15/24, 20/24, 0), new THREE.Vector3(15/24, 20/24, 0), true),
    new Segment(new THREE.Vector3(-15/24, 20/24, 0), new THREE.Vector3(0, -6/24, 0), true),
    new Segment(new THREE.Vector3(15/24, 20/24, 0), new THREE.Vector3(0, -6/24, 0), true),
    new Segment(new THREE.Vector3(0, -6/24, 0), new THREE.Vector3(0, -28/24, 0), true),
    new Segment(new THREE.Vector3(-11/24, -17/24, 0), new THREE.Vector3(11/24, -17/24, 0), true),
  ],
  arcs: [],
  circles: [],
  size: null,   // sum of distances from segment endpoints to origin
  minScore: 6.0,
  manaUseMultiplier: 1,
  color: 'red',
  audioTag: '#flame',
});

const brimstoneUpTemplate = centerAndSizeTemplate({
  name: "brimstone up",
  segments: [
    new Segment(new THREE.Vector3(-15/24,   0,    0), new THREE.Vector3(15/24,   0,    0), true),
    new Segment(new THREE.Vector3(-15/24,   0,    0), new THREE.Vector3( 0,     26/24, 0), true),
    new Segment(new THREE.Vector3( 15/24,   0,    0), new THREE.Vector3( 0,     26/24, 0), true),
    new Segment(new THREE.Vector3(  0,      0,    0), new THREE.Vector3( 0,    -22/24, 0), true),
    new Segment(new THREE.Vector3(-11/24, -11/24, 0), new THREE.Vector3(11/24, -11/24, 0), true),
  ],
  arcs: [],
  circles: [],
  size: null,
  minScore: 5.0,
  manaUseMultiplier: 1,
  color: 'red',
  audioTag: '#flame',
});

const pentacleTemplate = centerAndSizeTemplate({
  name: "pentacle",
  segments: [
    new Segment(new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), true),
    new Segment(new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), true),
    new Segment(new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), true),
    new Segment(new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), true),
    new Segment(new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0), true),
  ],
  arcs: [],
  circles: [
    circleFrom3Points(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0)).circle
  ],
  size: null,
  minScore: 5.0,
  manaUseMultiplier: 1,
  color: 'blue',
  audioTag: '#force',
});

const HALF_SQRT3 = Math.sqrt(3)/2;

const triquetraTemplate = centerAndSizeTemplate({
  name: "triquetra",
  segments: [],
  arcs: [
    new Arc(new THREE.Vector3(-HALF_SQRT3, -0.5, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(HALF_SQRT3, -0.5, 0)),
    new Arc(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(HALF_SQRT3, -0.5, 0)),
    new Arc(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(-HALF_SQRT3, -0.5, 0))
  ],
  circles: [],
  size: null,
  minScore: 5.0,
  manaUseMultiplier: 1,
  color: 'gold',
  audioTag: '#bind',
});

const {circle: circle1} = circleFrom3Points(
    new THREE.Vector3(0, -Math.sqrt(3)/3 - 1, 0),
    new THREE.Vector3(-0.5, Math.sqrt(3)/6, 0),
    new THREE.Vector3(0.5, Math.sqrt(3)/6, 0)
);
const {circle: circle2} = circleFrom3Points(
    new THREE.Vector3(-1.5, Math.sqrt(3)/6, 0),
    new THREE.Vector3(0.5, Math.sqrt(3)/6, 0),
    new THREE.Vector3(0, -Math.sqrt(3)/3, 0)
);
const {circle: circle3} = circleFrom3Points(
    new THREE.Vector3(1.5, Math.sqrt(3)/6, 0),
    new THREE.Vector3(-0.5, Math.sqrt(3)/6, 0),
    new THREE.Vector3(0, -Math.sqrt(3)/3, 0)
);
const borromeanRingsTemplate = centerAndSizeTemplate({
  name: "borromean rings",
  segments: [],
  arcs: [],
  circles: [circle1, circle2, circle3],
  size: null,
  minScore: 10.0,
  manaUseMultiplier: 1,
  color: 'gold',
  audioTag: '#bind',
});

const quicksilverTemplate = centerAndSizeTemplate({
  name: "quicksilver",
  segments: [
    new Segment(new THREE.Vector3(0, -20/20, 0), new THREE.Vector3(0, -10/20,  0), true),
    new Segment(new THREE.Vector3(-5/20, -15/20, 0), new THREE.Vector3(5/20, -15/20, 0), true)
  ],
  arcs: [
    new Arc(new THREE.Vector3(-8.9/20, 18/20, 0), new THREE.Vector3(0, 10/20,  0), new THREE.Vector3(8.9/20, 18/20, 0)),
  ],
  circles: [circleFrom3Points(
      new THREE.Vector3(0, 10/20,  0),
      new THREE.Vector3(10/20, 0, 0),
      new THREE.Vector3(0, -10/20,  0)
  ).circle],
  size: null,
  minScore: 7.0,
  manaUseMultiplier: 1,
  color: 'silver',
  audioTag: '#liquid',
});

const dagazTemplate = centerAndSizeTemplate({
  name: "dagaz",
  segments: [
    new Segment(new THREE.Vector3(-2/3, 1), new THREE.Vector3(2/3, -1), true),
    new Segment(new THREE.Vector3(2/3, -1), new THREE.Vector3(2/3,  1), true),
    new Segment(new THREE.Vector3(2/3,  1), new THREE.Vector3(-2/3, -1), true),
    new Segment(new THREE.Vector3(-2/3, -1), new THREE.Vector3(-2/3, 1), true),
  ],
  arcs: [],
  circles: [],
  size: null,
  minScore: 9.0,
  manaUseMultiplier: 15,
  color: 'yellow',
  audioTag: '#light',
});

const templates = [
  brimstoneDownTemplate,
  brimstoneUpTemplate,
  pentacleTemplate,
  triquetraTemplate,
  borromeanRingsTemplate,
  quicksilverTemplate,
  dagazTemplate,
];

function transformTemplateToDrawn(drawnSegments, drawnArcs, drawnCircles, template){
  // calculates center of drawn
  const drawnCenter = new THREE.Vector3(0, 0, 0);
  drawnSegments.forEach(segment => {
    drawnCenter.add(segment.a);
    drawnCenter.add(segment.b);
  });
  drawnArcs.forEach(arc => {
    drawnCenter.add(arc.end1);
    drawnCenter.add(arc.midpoint);
    drawnCenter.add(arc.end2);
  });
  drawnCircles.forEach(circle => {
    drawnCenter.add(circle.center);
  });
  drawnCenter.divideScalar(drawnSegments.length * 2 + drawnArcs.length * 3 + drawnCircles.length);

  // centers drawn segments & arcs & collects points
  const centeredDrawnSegments = [];
  drawnSegments.forEach(segment => {
    const a = segment.a.clone().sub(drawnCenter);
    const b = segment.b.clone().sub(drawnCenter);
    centeredDrawnSegments.push(new Segment(a, b, true));
  });
  const centeredDrawnArcs = [];
  drawnArcs.forEach(arc => {
    const end1 = arc.end1.clone().sub(drawnCenter);
    const midpoint = arc.midpoint.clone().sub(drawnCenter);
    const end2 = arc.end2.clone().sub(drawnCenter);
    centeredDrawnArcs.push(new Arc(end1, midpoint, end2, true));
  });
  const centeredDrawnCircles = [];
  drawnCircles.forEach(circle => {
    const p1 = circle.p1.clone().sub(drawnCenter);
    const p2 = circle.p2.clone().sub(drawnCenter);
    const p3 = circle.p3.clone().sub(drawnCenter);
    const center = circle.center.clone().sub(drawnCenter);
    centeredDrawnCircles.push(new Circle(p1, p2, p3, center, circle.radius, circle.normal.clone(), true));
  })

  const normalDrawn = calcPlaneNormal(drawnSegments, drawnArcs, drawnCircles);

  const templateSegmentsXformed = template.segments.map(segment => new Segment(segment.a, segment.b));
  const templateArcsXformed = template.arcs.map(arc => new Arc(arc.end1, arc.midpoint, arc.end2));
  const templateCirclesXformed = template.circles.map(circle => new Circle(circle.p1, circle.p2, circle.p3, circle.center, circle.radius, circle.normal));

  // rotates plane of template to match drawn
  let rotAngle = normalDrawn.angleTo(zAxis);
  rotAxis.crossVectors(zAxis, normalDrawn);
  if (rotAxis.length() > 0.00001) {   // rotates if normals not co-linear
    rotAxis.normalize();

    templateSegmentsXformed.forEach(segment => {
      segment.a.applyAxisAngle(rotAxis, rotAngle);
      segment.b.applyAxisAngle(rotAxis, rotAngle);
    });
    templateArcsXformed.forEach(arc => {
      arc.end1.applyAxisAngle(rotAxis, rotAngle);
      arc.midpoint.applyAxisAngle(rotAxis, rotAngle);
      arc.end2.applyAxisAngle(rotAxis, rotAngle);
    });
    templateCirclesXformed.forEach(circle => {
      circle.p1.applyAxisAngle(rotAxis, rotAngle);
      circle.p2.applyAxisAngle(rotAxis, rotAngle);
      circle.p3.applyAxisAngle(rotAxis, rotAngle);
      circle.center.applyAxisAngle(rotAxis, rotAngle);
      circle.normal.applyAxisAngle(rotAxis, rotAngle);
    });
  }

  // scales template to match drawn, and moves to its location
  let sizeDrawn = 0;
  for (let i=0; i<templateSegmentsXformed.length; ++i) {
    sizeDrawn += centeredDrawnSegments[i].a.length();
    sizeDrawn += centeredDrawnSegments[i].b.length();
  }
  for (let i=0; i<templateArcsXformed.length; ++i) {
    sizeDrawn += centeredDrawnArcs[i].end1.length();
    sizeDrawn += centeredDrawnArcs[i].midpoint.length();
    sizeDrawn += centeredDrawnArcs[i].end2.length();
  }
  for (let i=0; i<templateCirclesXformed.length; ++i) {
    sizeDrawn += centeredDrawnCircles[i].center.length();
    sizeDrawn += centeredDrawnCircles[i].radius;
  }
  const scale = sizeDrawn / template.size;

  templateSegmentsXformed.forEach(segment => {
    segment.a.multiplyScalar(scale).add(drawnCenter);
    segment.b.multiplyScalar(scale).add(drawnCenter);
  });
  templateArcsXformed.forEach(arc => {
    arc.end1.multiplyScalar(scale).add(drawnCenter);
    arc.midpoint.multiplyScalar(scale).add(drawnCenter);
    arc.end2.multiplyScalar(scale).add(drawnCenter);
  });
  templateCirclesXformed.forEach(circle => {
    circle.scaleAndTranslate(scale, drawnCenter);
  });

  return [templateSegmentsXformed, templateArcsXformed, templateCirclesXformed, drawnCenter];
}

/**
 * Calculates root-mean-square difference.
 * @param {Segment[]} drawnSegments
 * @param {Arc[]} drawnArcs
 * @param {Circle[]} drawnCircles
 * @param {Segment[]} templateSegments
 * @param {Arc[]} templateArcs
 * @param {Circle[]} templateCircles
 * @return {number}
 */
function rmsd(drawnSegments, drawnArcs, drawnCircles, templateSegments, templateArcs, templateCircles) {
  if (!Array.isArray(drawnSegments) || !Array.isArray(templateSegments)) {
    throw new Error("must pass arrays of segments");
  }
  if (!Array.isArray(drawnArcs) || !Array.isArray(templateArcs)) {
    throw new Error("must pass arrays of arcs");
  }
  if (!Array.isArray(drawnCircles) || !Array.isArray(templateCircles)) {
    throw new Error("must pass arrays of circles");
  }

  let sum = 0;

  templateSegments.forEach(templateSegment => {
    let smallestDs = Number.POSITIVE_INFINITY;
    drawnSegments.forEach(drawnSegment => {
      let ds = (templateSegment.a.distanceToSquared(drawnSegment.a) + templateSegment.b.distanceToSquared(drawnSegment.b));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
      ds = (templateSegment.a.distanceToSquared(drawnSegment.b) + templateSegment.b.distanceToSquared(drawnSegment.a));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
    });
    sum += smallestDs;
  });

  templateArcs.forEach(templateArc => {
    let smallestDs = Number.POSITIVE_INFINITY;
    drawnArcs.forEach(drawnArc => {
      let ds = (templateArc.midpoint.distanceToSquared(drawnArc.midpoint) +
          templateArc.end1.distanceToSquared(drawnArc.end1) +
          templateArc.end2.distanceToSquared(drawnArc.end2));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
      ds = (templateArc.midpoint.distanceToSquared(drawnArc.midpoint) +
          templateArc.end1.distanceToSquared(drawnArc.end2) +
          templateArc.end2.distanceToSquared(drawnArc.end1));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
    });
    sum += smallestDs;
  });

  templateCircles.forEach(templateCircle => {
    let smallestDs = Number.POSITIVE_INFINITY;
    drawnCircles.forEach(drawnCircle => {
      let radiusDiff = drawnCircle.radius - templateCircle.radius;
      let ds = templateCircle.center.distanceToSquared(drawnCircle.center) +
          radiusDiff*radiusDiff +
          templateCircle.normal.distanceToSquared(drawnCircle.normal);
      if (ds < smallestDs) {
        smallestDs = ds;
      }
    });
    sum += smallestDs;
  });

  return Math.sqrt(sum/(2*templateSegments.length + 3*templateArcs.length + 3*templateCircles.length));
}


/**
 * Finds the template that best matches drawn segments and arcs.
 *
 * @param {Segment[]} drawnSegments
 * @param {Arc[]} drawnArcs
 * @param {Circle[]} drawnCircles
 */
function matchDrawnAgainstTemplates(drawnSegments, drawnArcs, drawnCircles) {
  if (!(drawnSegments instanceof Array) || !(drawnArcs instanceof Array) || !(drawnCircles instanceof Array)) {
    throw new Error("must pass segments, arcs and circles to matchDrawnAgainstTemplates");
  }

  let bestScore = Number.NEGATIVE_INFINITY,
      rawScore = Number.NEGATIVE_INFINITY,
      matchedTemplate = null,
      centroidOfDrawn = null,
      bestSegmentsXformed = null,
      bestArcsXformed = null,
      bestCirclesXformed = null;

  templates.forEach(template => {
    if (drawnSegments.length < template.segments.length ||
        drawnArcs.length < template.arcs.length ||
        drawnCircles.length < template.circles.length) {
      return;
    }
    const candidateSegments = template.segments.length ?
        drawnSegments.slice(-template.segments.length) :
        [];
    const candidateArcs = template.arcs.length ?
        drawnArcs.slice(-template.arcs.length) :
        [];
    const candidateCircles = template.circles.length ?
        drawnCircles.slice(-template.circles.length) :
        [];

    const [templateSegmentsXformed, templateArcsXformed, templateCirclesXformed, centroidP] = transformTemplateToDrawn(candidateSegments, candidateArcs, candidateCircles, template);

    const diff = rmsd(candidateSegments, candidateArcs, candidateCircles, templateSegmentsXformed, templateArcsXformed, templateCirclesXformed);
    const rawTemplateScore = 1 / diff;
    const templateScore = rawTemplateScore - template.minScore;

    if (templateScore > bestScore) {
      bestScore = templateScore;
      rawScore = rawTemplateScore;
      matchedTemplate = template;
      centroidOfDrawn = centroidP.clone();
      bestSegmentsXformed = templateSegmentsXformed;
      bestArcsXformed = templateArcsXformed;
      bestCirclesXformed = templateCirclesXformed;
    }
  });

  return [bestScore, rawScore, matchedTemplate, centroidOfDrawn, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed];
}


function angleDiff(first, second) {
  const sign = first.dot(second) >= 0 ? 1 : -1;
  return first.angleTo(second) * sign;
}


try {   // pulled in via require for testing
  module.exports = {
    arcFrom3Points,
    circleFrom3Points,
    Segment,
    Arc,
    Circle,
    calcCentroid,
    centerPoints,
    calcPlaneNormalPoints,
    calcPlaneNormal,
    angleDiff,
    brimstoneDownTemplate,
    brimstoneUpTemplate,
    pentacleTemplate,
    triquetraTemplate,
    borromeanRingsTemplate,
    quicksilverTemplate,
    dagazTemplate,
    templates,
    transformTemplateToDrawn,
    rmsd,
    matchDrawnAgainstTemplates,
  }
} catch (err) {
  // pulled in via script tag
}

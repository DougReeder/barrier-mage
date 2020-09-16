// math.js - math utilities for Barrier Mage
// A-Frame doesn't support any module system well, so functions are just defined globally.
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

try {
  THREE;   // in the browser, A-Frame includes threeJS
} catch (err) {
  THREE = require('../spec/support/three.min');
}


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
 * @param p1 (Vector3)
 * @param p2 (Vector3)
 * @param p3 (Vector3)
 * @param isCircle (boolean)
 * @returns {{startAngle: number, center3: Vector3, endAngle: number, center2: Vector2, radius: number, points: [Vector3]}}
 */
function arcFrom3Points(p1, p2, p3, isCircle) {
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
    endAngle = startAngle + 2*Math.PI;
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

  return {center2, center3, radius, startAngle, endAngle, points};
}

const PI2 = Math.PI / 2;

/** Angle is not meaningful unless the segment has been rotated into the X-Y plane. */
class SegmentStraight {
  constructor(a, b, doReuse) {
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


function calcPlaneNormal(points, normal) {
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
  plane.setFromCoplanarPoints(points[0], points[furthestInd], thirdPt);

  normal.copy(plane.normal);
  if (normal.z < 0) {
    normal.multiplyScalar(-1);
  }
  return normal;
}

function calcPlaneNormalSegments(segmentsStraight) {
  const points = [];
  segmentsStraight.forEach(segment => {
    points.push(segment.a);
    points.push(segment.b);
  });

  const normal = new THREE.Vector3();
  calcPlaneNormal(points, normal);

  return normal;
}

function centerAndSizeTemplate(template) {
  // centers endpoints
  const center = new THREE.Vector3(0, 0, 0);
  template.segmentsStraight.forEach(segment => {
    center.add(segment.a);
    center.add(segment.b)
  });
  center.divideScalar(template.segmentsStraight.length * 2);

  template.segmentsStraight.forEach(segment => {
    segment.a.sub(center);
    segment.b.sub(center);
  });

  template.size = template.segmentsStraight.reduce((total, segment) => {
    return total + segment.a.length() + segment.b.length();
  }, 0);

  if (! (template.color instanceof THREE.Color)) {
    template.color = new THREE.Color(template.color || 'cyan');
  }

  return template;
}

const brimstoneDownTemplate = centerAndSizeTemplate({
  name: "brimstone down",
  segmentsStraight: [
    new SegmentStraight(new THREE.Vector3(-15/24, 20/24, 0), new THREE.Vector3(15/24, 20/24, 0), true),
    new SegmentStraight(new THREE.Vector3(-15/24, 20/24, 0), new THREE.Vector3(0, -6/24, 0), true),
    new SegmentStraight(new THREE.Vector3(15/24, 20/24, 0), new THREE.Vector3(0, -6/24, 0), true),
    new SegmentStraight(new THREE.Vector3(0, -6/24, 0), new THREE.Vector3(0, -28/24, 0), true),
    new SegmentStraight(new THREE.Vector3(-11/24, -17/24, 0), new THREE.Vector3(11/24, -17/24, 0), true),
  ],
  segmentsCurved: [],
  size: null,   // sum of distances from segment endpoints to origin
  minScore: 12.0,
  manaUseMultiplier: 1,
  color: 'red',
  audioTag: '#flame',
});

const brimstoneUpTemplate = centerAndSizeTemplate({
  name: "brimstone up",
  segmentsStraight: [
    new SegmentStraight(new THREE.Vector3(-15/24,   0,    0), new THREE.Vector3(15/24,   0,    0), true),
    new SegmentStraight(new THREE.Vector3(-15/24,   0,    0), new THREE.Vector3( 0,     26/24, 0), true),
    new SegmentStraight(new THREE.Vector3( 15/24,   0,    0), new THREE.Vector3( 0,     26/24, 0), true),
    new SegmentStraight(new THREE.Vector3(  0,      0,    0), new THREE.Vector3( 0,    -22/24, 0), true),
    new SegmentStraight(new THREE.Vector3(-11/24, -11/24, 0), new THREE.Vector3(11/24, -11/24, 0), true),
  ],
  segmentsCurved: [],
  size: null,
  minScore: 7.0,
  manaUseMultiplier: 1,
  color: 'red',
  audioTag: '#flame',
});

const pentagramTemplate = centerAndSizeTemplate({
  name: "pentagram",
  segmentsStraight: [
    new SegmentStraight(new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), true),
    new SegmentStraight(new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), true),
    new SegmentStraight(new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), true),
    new SegmentStraight(new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), true),
    new SegmentStraight(new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0), true),
  ],
  segmentsCurved: [],
  size: null,
  minScore: 35.0,
  manaUseMultiplier: 1,
  color: 'blue',
  audioTag: '#force',
});

const dagazTemplate = centerAndSizeTemplate({
  name: "dagaz",
  segmentsStraight: [
    new SegmentStraight(new THREE.Vector3(-2/3, 1), new THREE.Vector3(2/3, -1), true),
    new SegmentStraight(new THREE.Vector3(2/3, -1), new THREE.Vector3(2/3,  1), true),
    new SegmentStraight(new THREE.Vector3(2/3,  1), new THREE.Vector3(-2/3, -1), true),
    new SegmentStraight(new THREE.Vector3(-2/3, -1), new THREE.Vector3(-2/3, 1), true),
  ],
  segmentsCurved: [],
  size: null,
  minScore: 40.0,
  manaUseMultiplier: 15,
  color: 'yellow',
  audioTag: '#light',
});

const templates = [
  brimstoneDownTemplate,
  brimstoneUpTemplate,
  pentagramTemplate,
  dagazTemplate,
];

function transformTemplateSegmentsToActual(actualSegmentsStraight, actualSegmentsCurved, template){
  // calculates center of actual
  const actualCenter = new THREE.Vector3(0, 0, 0);
  actualSegmentsStraight.forEach(segment => {
    actualCenter.add(segment.a);
    actualCenter.add(segment.b)
  });
  actualCenter.divideScalar(actualSegmentsStraight.length * 2);
  // centers actual segments & collects points
  const centeredActualSegmentsStraight = [];
  actualSegmentsStraight.forEach(segment => {
    const a = segment.a.clone().sub(actualCenter);
    const b = segment.b.clone().sub(actualCenter);
    centeredActualSegmentsStraight.push(new SegmentStraight(a, b));
  });

  const normalActual = calcPlaneNormalSegments(actualSegmentsStraight);

  const templateSegmentsStraightXformed = template.segmentsStraight.map(segment => new SegmentStraight(segment.a, segment.b));
  const templateSegmentsCurvedXformed = [];

  // rotates plane of template to match actual
  let rotAngle = normalActual.angleTo(zAxis);
  rotAxis.crossVectors(zAxis, normalActual);
  if (rotAxis.length() > 0.00001) {   // rotates if normals not co-linear
    rotAxis.normalize();

    templateSegmentsStraightXformed.forEach(segment => {
      segment.a.applyAxisAngle(rotAxis, rotAngle);
      segment.b.applyAxisAngle(rotAxis, rotAngle);
    });
  }

  // scales template to match actual, and moves to its location
  let scaleSum = 0;
  for (let i=0; i<templateSegmentsStraightXformed.length; ++i) {
    scaleSum += centeredActualSegmentsStraight[i].a.length() / templateSegmentsStraightXformed[i].a.length();
    scaleSum += centeredActualSegmentsStraight[i].b.length() / templateSegmentsStraightXformed[i].b.length();
  }
  const scale = scaleSum / (templateSegmentsStraightXformed.length * 2);
  templateSegmentsStraightXformed.forEach(segment => {
    segment.a.multiplyScalar(scale).add(actualCenter);
    segment.b.multiplyScalar(scale).add(actualCenter);
  });

  return [templateSegmentsStraightXformed, templateSegmentsCurvedXformed, actualCenter];
}

function copySegmentStraight(segment) {
  return {
    center: segment.center.clone(),
    length: segment.length,
    angle: segment.angle,
  };
}

function rmsdSegments(actualSegmentsStraight, actualSegmentsCurved, templateSegmentsStraight, templateSegmentsCurved) {
  let sum = 0;

  templateSegmentsStraight.forEach(tSegment => {
    let smallestDs = Number.POSITIVE_INFINITY;
    actualSegmentsStraight.forEach(aSegment => {
      let ds = (tSegment.a.distanceToSquared(aSegment.a) + tSegment.b.distanceToSquared(aSegment.b));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
      ds = (tSegment.a.distanceToSquared(aSegment.b) + tSegment.b.distanceToSquared(aSegment.a));
      if (ds < smallestDs) {
        smallestDs = ds;
      }
    });
    sum += smallestDs;
  });

  return Math.sqrt(sum/2/templateSegmentsStraight.length);
}


function matchSegmentsAgainstTemplates(segmentsStraight, segmentsCurved) {
  let bestScore = Number.NEGATIVE_INFINITY,
      rawScore = Number.NEGATIVE_INFINITY,
      matchedTemplate = null,
      centroidOfDrawn = null;

  templates.forEach(template => {
    if (segmentsStraight.length < template.segmentsStraight.length ||
        segmentsCurved.length < template.segmentsCurved.length) {
      return;
    }
    const candidateSegmentsStraight = segmentsStraight.slice(-template.segmentsStraight.length);
    const candidateSegmentsCurved = segmentsCurved.slice(-template.segmentsCurved.length);

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed, centroidP] = transformTemplateSegmentsToActual(candidateSegmentsStraight, candidateSegmentsCurved, template);

    const diff = rmsdSegments(candidateSegmentsStraight, candidateSegmentsCurved, templateSegmentsStraightXformed, templateSegmentsCurvedXformed);
    const rawTemplateScore = 1 / (diff / template.size);
    const templateScore = rawTemplateScore - template.minScore;

    if (templateScore > bestScore) {
      bestScore = templateScore;
      rawScore = rawTemplateScore;
      matchedTemplate = template;
      centroidOfDrawn = centroidP.clone();
    }
  });

  return [bestScore, rawScore, matchedTemplate, centroidOfDrawn];
}

const rotAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3(0,0,1);


function angleDiff(first, second) {
  const sign = first.dot(second) >= 0 ? 1 : -1;
  return first.angleTo(second) * sign;
}


try {   // pulled in via require for testing
  module.exports = {
    arcFrom3Points,
    SegmentStraight,
    calcCentroid,
    centerPoints,
    calcPlaneNormal,
    calcPlaneNormalSegments,
    angleDiff,
    brimstoneDownTemplate,
    brimstoneUpTemplate,
    pentagramTemplate,
    dagazTemplate,
    templates,
    transformTemplateSegmentsToActual,
    rmsdSegments,
    matchSegmentsAgainstTemplates,
  }
} catch (err) {
  // pulled in via script tag
}

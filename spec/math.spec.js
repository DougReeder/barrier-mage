// unit tests for math utilities for Barrier Mage

require("./support/three.min");
const {arcFrom3Points, newSegmentStraight, calcCentroid, centerPoints, calcPlaneNormal, angleDiff, brimstoneDownTemplate, brimstoneUpTemplate, pentagramTemplate, dragonsEyeTemplate, copySegmentStraight, transformSegmentsToStandard, rmsdTemplate, matchSegmentsAgainstTemplates, transformToStandard, transformTemplateToActual, rmsd} = require('../src/math');

const INV_SQRT_2 = 1 / Math.sqrt(2);
const THREE_SQRT_2 = 3 / Math.sqrt(2);

describe("arcFrom3Points", () => {
  it("should do first quadrant", () => {
    const p1 = new THREE.Vector3(0, 1, 0);
    const p2 = new THREE.Vector3(INV_SQRT_2, INV_SQRT_2, 0);
    const p3 = new THREE.Vector3(1,0,0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(0, 6);
    expect(arc.center3.y).toBeCloseTo(0, 6);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(1, 6);
    expect(arc.startAngle).toBeCloseTo(Math.PI/2, 6);
    expect(arc.endAngle).toBeCloseTo(0, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    // expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,4);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should do spread", () => {
    const p1 = new THREE.Vector3(2.3,3.4,0);
    const p2 = new THREE.Vector3(-1.2,-2.1,0);
    const p3 = new THREE.Vector3(3.2,-0.5,0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(0.2129, 4);
    expect(arc.center3.y).toBeCloseTo(0.8645, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(3.28401, 4);
    expect(arc.startAngle).toBeGreaterThan(Math.PI/4);
    expect(arc.startAngle).toBeLessThan(Math.PI/2);
    expect(arc.endAngle).toBeGreaterThan(1.75*Math.PI);
    expect(arc.endAngle).toBeLessThan(2*Math.PI);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    // p2 is not the middle of this arc
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle origin in fourth quadrant", () => {
    const p1 = new THREE.Vector3(-1.1, 2.2, 0);
    const p2 = new THREE.Vector3(-5.4, -4.4, 0);
    const p3 = new THREE.Vector3(3.2, -0.5,0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(-1.0673, 4);
    expect(arc.center3.y).toBeCloseTo(-2.522, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(4.72216, 4);
    expect(arc.startAngle).toBeGreaterThan(Math.PI/2);
    expect(arc.startAngle).toBeLessThan(0.75*Math.PI);
    expect(arc.endAngle).toBeGreaterThan(0);
    expect(arc.endAngle).toBeLessThan(Math.PI/4);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    // p2 is not the middle of this arc
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle arc crossing X-axis", () => {
    const p1 = new THREE.Vector3(0.80, -0.62, 0);
    const p2 = new THREE.Vector3(-0.97, 0.20, 0.01);
    const p3 = new THREE.Vector3(0.95, 0.32, 0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(0, 1);
    expect(arc.center3.y).toBeCloseTo(0, 1);
    expect(arc.center3.z).toBeCloseTo(0, 2);
    expect(arc.radius).toBeCloseTo(1, 3);
    const arcAngle = (arc.endAngle - arc.startAngle + 2*Math.PI) % 2*Math.PI;
    expect(arcAngle).toBeGreaterThan(1.25*Math.PI);
    expect(arcAngle).toBeLessThan(1.75*Math.PI);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle in Y-Z plane", () => {
    const p1 = new THREE.Vector3(9, 1, 0);
    const p2 = new THREE.Vector3(9, INV_SQRT_2, INV_SQRT_2);
    const p3 = new THREE.Vector3(9, 0, 1);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(9, 4);
    expect(arc.center3.y).toBeCloseTo(0, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(1, 4);
    expect(arc.startAngle).toBeCloseTo(Math.PI/2, 6);
    expect(arc.endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle in other vertical plane", () => {
    const p1 = new THREE.Vector3(-THREE_SQRT_2, 0, -THREE_SQRT_2);
    const p2 = new THREE.Vector3(0, 3, 0);
    const p3 = new THREE.Vector3(THREE_SQRT_2, 0, THREE_SQRT_2);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(0, 4);
    expect(arc.center3.y).toBeCloseTo(0, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(3, 4);
    expect(arc.startAngle).toBeCloseTo(2*Math.PI, 6);   // p1 rotated 0.75 π onto +X axis
    expect(arc.endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle in other vertical plane with offset", () => {
    const p1 = new THREE.Vector3(2-THREE_SQRT_2, 0, 4-THREE_SQRT_2);
    const p2 = new THREE.Vector3(2, 3, 4);
    const p3 = new THREE.Vector3(2+THREE_SQRT_2, 0, 4+THREE_SQRT_2);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(2, 4);
    expect(arc.center3.y).toBeCloseTo(0, 4);
    expect(arc.center3.z).toBeCloseTo(4, 6);
    expect(arc.radius).toBeCloseTo(3, 4);
    expect(arc.startAngle).toBeCloseTo(2*Math.PI, 6);   // p1 rotated 0.75 π onto +X axis
    expect(arc.endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle in diagonal plane", () => {
    const p1 = new THREE.Vector3(-THREE_SQRT_2, -THREE_SQRT_2, 0);
    const p2 = new THREE.Vector3(0, 0, 3);
    const p3 = new THREE.Vector3(THREE_SQRT_2, THREE_SQRT_2, 0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(0, 4);
    expect(arc.center3.y).toBeCloseTo(0, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(3, 4);
    expect(arc.startAngle).toBeCloseTo(1.25*Math.PI, 6);
    expect(arc.endAngle).toBeCloseTo(Math.PI/4, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should handle diagonal plane with offset", () => {
    const p1 = new THREE.Vector3(2-THREE_SQRT_2, 4-THREE_SQRT_2, 0);
    const p2 = new THREE.Vector3(2, 4, 3);
    const p3 = new THREE.Vector3(2+THREE_SQRT_2, 4+THREE_SQRT_2, 0);

    const arc = arcFrom3Points(p1, p2, p3);

    expect(arc.center3.x).toBeCloseTo(2, 4);
    expect(arc.center3.y).toBeCloseTo(4, 4);
    expect(arc.center3.z).toBeCloseTo(0, 6);
    expect(arc.radius).toBeCloseTo(3, 4);
    expect(arc.startAngle).toBeCloseTo(1.25*Math.PI, 6);
    expect(arc.endAngle).toBeCloseTo(Math.PI/4, 6);
    expect(p1.distanceTo(arc.points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(arc.points[Math.floor(arc.points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(arc.points[arc.points.length-1])).toBeCloseTo(0,4);
  });

  it("should return circle when 4th arg is truthy", () => {
    const p1 = new THREE.Vector3(1, -2, 6);
    const p2 = new THREE.Vector3(1, 13.3, 14.5);
    const p3 = new THREE.Vector3(1, 13.3, -2.5);

    const arc = arcFrom3Points(p1, p2, p3, true);

    expect(arc.center3.x).toBeCloseTo(1, 4);
    expect(arc.center3.y).toBeCloseTo(8, 1);
    expect(arc.center3.z).toBeCloseTo(6, 6);
    expect(arc.radius).toBeCloseTo(10, 1);
    expect(arc.endAngle - arc.startAngle).toBeCloseTo(2*Math.PI);
    expect(arc.points.length).toBeGreaterThan(3141);   // Math.round(10*2*Math.PI/0.02)
    expect(arc.points.length).toBeLessThan(3147);   // Math.round(10*2*Math.PI/0.02)
  });

});

/** angle is always returned in the 1st quadrant, because X and Z swap around and reverse as the user turns around. */
describe("newSegmentStraight", () => {
  it("should calculate center, length & positive angle when slope is -3/2", ()=> {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toEqual(5);
    expect(segment.center.y).toEqual(7);
    expect(segment.center.z).toEqual(-1);
    expect(segment.length).toBeCloseTo(Math.sqrt(4*4+6*6));
    expect(segment.angle).toBeCloseTo(Math.asin(3/Math.sqrt(2*2+3*3)), 6);
  });

  it("should calculate center, length & positive angle when slope is +30 deg", ()=> {
    const a = new THREE.Vector3(1, 10, -1);
    const b = new THREE.Vector3(2.73205, 11, -1);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toBeCloseTo(1.86603, 4);
    expect(segment.center.y).toBeCloseTo(10.5, 4);
    expect(segment.center.z).toEqual(-1);
    expect(segment.length).toBeCloseTo(2);
    expect(segment.angle).toBeCloseTo(0.5236, 4);
  });

  it("should calculate center, length & positive angle when in Y-Z plane & slope is +30 deg", ()=> {
    const a = new THREE.Vector3(-2, 10, 1);
    const b = new THREE.Vector3(-2, 11, 2.73205);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toEqual(-2);
    expect(segment.center.y).toBeCloseTo(10.5, 4);
    expect(segment.center.z).toBeCloseTo(1.86603, 4);
    expect(segment.length).toBeCloseTo(2);
    expect(segment.angle).toBeCloseTo(0.5236, 4);
  });

  it("should calculate center, length & positive angle when in other vertical plane & slope is +45 deg", ()=> {
    const a = new THREE.Vector3(0, 0, 0);
    const b = new THREE.Vector3(THREE_SQRT_2, 3, THREE_SQRT_2);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toBeCloseTo(THREE_SQRT_2/2, 4);
    expect(segment.center.y).toBeCloseTo(1.5, 4);
    expect(segment.center.z).toBeCloseTo(THREE_SQRT_2/2, 4);
    expect(segment.length).toBeCloseTo(4.24264, 4);
    expect(segment.angle).toBeCloseTo(Math.PI/4, 4);
  });

  it("should calculate center, length & positive angle when in other vertical plane & slope is zero", ()=> {
    const a = new THREE.Vector3(0, 4, 0);
    const b = new THREE.Vector3(THREE_SQRT_2, 4, THREE_SQRT_2);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toBeCloseTo(THREE_SQRT_2/2, 4);
    expect(segment.center.y).toBeCloseTo(4, 4);
    expect(segment.center.z).toBeCloseTo(THREE_SQRT_2/2, 4);
    expect(segment.length).toBeCloseTo(3, 4);
    expect(segment.angle).toBeCloseTo(0, 4);
  });

  it("should calculate center, length & 90 degree angle when vertical", ()=> {
    const a = new THREE.Vector3(2, 3, 2);
    const b = new THREE.Vector3(2, 4, 2);

    const segment = newSegmentStraight(a, b);

    expect(segment.center.x).toBeCloseTo(2, 4);
    expect(segment.center.y).toBeCloseTo(3.5, 4);
    expect(segment.center.z).toBeCloseTo(2, 4);
    expect(segment.length).toBeCloseTo(1, 4);
    expect(segment.angle).toBeCloseTo(Math.PI/2, 4);
  });
});

const diagonal = new THREE.Vector3(1, 1, 1).normalize();

function fuzz(points, fuzzAmount) {
  points.forEach(p => {
    p.addScaledVector(diagonal, fuzzAmount);
  });
}

function expectStdPentagram(points, decimalPlaces) {
  expect(points[0].x).toBeCloseTo(0, decimalPlaces);
  expect(points[0].y).toBeCloseTo(1, decimalPlaces);
  expect(points[0].z).toBeCloseTo(0, decimalPlaces);

  expect(points[1].x).toBeCloseTo(0.58779, decimalPlaces);
  expect(points[1].y).toBeCloseTo(-0.80902, decimalPlaces);
  expect(points[1].z).toBeCloseTo(0, decimalPlaces);

  expect(points[2].x).toBeCloseTo(-0.95106, decimalPlaces);
  expect(points[2].y).toBeCloseTo(0.30902, decimalPlaces);
  expect(points[2].z).toBeCloseTo(0, decimalPlaces);

  expect(points[3].x).toBeCloseTo(0.95106, decimalPlaces);
  expect(points[3].y).toBeCloseTo(0.30902, decimalPlaces);
  expect(points[3].z).toBeCloseTo(0, decimalPlaces);

  expect(points[4].x).toBeCloseTo(-0.58779, decimalPlaces);
  expect(points[4].y).toBeCloseTo(-0.80902, decimalPlaces);
  expect(points[4].z).toBeCloseTo(0, decimalPlaces);
}

describe("calcCentroid", function () {
  it("should calculate centroid of points", () => {
    const points = [new THREE.Vector3(1, 2, 3), new THREE.Vector3(-5, 1, -4), new THREE.Vector3(9, -8, 0), new THREE.Vector3(0, -2, -3)];

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(1.25);
    expect(centroidPt.y).toEqual(-1.75);
    expect(centroidPt.z).toEqual(-1);
  });
});

describe("angleDiff", () => {
  it("should equal angleTo when dot product is positive", () => {
    const first = new THREE.Vector3(1, -2, 1);
    const second = new THREE.Vector3(2, -1, 3);
    expect(angleDiff(first, second)).toBeCloseTo(first.angleTo(second), 6);
    expect(angleDiff(second, first)).toBeCloseTo(second.angleTo(first), 6);
  });

  it("should be the negative of angleTo when dot product is negative", () => {
    const first = new THREE.Vector3(1, 2, 1);
    const second = new THREE.Vector3(2, 0, -3);
    expect(angleDiff(first, second)).toBeCloseTo(-first.angleTo(second), 6);
    expect(angleDiff(second, first)).toBeCloseTo(-second.angleTo(first), 6);
  });

  it("should be symmetric", () => {
    const first = new THREE.Vector3(1, 2, 1);
    const second = new THREE.Vector3(2, 0, -3);
    expect(angleDiff(first, second)).toEqual(angleDiff(second, first));
  });

  it("should deal with edge cases", () => {
    const first = new THREE.Vector3(0.58779, -0.80902, 0);
    const second = new THREE.Vector3(0.58779, -0.8090199999999999, 0);
    expect(angleDiff(first, second)).toEqual(first.angleTo(second));
    expect(angleDiff(second, first)).toEqual(second.angleTo(first));
  });
});

describe("centerPoints", function () {
  it("should center points on the origin", () => {
    const points = [new THREE.Vector3(3, 2, 1), new THREE.Vector3(-1, -3, 5), new THREE.Vector3(-9, 0, -6), new THREE.Vector3(0, 9, -3)];

    centerPoints(points);

    expect(points[0].x).toEqual(4.75);
    expect(points[0].y).toEqual(0);
    expect(points[0].z).toEqual(1.75);

    expect(points[1].x).toEqual(0.75);
    expect(points[1].y).toEqual(-5);
    expect(points[1].z).toEqual(5.75);

    expect(points[2].x).toEqual(-7.25);
    expect(points[2].y).toEqual(-2);
    expect(points[2].z).toEqual(-5.25);

    expect(points[3].x).toEqual(1.75);
    expect(points[3].y).toEqual(7);
    expect(points[3].z).toEqual(-2.25);
  });
});

describe("calcPlaneNormal", () => {
  it("should handle points almost in the X-Z plane", () => {
    const points = [new THREE.Vector3(1, 0, 1), new THREE.Vector3(2, 0, 2), new THREE.Vector3(3, 0.1, 1), new THREE.Vector3(5, 0, 2), new THREE.Vector3(1, 0, 4)];
    const normal = new THREE.Vector3();

    calcPlaneNormal(points, normal);

    expect(normal.x).toBeCloseTo(0, 1);
    expect(Math.abs(normal.y)).toBeCloseTo(1, 2);
    expect(normal.z).toBeCloseTo(0, 1);
  });

  it("should handle points almost in a vertical plane", () => {
    const points = [new THREE.Vector3(THREE_SQRT_2, 0, THREE_SQRT_2), new THREE.Vector3(-THREE_SQRT_2, 0, -THREE_SQRT_2), new THREE.Vector3(0.01, 2, 0), new THREE.Vector3(0, -4, 0)];
    const normal = new THREE.Vector3();

    calcPlaneNormal(points, normal);

    expect(normal.x).toBeCloseTo(-INV_SQRT_2, 2);
    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(INV_SQRT_2, 2);
  });

  it("should handle beginning points in one plane and end points in a different one", () => {
    const points = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.0001, 0, 1), new THREE.Vector3(0.0001, 1, 1)];
    const normal = new THREE.Vector3();

    calcPlaneNormal(points, normal);

    expect(normal.lengthSq()).toBeGreaterThan(0);   // direction is ambiguous
  });

  it("should work around repeated points", () => {
    const points = [new THREE.Vector3(0, 1, 2), new THREE.Vector3(0, 2, 1), new THREE.Vector3(0, 1, 2), new THREE.Vector3(0, 2, 3), new THREE.Vector3(0, 2, 3)];
    const normal = new THREE.Vector3();

    calcPlaneNormal(points, normal);

    expect(Math.abs(normal.x)).toBeCloseTo(1, 2);
    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(0, 2);
  });

  it("should work around many repeated points", () => {
    const points = [new THREE.Vector3(2, 0, 3), new THREE.Vector3(2, 0, 3), new THREE.Vector3(2, 0, 3), new THREE.Vector3(3, 0, 4), new THREE.Vector3(3, 0, 4), new THREE.Vector3(3, 0, 4), new THREE.Vector3(-4, 0.001, 5)];
    const normal = new THREE.Vector3();

    calcPlaneNormal(points, normal);

    expect(normal.x).toBeCloseTo(0, 2);
    expect(Math.abs(normal.y)).toBeCloseTo(1, 2);
    expect(normal.z).toBeCloseTo(0, 2);
  });
});


describe("templates", () => {
  it("should have brimstone down at origin", () => {
    const points = brimstoneDownTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toEqual(0);
    expect(centroidPt.z).toEqual(0);
  });

  it("should have brimstone up at origin", () => {
    const points = brimstoneUpTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toEqual(0);
    expect(centroidPt.z).toEqual(0);
  });

  it("should have pentagram at origin", () => {
    const points = pentagramTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);
  });

  it("should have dragon's eye at origin", () => {
    const points = dragonsEyeTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);
  });
});

function fuzzSegmentStraight(segmentStraight, linearFuzz, angularFuzz = 0) {
  const newCenter = segmentStraight.center.clone().addScaledVector(diagonal, linearFuzz);
  return {
    center: newCenter,
    length: segmentStraight.length - linearFuzz,
    angle: segmentStraight.angle - angularFuzz
  }
}

describe("transformSegmentsToStandard", () => {
  it("should not transform brimstone (point down) exact", () => {
    [segmentsStraightXformed, segmentsCurvedXformed] = transformSegmentsToStandard(brimstoneDownTemplate.segmentsStraight, []);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(segmentsStraightXformed[i].center.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.x, 4);
      expect(segmentsStraightXformed[i].center.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.y, 4);
      expect(segmentsStraightXformed[i].center.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.z, 4);
      expect(segmentsStraightXformed[i].length).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].length, 4);
      expect(segmentsStraightXformed[i].angle).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].angle, 4);
    }
  });

  it("should transform back brimstone (point down) fuzzed", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.001))
    });

    [segmentsStraightXformed, segmentsCurvedXformed] = transformSegmentsToStandard(segmentsStraightFuzzed, []);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(Math.abs(segmentsStraightXformed[i].center.x)).toBeCloseTo(Math.abs(brimstoneDownTemplate.segmentsStraight[i].center.x), 2);
      expect(segmentsStraightXformed[i].center.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.y, 2);
      expect(segmentsStraightXformed[i].center.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.z, 2);
      expect(segmentsStraightXformed[i].length).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].length, 2);
      expect(segmentsStraightXformed[i].angle).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].angle, 2);
    }
  });

  it("should transform back brimstone (point down) rotated around Y fuzzed", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.001))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.center.applyAxisAngle(axis, Math.PI/6);
    });

    [segmentsStraightXformed, segmentsCurvedXformed] = transformSegmentsToStandard(segmentsStraightRotated, []);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(Math.abs(segmentsStraightXformed[i].center.x)).toBeCloseTo(Math.abs(brimstoneDownTemplate.segmentsStraight[i].center.x), 2);
      expect(segmentsStraightXformed[i].center.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.y, 2);
      expect(segmentsStraightXformed[i].center.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.z, 2);
      expect(segmentsStraightXformed[i].length).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].length, 2);
      expect(segmentsStraightXformed[i].angle).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].angle, 2);
    }
  });

  xit("should transform back brimstone (point down) rotated around X fuzzed", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.001))
    });
    const axis = new THREE.Vector3(1, 0, 0).normalize();
    segmentsStraightRotated.forEach(segment => {
      segment.center.applyAxisAngle(axis, Math.PI/20);
    });

    [segmentsStraightXformed, segmentsCurvedXformed] = transformSegmentsToStandard(segmentsStraightRotated, []);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(Math.abs(segmentsStraightXformed[i].center.x)).toBeCloseTo(Math.abs(brimstoneDownTemplate.segmentsStraight[i].center.x), 1);
      expect(segmentsStraightXformed[i].center.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.y, 1);
      expect(segmentsStraightXformed[i].center.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].center.z, 1);
      expect(segmentsStraightXformed[i].length).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].length, 1);
      expect(segmentsStraightXformed[i].angle).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].angle, 1);
    }
  });
});

describe("rmsdTemplate", () => {
  it("should calculate 0 for exact match", () => {
    const diff = rmsdTemplate(brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toEqual(0);
  });

  it("should correspond to small differences in center.x", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].center.x += 0.01;

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.01/5), 4);
  });

  it("should correspond to small differences in center.y", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].center.y += 0.01;

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.01/5), 4);
  });

  it("should correspond to small differences in center.z", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].center.z += 0.01;

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.01/5), 4);
  });

  it("should correspond to small differences in length", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].length += 0.01;

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.01/5), 4);
  });

  it("should correspond to small differences in angle", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].angle += 0.001;

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.001*segmentsStraightFuzzed[1].length/5), 4);
  });

  it("should correspond to small differences in center and length", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1] = fuzzSegmentStraight(segmentsStraightFuzzed[1], 0.01, 0);

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.02/5), 4);
  });

  it("should be small for near match (linear)", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, 0));
    });

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeCloseTo(Math.sqrt(0.01*2*brimstoneDownTemplate.segmentsStraight.length/5), 4);
  });

  it("should be small for near match (angular)", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0, 0.001));
    });

    const diff = rmsdTemplate(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate);

    expect(diff).toBeLessThan(0.17);
  });

  it("should calculate 0 for exact match of brimstone up", () => {
    const diff = rmsdTemplate(brimstoneUpTemplate.segmentsStraight, brimstoneUpTemplate.segmentsCurved, brimstoneUpTemplate);

    expect(diff).toEqual(0);
  });
});

describe("matchSegmentsAgainstTemplates", () => {
  it("should match brimstone (point down) exact", () => {
    const [score, template] = matchSegmentsAgainstTemplates(brimstoneDownTemplate.segmentsStraight, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(1000);
  });

  it("should match brimstone (point down) small difference in center.x", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].center.x += 0.01;

    const [score, template] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeCloseTo(40.2, 1);
  });

  it("should match brimstone (point down) fuzzed angular", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0, 0.001));
    });

    const [score, template] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeCloseTo(92.9, 1);
  });

  it("should not crash when too few segments to match template", () => {
    const segmentsStraight = [
      newSegmentStraight(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
    ];

    const [score, template] = matchSegmentsAgainstTemplates(segmentsStraight, []);

    expect(template).toBeNull();
    expect(score).toEqual(Number.NEGATIVE_INFINITY);
  });

  it("should should match brimstone (point up) fuzzed linear & angular", () => {
    const segmentsStraightFuzzed = [];
    brimstoneUpTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, 0.001));
    });

    const [score, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone up");
    expect(score).toBeCloseTo(21.0, 1);
    expect(centroidPt.x).toBeCloseTo(0, 1);
    expect(centroidPt.y).toBeCloseTo(0, 1);
    expect(centroidPt.z).toBeCloseTo(0, 1);
  });

  it("should match pentagram exact", () => {
    const [score, template, centroidPt] = matchSegmentsAgainstTemplates(pentagramTemplate.segmentsStraight, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(1000);
    expect(centroidPt.x).toBeCloseTo(0, 6);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram; small difference in center.x", () => {
    const segmentsStraightFuzzed = [];
    pentagramTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(copySegmentStraight(segment));
    });
    segmentsStraightFuzzed[1].center.x += 0.01;

    const [score, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeCloseTo(15, 0);
    expect(centroidPt.x).toBeCloseTo(0.002, 3);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram fuzzed angular", () => {
    const segmentsStraightFuzzed = [];
    pentagramTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0, 0.001));
    });

    const [score, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeCloseTo(35.4, 1);
    expect(centroidPt.x).toBeCloseTo(0, 6);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should should match dragon's eye fuzzed linear & angular", () => {
    const segmentsStraightFuzzed = dragonsEyeTemplate.segmentsStraight.map( segment => {
      return fuzzSegmentStraight(segment, 0.01, 0.001);
    });

    const [score, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("dragon's eye");
    expect(score).toBeCloseTo(28.1, 1);
    expect(centroidPt.x).toBeCloseTo(0, 1);
    expect(centroidPt.y).toBeCloseTo(0, 1);
    expect(centroidPt.z).toBeCloseTo(0, 1);
  });
});

describe("transformToStandard", function () {
  it("should transform the points to the X-Y plane (exact, small rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/6));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, small rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/6));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large negative rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large negative rotation around vertical)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.010);
    const axis = new THREE.Vector3(0, 1, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large negative rotation around X)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(1, 0, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large negative rotation around X)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(1, 0, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large negative rotation around diagonal)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(0.70711, 0.70711, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large negative rotation around diagonal)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.010);
    const axis = new THREE.Vector3(0.70711, 0.70711, 0);
    points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large rotation around Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(0, 0, 1);
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large rotation around Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(0, 0, 1);
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  it("should transform the points to the X-Y plane (exact, large rotation around X, Y & Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    const axis = new THREE.Vector3(1, 1, 1);
    axis.normalize();
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, large rotation around X, Y & Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(1, 1, 1);
    axis.normalize();
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });

  // it("should transform the points to the X-Y plane (exact, mirrored across horizontal)", () => {
  //   const points = [new THREE.Vector3(0,-1,0), new THREE.Vector3(0.58779,0.80902,0), new THREE.Vector3(-0.95106,-0.30902,0), new THREE.Vector3(0.95106,-0.30902,0), new THREE.Vector3(-0.58779,0.80902)];
  //   // const axis = new THREE.Vector3(0, 1, 0);
  //   // points.forEach(p => p.applyAxisAngle(axis, -3*Math.PI/4));
  //
  //   transformToStandard(points);
  //
  //   expectStdPentagram(points, 4);
  // });


  // it("should transform the points to the X-Y plane (exact, drawn ccw)", () => {
  //   const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.58779,-0.80902,0)];
  //
  //   transformToStandard(points);
  //
  //   expectStdPentagram(points, 4);
  // });


  it("should transform the points to the X-Y plane (exact, translation in X, Y & Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    points.forEach(p => p.addScalar(2));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, translation & large rotation around X, Y & Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(1, 1, 1);
    axis.normalize();
    points.forEach(p => p.applyAxisAngle(axis, 3*Math.PI/4).addScalar(2));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });


  it("should scale the points to standard size (exact, scaled double)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    points.forEach(p => p.multiplyScalar(2));

    transformToStandard(points);

    expectStdPentagram(points, 4);
  });

  it("should transform the points to the X-Y plane (fuzzed, scaled third, translation & large rotation around X, Y & Z)", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];
    fuzz(points, 0.015);
    const axis = new THREE.Vector3(1, 1, 1);
    axis.normalize();
    points.forEach(p => p.multiplyScalar(1/3).applyAxisAngle(axis, 3*Math.PI/4).addScalar(2));

    transformToStandard(points);

    expectStdPentagram(points, 1);
  });
});

const stdPentagramPoints = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902)];

describe("rmsd", () => {
  it("should be zero when comparing points to themselves", () => {
    expect(rmsd(stdPentagramPoints,stdPentagramPoints)).toEqual(0);
  });

  it("should be sqrt(0.1^2/5) when one point varies by 0.1", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    points[1].x += 0.1;
    expect(rmsd(points,stdPentagramPoints)).toBeCloseTo(0.04472,4);
  });

  it("should be sqrt((0.1^2+0.1^2)/5) when two points vary by 0.1", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const offset = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(0.1);
    points[1].add(offset);
    points[3].add(offset);
    expect(rmsd(points,stdPentagramPoints)).toBeCloseTo(0.06325,4);
  });

  it("should be small when all points fuzzed", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    fuzz(points, 0.1);
    expect(rmsd(points,stdPentagramPoints)).toBeLessThan(0.17321);
  });
});


describe("transformTemplateToActual", () => {
  it("should not alter points", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.multiplyScalar(3.5).applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));
    fuzz(points, 0.1);
    const pointsCopy = points.map(p => new THREE.Vector3().copy(p));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, pointsCopy)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, translation)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    points.forEach(p => p.addScalar(2));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(1, 6);
  });

  xit("should transform the template to match the actual (exact, large rotation around X & Y)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 0).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(1, 6);
  });

  it("should transform the template to match the actual (exact, small rotation around Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(0, 0, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(1, 6);
  });

  it("should transform the template to match the actual (exact, large negative rotation around Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(0, 0, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, -5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(1, 6);
  });

  xit("should transform the template to match the actual (exact, small rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 3).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/5));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(1, 6);
  });

  it("should transform the template to match the actual (fuzzed, small rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 3).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/5));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeLessThan(0.30);
    expect(Math.abs(template.scale - 1)).toBeLessThan(0.1);
  });

  xit("should transform the template to match the actual (exact, large rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, large rotation around X,Y & Z) 2", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 1, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 4*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (fuzzed, translation & large rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeLessThan(2.5);
    expect(Math.abs(template.scale - 1)).toBeLessThan(0.1);
  });

  it("should transform the template to match the actual (exact, scaled)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p).multiplyScalar(3));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeCloseTo(0, 6);
    expect(template.scale).toBeCloseTo(3, 6);
  });

  it("should transform the template to match the actual (fuzzed, scaled)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p).multiplyScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeLessThan(0.30);
    expect(Math.abs(template.scale - 3)).toBeLessThan(0.15);
  });

  it("should transform the template to match the actual (fuzzed, scaled, large rotation around X,Y & Z, translated)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.multiplyScalar(2.5).applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rmsd(points, template)).toBeLessThan(5.5);
    expect(Math.abs(template.scale - 2.5)).toBeLessThan(0.15);
  });
});

describe("matchTemplates", () => {
  it("should match nothing when too short", () => {
     const points = [new THREE.Vector3(0,1,0)];

     const [score, template, transformedTemplatePoints] = matchTemplates(points);

     expect(template).toBeFalsy();
     expect(score).toEqual(0);
     expect(transformedTemplatePoints).toBeFalsy();
  });

  it("should match pentagram when exact match", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0)];

    const [score, template, transformedTemplatePoints] = matchTemplates(points);

    expect(template).toBeTruthy();
    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(5.0);
    expect(transformedTemplatePoints).toBeInstanceOf(Array);
  });

  it("should match pentagram when last points exactly match", () => {
    const points = [new THREE.Vector3(1,2,3), new THREE.Vector3(2,3,4), new THREE.Vector3(3,4,5), new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0)];

    const [score, template, transformedTemplatePoints] = matchTemplates(points);

    expect(template).toBeTruthy();
    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(5.0);
    expect(transformedTemplatePoints).toBeInstanceOf(Array);
  });

  it("should poorly match pentagram when points in the middle exactly match", () => {
    const points = [new THREE.Vector3(1,2,3), new THREE.Vector3(2,3,4), new THREE.Vector3(3,4,5), new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0), new THREE.Vector3(3,2,1), new THREE.Vector3(4,3,2)];

    const [score, template, transformedTemplatePoints] = matchTemplates(points);

    expect(template).toBeTruthy();
    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(0.0);
    expect(score).toBeLessThan(1.0);
    expect(transformedTemplatePoints).toBeInstanceOf(Array);
  });

  it("should match pentagram when fuzzed", () => {
    const points = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0)];
    fuzz(points, 0.1);

    const [score, template, transformedTemplatePoints] = matchTemplates(points);

    expect(template).toBeTruthy();
    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(2.9);
    expect(transformedTemplatePoints).toBeInstanceOf(Array);
  });

});

// unit tests for math utilities for Barrier Mage

require("./support/three.min");
const {arcFrom3Points, SegmentStraight, calcCentroid, centerPoints, calcPlaneNormal, calcPlaneNormalSegments, angleDiff, brimstoneDownTemplate, brimstoneUpTemplate, pentagramTemplate, dagazTemplate, templates, transformTemplateSegmentsToActual, rmsdSegments, matchSegmentsAgainstTemplates} = require('../src/math');

const INV_SQRT_2 = 1 / Math.sqrt(2);   // 0.70711
const INV_SQRT_3 = 1 / Math.sqrt(3);   // 0.57735
const THREE_SQRT_2 = 3 / Math.sqrt(2);   // 2.12132

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

describe("SegmentStraight", () => {
  it("should copy points by default", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b);

    expect(segment.a).toEqual(a);
    expect(segment.a === a).toBeFalsy();
    expect(segment.b).toEqual(b);
    expect(segment.b === b).toBeFalsy();
  });

  it("should reuse points when 3rd arg is true", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.a).toEqual(a);
    expect(segment.a === a).toBeTruthy();
    expect(segment.b).toEqual(b);
    expect(segment.b === b).toBeTruthy();
  });

  it("should not allow overwriting a", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    segment.a = new THREE.Vector3(1, 2, 3);

    expect(segment.a).toEqual(a);
  });

  it("should not allow overwriting b", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    segment.b = new THREE.Vector3(1, 2, 3);

    expect(segment.b).toEqual(b);
  });

  it("should calculate center", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.center.x).toEqual(5);
    expect(segment.center.y).toEqual(7);
    expect(segment.center.z).toEqual(-1);
  });

  it("should calculate length", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.length).toBeCloseTo(Math.sqrt(4*4+6*6));
  });

  it("should calculate angle for quadrant I", () => {
    const a = new THREE.Vector3(3,  4, -1);
    const b = new THREE.Vector3(7, 10, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant II", () => {
    const a = new THREE.Vector3(7,  4, -1);
    const b = new THREE.Vector3(3, 10, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(-6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant III", () => {
    const a = new THREE.Vector3(7, 10, -1);
    const b = new THREE.Vector3(3,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant IV", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(-6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate positive angle for straight up", () => {
    const a = new THREE.Vector3(2, 5, -1);
    const b = new THREE.Vector3(2, 9, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
  });

  it("should calculate positive angle for straight down", () => {
    const a = new THREE.Vector3(2, 9, -1);
    const b = new THREE.Vector3(2, 5, -1);

    const segment = new SegmentStraight(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
  });
});


const diagonal = new THREE.Vector3(1, 1, 1).normalize();

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

describe("calcPlaneNormalSegments", () => {
  it("should work for segments almost in the X-Y plane", () => {
    const segmentsStraight = [
        new SegmentStraight(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.01)),
        new SegmentStraight(new THREE.Vector3(2, -1, -0.01), new THREE.Vector3(-1, -0.5, 0.1))
    ]

    const normal = calcPlaneNormalSegments(segmentsStraight);

    expect(normal.x).toBeLessThan(0.01);
    expect(normal.y).toBeLessThan(0.01);
    expect(normal.z).toBeGreaterThan(0.99);
  });

  it("should work for segments almost in a vertical plane", () => {
    const segmentsStraight = [
      new SegmentStraight(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new SegmentStraight(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraight.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormalSegments(segmentsStraight);

    expect(normal.x).toBeCloseTo(Math.sin(Math.PI/6), 2);
    expect(normal.z).toBeCloseTo(Math.cos(Math.PI/6), 2);   // 0.86603
    expect(normal.y).toBeCloseTo(0, 2);
  });

  it("should work for segments almost in a tilted plane", () => {
    const segmentsStraight = [
      new SegmentStraight(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new SegmentStraight(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(1, 0, 0);
    segmentsStraight.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormalSegments(segmentsStraight);

    expect(normal.z).toBeCloseTo(Math.cos(Math.PI/6), 2);   // 0.86603
    expect(normal.y).toBeCloseTo(-Math.sin(Math.PI/6), 2);
    expect(normal.x).toBeCloseTo(0, 2);
  });

  it("should work for segments almost in a skew plane", () => {
    const segmentsStraight = [
      new SegmentStraight(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new SegmentStraight(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(0, 1, 1);
    segmentsStraight.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormalSegments(segmentsStraight);

    expect(normal.y).toBeGreaterThan(0.1);
    expect(normal.x).toBeGreaterThan(normal.y);
    expect(normal.z).toBeGreaterThan(normal.x);
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

    expect(brimstoneDownTemplate.color instanceof THREE.Color)
  });

  it("should have brimstone up at origin", () => {
    const points = brimstoneUpTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);

    expect(brimstoneUpTemplate.color instanceof THREE.Color)
  });

  it("should have pentagram at origin", () => {
    const points = pentagramTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);

    expect(pentagramTemplate.size).toBeCloseTo(5 * 2 * 1.0, 4);

    expect(pentagramTemplate.color instanceof THREE.Color)
  });

  it("should have dagaz at origin", () => {
    const points = dagazTemplate.segmentsStraight.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);

    expect(dagazTemplate.size).toBeCloseTo(4 * 2 * Math.sqrt((2/3)*(2/3) + 1*1), 4);

    expect(dagazTemplate.color instanceof THREE.Color)
  });

  it("should contain all templates", () => {
    expect(templates).toContain(brimstoneDownTemplate);
    expect(templates).toContain(brimstoneUpTemplate);
    expect(templates).toContain(pentagramTemplate);
    expect(templates).toContain(dagazTemplate);
  })
});

const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);

function fuzzSegmentStraight(segmentStraight, linearFuzz = 0, offset = 0) {
  const direction1 = (new THREE.Vector3( INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(xAxis, offset);
  const direction2 = (new THREE.Vector3(-INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(yAxis, offset);

  return new SegmentStraight(
      segmentStraight.a.clone().addScaledVector(direction1, linearFuzz),
      segmentStraight.b.clone().addScaledVector(direction2, linearFuzz),
      true
  )
}

describe("transformTemplateSegmentsToActual", () => {
  it("should not transform brimstone (point down) exact", () => {
    const [segmentsStraightXformed, segmentsCurvedXformed] = transformTemplateSegmentsToActual(brimstoneDownTemplate.segmentsStraight, [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(segmentsStraightXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.x, 6);
      expect(segmentsStraightXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.y, 6);
      expect(segmentsStraightXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.z, 6);
      expect(segmentsStraightXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.x, 6);
      expect(segmentsStraightXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.y, 6);
      expect(segmentsStraightXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.z, 6);
    }
  });

  it("should not much transform brimstone (point down) fuzzed", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i))
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightFuzzed, [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.x, 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.y, 1);
      expect(templateSegmentsStraightXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.z, 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.x, 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.y, 1);
      expect(templateSegmentsStraightXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.z, 1);
    }
  });

  it("should translate back brimstone (point down) fuzzed", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      const newSegment = fuzzSegmentStraight(segment, 0.004, i);
      newSegment.a.addScaledVector(diagonal, 2.0);
      newSegment.b.addScaledVector(diagonal, 2.0);
      segmentsStraightFuzzed.push(newSegment)
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightFuzzed, [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.x + 2*INV_SQRT_3, 2);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.y + 2*INV_SQRT_3, 2);
      expect(templateSegmentsStraightXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.z + 2*INV_SQRT_3, 2);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.x + 2*INV_SQRT_3, 2);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.y + 2*INV_SQRT_3, 2);
      expect(templateSegmentsStraightXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.z + 2*INV_SQRT_3, 2);
    }
  });

  it("should rotate to match brimstone (point down) small rotation around Y", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightRotated, [], brimstoneDownTemplate);

    for (let i=0; i<segmentsStraightRotated.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(segmentsStraightRotated[i].a.x, 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(segmentsStraightRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].a.z), 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(segmentsStraightRotated[i].b.x, 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(segmentsStraightRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].b.z), 1);
    }
  });

  it("should rotate to match brimstone (point down) small negative rotation around Y", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, -Math.PI/6);
      segment.b.applyAxisAngle(axis, -Math.PI/6);
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightRotated, [], brimstoneDownTemplate);

    for (let i=0; i<segmentsStraightRotated.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(segmentsStraightRotated[i].a.x, 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(segmentsStraightRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].a.z), 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(segmentsStraightRotated[i].b.x, 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(segmentsStraightRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].b.z), 1);
    }
  });

  it("should rotate to match brimstone (point down) large rotation around Y", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI*5/6);
      segment.b.applyAxisAngle(axis, Math.PI*5/6);
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightRotated, [], brimstoneDownTemplate);

    for (let i=0; i<segmentsStraightRotated.length; ++i) {
      expect(Math.abs(templateSegmentsStraightXformed[i].a.x)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].a.x), 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(segmentsStraightRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].a.z), 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(Math.abs(segmentsStraightRotated[i].b.x), 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(segmentsStraightRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsStraightXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsStraightRotated[i].b.z), 1);
    }
  });

  it("should rotate back brimstone (point down) rotated around X", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(1, 0, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightRotated, [], brimstoneDownTemplate);

    for (let i=0; i<segmentsStraightRotated.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(segmentsStraightRotated[i].a.x, 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(segmentsStraightRotated[i].a.y, 1);
      expect(templateSegmentsStraightXformed[i].a.z).toBeCloseTo(segmentsStraightRotated[i].a.z, 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(segmentsStraightRotated[i].b.x, 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(segmentsStraightRotated[i].b.y, 1);
      expect(templateSegmentsStraightXformed[i].b.z).toBeCloseTo(segmentsStraightRotated[i].b.z, 1);
    }
  });

  it("should rotate back brimstone (point down) rotated around X and Y", () => {
    const segmentsStraightRotated = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightRotated.push(fuzzSegmentStraight(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(1, 1, 0);
    segmentsStraightRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightRotated, [], brimstoneDownTemplate);

    for (let i=0; i<segmentsStraightRotated.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(segmentsStraightRotated[i].a.x, 1);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(segmentsStraightRotated[i].a.y, 1);
      expect(templateSegmentsStraightXformed[i].a.z).toBeCloseTo(segmentsStraightRotated[i].a.z, 1);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(segmentsStraightRotated[i].b.x, 1);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(segmentsStraightRotated[i].b.y, 1);
      expect(templateSegmentsStraightXformed[i].b.z).toBeCloseTo(segmentsStraightRotated[i].b.z, 1);
    }
  });

  it("should resize brimstone (point down) fuzzed", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      const newSegment = fuzzSegmentStraight(segment, 0.01, i);
      newSegment.a.multiplyScalar(0.3);
      newSegment.b.multiplyScalar(0.3);
      segmentsStraightFuzzed.push(newSegment)
    });

    const [templateSegmentsStraightXformed, templateSegmentsCurvedXformed] = transformTemplateSegmentsToActual(segmentsStraightFuzzed, [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      expect(templateSegmentsStraightXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.x * 0.3, 2);
      expect(templateSegmentsStraightXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.y * 0.3, 2);
      expect(templateSegmentsStraightXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].a.z * 0.3, 2);
      expect(templateSegmentsStraightXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.x * 0.3, 2);
      expect(templateSegmentsStraightXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.y * 0.3, 2);
      expect(templateSegmentsStraightXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segmentsStraight[i].b.z * 0.3, 2);
    }
  });
});


describe("rmsdSegments", () => {
  it("should calculate 0 for exact match", () => {
    const diff = rmsdSegments(brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toEqual(0);
  });

  it("should correspond to small differences in a.x y & z", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment) => {
      segmentsStraightFuzzed.push(new SegmentStraight(segment.a, segment.b));
    });
    segmentsStraightFuzzed[1].a.addScaledVector (diagonal, 0.01);

    const diff = rmsdSegments(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/2/5), 6);
  });

  it("should correspond to small differences in b.x y & z", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(new SegmentStraight(segment.a, segment.b));
    });
    segmentsStraightFuzzed[1].b.addScaledVector (diagonal, 0.01);

    const diff = rmsdSegments(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/2/5), 4);
  });

  it("should allow for a and b being reversed", () => {
    const segmentStraightReversed = brimstoneDownTemplate.segmentsStraight.map(segment => new SegmentStraight(segment.b, segment.a));

    const diff = rmsdSegments(segmentStraightReversed, [], brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toEqual(0);
  });

  it("should allow segments to be in different order", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.unshift(new SegmentStraight(segment.a, segment.b));
    });
    segmentsStraightFuzzed[1].b.addScaledVector (diagonal, 0.01);

    const diff = rmsdSegments(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/2/5), 4);
  });

  it("should correspond for small fuzz", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i));
    });

    const diff = rmsdSegments(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toBeCloseTo(0.01, 6);
  });

  it("should correspond for medium fuzz", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.1, i));
    });

    const diff = rmsdSegments(segmentsStraightFuzzed, brimstoneDownTemplate.segmentsCurved, brimstoneDownTemplate.segmentsStraight, brimstoneDownTemplate.segmentsCurved);

    expect(diff).toBeCloseTo(0.1, 6);
  });
});


describe("matchSegmentsAgainstTemplates", () => {
  it("should match brimstone (point down) exact", () => {
    const [score, rawScore, template] = matchSegmentsAgainstTemplates(brimstoneDownTemplate.segmentsStraight, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(1000);
  });

  it("should match brimstone (point down) small difference in center.x", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(new SegmentStraight(segment.a, segment.b));
    });
    segmentsStraightFuzzed[1].a.x += 0.01;

    const [score, rawScore, template] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
  });

  it("should match brimstone (point down) fuzzed linear", () => {
    const segmentsStraightFuzzed = [];
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i));
    });

    const [score, rawScore, template] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
  });

  it("should match brimstone (point down) fuzzed rotated scaled translated", () => {
    const segmentsStraightDrawn = [
      new SegmentStraight(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new SegmentStraight(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new SegmentStraight(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new SegmentStraight(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];
    const xyDiagonal = new THREE.Vector3(1, 2, 0).normalize();
    brimstoneDownTemplate.segmentsStraight.forEach( (segment, i) => {
      const newSegment = fuzzSegmentStraight(segment, 0.01, i);
      newSegment.a.multiplyScalar(0.3).applyAxisAngle(xyDiagonal, Math.PI/6).addScaledVector(diagonal, 2.0);
      newSegment.b.multiplyScalar(0.3).applyAxisAngle(xyDiagonal, Math.PI/6).addScaledVector(diagonal, 2.0);
      segmentsStraightDrawn.push(newSegment);
    });

    const [score, rawScore, template, centroidOfDrawn, bestSegmentsStraightXformed] = matchSegmentsAgainstTemplates(segmentsStraightDrawn, []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
    const expectedCenter = diagonal.clone().multiplyScalar(2);
    expect(centroidOfDrawn.x).toBeCloseTo(expectedCenter.x, 2);
    expect(centroidOfDrawn.y).toBeCloseTo(expectedCenter.y, 2);
    expect(centroidOfDrawn.z).toBeCloseTo(expectedCenter.z, 2);

    for (let i=0; i<brimstoneDownTemplate.segmentsStraight.length; ++i) {
      const expectedA = brimstoneDownTemplate.segmentsStraight[i].a.clone().applyAxisAngle(xyDiagonal, Math.PI/6).multiplyScalar(0.3).addScaledVector(diagonal, 2.0);
      expect(bestSegmentsStraightXformed[i].a.x).toBeCloseTo(expectedA.x, 2);
      expect(bestSegmentsStraightXformed[i].a.y).toBeCloseTo(expectedA.y, 2);
      expect(bestSegmentsStraightXformed[i].a.z).toBeCloseTo(expectedA.z, 2);
      const expectedB = brimstoneDownTemplate.segmentsStraight[i].b.clone().applyAxisAngle(xyDiagonal, Math.PI/6).multiplyScalar(0.3).addScaledVector(diagonal, 2.0);
      expect(bestSegmentsStraightXformed[i].b.x).toBeCloseTo(expectedB.x, 2);
      expect(bestSegmentsStraightXformed[i].b.y).toBeCloseTo(expectedB.y, 2);
      expect(bestSegmentsStraightXformed[i].b.z).toBeCloseTo(expectedB.z, 2);
    }
  });

  it("should not crash when too few segments to match template", () => {
    const segmentsStraight = [
      new SegmentStraight(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
    ];

    const [score, rawScore, template] = matchSegmentsAgainstTemplates(segmentsStraight, []);

    expect(template).toBeNull();
    expect(score).toEqual(Number.NEGATIVE_INFINITY);
  });

  it("should not match random segments", () => {
    const segmentsStraight = [
      new SegmentStraight(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new SegmentStraight(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new SegmentStraight(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new SegmentStraight(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];

    const [score, rawScore, template] = matchSegmentsAgainstTemplates(segmentsStraight, []);

    expect(score).toBeLessThan(template.minScore);
  });

  it("should should match brimstone (point up) fuzzed linear", () => {
    const segmentsStraightFuzzed = [];
    brimstoneUpTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i));
    });

    const [score, rawScore, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("brimstone up");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 1);
    expect(centroidPt.y).toBeCloseTo(0, 1);
    expect(centroidPt.z).toBeCloseTo(0, 1);
  });

  it("should match pentagram exact", () => {
    const [score, rawScore, template, centroidPt] = matchSegmentsAgainstTemplates(pentagramTemplate.segmentsStraight, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(1000);
    expect(centroidPt.x).toBeCloseTo(0, 6);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram; small difference in a.x", () => {
    const segmentsStraightFuzzed = [];
    pentagramTemplate.segmentsStraight.forEach( segment => {
      segmentsStraightFuzzed.push(new SegmentStraight(segment.a, segment.b));
    });
    segmentsStraightFuzzed[1].a.x += 0.01;

    const [score, rawScore, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(pentagramTemplate.minScore);
    expect(centroidPt.x).toBeCloseTo(0.001, 3);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram fuzzed linear", () => {
    const segmentsStraightFuzzed = [];
    pentagramTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i));
    });

    const [score, rawScore, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 2);
    expect(centroidPt.y).toBeCloseTo(0, 2);
    expect(centroidPt.z).toBeCloseTo(0, 2);
  });

  it("should match pentagram fuzzed linear after random junk", () => {
    const segmentsStraightFuzzed = [
      new SegmentStraight(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new SegmentStraight(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new SegmentStraight(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new SegmentStraight(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new SegmentStraight(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];
    pentagramTemplate.segmentsStraight.forEach( (segment, i) => {
      segmentsStraightFuzzed.push(fuzzSegmentStraight(segment, 0.01, i));
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsStraightFuzzed.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [score, rawScore, template, centroidPt] = matchSegmentsAgainstTemplates(segmentsStraightFuzzed, []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 2);
    expect(centroidPt.y).toBeCloseTo(0, 2);
    expect(centroidPt.z).toBeCloseTo(0, 2);
  });
});


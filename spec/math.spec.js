// unit tests for math utilities for Barrier Mage

require("./support/three.min");
const {arcFrom3Points, circleFrom3Points, Segment, Arc, Circle, calcCentroid, centerPoints, calcPlaneNormalPoints, calcPlaneNormal, angleDiff, brimstoneDownTemplate, brimstoneUpTemplate, pentagramTemplate, triquetraTemplate, borromeanRingsTemplate, quicksilverTemplate, dagazTemplate, templates, transformTemplateToDrawn, rmsd, matchDrawnAgainstTemplates} = require('../src/math');

const INV_SQRT_2 = 1 / Math.sqrt(2);   // 0.70711
const INV_SQRT_3 = 1 / Math.sqrt(3);   // 0.57735
const THREE_SQRT_2 = 3 / Math.sqrt(2);   // 2.12132
const HALF_SQRT3 = Math.sqrt(3)/2;


describe("arcFrom3Points", () => {
  it("should do first quadrant", () => {
    const p1 = new THREE.Vector3(1,0,0);
    const p2 = new THREE.Vector3(INV_SQRT_2, INV_SQRT_2, 0);
    const p3 = new THREE.Vector3(0, 1, 0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(0, 6);
    expect(center.y).toBeCloseTo(0, 6);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(1, 6);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI/2, 6);
    expect(startAngle).toBeCloseTo(0, 6);
    expect(endAngle).toBeCloseTo(Math.PI/2, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    // expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,4);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc).toBeInstanceOf(Arc);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 6);
  });

  it("should handle arcs centered on axis parallel to X axis", () => {
    const centerX = -0.6;
    const centerY = -9.1;
    const centerZ = -7.2;
    const r = 1.7;
    for (let alpha=0.1; alpha<=Math.PI; alpha+=0.1) {
      const p1 = new THREE.Vector3(centerX + r*Math.cos(alpha), centerY - r*Math.sin(alpha), centerZ);
      const p2 = new THREE.Vector3(centerX + r, centerY, centerZ);
      const p3 = new THREE.Vector3(centerX + r*Math.cos(alpha), centerY + r*Math.sin(alpha), centerZ);

      const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

      expect(center.x).toBeCloseTo(centerX, 6);
      expect(center.y).toBeCloseTo(centerY, 6);
      expect(center.z).toBeCloseTo(centerZ, 6);
      expect(center.distanceTo(arc.end1)).toBeCloseTo(r, 6);
      if (2*alpha < 3.2) {   // TODO: figure out why this breaks down
        expect(arc.end2.clone().sub(center).angleTo(arc.end1.clone().sub(center))).toBeCloseTo(2*alpha, 1);
      }
      expect(startAngle).toBeCloseTo(2*Math.PI - alpha);
      expect(endAngle).toBeCloseTo(alpha);
      expect(p1.distanceTo(points[0])).toBeCloseTo(0, 4);
      expect(p2.distanceTo(points[Math.round(points.length/2)])).toBeCloseTo(0,1);
      expect(p3.distanceTo(points[points.length - 1])).toBeCloseTo(0, 4);
      expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
      expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
      expect(arc.midpoint.z).toBeCloseTo(p2.z, 6);
    }
  });

  it("should do spread", () => {
    const p1 = new THREE.Vector3(2.3,3.4,0);
    const p2 = new THREE.Vector3(-1.2,-2.1,0);
    const p3 = new THREE.Vector3(3.2,-0.5,0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(0.2129, 4);
    expect(center.y).toBeCloseTo(0.8645, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(3.28401, 4);
    expect(startAngle).toBeGreaterThan(Math.PI/4);
    expect(startAngle).toBeLessThan(Math.PI/2);
    expect(endAngle).toBeGreaterThan(1.75*Math.PI);
    expect(endAngle).toBeLessThan(2*Math.PI);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    // p2 is not the middle of this arc
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 4);
  });

  it("should handle origin in fourth quadrant", () => {
    const p1 = new THREE.Vector3(-1.1, 2.2, 0);
    const p2 = new THREE.Vector3(-5.4, -4.4, 0);
    const p3 = new THREE.Vector3(3.2, -0.5,0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(-1.0673, 4);
    expect(center.y).toBeCloseTo(-2.522, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(4.72216, 4);
    expect(startAngle).toBeGreaterThan(Math.PI/2);
    expect(startAngle).toBeLessThan(0.75*Math.PI);
    expect(endAngle).toBeGreaterThan(0);
    expect(endAngle).toBeLessThan(Math.PI/4);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    // p2 is not the middle of this arc
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 4);
  });

  it("should handle arc crossing X-axis", () => {
    const p1 = new THREE.Vector3(0.80, -0.62, 0);
    const p2 = new THREE.Vector3(-0.97, 0.20, 0.01);
    const p3 = new THREE.Vector3(0.95, 0.32, 0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(0, 1);
    expect(center.y).toBeCloseTo(0, 1);
    expect(center.z).toBeCloseTo(0, 2);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(1, 3);
    const arcAngle = (endAngle - startAngle + 2*Math.PI) % 2*Math.PI;
    expect(arcAngle).toBeGreaterThan(1.25*Math.PI);
    expect(arcAngle).toBeLessThan(1.75*Math.PI);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 4);
  });

  it("should handle in Y-Z plane", () => {
    const p1 = new THREE.Vector3(9, 1, 0);
    const p2 = new THREE.Vector3(9, INV_SQRT_2, INV_SQRT_2);
    const p3 = new THREE.Vector3(9, 0, 1);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(9, 4);
    expect(center.y).toBeCloseTo(0, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(1, 4);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI/2, 6);
    expect(startAngle).toBeCloseTo(Math.PI/2, 6);
    expect(endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 6);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 3);
  });

  it("should handle in other vertical plane", () => {
    const p1 = new THREE.Vector3(-THREE_SQRT_2, 0, -THREE_SQRT_2);
    const p2 = new THREE.Vector3(0, 3, 0);
    const p3 = new THREE.Vector3(THREE_SQRT_2, 0, THREE_SQRT_2);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(0, 4);
    expect(center.y).toBeCloseTo(0, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(3, 4);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI, 6);
    expect(startAngle).toBeCloseTo(2*Math.PI, 6);   // p1 rotated 0.75 π onto +X axis
    expect(endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 6);
  });

  it("should handle in other vertical plane with offset", () => {
    const p1 = new THREE.Vector3(2-THREE_SQRT_2, 0, 4-THREE_SQRT_2);
    const p2 = new THREE.Vector3(2, 3, 4);
    const p3 = new THREE.Vector3(2+THREE_SQRT_2, 0, 4+THREE_SQRT_2);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(2, 4);
    expect(center.y).toBeCloseTo(0, 4);
    expect(center.z).toBeCloseTo(4, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(3, 4);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI, 6);
    expect(startAngle).toBeCloseTo(2*Math.PI, 6);   // p1 rotated 0.75 π onto +X axis
    expect(endAngle).toBeCloseTo(Math.PI, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 6);
  });

  it("should handle in diagonal plane", () => {
    const p1 = new THREE.Vector3(-THREE_SQRT_2, -THREE_SQRT_2, 0);
    const p2 = new THREE.Vector3(0, 0, 3);
    const p3 = new THREE.Vector3(THREE_SQRT_2, THREE_SQRT_2, 0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(0, 4);
    expect(center.y).toBeCloseTo(0, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(3, 4);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI, 6);
    expect(startAngle).toBeCloseTo(1.25*Math.PI, 6);
    expect(endAngle).toBeCloseTo(Math.PI/4, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 3);
  });

  it("should handle diagonal plane with offset", () => {
    const p1 = new THREE.Vector3(2-THREE_SQRT_2, 4-THREE_SQRT_2, 0);
    const p2 = new THREE.Vector3(2, 4, 3);
    const p3 = new THREE.Vector3(2+THREE_SQRT_2, 4+THREE_SQRT_2, 0);

    const {arc, points, center, startAngle, endAngle} = arcFrom3Points(p1, p2, p3);

    expect(center.x).toBeCloseTo(2, 4);
    expect(center.y).toBeCloseTo(4, 4);
    expect(center.z).toBeCloseTo(0, 6);
    expect(center.clone().sub(arc.end1).length()).toBeCloseTo(3, 4);
    expect(arc.end1.clone().sub(center).angleTo(arc.end2.clone().sub(center))).toBeCloseTo(Math.PI, 6);
    expect(startAngle).toBeCloseTo(1.25*Math.PI, 6);
    expect(endAngle).toBeCloseTo(Math.PI/4, 6);
    expect(p1.distanceTo(points[0])).toBeCloseTo(0,4);
    expect(p2.distanceTo(points[Math.floor(points.length/2)])).toBeCloseTo(0,1);
    expect(p3.distanceTo(points[points.length-1])).toBeCloseTo(0,4);
    expect(arc.midpoint.x).toBeCloseTo(p2.x, 3);
    expect(arc.midpoint.y).toBeCloseTo(p2.y, 3);
    expect(arc.midpoint.z).toBeCloseTo(p2.z, 3);
  });
});

describe("circleFrom3Points", () => {
  it("should return circle in Y-Z plane", () => {
    const p1 = new THREE.Vector3(1, -2, 6);
    const p2 = new THREE.Vector3(1, 13.3, 14.5);
    const p3 = new THREE.Vector3(1, 13.3, -2.5);

    const {circle, points} = circleFrom3Points(p1, p2, p3);

    expect(circle).toBeInstanceOf(Circle);
    expect(circle.center.x).toBeCloseTo(1, 4);
    expect(circle.center.y).toBeCloseTo(8, 1);
    expect(circle.center.z).toBeCloseTo(6, 6);
    expect(circle.radius).toBeCloseTo(10, 1);
    expect(circle.normal.x).toBeCloseTo(1, 6);
    expect(circle.normal.y).toBeCloseTo(0, 6);
    expect(circle.normal.z).toBeCloseTo(0, 6);
    expect(circle.p1).toEqual(p1);
    expect(circle.p2).toEqual(p2);
    expect(circle.p3).toEqual(p3);

    expect(points.length).toBeGreaterThan(3141);   // Math.round(10*2*Math.PI/0.02)
    expect(points.length).toBeLessThan(3147);   // Math.round(10*2*Math.PI/0.02)
  });

  it("should return circle in X-Y plane", () => {
    const p1 = new THREE.Vector3( 6, -2,  20);
    const p2 = new THREE.Vector3(14.5, 13.3, 20);
    const p3 = new THREE.Vector3( -2.5, 13.3, 20);

    const {circle, points} = circleFrom3Points(p1, p2, p3);

    expect(circle).toBeInstanceOf(Circle);
    expect(circle.center.x).toBeCloseTo(6, 4);
    expect(circle.center.y).toBeCloseTo(8, 1);
    expect(circle.center.z).toBeCloseTo(20, 6);
    expect(circle.radius).toBeCloseTo(10, 1);
    expect(circle.normal.x).toBeCloseTo(0, 6);
    expect(circle.normal.y).toBeCloseTo(0, 6);
    expect(circle.normal.z).toBeCloseTo(1, 6);
    expect(circle.p1).toEqual(p1);
    expect(circle.p2).toEqual(p2);
    expect(circle.p3).toEqual(p3);

    expect(points.length).toBeGreaterThan(3141);   // Math.round(10*2*Math.PI/0.02)
    expect(points.length).toBeLessThan(3147);   // Math.round(10*2*Math.PI/0.02)
  });

  it("should return circle for arbitrary guide points vertical", () => {
    let p1 = new THREE.Vector3();
    let p2 = new THREE.Vector3();
    let p3 = new THREE.Vector3();
    for (let i=0; i<3; ++i) {
      const center = new THREE.Vector3(Math.random()*10, Math.random()*10, Math.random()*10);
      const radius = Math.random()*3;
      p1.setFromSphericalCoords(radius, Math.random() * Math.PI, 0).add(center);
      p2.setFromSphericalCoords(radius, Math.random() * Math.PI, 0).add(center);
      p3.setFromSphericalCoords(radius, Math.random() * Math.PI, 0).add(center);

      const {circle, points} = circleFrom3Points(p1, p2, p3);

      expect(circle.center.x).toBeCloseTo(center.x, 6);
      expect(circle.center.y).toBeCloseTo(center.y, 6);
      expect(circle.center.z).toBeCloseTo(center.z, 6);
      expect(circle.radius).toBeCloseTo(radius, 6);
      expect(circle.normal.x).toBeCloseTo(1, 6);
      expect(circle.normal.y).toBeCloseTo(0, 6);
      expect(circle.normal.z).toBeCloseTo(0, 6);
      expect(circle.p1).toEqual(p1);
      expect(circle.p2).toEqual(p2);
      expect(circle.p3).toEqual(p3);

      expect(points.length).toBeCloseTo(Math.round(radius*2*Math.PI/0.02), -1);
    }
  });

  it("should return circle for arbitrary guide points horizontal", () => {
    let p1 = new THREE.Vector3();
    let p2 = new THREE.Vector3();
    let p3 = new THREE.Vector3();
    for (let i=0; i<3; ++i) {
      const center = new THREE.Vector3(Math.random()*10, Math.random()*10, Math.random()*10);
      const radius = Math.random()*3;
      p1.setFromSphericalCoords(radius, Math.PI/2, Math.random() * 2 * Math.PI).add(center);
      p2.setFromSphericalCoords(radius, Math.PI/2, Math.random() * 2 * Math.PI).add(center);
      p3.setFromSphericalCoords(radius, Math.PI/2, Math.random() * 2 * Math.PI).add(center);

      const {circle, points} = circleFrom3Points(p1, p2, p3);

      expect(circle.center.x).toBeCloseTo(center.x, 6);
      expect(circle.center.y).toBeCloseTo(center.y, 6);
      expect(circle.center.z).toBeCloseTo(center.z, 6);
      expect(circle.radius).toBeCloseTo(radius, 6)
      expect(circle.normal.x).toBeCloseTo(0, 6);
      expect(circle.normal.y).toBeCloseTo(1, 6);
      expect(circle.normal.z).toBeCloseTo(0, 6);
      expect(circle.p1).toEqual(p1);
      expect(circle.p2).toEqual(p2);
      expect(circle.p3).toEqual(p3);

      expect(points.length).toBeCloseTo(Math.round(radius*2*Math.PI/0.02), -1);
    }
  });

  it("should return a different object for center and normal each time", () => {
    const p1 = new THREE.Vector3(1, -2, 6);
    const p2 = new THREE.Vector3(1, 13.3, 14.5);
    const p3 = new THREE.Vector3(1, 13.3, -2.5);

    const {circle:circleA} = circleFrom3Points(p1, p2, p3);

    const p4 = new THREE.Vector3(2, 6, 8);
    const p5 = new THREE.Vector3(-1, 6, 7);
    const p6 = new THREE.Vector3(4, 6, 5);

    const {circle:circleB} = circleFrom3Points(p4, p5, p6);

    expect(circleA.center === circleB.center).toBeFalsy();
    expect(circleA.normal === circleB.normal).toBeFalsy();
  })
});

describe("Segment", () => {
  it("should copy points by default", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b);

    expect(segment.a).toEqual(a);
    expect(segment.a === a).toBeFalsy();
    expect(segment.b).toEqual(b);
    expect(segment.b === b).toBeFalsy();
  });

  it("should reuse points when 3rd arg is true", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    expect(segment.a).toEqual(a);
    expect(segment.a === a).toBeTruthy();
    expect(segment.b).toEqual(b);
    expect(segment.b === b).toBeTruthy();
  });

  it("should not allow overwriting a", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    segment.a = new THREE.Vector3(1, 2, 3);

    expect(segment.a).toEqual(a);
  });

  it("should not allow overwriting b", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    segment.b = new THREE.Vector3(1, 2, 3);

    expect(segment.b).toEqual(b);
  });

  it("should calculate center", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    expect(segment.center.x).toEqual(5);
    expect(segment.center.y).toEqual(7);
    expect(segment.center.z).toEqual(-1);
  });

  it("should calculate length", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    expect(segment.length).toBeCloseTo(Math.sqrt(4*4+6*6));
  });

  it("should calculate angle for quadrant I", () => {
    const a = new THREE.Vector3(3,  4, -1);
    const b = new THREE.Vector3(7, 10, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant II", () => {
    const a = new THREE.Vector3(7,  4, -1);
    const b = new THREE.Vector3(3, 10, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(-6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant III", () => {
    const a = new THREE.Vector3(7, 10, -1);
    const b = new THREE.Vector3(3,  4, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate angle for quadrant IV", () => {
    const a = new THREE.Vector3(3, 10, -1);
    const b = new THREE.Vector3(7,  4, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.asin(-6 / Math.sqrt(4*4 + 6*6)), 6);
  });

  it("should calculate positive angle for straight up", () => {
    const a = new THREE.Vector3(2, 5, -1);
    const b = new THREE.Vector3(2, 9, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
  });

  it("should calculate positive angle for straight down", () => {
    const a = new THREE.Vector3(2, 9, -1);
    const b = new THREE.Vector3(2, 5, -1);

    const segment = new Segment(a, b, true);

    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
  });
});

describe("Arc", () => {
  it("should copy points by default", () => {
    const end1 = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const midpoint = new THREE.Vector3(0, 0, 0);
    const end2 = new THREE.Vector3(HALF_SQRT3, -0.5, 0);

    const arc = new Arc(end1, midpoint, end2);

    expect(arc.end1).toEqual(end1);
    expect(arc.end1 === end1).toBeFalsy();
    expect(arc.midpoint).toEqual(midpoint);
    expect(arc.midpoint === midpoint).toBeFalsy();
    expect(arc.end2).toEqual(end2);
    expect(arc.end2 === end2).toBeFalsy();
  });

  it("should reuse points when 4th arg is true", () => {
    const end1 = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const midpoint = new THREE.Vector3(0, 0, 0);
    const end2 = new THREE.Vector3(HALF_SQRT3, -0.5, 0);

    const arc = new Arc(end1, midpoint, end2, true);

    expect(arc.end1).toEqual(end1);
    expect(arc.end1 === end1).toBeTruthy();
    expect(arc.midpoint).toEqual(midpoint);
    expect(arc.midpoint === midpoint).toBeTruthy();
    expect(arc.end2).toEqual(end2);
    expect(arc.end2 === end2).toBeTruthy();
  });

  it("should throw if end2 missing", () => {
    const end1 = new THREE.Vector3(2, 1.5, 7);
    const midpoint = new THREE.Vector3(0, 0, 0);

    try {
      new Arc(end1, midpoint);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/end2/);
    }
  });


  it("should not allow overwriting end1", () => {
    const end1 = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const midpoint = new THREE.Vector3(0, 0, 0);
    const end2 = new THREE.Vector3(HALF_SQRT3, -0.5, 0);

    const arc = new Arc(end1, midpoint, end2);

    arc.end1 = new THREE.Vector3(1, 2, 3);

    expect(arc.end1).toEqual(end1);
  });

  it("should not allow overwriting midpoint", () => {
    const end1 = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const midpoint = new THREE.Vector3(0, 0, 0);
    const end2 = new THREE.Vector3(HALF_SQRT3, -0.5, 0);

    const arc = new Arc(end1, midpoint, end2);

    arc.midpoint = new THREE.Vector3(1, 2, 3);

    expect(arc.midpoint).toEqual(midpoint);
  });

  it("should not allow overwriting end2", () => {
    const end1 = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const midpoint = new THREE.Vector3(0, 0, 0);
    const end2 = new THREE.Vector3(HALF_SQRT3, -0.5, 0);

    const arc = new Arc(end1, midpoint, end2);

    arc.end2 = new THREE.Vector3(1, 2, 3);

    expect(arc.end2).toEqual(end2);
  });
});

describe("Circle", () => {
  it("should copy points by default", () => {
    const center = new THREE.Vector3(0, -1, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(2, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    const circle = new Circle(p1, p2, p3, center, radius, normal);

    expect(circle.p1).toEqual(p1);
    expect(circle.p1 === p1).toBeFalsy();
    expect(circle.p2).toEqual(p2);
    expect(circle.p2 === p2).toBeFalsy();
    expect(circle.p3).toEqual(p3);
    expect(circle.p3 === p3).toBeFalsy();
    expect(circle.center).toEqual(center);
    expect(circle.center === center).toBeFalsy();
    expect(circle.radius).toEqual(radius);
    expect(circle.normal).toEqual(normal);
    expect(circle.normal === normal).toBeFalsy();
  });

  it("should reuse points when 7th arg is true", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 2, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    const circle = new Circle(p1, p2, p3, center, radius, normal, true);

    expect(circle.p1).toEqual(p1);
    expect(circle.p1 === p1).toBeTruthy();
    expect(circle.p2).toEqual(p2);
    expect(circle.p2 === p2).toBeTruthy();
    expect(circle.p3).toEqual(p3);
    expect(circle.p3 === p3).toBeTruthy();
    expect(circle.center).toEqual(center);
    expect(circle.center === center).toBeTruthy();
    expect(circle.radius).toEqual(radius);
    expect(circle.radius === radius).toBeTruthy();
    expect(circle.normal).toEqual(normal);
    expect(circle.normal === normal).toBeTruthy();
  });

  it("should throw if second point not Vector3", () => {
    const center = new THREE.Vector3(9, 4, 2);
    const radius = 22;
    const normal = new THREE.Vector3(2, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    try {
      new Circle(p1, 2.3, p3, center, radius, normal);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/\b2\b/);
    }
  });

  it("should throw if center not Vector3", () => {
    const center = new THREE.Vector3(9, 4, 2);
    const radius = 22;
    const normal = new THREE.Vector3(2, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    try {
      new Circle(p1, p2, p3, 17, radius, normal);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/center/);
    }
  });

  it("should throw if radius not finite", () => {
    const center = new THREE.Vector3(2, 1.5, 7);
    const radius = Number.POSITIVE_INFINITY;
    const normal = new THREE.Vector3(2, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    try {
      new Circle(p1, p2, p3, center, radius, normal);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/radius/);
    }
  });

  it("should throw if radius negative", () => {
    const center = new THREE.Vector3(2, 1.5, 7);
    const radius = -7;
    const normal = new THREE.Vector3(2, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    try {
      new Circle(p1, p2, p3, center, radius, normal);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/radius/);
    }
  });

  it("should throw if normal not Vector3", () => {
    const center = new THREE.Vector3(1, -1, 1);
    const radius = 22;
    const normal = true;
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);

    try {
      new Circle(p1, p2, p3, center, radius, normal);
      fail("should have thrown");
    } catch (err) {
      expect(err.message).toMatch(/normal/);
    }
  });

  it("should not allow overwriting third guide point", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    circle.p3 = new THREE.Vector3(1, 2, 3);

    expect(circle.p3).toEqual(p3);
  });

  it("should not allow overwriting center", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    circle.center = new THREE.Vector3(1, 2, 3);

    expect(circle.center).toEqual(center);
  });

  it("should not allow overwriting radius", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(-1, 1, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    circle.radius = 42;

    expect(circle.radius).toEqual(radius);
  });

  it("should not allow overwriting normal", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    circle.normal = new THREE.Vector3(1, 2, 3);

    expect(circle.normal).toEqual(normal);
  });

  it("should throw if third guidePoint not Vector3", () => {
    const center = new THREE.Vector3(0, 0, 0);
    const radius = 1.1;
    const normal = new THREE.Vector3(1, 0, 1).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);

    try {
      const circle = new Circle(p1, p2, 42, center, radius, normal);
      fail("should have thrown")
    } catch (ex) {
      expect(ex.message).toMatch(/\D3\D|\bthree\b/);
    }
  });

  it("should scale", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    const scale = 2.5;
    circle.scaleAndTranslate(scale);

    expect(circle.p1.x).toEqual(p1.x * scale);
    expect(circle.p1.y).toEqual(p1.y * scale);
    expect(circle.p1.z).toEqual(p1.z * scale);
    expect(circle.p2.x).toEqual(p2.x * scale);
    expect(circle.p2.y).toEqual(p2.y * scale);
    expect(circle.p2.z).toEqual(p2.z * scale);
    expect(circle.p3.x).toEqual(p3.x * scale);
    expect(circle.p3.y).toEqual(p3.y * scale);
    expect(circle.p3.z).toEqual(p3.z * scale);
    expect(circle.center.x).toEqual(center.x * scale);
    expect(circle.center.y).toEqual(center.y * scale);
    expect(circle.center.z).toEqual(center.z * scale);
    expect(circle.radius).toEqual(radius * scale);
    expect(circle.normal).toEqual(normal);
  });

  it("should translate", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    const offset = new THREE.Vector3(10, -20, 30);
    circle.scaleAndTranslate(null, offset);

    expect(circle.p1.x).toEqual(p1.x + offset.x);
    expect(circle.p1.y).toEqual(p1.y + offset.y);
    expect(circle.p1.z).toEqual(p1.z + offset.z);
    expect(circle.p2.x).toEqual(p2.x + offset.x);
    expect(circle.p2.y).toEqual(p2.y + offset.y);
    expect(circle.p2.z).toEqual(p2.z + offset.z);
    expect(circle.p3.x).toEqual(p3.x + offset.x);
    expect(circle.p3.y).toEqual(p3.y + offset.y);
    expect(circle.p3.z).toEqual(p3.z + offset.z);
    expect(circle.center.x).toEqual(center.x + offset.x);
    expect(circle.center.y).toEqual(center.y + offset.y);
    expect(circle.center.z).toEqual(center.z + offset.z);
    expect(circle.radius).toEqual(radius);
    expect(circle.normal).toEqual(normal);
  });

  it("should scale and translate", () => {
    const center = new THREE.Vector3(-HALF_SQRT3, -0.5, 0);
    const radius = 1.9;
    const normal = new THREE.Vector3(1, 1, 2).normalize();
    const p1 = new THREE.Vector3(radius, 0, 0).add(center);
    const p2 = new THREE.Vector3(0, radius, 0).add(center);
    const p3 = new THREE.Vector3(-radius, 0, 0).add(center);
    const circle = new Circle(p1, p2, p3, center, radius, normal);

    const scale = 2.5;
    const offset = new THREE.Vector3(10, -20, 30);
    circle.scaleAndTranslate(scale, offset);

    expect(circle.p1.x).toEqual(p1.x * scale + offset.x);
    expect(circle.p1.y).toEqual(p1.y * scale + offset.y);
    expect(circle.p1.z).toEqual(p1.z * scale + offset.z);
    expect(circle.p2.x).toEqual(p2.x * scale + offset.x);
    expect(circle.p2.y).toEqual(p2.y * scale + offset.y);
    expect(circle.p2.z).toEqual(p2.z * scale + offset.z);
    expect(circle.p3.x).toEqual(p3.x * scale + offset.x);
    expect(circle.p3.y).toEqual(p3.y * scale + offset.y);
    expect(circle.p3.z).toEqual(p3.z * scale + offset.z);
    expect(circle.center.x).toEqual(center.x * scale + offset.x);
    expect(circle.center.y).toEqual(center.y * scale + offset.y);
    expect(circle.center.z).toEqual(center.z * scale + offset.z);
    expect(circle.radius).toEqual(radius * scale);
    expect(circle.normal).toEqual(normal);
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

describe("calcPlaneNormalPoints", () => {
  it("should throw if less than three points passed", () => {
    const points = [new THREE.Vector3(1, 0, 1), new THREE.Vector3(2, 0, 2)];
    const normal = new THREE.Vector3();

    try {
      calcPlaneNormalPoints(points, normal);
    } catch (err) {
      expect(err.message).toMatch(/three/i);
    }
  });

  it("should handle points almost in the X-Z plane", () => {
    const points = [new THREE.Vector3(1, 0, 1), new THREE.Vector3(2, 0, 2), new THREE.Vector3(3, 0.1, 1), new THREE.Vector3(5, 0, 2), new THREE.Vector3(1, 0, 4)];
    const normal = new THREE.Vector3();

    calcPlaneNormalPoints(points, normal);

    expect(normal.x).toBeCloseTo(0, 1);
    expect(Math.abs(normal.y)).toBeCloseTo(1, 2);
    expect(normal.z).toBeCloseTo(0, 1);
  });

  it("should handle points almost in a vertical plane", () => {
    const points = [new THREE.Vector3(THREE_SQRT_2, 0, THREE_SQRT_2), new THREE.Vector3(-THREE_SQRT_2, 0, -THREE_SQRT_2), new THREE.Vector3(0.01, 2, 0), new THREE.Vector3(0, -4, 0)];
    const normal = new THREE.Vector3();

    calcPlaneNormalPoints(points, normal);

    expect(normal.x).toBeCloseTo(-INV_SQRT_2, 2);
    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(INV_SQRT_2, 2);
  });

  it("should handle beginning points in one plane and end points in a different one", () => {
    const points = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.0001, 0, 1), new THREE.Vector3(0.0001, 1, 1)];
    const normal = new THREE.Vector3();

    calcPlaneNormalPoints(points, normal);

    expect(normal.lengthSq()).toBeGreaterThan(0);   // direction is ambiguous
  });

  it("should work around repeated points", () => {
    const points = [new THREE.Vector3(0, 1, 2), new THREE.Vector3(0, 2, 1), new THREE.Vector3(0, 1, 2), new THREE.Vector3(0, 2, 3), new THREE.Vector3(0, 2, 3)];
    const normal = new THREE.Vector3();

    calcPlaneNormalPoints(points, normal);

    expect(Math.abs(normal.x)).toBeCloseTo(1, 2);
    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(0, 2);
  });

  it("should work around many repeated points", () => {
    const points = [new THREE.Vector3(2, 0, 3), new THREE.Vector3(2, 0, 3), new THREE.Vector3(2, 0, 3), new THREE.Vector3(3, 0, 4), new THREE.Vector3(3, 0, 4), new THREE.Vector3(3, 0, 4), new THREE.Vector3(-4, 0.001, 5)];
    const normal = new THREE.Vector3();

    calcPlaneNormalPoints(points, normal);

    expect(normal.x).toBeCloseTo(0, 2);
    expect(Math.abs(normal.y)).toBeCloseTo(1, 2);
    expect(normal.z).toBeCloseTo(0, 2);
  });
});

describe("calcPlaneNormal", () => {
  it("should work for segments almost in the X-Y plane", () => {
    const segments = [
        new Segment(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.01)),
        new Segment(new THREE.Vector3(2, -1, -0.01), new THREE.Vector3(-1, -0.5, 0.1))
    ]

    const normal = calcPlaneNormal(segments, [], []);

    expect(normal.x).toBeLessThan(0.01);
    expect(normal.y).toBeLessThan(0.01);
    expect(normal.z).toBeGreaterThan(0.99);
  });

  it("should work for segments almost in a vertical plane", () => {
    const segments = [
      new Segment(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new Segment(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(0, 1, 0);
    segments.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormal(segments, [], []);

    expect(normal.x).toBeCloseTo(Math.sin(Math.PI/6), 2);
    expect(normal.z).toBeCloseTo(Math.cos(Math.PI/6), 2);   // 0.86603
    expect(normal.y).toBeCloseTo(0, 2);
  });

  it("should work for segments almost in a tilted plane", () => {
    const segments = [
      new Segment(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new Segment(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(1, 0, 0);
    segments.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormal(segments, [], []);

    expect(normal.z).toBeCloseTo(Math.cos(Math.PI/6), 2);   // 0.86603
    expect(normal.y).toBeCloseTo(-Math.sin(Math.PI/6), 2);
    expect(normal.x).toBeCloseTo(0, 2);
  });

  it("should work for segments almost in a skew plane", () => {
    const segments = [
      new Segment(new THREE.Vector3(1, 1, 0), new THREE.Vector3(-1, -1, 0.007)),
      new Segment(new THREE.Vector3(2, -1, -0.007), new THREE.Vector3(-1, -0.5, 0.007))
    ]
    const axis = new THREE.Vector3(0, 1, 1);
    segments.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const normal = calcPlaneNormal(segments, [], []);

    expect(normal.y).toBeGreaterThan(0.1);
    expect(normal.x).toBeGreaterThan(normal.y);
    expect(normal.z).toBeGreaterThan(normal.x);
  });

  it("should work for arcs alone in the Y-Z plane", () => {
    const arcs = [
      new Arc(new THREE.Vector3(2, 2, 2), new THREE.Vector3(2, -12, 1), new THREE.Vector3(2, 0, -5)),
    ];

    const normal = calcPlaneNormal([], arcs, []);

    expect(normal.y).toBeCloseTo(0, 6);
    expect(normal.z).toBeCloseTo(0, 6);
    expect(Math.abs(normal.x)).toBeCloseTo(1, 6);

  });

  it("should work for one circle alone in the Y-Z plane", () => {
    const {circle} = circleFrom3Points(new THREE.Vector3(10.1, 15.1, 20.1), new THREE.Vector3(10.1, -2, 6), new THREE.Vector3(10.1, 9.9, -3.2));
    const circles = [circle];

    const normal = calcPlaneNormal([], [], circles);

    expect(normal.y).toBeCloseTo(0, 6);
    expect(normal.z).toBeCloseTo(0, 6);
    expect(Math.abs(normal.x)).toBeCloseTo(1, 6);
  });

  it("should work for two circles alone in the Y-Z plane", () => {
    const {circle:circleA} = circleFrom3Points(new THREE.Vector3(10.05, 15.1, 20.1), new THREE.Vector3(10.05, -2, 6), new THREE.Vector3(10.05, 9.9, -3.2));
    const {circle:circleB} = circleFrom3Points(new THREE.Vector3(10.0, -12, -12), new THREE.Vector3(10.0, -14, -12), new THREE.Vector3(10.0, -12, -14));
    const circles = [circleA, circleB];

    const normal = calcPlaneNormal([], [], circles);

    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(0, 2);
    expect(Math.abs(normal.x)).toBeCloseTo(1, 5);
  });

  it("should work for segments and arcs in the Y-Z plane", () => {
    const segments = [
      new Segment(new THREE.Vector3(2.01, -3, 5), new THREE.Vector3(2, 7, -2))
    ];
    const arcs = [
      new Arc(new THREE.Vector3(1.99, 2, 2), new THREE.Vector3(2, -12, 1), new THREE.Vector3(2, 0, -5)),
    ];

    const normal = calcPlaneNormal(segments, arcs, []);

    expect(Math.abs(normal.x)).toBeCloseTo(1, 5);
    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.z).toBeCloseTo(0, 2);

  });

  it("should work for segments and circles in a vertical plane", () => {
    const segments = [
        new Segment(new THREE.Vector3(-3.03, 1, -3), new THREE.Vector3(-2, 5, -2), true)
    ];
    const {circle} = circleFrom3Points(new THREE.Vector3(4, 0, 4), new THREE.Vector3(4, 3, 4), new THREE.Vector3(6, 1, 6));
    const circles = [circle];

    const normal = calcPlaneNormal(segments, [], circles);

    expect(normal.y).toBeCloseTo(0, 2);
    expect(normal.x).toBeCloseTo(-normal.z, 2);
  });
});


describe("templates", () => {
  it("should have brimstone down at origin", () => {
    const points = brimstoneDownTemplate.segments.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toEqual(0);
    expect(centroidPt.z).toEqual(0);
  });

  it("should have brimstone up at origin", () => {
    const points = brimstoneUpTemplate.segments.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);
  });

  it("should have pentagram at origin", () => {
    const points = pentagramTemplate.segments.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);

    expect(pentagramTemplate.size).toBeCloseTo(5 * 2 * 1.0, 4);
  });

  it("should have triquetra at origin", () => {
    const points = [];
    triquetraTemplate.arcs.forEach(arc => {
      points.push(arc.end1);
      points.push(arc.midpoint);
      points.push(arc.end2);
    });

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toBeCloseTo(0, 4);
    expect(centroidPt.y).toBeCloseTo(0, 4);
    expect(centroidPt.z).toBeCloseTo(0, 4);

    const triquetraSize = 3 * 0 + 6 * 1;
    expect(triquetraTemplate.size).toBeCloseTo(triquetraSize, 4);
  });

  it("should have borromean rings at origin", () => {
    expect(borromeanRingsTemplate.circles[0].center.x).toBeCloseTo(0, 6);
    expect(borromeanRingsTemplate.circles[0].center.y).toBeCloseTo(-Math.sqrt(3)/3, 6);
    expect(borromeanRingsTemplate.circles[0].center.z).toBeCloseTo( 0, 6);
    expect(borromeanRingsTemplate.circles[0].radius).toBeCloseTo( 1, 6);

    expect(borromeanRingsTemplate.circles[1].center.x).toBeCloseTo(-0.5, 6);
    expect(borromeanRingsTemplate.circles[1].center.y).toBeCloseTo(Math.sqrt(3)/6, 6);
    expect(borromeanRingsTemplate.circles[1].center.z).toBeCloseTo( 0, 6);
    expect(borromeanRingsTemplate.circles[1].radius).toBeCloseTo( 1, 6);

    expect(borromeanRingsTemplate.circles[2].center.x).toBeCloseTo(0.5, 6);
    expect(borromeanRingsTemplate.circles[2].center.y).toBeCloseTo(Math.sqrt(3)/6, 6);
    expect(borromeanRingsTemplate.circles[2].center.z).toBeCloseTo( 0, 6);
    expect(borromeanRingsTemplate.circles[2].radius).toBeCloseTo( 1);

    const centroidPt = new THREE.Vector3();
    borromeanRingsTemplate.circles.forEach(circle => {
      centroidPt.add(circle.center);
    });
    centroidPt.divideScalar(borromeanRingsTemplate.circles.length);

    expect(centroidPt.x).toBeCloseTo(0, 4);
    expect(centroidPt.y).toBeCloseTo(0, 4);
    expect(centroidPt.z).toBeCloseTo(0, 4);

    expect(borromeanRingsTemplate.size).toBeCloseTo(1.73205, 5);
  });

  it("should have quicksilver at origin", () => {
    expect(quicksilverTemplate.circles[0].center.x).toBeCloseTo(0, 6);
    expect(quicksilverTemplate.circles[0].center.z).toBeCloseTo( 0, 6);
    expect(quicksilverTemplate.circles[0].radius).toBeCloseTo( 0.5, 6);

    const centroidPt = new THREE.Vector3();
    quicksilverTemplate.segments.forEach(segment => {
      centroidPt.add(segment.a);
      centroidPt.add(segment.b);
    });
    quicksilverTemplate.arcs.forEach(arc => {
      centroidPt.add(arc.end1);
      centroidPt.add(arc.midpoint);
      centroidPt.add(arc.end2);
    });
    quicksilverTemplate.circles.forEach(circle => {
      centroidPt.add(circle.center);
    })
    centroidPt.divideScalar(quicksilverTemplate.segments.length*2 + quicksilverTemplate.arcs.length*3 + quicksilverTemplate.circles.length*1);

    expect(centroidPt.x).toBeCloseTo(0, 4);
    expect(centroidPt.y).toBeCloseTo(0, 4);
    expect(centroidPt.z).toBeCloseTo(0, 4);

    expect(quicksilverTemplate.size).toBeGreaterThan(5);
    expect(quicksilverTemplate.size).toBeLessThan(12);
  });

  it("should have dagaz at origin", () => {
    const points = dagazTemplate.segments.map(segment => segment.center);

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(0);
    expect(centroidPt.y).toBeCloseTo(0,6);
    expect(centroidPt.z).toEqual(0);

    expect(dagazTemplate.size).toBeCloseTo(4 * 2 * Math.sqrt((2/3)*(2/3) + 1*1), 4);
  });

  it("should contain all templates", () => {
    expect(templates).toContain(brimstoneDownTemplate);
    expect(templates).toContain(brimstoneUpTemplate);
    expect(templates).toContain(pentagramTemplate);
    expect(templates).toContain(triquetraTemplate);
    expect(templates).toContain(borromeanRingsTemplate);
    expect(templates).toContain(quicksilverTemplate);
    expect(templates).toContain(dagazTemplate);
  })

  it("should assign a color and audioTag to every template", () => {
    templates.forEach(template => {
      expect(template.color instanceof THREE.Color).toBeTruthy();
      expect(template.audioTag).toMatch(/^#/);
      expect(template.minScore).toBeGreaterThanOrEqual(4.0)
    });
  });
});

const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);
const zAxis = new THREE.Vector3(0, 0, 1);

function fuzzSegment(segment, linearFuzz = 0, offset = 0) {
  const direction1 = (new THREE.Vector3( INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(xAxis, offset);
  const direction2 = (new THREE.Vector3(-INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(yAxis, offset);

  return new Segment(
      segment.a.clone().addScaledVector(direction1, linearFuzz),
      segment.b.clone().addScaledVector(direction2, linearFuzz),
      true
  )
}

function fuzzArc(arc, fuzz = 0, offset = 0) {
  const direction1 = (new THREE.Vector3( INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(xAxis, offset);
  const direction2 = (new THREE.Vector3(-INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(yAxis, offset);
  const direction3 = (new THREE.Vector3(INV_SQRT_3, -INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(zAxis, offset);

  return new Arc(
      arc.end1.clone().addScaledVector(direction1, fuzz),
      arc.midpoint.clone().addScaledVector(direction2, fuzz),
      arc.end2.clone().addScaledVector(direction3, fuzz),
      true
  );
}

function fuzzCircle(circle, fuzz = 0, offset = 0) {
  const direction1 = (new THREE.Vector3( INV_SQRT_3, INV_SQRT_3, -INV_SQRT_3)).applyAxisAngle(xAxis, offset);
  const direction2 = (new THREE.Vector3( INV_SQRT_3, -INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(yAxis, offset);
  const direction3 = (new THREE.Vector3( -INV_SQRT_3, INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(zAxis, offset);

  const p1 = circle.p1.clone().addScaledVector(direction1, fuzz);
  const p2 = circle.p2.clone().addScaledVector(direction2, fuzz);
  const p3 = circle.p3.clone().addScaledVector(direction3, fuzz);

  return circleFrom3Points(p1, p2, p3).circle;
}


describe("transformTemplateToDrawn", () => {
  it("should not transform brimstone (point down) exact", () => {
    const [segmentsXformed, arcsXformed] = transformTemplateToDrawn(brimstoneDownTemplate.segments, [], [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segments.length; ++i) {
      expect(segmentsXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segments[i].a.x, 6);
      expect(segmentsXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segments[i].a.y, 6);
      expect(segmentsXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segments[i].a.z, 6);
      expect(segmentsXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segments[i].b.x, 6);
      expect(segmentsXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segments[i].b.y, 6);
      expect(segmentsXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segments[i].b.z, 6);
    }
  });

  it("should not much transform brimstone (point down) fuzzed", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i))
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsFuzzed, [], [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segments.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segments[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segments[i].a.y, 1);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segments[i].a.z, 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segments[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segments[i].b.y, 1);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segments[i].b.z, 1);
    }
  });

  it("should translate back brimstone (point down) fuzzed", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      const newSegment = fuzzSegment(segment, 0.004, i);
      newSegment.a.addScaledVector(diagonal, 2.0);
      newSegment.b.addScaledVector(diagonal, 2.0);
      segmentsFuzzed.push(newSegment)
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsFuzzed, [], [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segments.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segments[i].a.x + 2*INV_SQRT_3, 2);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segments[i].a.y + 2*INV_SQRT_3, 2);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segments[i].a.z + 2*INV_SQRT_3, 2);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segments[i].b.x + 2*INV_SQRT_3, 2);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segments[i].b.y + 2*INV_SQRT_3, 2);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segments[i].b.z + 2*INV_SQRT_3, 2);
    }
  });

  it("should rotate to match brimstone (point down) small rotation around Y", () => {
    const segmentsRotated = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsRotated.push(fuzzSegment(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, [], [], brimstoneDownTemplate);

    for (let i=0; i<segmentsRotated.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(segmentsRotated[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsRotated[i].a.z), 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(segmentsRotated[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsRotated[i].b.z), 1);
    }
  });

  it("should rotate to match brimstone (point down) small negative rotation around Y", () => {
    const segmentsRotated = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsRotated.push(fuzzSegment(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, -Math.PI/6);
      segment.b.applyAxisAngle(axis, -Math.PI/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, [], [], brimstoneDownTemplate);

    for (let i=0; i<segmentsRotated.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(segmentsRotated[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsRotated[i].a.z), 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(segmentsRotated[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsRotated[i].b.z), 1);
    }
  });

  it("should rotate to match brimstone (point down) large rotation around Y", () => {
    const segmentsRotated = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsRotated.push(fuzzSegment(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI*5/6);
      segment.b.applyAxisAngle(axis, Math.PI*5/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, [], [], brimstoneDownTemplate);

    for (let i=0; i<segmentsRotated.length; ++i) {
      expect(Math.abs(templateSegmentsXformed[i].a.x)).toBeCloseTo(Math.abs(segmentsRotated[i].a.x), 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsRotated[i].a.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].a.z)).toBeCloseTo(Math.abs(segmentsRotated[i].a.z), 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(Math.abs(segmentsRotated[i].b.x), 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsRotated[i].b.y, 1);
      expect(Math.abs(templateSegmentsXformed[i].b.z)).toBeCloseTo(Math.abs(segmentsRotated[i].b.z), 1);
    }
  });

  it("should rotate back brimstone (point down) rotated around X", () => {
    const segmentsRotated = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsRotated.push(fuzzSegment(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(1, 0, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, [], [], brimstoneDownTemplate);

    for (let i=0; i<segmentsRotated.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(segmentsRotated[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsRotated[i].a.y, 1);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(segmentsRotated[i].a.z, 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(segmentsRotated[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsRotated[i].b.y, 1);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(segmentsRotated[i].b.z, 1);
    }
  });

  it("should rotate back brimstone (point down) rotated around X and Y", () => {
    const segmentsRotated = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsRotated.push(fuzzSegment(segment, 0.01, i))
    });
    const axis = new THREE.Vector3(1, 1, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, [], [], brimstoneDownTemplate);

    for (let i=0; i<segmentsRotated.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(segmentsRotated[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsRotated[i].a.y, 1);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(segmentsRotated[i].a.z, 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(segmentsRotated[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsRotated[i].b.y, 1);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(segmentsRotated[i].b.z, 1);
    }
  });

  it("should resize brimstone (point down) fuzzed", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      const newSegment = fuzzSegment(segment, 0.01, i);
      newSegment.a.multiplyScalar(0.3);
      newSegment.b.multiplyScalar(0.3);
      segmentsFuzzed.push(newSegment)
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsFuzzed, [], [], brimstoneDownTemplate);

    for (let i=0; i<brimstoneDownTemplate.segments.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(brimstoneDownTemplate.segments[i].a.x * 0.3, 2);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(brimstoneDownTemplate.segments[i].a.y * 0.3, 2);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(brimstoneDownTemplate.segments[i].a.z * 0.3, 2);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(brimstoneDownTemplate.segments[i].b.x * 0.3, 2);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(brimstoneDownTemplate.segments[i].b.y * 0.3, 2);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(brimstoneDownTemplate.segments[i].b.z * 0.3, 2);
    }
  });

  it("should rotate back triquetra rotated around X and Y", () => {
    const segmentsRotated = triquetraTemplate.segments.map(
        (segment, i) => fuzzSegment(segment, 0.01, i)
    );
    const arcsRotated = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.01, i)
    );
    const axis = new THREE.Vector3(1, 1, 0);
    segmentsRotated.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });
    arcsRotated.forEach(arc => {
      arc.end1.applyAxisAngle(axis, Math.PI/6);
      arc.midpoint.applyAxisAngle(axis, Math.PI/6);
      arc.end2.applyAxisAngle(axis, Math.PI/6);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn(segmentsRotated, arcsRotated, [], triquetraTemplate);

    for (let i=0; i<arcsRotated.length; ++i) {
      expect(templateArcsXformed[i].midpoint.x).toBeCloseTo(arcsRotated[i].midpoint.x, 1);
      expect(templateArcsXformed[i].midpoint.y).toBeCloseTo(arcsRotated[i].midpoint.y, 1);
      expect(templateArcsXformed[i].midpoint.z).toBeCloseTo(arcsRotated[i].midpoint.z, 1);
      expect(templateArcsXformed[i].end1.x).toBeCloseTo(arcsRotated[i].end1.x, 1);
      expect(templateArcsXformed[i].end1.y).toBeCloseTo(arcsRotated[i].end1.y, 0);
      expect(templateArcsXformed[i].end1.z).toBeCloseTo(arcsRotated[i].end1.z, 1);
      expect(templateArcsXformed[i].end2.x).toBeCloseTo(arcsRotated[i].end2.x, 1);
      expect(templateArcsXformed[i].end2.y).toBeCloseTo(arcsRotated[i].end2.y, 1);
      expect(templateArcsXformed[i].end2.z).toBeCloseTo(arcsRotated[i].end2.z, 1);
    }
  });

  it("should scale triquetra", () => {
    const arcsScaled = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.01, i)
    );
    arcsScaled.forEach(arc => {
      arc.midpoint.multiplyScalar(0.4);
      arc.end1.multiplyScalar(0.4);
      arc.end2.multiplyScalar(0.4);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn([], arcsScaled, [], triquetraTemplate);

    for (let i=0; i<arcsScaled.length; ++i) {
      expect(templateArcsXformed[i].midpoint.x).toBeCloseTo(arcsScaled[i].midpoint.x, 1);
      expect(templateArcsXformed[i].midpoint.y).toBeCloseTo(arcsScaled[i].midpoint.y, 1);
      expect(templateArcsXformed[i].midpoint.z).toBeCloseTo(arcsScaled[i].midpoint.z, 1);
      expect(templateArcsXformed[i].end1.x).toBeCloseTo(arcsScaled[i].end1.x, 1);
      expect(templateArcsXformed[i].end1.y).toBeCloseTo(arcsScaled[i].end1.y, 1);
      expect(templateArcsXformed[i].end1.z).toBeCloseTo(arcsScaled[i].end1.z, 1);
      expect(templateArcsXformed[i].end2.x).toBeCloseTo(arcsScaled[i].end2.x, 1);
      expect(templateArcsXformed[i].end2.y).toBeCloseTo(arcsScaled[i].end2.y, 1);
      expect(templateArcsXformed[i].end2.z).toBeCloseTo(arcsScaled[i].end2.z, 1);
    }
  });

  it("should rotate and scale back triquetra w/ fuzzing & translation", () => {
    const arcsAltered = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.01, i)
    );
    const axis = new THREE.Vector3(2, 3, 0).normalize();
    const diagonal = new THREE.Vector3(10, 12, 14);
    arcsAltered.forEach(arc => {
      arc.midpoint.applyAxisAngle(axis, Math.PI/6).multiplyScalar(0.4).add(diagonal);
      arc.end1.applyAxisAngle(axis, Math.PI/6).multiplyScalar(0.4).add(diagonal);
      arc.end2.applyAxisAngle(axis, Math.PI/6).multiplyScalar(0.4).add(diagonal);
    });

    const [templateSegmentsXformed, templateArcsXformed] = transformTemplateToDrawn([], arcsAltered, [], triquetraTemplate);

    for (let i=0; i<arcsAltered.length; ++i) {
      expect(templateArcsXformed[i].midpoint.x).toBeCloseTo(arcsAltered[i].midpoint.x, 2);
      expect(templateArcsXformed[i].midpoint.y).toBeCloseTo(arcsAltered[i].midpoint.y, 2);
      expect(templateArcsXformed[i].midpoint.z).toBeCloseTo(arcsAltered[i].midpoint.z, 2);
      expect(templateArcsXformed[i].end1.x).toBeCloseTo(arcsAltered[i].end1.x, 2);
      expect(templateArcsXformed[i].end1.y).toBeCloseTo(arcsAltered[i].end1.y, 2);
      expect(templateArcsXformed[i].end1.z).toBeCloseTo(arcsAltered[i].end1.z, 2);
      expect(templateArcsXformed[i].end2.x).toBeCloseTo(arcsAltered[i].end2.x, 2);
      expect(templateArcsXformed[i].end2.y).toBeCloseTo(arcsAltered[i].end2.y, 2);
      expect(templateArcsXformed[i].end2.z).toBeCloseTo(arcsAltered[i].end2.z, 2);
    }
  });

  it("should scale back borromean rings w/ fuzzing & translation", () => {
    const fuzz = 0.051;
    const scale = 0.7;
    const angle = 0;
    const axis = new THREE.Vector3(0, 1, 0).normalize();
    const offset = new THREE.Vector3(-22, 33, -44);

    const {segmentsDrawn, arcsDrawn, circlesDrawn} = pseudoDraw(borromeanRingsTemplate, axis, angle, scale, offset, fuzz);

    const [templateSegmentsXformed, templateArcsXformed, templateCirclesXformed, drawnCenter] = transformTemplateToDrawn(segmentsDrawn, arcsDrawn, circlesDrawn, borromeanRingsTemplate);

    expect(templateSegmentsXformed.length).toEqual(0);
    expect(templateArcsXformed.length).toEqual(0);
    for (let i=0; i<circlesDrawn.length; ++i) {
      expect(templateCirclesXformed[i].center.x).toBeCloseTo(circlesDrawn[i].center.x, 1);
      expect(templateCirclesXformed[i].center.y).toBeCloseTo(circlesDrawn[i].center.y, 1);
      expect(templateCirclesXformed[i].center.z).toBeCloseTo(circlesDrawn[i].center.z, 1);
      expect(templateCirclesXformed[i].radius).toBeCloseTo(circlesDrawn[i].radius, 1);
      expect(templateCirclesXformed[i].normal.x).toBeCloseTo(circlesDrawn[i].normal.x, 0);
      expect(templateCirclesXformed[i].normal.y).toBeCloseTo(circlesDrawn[i].normal.y, 0);
      expect(templateCirclesXformed[i].normal.z).toBeCloseTo(circlesDrawn[i].normal.z, 1);
    }
    expect(drawnCenter.x).toBeCloseTo(offset.x, 1);
    expect(drawnCenter.y).toBeCloseTo(offset.y, 1);
    expect(drawnCenter.z).toBeCloseTo(offset.z, 1);
  });

  it("should rotate and scale back quicksilver w/ fuzzing & translation", () => {
    const fuzz = 0.048;
    const scale = 0.4;
    const angle = Math.PI / 6;
    const axis = new THREE.Vector3(0, 11, -1).normalize();
    const offset = new THREE.Vector3(10, 12, 14);

    const {segmentsDrawn, arcsDrawn, circlesDrawn} = pseudoDraw(quicksilverTemplate, axis, angle, scale, offset, fuzz);

    const [templateSegmentsXformed, templateArcsXformed, templateCirclesXformed, drawnCenter] = transformTemplateToDrawn(segmentsDrawn, arcsDrawn, circlesDrawn, quicksilverTemplate);

    for (let i=0; i<segmentsDrawn.length; ++i) {
      expect(templateSegmentsXformed[i].a.x).toBeCloseTo(segmentsDrawn[i].a.x, 1);
      expect(templateSegmentsXformed[i].a.y).toBeCloseTo(segmentsDrawn[i].a.y, 1);
      expect(templateSegmentsXformed[i].a.z).toBeCloseTo(segmentsDrawn[i].a.z, 1);
      expect(templateSegmentsXformed[i].b.x).toBeCloseTo(segmentsDrawn[i].b.x, 1);
      expect(templateSegmentsXformed[i].b.y).toBeCloseTo(segmentsDrawn[i].b.y, 1);
      expect(templateSegmentsXformed[i].b.z).toBeCloseTo(segmentsDrawn[i].b.z, 1);
    }
    for (let i=0; i<arcsDrawn.length; ++i) {
      expect(templateArcsXformed[i].end1.x).toBeCloseTo(arcsDrawn[i].end1.x, 1);
      expect(templateArcsXformed[i].end1.y).toBeCloseTo(arcsDrawn[i].end1.y, 1);
      expect(templateArcsXformed[i].end1.z).toBeCloseTo(arcsDrawn[i].end1.z, 1);
      expect(templateArcsXformed[i].midpoint.x).toBeCloseTo(arcsDrawn[i].midpoint.x, 1);
      expect(templateArcsXformed[i].midpoint.y).toBeCloseTo(arcsDrawn[i].midpoint.y, 1);
      expect(templateArcsXformed[i].midpoint.z).toBeCloseTo(arcsDrawn[i].midpoint.z, 1);
      expect(templateArcsXformed[i].end2.x).toBeCloseTo(arcsDrawn[i].end2.x, 1);
      expect(templateArcsXformed[i].end2.y).toBeCloseTo(arcsDrawn[i].end2.y, 1);
      expect(templateArcsXformed[i].end2.z).toBeCloseTo(arcsDrawn[i].end2.z, 1);
    }
    for (let i=0; i<circlesDrawn.length; ++i) {
      expect(templateCirclesXformed[i].center.x).toBeCloseTo(circlesDrawn[i].center.x, 1);
      expect(templateCirclesXformed[i].center.y).toBeCloseTo(circlesDrawn[i].center.y, 1);
      expect(templateCirclesXformed[i].center.z).toBeCloseTo(circlesDrawn[i].center.z, 1);
      expect(templateCirclesXformed[i].radius).toBeCloseTo(circlesDrawn[i].radius, 1);
      expect(templateCirclesXformed[i].normal.x).toBeCloseTo(circlesDrawn[i].normal.x, 0);
      expect(templateCirclesXformed[i].normal.y).toBeCloseTo(circlesDrawn[i].normal.y, 1);
      expect(templateCirclesXformed[i].normal.z).toBeCloseTo(circlesDrawn[i].normal.z, 0);
    }
    expect(drawnCenter.x).toBeCloseTo(offset.x, 1);
    expect(drawnCenter.y).toBeCloseTo(offset.y, 1);
    expect(drawnCenter.z).toBeCloseTo(offset.z, 1);
  });
});

function pseudoDraw(template, axis, angle, scale, offset, fuzz) {
  const segmentsDrawn = [];
  template.segments.forEach((segment, i) => {
    const newSegment = new Segment(segment.a, segment.b);
    newSegment.a.applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset);
    newSegment.b.applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset);
    segmentsDrawn.push(fuzzSegment(newSegment, fuzz, i))
  });
  const arcsDrawn = [];
  template.arcs.forEach((arc, i) => {
    const newArc = new Arc(arc.end1, arc.midpoint, arc.end2);
    newArc.end1.applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset);
    newArc.midpoint.applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset);
    newArc.end2.applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset);
    arcsDrawn.push(fuzzArc(newArc, fuzz, i));
  });
  const circlesDrawn = [];
  template.circles.forEach( (circle, i) => {
    const fuzzDir1 = (new THREE.Vector3( INV_SQRT_3, INV_SQRT_3, -INV_SQRT_3)).applyAxisAngle(xAxis, i);
    const fuzzDir2 = (new THREE.Vector3( INV_SQRT_3, -INV_SQRT_3, INV_SQRT_3)).applyAxisAngle(yAxis, i);
    const fuzzDir3 = (new THREE.Vector3( -INV_SQRT_3, INV_SQRT_3, -INV_SQRT_3)).applyAxisAngle(xAxis, i);

    const p1 = circle.p1.clone().applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset).addScaledVector(fuzzDir1, fuzz);
    const p2 = circle.p2.clone().applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset).addScaledVector(fuzzDir2, fuzz);
    const p3 = circle.p3.clone().applyAxisAngle(axis, angle).multiplyScalar(scale).add(offset).addScaledVector(fuzzDir3, fuzz);

    circlesDrawn.push(circleFrom3Points(p1, p2, p3).circle);
  });

  return {segmentsDrawn, arcsDrawn, circlesDrawn};
}

describe("rmsd", () => {
  it("should calculate 0 for exact match", () => {
    const diff = rmsd(brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toEqual(0);
  });

  it("should correspond to small differences in a.x y & z", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment) => {
      segmentsFuzzed.push(new Segment(segment.a, segment.b));
    });
    segmentsFuzzed[1].a.addScaledVector (diagonal, 0.01);
    segmentsFuzzed[2].a.addScaledVector (diagonal, 0.02);

    const diff = rmsd(segmentsFuzzed, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01+0.02*0.02)/2/5), 6);
  });

  it("should correspond to small differences in b.x y & z", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( segment => {
      segmentsFuzzed.push(new Segment(segment.a, segment.b));
    });
    segmentsFuzzed[1].b.addScaledVector (diagonal, 0.01);

    const diff = rmsd(segmentsFuzzed, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/2/5), 4);
  });

  it("should allow for a and b being reversed", () => {
    const segmentReversed = brimstoneDownTemplate.segments.map(segment => new Segment(segment.b, segment.a));

    const diff = rmsd(segmentReversed, [], [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toEqual(0);
  });

  it("should allow segments to be in different order", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( segment => {
      segmentsFuzzed.unshift(new Segment(segment.a, segment.b));
    });
    segmentsFuzzed[1].b.addScaledVector (diagonal, 0.01);

    const diff = rmsd(segmentsFuzzed, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/2/5), 4);
  });

  it("should correspond for small fuzz", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i));
    });

    const diff = rmsd(segmentsFuzzed, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toBeCloseTo(0.01, 6);
  });

  it("should correspond for medium fuzz", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.1, i));
    });

    const diff = rmsd(segmentsFuzzed, brimstoneDownTemplate.arcs, [], brimstoneDownTemplate.segments, brimstoneDownTemplate.arcs, []);

    expect(diff).toBeCloseTo(0.1, 6);
  });

  it("should calculate 0 for exact match of arcs", () => {
    const diff = rmsd(triquetraTemplate.segments, triquetraTemplate.arcs, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toEqual(0);
  });

  it("should correspond to small differences in midpoint.x .y & .z", () => {
    const arcsMutated = triquetraTemplate.arcs.map(
        arc => new Arc(arc.end1, arc.midpoint, arc.end2)
    );
    arcsMutated[0].midpoint.addScaledVector (diagonal, 0.01);
    arcsMutated[1].end1.addScaledVector (diagonal, 0.02);
    arcsMutated[2].end2.addScaledVector (diagonal, 0.03);

    const diff = rmsd(triquetraTemplate.segments, arcsMutated, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01+0.02*0.02+0.03*0.03)/3/3), 6);
  });

  it("should allow for end1 and end2 being reversed", () => {
    const arcsReversed = triquetraTemplate.arcs.map(arc => new Arc(arc.end2, arc.midpoint, arc.end1));

    const diff = rmsd([], arcsReversed, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toEqual(0);
  });

  it("should allow arcs to be in different order", () => {
    const arcsFuzzed = [];
    triquetraTemplate.arcs.forEach( arc => {
      arcsFuzzed.unshift(new Arc(arc.end1, arc.midpoint, arc.end2));
    });
    arcsFuzzed[1].end1.addScaledVector (diagonal, 0.01);

    const diff = rmsd(triquetraTemplate.segments, arcsFuzzed, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/3/3), 4);
  });

  it("should correspond for small fuzz of arcs", () => {
    const arcsFuzzed = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.01, i)
    );

    const diff = rmsd(triquetraTemplate.segments, arcsFuzzed, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toBeCloseTo(0.01, 6);
  });

  it("should correspond for medium fuzz of arcs", () => {
    const arcsFuzzed = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.1, i)
    );

    const diff = rmsd(triquetraTemplate.segments, arcsFuzzed, [], triquetraTemplate.segments, triquetraTemplate.arcs, []);

    expect(diff).toBeCloseTo(0.1, 6);
  });

  it("should calculate 0 for exact match of circles", () => {
    const circles = [
      new Circle(new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), 1.5, new THREE.Vector3(-1, -1, -1).normalize()),
      new Circle(new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(-1, 6, -3), 0.99, new THREE.Vector3(5, -1, 6).normalize()),
    ]

    const diff = rmsd([], [], circles, [], [], circles);

    expect(diff).toEqual(0);
  });

  it("should correspond to small differences in circle center", () => {
    const circles = [
      new Circle(new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(2, 3, 4), new THREE.Vector3(3, 4, 5), 1.1, new THREE.Vector3(1, -1, 1).normalize())
    ];
    const circlesMutated = circles.map(
        circle => new Circle(circle.p1, circle.p2, circle.p3, circle.center, circle.radius, circle.normal)
    );
    circlesMutated[0].center.addScaledVector (diagonal, 0.01);

    const diff = rmsd([], [], circlesMutated, [], [], circles);

    expect(diff).toBeCloseTo(Math.sqrt((0.01*0.01)/3), 6);
  });

  it("should correspond to small differences in circle radius", () => {
    const circles = [
      new Circle(new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), 1.2, new THREE.Vector3(1, -1, 1).normalize())
    ];
    const circlesMutated = circles.map(
        circle => new Circle(circle.p1, circle.p2, circle.p3, circle.center, circle.radius+0.02, circle.normal)
    );

    const diff = rmsd([], [], circlesMutated, [], [], circles);

    expect(diff).toBeCloseTo(Math.sqrt((0.02*0.02)/3), 6);
  });

  it("should correspond to small differences in circle normal", () => {
    const circles = [
      new Circle(new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), new THREE.Vector3(3, 4, 5), 1.3, new THREE.Vector3(1, -1, 1).normalize())
    ];
    const circlesMutated = circles.map(
        circle => new Circle(circle.p1, circle.p2, circle.p3, circle.center, circle.radius, circle.normal.clone().addScaledVector(diagonal, 0.03))
    );

    const diff = rmsd([], [], circlesMutated, [], [], circles);

    expect(diff).toBeCloseTo(Math.sqrt((0.03*0.03)/3), 6);
  });

  it("should correspond for small fuzz of circles", () => {
    const circles = [
      circleFrom3Points(
          new THREE.Vector3(0, Math.sqrt(3)/6, 1.5),
          new THREE.Vector3(0, Math.sqrt(3)/6, -0.5),
          new THREE.Vector3(0, -Math.sqrt(3)/3, 0)
      ).circle
    ];
    expect(circles[0].center.x).toBeCloseTo(0, 6);
    expect(circles[0].center.y).toBeCloseTo(Math.sqrt(3)/6, 6);
    expect(circles[0].center.z).toBeCloseTo(0.5, 6);
    expect(circles[0].radius).toBeCloseTo(1, 6);
    const circlesFuzzed = circles.map(
        (circle, i) => fuzzCircle(circle, 0.01, i)
    );

    const diff = rmsd([], [], circlesFuzzed, [], [], circles);

    expect(diff).toBeCloseTo(0.01, 2);
  });

  it("should correspond for small fuzz of segments & circles", () => {
    const segments = [
       new Segment(new THREE.Vector3(4, 5, 6), new THREE.Vector3(-2, 3, 4))
    ];
    const segmentsFuzzed = segments.map(
        (segment, i) => fuzzSegment(segment, 0.02, i)
    )
    const circles = [
      circleFrom3Points(
          new THREE.Vector3(0, Math.sqrt(3)/6, 1.5),
          new THREE.Vector3(0, Math.sqrt(3)/6, -0.5),
          new THREE.Vector3(0, -Math.sqrt(3)/3, 0)
      ).circle
    ];
    const circlesFuzzed = circles.map(
        (circle, i) => fuzzCircle(circle, 0.02, i)
    );

    const diff = rmsd(segmentsFuzzed, [], circlesFuzzed, segments, [], circles);

    expect(diff).toBeCloseTo(0.02, 2);
  });
});


describe("matchDrawnAgainstTemplates", () => {
  it("should match brimstone (point down) exact", () => {
    const [score, rawScore, template] = matchDrawnAgainstTemplates(brimstoneDownTemplate.segments, [], []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(1000);
  });

  it("should match brimstone (point down) small difference in center.x", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( segment => {
      segmentsFuzzed.push(new Segment(segment.a, segment.b));
    });
    segmentsFuzzed[1].a.x += 0.01;

    const [score, rawScore, template] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
  });

  it("should match brimstone (point down) fuzzed linear", () => {
    const segmentsFuzzed = [];
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i));
    });

    const [score, rawScore, template] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
  });

  it("should match brimstone (point down) fuzzed rotated scaled translated", () => {
    const segmentsDrawn = [
      new Segment(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new Segment(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new Segment(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new Segment(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];
    const xyDiagonal = new THREE.Vector3(1, 2, 0).normalize();
    brimstoneDownTemplate.segments.forEach( (segment, i) => {
      const newSegment = fuzzSegment(segment, 0.01, i);
      newSegment.a.multiplyScalar(0.3).applyAxisAngle(xyDiagonal, Math.PI/6).addScaledVector(diagonal, 2.0);
      newSegment.b.multiplyScalar(0.3).applyAxisAngle(xyDiagonal, Math.PI/6).addScaledVector(diagonal, 2.0);
      segmentsDrawn.push(newSegment);
    });

    const [score, rawScore, template, centroidOfDrawn, bestSegmentsXformed] = matchDrawnAgainstTemplates(segmentsDrawn, [], []);

    expect(template.name).toEqual("brimstone down");
    expect(score).toBeGreaterThan(brimstoneDownTemplate.minScore);
    const expectedCenter = diagonal.clone().multiplyScalar(2);
    expect(centroidOfDrawn.x).toBeCloseTo(expectedCenter.x, 2);
    expect(centroidOfDrawn.y).toBeCloseTo(expectedCenter.y, 2);
    expect(centroidOfDrawn.z).toBeCloseTo(expectedCenter.z, 2);

    for (let i=0; i<brimstoneDownTemplate.segments.length; ++i) {
      const expectedA = brimstoneDownTemplate.segments[i].a.clone().applyAxisAngle(xyDiagonal, Math.PI/6).multiplyScalar(0.3).addScaledVector(diagonal, 2.0);
      expect(bestSegmentsXformed[i].a.x).toBeCloseTo(expectedA.x, 2);
      expect(bestSegmentsXformed[i].a.y).toBeCloseTo(expectedA.y, 2);
      expect(bestSegmentsXformed[i].a.z).toBeCloseTo(expectedA.z, 2);
      const expectedB = brimstoneDownTemplate.segments[i].b.clone().applyAxisAngle(xyDiagonal, Math.PI/6).multiplyScalar(0.3).addScaledVector(diagonal, 2.0);
      expect(bestSegmentsXformed[i].b.x).toBeCloseTo(expectedB.x, 2);
      expect(bestSegmentsXformed[i].b.y).toBeCloseTo(expectedB.y, 2);
      expect(bestSegmentsXformed[i].b.z).toBeCloseTo(expectedB.z, 2);
    }
  });

  it("should not crash when too few segments to match template", () => {
    const segments = [
      new Segment(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
    ];

    const [score, rawScore, template] = matchDrawnAgainstTemplates(segments, [], []);

    expect(template).toBeNull();
    expect(score).toEqual(Number.NEGATIVE_INFINITY);
  });

  it("should not crash when too few arcs to match template", () => {
    const arcs = [
      new Arc(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(-2, 4, 9), new THREE.Vector3(1, 0, 0)),
    ];

    const [score, rawScore, template] = matchDrawnAgainstTemplates([], arcs, []);

    expect(template).toBeNull();
    expect(score).toEqual(Number.NEGATIVE_INFINITY);
  });

  it("should not match random segments", () => {
    const segments = [
      new Segment(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new Segment(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new Segment(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new Segment(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];

    const [score, rawScore, template] = matchDrawnAgainstTemplates(segments, [], []);

    expect(score).toBeLessThan(-2.5);
  });

  it("should not match random arcs", () => {
    const drawnArcs = [
      new Arc(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(3, -5, 9)),
      new Arc(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0), new THREE.Vector3(8, 3, 2)),
      new Arc(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0), new THREE.Vector3(-3, 6, 4)),
      new Arc(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0), new THREE.Vector3(4, 4, -4)),
      new Arc(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(8, -6.5, 2)),
      new Arc(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0), new THREE.Vector3(9, 3, 5)),
    ];

    const [score, rawScore, template] = matchDrawnAgainstTemplates([], drawnArcs, []);

    expect(score).toBeLessThan(-2.5);
  });

  it("should not match random circles", () => {
    const {circle} = circleFrom3Points(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(3, -5, 9));
    const {circle:circle2} = circleFrom3Points(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0), new THREE.Vector3(8, 3, 2));
    const {circle:circle3} = circleFrom3Points(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0), new THREE.Vector3(-3, 6, 4));
    const {circle:circle4} = circleFrom3Points(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0), new THREE.Vector3(4, 4, -4));
    const {circle:circle5} = circleFrom3Points(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(8, -6.5, 2));

    const drawnCircles = [circle, circle2, circle3, circle4, circle5];

    const [score, rawScore, template] = matchDrawnAgainstTemplates([], [], drawnCircles);

    expect(score).toBeLessThan(-2.5);
  });

  it("should should match brimstone (point up) fuzzed linear", () => {
    const segmentsFuzzed = [];
    brimstoneUpTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i));
    });

    const [score, rawScore, template, centroidPt] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("brimstone up");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 1);
    expect(centroidPt.y).toBeCloseTo(0, 1);
    expect(centroidPt.z).toBeCloseTo(0, 1);
  });

  it("should match pentagram exact", () => {
    const [score, rawScore, template, centroidPt] = matchDrawnAgainstTemplates(pentagramTemplate.segments, [], []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(1000);
    expect(centroidPt.x).toBeCloseTo(0, 6);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram; small difference in a.x", () => {
    const segmentsFuzzed = [];
    pentagramTemplate.segments.forEach( segment => {
      segmentsFuzzed.push(new Segment(segment.a, segment.b));
    });
    segmentsFuzzed[1].a.x += 0.01;

    const [score, rawScore, template, centroidPt] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(pentagramTemplate.minScore);
    expect(centroidPt.x).toBeCloseTo(0.001, 3);
    expect(centroidPt.y).toBeCloseTo(0, 6);
    expect(centroidPt.z).toBeCloseTo(0, 6);
  });

  it("should match pentagram fuzzed linear", () => {
    const segmentsFuzzed = [];
    pentagramTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i));
    });

    const [score, rawScore, template, centroidPt] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 2);
    expect(centroidPt.y).toBeCloseTo(0, 2);
    expect(centroidPt.z).toBeCloseTo(0, 2);
  });

  it("should match pentagram fuzzed linear after random junk", () => {
    const segmentsFuzzed = [
      new Segment(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0)),
      new Segment(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0)),
      new Segment(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0)),
      new Segment(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)),
      new Segment(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0)),
    ];
    pentagramTemplate.segments.forEach( (segment, i) => {
      segmentsFuzzed.push(fuzzSegment(segment, 0.01, i));
    });
    const axis = new THREE.Vector3(0, 1, 0);
    segmentsFuzzed.forEach(segment => {
      segment.a.applyAxisAngle(axis, Math.PI/6);
      segment.b.applyAxisAngle(axis, Math.PI/6);
    });

    const [score, rawScore, template, centroidPt] = matchDrawnAgainstTemplates(segmentsFuzzed, [], []);

    expect(template.name).toEqual("pentagram");
    expect(score).toBeGreaterThan(0);
    expect(centroidPt.x).toBeCloseTo(0, 2);
    expect(centroidPt.y).toBeCloseTo(0, 2);
    expect(centroidPt.z).toBeCloseTo(0, 2);
  });

  it("should match triquetra exact", () => {
    const [score, rawScore, template, centroidOfDrawn] = matchDrawnAgainstTemplates(triquetraTemplate.segments, triquetraTemplate.arcs, triquetraTemplate.circles);

    expect(template.name).toEqual("triquetra");
    expect(score).toBeGreaterThan(1000);
    expect(centroidOfDrawn).toEqual(new THREE.Vector3(0, 0, 0));
  });

  it("should match triquetra with small fuzz", () => {
    const arcsFuzzed = triquetraTemplate.arcs.map(
        (arc, i) => fuzzArc(arc, 0.01, i)
    );

    const [score, rawScore, template, centroidOfDrawn] = matchDrawnAgainstTemplates(triquetraTemplate.segments, arcsFuzzed, []);

    expect(template.name).toEqual("triquetra");
    expect(score).toBeGreaterThan(100);
    expect(centroidOfDrawn.x).toBeCloseTo(0, 2);
    expect(centroidOfDrawn.y).toBeCloseTo(0, 2);
    expect(centroidOfDrawn.z).toBeCloseTo(0, 1);
  });

  it("should match triquetra fuzzed & scaled", () => {
    const drawnArcs = [
      new Arc(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(3, -5, 9), new THREE.Vector3(1, 0, 0)),
      new Arc(new THREE.Vector3(1, 1, 0.10), new THREE.Vector3(0, 0, 0), new THREE.Vector3(8, 3, 2)),
      new Arc(new THREE.Vector3(-1, 2, 0), new THREE.Vector3(2, 1, 0), new THREE.Vector3(-3, 6, 4)),
    ];
    triquetraTemplate.arcs.forEach( (arc, i) => {
      const newArc = fuzzArc(arc, 0.007, i);
      newArc.end1.multiplyScalar(0.3);
      newArc.midpoint.multiplyScalar(0.3);
      newArc.end2.multiplyScalar(0.3);
      drawnArcs.push(newArc);
    });

    const [score, rawScore, template, centroidOfDrawn] = matchDrawnAgainstTemplates(triquetraTemplate.segments, drawnArcs, []);

    expect(template.name).toEqual("triquetra");
    expect(score).toBeGreaterThan(100);
    const expectedCenter = diagonal.clone().multiplyScalar(0);
    expect(centroidOfDrawn.x).toBeCloseTo(expectedCenter.x, 2);
    expect(centroidOfDrawn.y).toBeCloseTo(expectedCenter.y, 2);
    expect(centroidOfDrawn.z).toBeCloseTo(expectedCenter.z, 2);
  });

  it("should match triquetra fuzzed rotated scaled & translated", () => {
    const drawnArcs = [
      new Arc(new THREE.Vector3(-2, 0, 0), new THREE.Vector3(1, 1, 0), new THREE.Vector3(4, 4, -4)),
      new Arc(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(8, -6.5, 2)),
      new Arc(new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(1, -1, 0), new THREE.Vector3(9, 3, 5)),
    ];
    const axis = new THREE.Vector3(1, -3, 0).normalize();
    const offset = new THREE.Vector3(20, 23, 10);
    triquetraTemplate.arcs.forEach( (arc, i) => {
      const newArc = fuzzArc(arc, 0.007, i);
      newArc.end1.applyAxisAngle(axis, Math.PI/3).multiplyScalar(2.1).add(offset);
      newArc.midpoint.applyAxisAngle(axis, Math.PI/3).multiplyScalar(2.1).add(offset);
      newArc.end2.applyAxisAngle(axis, Math.PI/3).multiplyScalar(2.1).add(offset);
      drawnArcs.push(newArc);
    });

    const [score, rawScore, template, centroidOfDrawn, bestSegmentsXformed, bestArcsXformed] = matchDrawnAgainstTemplates(triquetraTemplate.segments, drawnArcs, []);

    expect(template.name).toEqual("triquetra");
    expect(score).toBeGreaterThan(88);
    expect(centroidOfDrawn.x).toBeCloseTo(offset.x, 2);
    expect(centroidOfDrawn.y).toBeCloseTo(offset.y, 2);
    expect(centroidOfDrawn.z).toBeCloseTo(offset.z, 1);
    const relevantArcs = drawnArcs.slice(-triquetraTemplate.arcs.length);
    for (let i=0; i<template.arcs.length; ++i) {
      const bestArc = bestArcsXformed[i];
      const drawnArc = relevantArcs[i];
      expect(bestArc.end1.x).toBeCloseTo(drawnArc.end1.x, 1);
      expect(bestArc.end1.y).toBeCloseTo(drawnArc.end1.y, 1);
      expect(bestArc.end1.z).toBeCloseTo(drawnArc.end1.z, 1);
      expect(bestArc.midpoint.x).toBeCloseTo(drawnArc.midpoint.x, 1);
      expect(bestArc.midpoint.y).toBeCloseTo(drawnArc.midpoint.y, 1);
      expect(bestArc.midpoint.z).toBeCloseTo(drawnArc.midpoint.z, 1);
      expect(bestArc.end2.x).toBeCloseTo(drawnArc.end2.x, 1);
      expect(bestArc.end2.y).toBeCloseTo(drawnArc.end2.y, 1);
      expect(bestArc.end2.z).toBeCloseTo(drawnArc.end2.z, 2);
    }
  });

  it("should match Borromean Rings fuzzed rotated scaled & translated", () => {
    const fuzz = 0.050;
    const scale = 1.2;
    const angle = -Math.PI / 6;
    const axis = new THREE.Vector3(0, 12, 1).normalize();
    const offset = new THREE.Vector3(20, 21, 22);

    const {segmentsDrawn, arcsDrawn, circlesDrawn} = pseudoDraw(borromeanRingsTemplate, axis, angle, scale, offset, fuzz);

    const [score, rawScore, template, centroidOfDrawn, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed] = matchDrawnAgainstTemplates(segmentsDrawn, arcsDrawn, circlesDrawn);

    expect(template.name).toEqual("borromean rings");
    expect(score).toBeGreaterThan(16);
    expect(centroidOfDrawn.x).toBeCloseTo(offset.x, 1);
    expect(centroidOfDrawn.y).toBeCloseTo(offset.y, 1);
    expect(centroidOfDrawn.z).toBeCloseTo(offset.z, 1);

    expect(bestSegmentsXformed.length).toEqual(0);

    expect(bestArcsXformed.length).toEqual(0);

    const relevantCircles = circlesDrawn.slice(-borromeanRingsTemplate.circles.length);
    for (let i=0; i<template.circles.length; ++i) {
      const bestCircle = bestCirclesXformed[i];
      const drawnCircle = relevantCircles[i];
      expect(bestCircle.center.x).toBeCloseTo(drawnCircle.center.x, 1);
      expect(bestCircle.center.y).toBeCloseTo(drawnCircle.center.y, 1);
      expect(bestCircle.center.z).toBeCloseTo(drawnCircle.center.z, 1);
      expect(bestCircle.radius).toBeCloseTo(drawnCircle.radius, 1);
      expect(bestCircle.normal.x).toBeCloseTo(drawnCircle.normal.x, 1);
      expect(bestCircle.normal.y).toBeCloseTo(drawnCircle.normal.y, 0);
      expect(bestCircle.normal.z).toBeCloseTo(drawnCircle.normal.z, 1);
    }
  });

  it("should match quicksilver rotated, scaled, fuzzed & translated", () => {
    const fuzz = 0.043;
    const scale = 0.8;
    const angle = -Math.PI / 6;
    const axis = new THREE.Vector3(1, 12, 0).normalize();
    const offset = new THREE.Vector3(-30, 40, -50);

    const {segmentsDrawn, arcsDrawn, circlesDrawn} = pseudoDraw(quicksilverTemplate, axis, angle, scale, offset, fuzz);

    const [score, rawScore, template, centroidOfDrawn, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed] = matchDrawnAgainstTemplates(segmentsDrawn, arcsDrawn, circlesDrawn);

    expect(template.name).toEqual("quicksilver");
    expect(score).toBeGreaterThan(19);
    expect(centroidOfDrawn.x).toBeCloseTo(offset.x, 1);
    expect(centroidOfDrawn.y).toBeCloseTo(offset.y, 1);
    expect(centroidOfDrawn.z).toBeCloseTo(offset.z, 1);

    const relevantSegments = segmentsDrawn.slice(-quicksilverTemplate.segments.length);
    for (let i=0; i<template.segments.length; ++i) {
      const bestSegment = bestSegmentsXformed[i];
      const drawnSegment = relevantSegments[i];
      expect(bestSegment.a.x).toBeCloseTo(drawnSegment.a.x, 1);
      expect(bestSegment.a.y).toBeCloseTo(drawnSegment.a.y, 1);
      expect(bestSegment.a.z).toBeCloseTo(drawnSegment.a.z, 1);
      expect(bestSegment.b.x).toBeCloseTo(drawnSegment.b.x, 1);
      expect(bestSegment.b.y).toBeCloseTo(drawnSegment.b.y, 1);
      expect(bestSegment.b.z).toBeCloseTo(drawnSegment.b.z, 1);
    }

    const relevantArcs = arcsDrawn.slice(-quicksilverTemplate.arcs.length);
    for (let i=0; i<template.arcs.length; ++i) {
      const bestArc = bestArcsXformed[i];
      const drawnArc = relevantArcs[i];
      expect(bestArc.end1.x).toBeCloseTo(drawnArc.end1.x, 1);
      expect(bestArc.end1.y).toBeCloseTo(drawnArc.end1.y, 1);
      expect(bestArc.end1.z).toBeCloseTo(drawnArc.end1.z, 1);
      expect(bestArc.midpoint.x).toBeCloseTo(drawnArc.midpoint.x, 1);
      expect(bestArc.midpoint.y).toBeCloseTo(drawnArc.midpoint.y, 1);
      expect(bestArc.midpoint.z).toBeCloseTo(drawnArc.midpoint.z, 1);
      expect(bestArc.end2.x).toBeCloseTo(drawnArc.end2.x, 1);
      expect(bestArc.end2.y).toBeCloseTo(drawnArc.end2.y, 1);
      expect(bestArc.end2.z).toBeCloseTo(drawnArc.end2.z, 2);
    }

    const relevantCircles = circlesDrawn.slice(-quicksilverTemplate.circles.length);
    for (let i=0; i<template.circles.length; ++i) {
      const bestCircle = bestCirclesXformed[i];
      const drawnCircle = relevantCircles[i];
      expect(bestCircle.center.x).toBeCloseTo(drawnCircle.center.x, 1);
      expect(bestCircle.center.y).toBeCloseTo(drawnCircle.center.y, 1);
      expect(bestCircle.center.z).toBeCloseTo(drawnCircle.center.z, 1);
      expect(bestCircle.radius).toBeCloseTo(drawnCircle.radius, 0);
      expect(bestCircle.normal.x).toBeCloseTo(drawnCircle.normal.x, 1);
      expect(bestCircle.normal.y).toBeCloseTo(drawnCircle.normal.y, 1);
      expect(bestCircle.normal.z).toBeCloseTo(drawnCircle.normal.z, 1);
    }
  });
});


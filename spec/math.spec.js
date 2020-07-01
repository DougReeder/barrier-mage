// unit tests for math utilities for Barrier Mage

require("./support/three.min");
// const {AFRAME, componentParam} = require('./aframe-stub');
const {calcCentroid, centerPoints, transformToStandard, transformTemplateToActual, rms} = require('../src/math');

function fuzz(points, fuzzAmount) {
  points.forEach(p => {
    p.x += Math.sign(Math.random()-0.5) * fuzzAmount;
    p.y += Math.sign(Math.random()-0.5) * fuzzAmount;
    p.z += Math.sign(Math.random()-0.5) * fuzzAmount;
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

describe("centroid", function () {
  it("should calculate centroid of points", () => {
    const points = [new THREE.Vector3(1, 2, 3), new THREE.Vector3(-5, 1, -4), new THREE.Vector3(9, -8, 0), new THREE.Vector3(0, -2, -3)];

    const centroidPt = new THREE.Vector3();
    calcCentroid(points, centroidPt);

    expect(centroidPt.x).toEqual(1.25);
    expect(centroidPt.y).toEqual(-1.75);
    expect(centroidPt.z).toEqual(-1);
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
    fuzz(points, 0.015);
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
    fuzz(points, 0.015);
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

describe("rms", () => {
  it("should be zero when comparing points to themselves", () => {
    expect(rms(stdPentagramPoints,stdPentagramPoints)).toEqual(0);
  });

  it("should be sqrt(0.1^2/5) when one point varies by 0.1", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    points[1].x += 0.1;
    expect(rms(points,stdPentagramPoints)).toBeCloseTo(0.04472,4);
  });

  it("should be sqrt((0.1^2+0.1^2)/5) when two points vary by 0.1", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const offset = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(0.1);
    points[1].add(offset);
    points[3].add(offset);
    expect(rms(points,stdPentagramPoints)).toBeCloseTo(0.06325,4);
  });

  it("should be small when all points fuzzed", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    fuzz(points, 0.1);
    expect(rms(points,stdPentagramPoints)).toBeLessThan(0.17321);
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

    expect(rms(points, pointsCopy)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, translation)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    points.forEach(p => p.addScalar(2));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, large rotation around X & Y)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 0).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, small rotation around Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(0, 0, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, large negative rotation around Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(0, 0, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, -5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, small rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 3).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/5));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (fuzzed, small rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 2, 3).normalize();
    points.forEach(p => p.applyAxisAngle(axis, Math.PI/5));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeLessThan(0.30);
  });

  it("should transform the template to match the actual (exact, large rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, large rotation around X,Y & Z) 2", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(1, 1, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 4*Math.PI/6));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (exact, translation & large rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (fuzzed, translation & large rotation around X,Y & Z)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeLessThan(2.5);
  });

  it("should transform the template to match the actual (exact, scaled)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p).multiplyScalar(3));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (fuzzed, scaled)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p).multiplyScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeLessThan(0.30);
  });

  it("should transform the template to match the actual (exact, scaled, large rotation around X,Y & Z, translated)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p).multiplyScalar(2.5));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeCloseTo(0, 6);
  });

  it("should transform the template to match the actual (fuzzed, scaled, large rotation around X,Y & Z, translated)", () => {
    const points = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    const axis = new THREE.Vector3(3, 2, 1).normalize();
    points.forEach(p => p.multiplyScalar(2.5).applyAxisAngle(axis, 5*Math.PI/6).addScalar(3));
    fuzz(points, 0.1);

    const template = stdPentagramPoints.map(p => new THREE.Vector3().copy(p));
    transformTemplateToActual(points, template);

    expect(rms(points, template)).toBeLessThan(5.5);
  });
});

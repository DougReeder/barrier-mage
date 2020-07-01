// math.js - math utilities for Barrier Mage
// A-Frame doesn't support any module system well, so functions are just defined globally.
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

try {
  THREE;   // in the browser, A-Frame includes threeJS
} catch (err) {
  THREE = require('../spec/support/three.min');
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


const plane1 = new THREE.Plane();
const plane2 = new THREE.Plane();
const avgNormal = new THREE.Vector3();
const rotAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3(0,0,1);
const yAxis = new THREE.Vector3(0,1,0);

function transformToStandard(points) {
  centerPoints(points);

  plane1.setFromCoplanarPoints(points[0], points[2], points[1]);   // ccw
  plane2.setFromCoplanarPoints(points[points.length-1], points[points.length-2], points[points.length-3]);   // ccw
  avgNormal.copy(plane1.normal);
  avgNormal.add(plane2.normal);
  // We only care about direction, so no need to divide by 2.

  let angle = avgNormal.angleTo(zAxis);

  rotAxis.crossVectors(avgNormal, zAxis);
  rotAxis.normalize();

  points.forEach(p => p.applyAxisAngle(rotAxis, angle));

  // rotates about Z so first point is on positive Y axis
  angle = points[0].angleTo(yAxis) * (points[0].x >= 0 ? 1 : -1);
  points.forEach(p => p.applyAxisAngle(zAxis, angle));

  // scale so first point is at 0 1 0
  const scale = 1/points[0].y;
  points.forEach(p => p.multiplyScalar(scale))
}

function angleBetween(first, second) {
  const dotProd = first.dot(second);
  return Math.acos(dotProd/first.length()/second.length()) * Math.sign(dotProd);
}

const centeredActual = [];

function transformTemplateToActual(actual, template) {
  // calculate centered actual
  for (let i=centeredActual.length; i<template.length; ++i) {
    centeredActual[i] = new THREE.Vector3();
  }
  calcCentroid(actual, centroidPt);
  for (i=0; i<template.length; ++i) {
    centeredActual[i].copy(actual[i]);
    centeredActual[i].sub(centroidPt);
  }

  // rotates about X & Y
  plane1.setFromCoplanarPoints(centeredActual[0], centeredActual[2], centeredActual[1]);   // ccw
  plane2.setFromCoplanarPoints(centeredActual[centeredActual.length-1], centeredActual[centeredActual.length-2], centeredActual[centeredActual.length-3]);   // ccw
  avgNormal.copy(plane1.normal).add(plane2.normal).normalize();

  let angle = avgNormal.angleTo(zAxis);
  rotAxis.crossVectors(zAxis, avgNormal).normalize();
  template.forEach(p => p.applyAxisAngle(rotAxis, angle));

  // rotates about Z so middle point is on positive Y axis
  const midPoint = Math.round((template.length-1)/2);
  angle = angleBetween(template[midPoint], centeredActual[midPoint]);
  template.forEach(p => p.applyAxisAngle(avgNormal, angle));

  // scale to match
  const scale = centeredActual[midPoint].length() / template[midPoint].length();
  template.forEach(p => p.multiplyScalar(scale));

  // translates
  template.forEach(p => p.add(centroidPt));
}

function rms(points, pattPts) {
  let sum = 0, i;
  for (i=0; i<pattPts.length; ++i) {
    const d = pattPts[i].distanceTo(points[i]);
    sum += d*d;
  }

  return Math.sqrt(sum/points.length);
}

try {   // pulled in via require for testing
  module.exports = {
    calcCentroid,
    centerPoints,
    transformToStandard,
    transformTemplateToActual,
    rms,
  }
} catch (err) {
  // pulled in via script tag
}

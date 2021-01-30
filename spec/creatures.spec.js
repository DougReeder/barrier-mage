// unit tests for Barrier Mage creatures
// Copyright © 2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

require('./support/three.min');
const {AFRAME, MockElement} = require('./aframe-stub');
math = require('../src/math');
creatures = require('../src/creatures');

global.distanceToBarrier = math.distanceToBarrier;
global.triquetraTemplate = math.triquetraTemplate;
global.brimstoneUpTemplate = math.brimstoneUpTemplate;
global.IrkBall = creatures.IrkBall;
global.ViolentCloud = creatures.ViolentCloud;

describe("creature", () => {
  it("should set defaults on instantiating Irk Ball without params", () => {
    const creature = new IrkBall();

    expect(creature.radius).toBeCloseTo(0.25, 2);
    expect(creature.barrierEffectDist).toBeGreaterThan(0.25, 6);
    expect(creature.barrierEffectDist).toBeLessThan(1.00, 6);
    expect(creature.el).toBeFalsy();
    expect(creature.speed).toEqual(1.0);
    expect(creature.canMove).toBeTruthy();
    expect(creature.hitPoints).toBeGreaterThanOrEqual(3000);
    expect(creature.activityCount).toEqual(0);
    expect(creature.forceBarriers instanceof Set).toBeTruthy();
  });

  it("should set defaults on instanting Violent Cloud without params", () => {
    const creature = new ViolentCloud();

    expect(creature.radius).toEqual(1.0);
    expect(creature.barrierEffectDist).toBeCloseTo(1.0, 6);
    expect(creature.el).toBeFalsy();
    expect(creature.sound).toEqual('#ominous');
    expect(creature.speed).toEqual(1.0);
    expect(creature.canMove).toBeTruthy();
    expect(creature.hitPoints).toBeGreaterThanOrEqual(5000);
    expect(creature.activityCount).toEqual(0);
    expect(creature.forceBarriers instanceof Set).toBeTruthy();
  });

  it("should set members from constructor params", () => {
    const speed = 1.5;
    const hitPoints = 9000;

    const creature = new IrkBall(speed, hitPoints);

    expect(creature.radius).toBeCloseTo(0.25, 2);
    expect(creature.el).toBeFalsy();
    expect(creature.speed).toEqual(speed);
    expect(creature.hitPoints).toEqual(hitPoints);
    expect(creature.forceBarriers instanceof Set).toBeTruthy();
  });

  it("should be placeable", () => {
    const creature = new ViolentCloud(1.2, 2500);

    const position = new THREE.Vector3(300, 100, 300);
    creature.place(position);

    expect(typeof creature.el).toEqual('object');
    expect(creature.el.object3D instanceof THREE.Object3D).toBeTruthy();
    expect(creature.el.object3D.position).toEqual(position);
    expect(creature.el.getAttribute('material') instanceof Object).toBeTruthy();
  });

  it("should move forward on tickMove", () => {
    const speed = 1.3;
    const creature = new IrkBall(speed, 3500);

    const position = new THREE.Vector3(300, 100, 300);
    creature.place(position);
    const timeDelta = 1000 / 72;
    const staffPosition = new THREE.Vector3(400, 50, 200);
    terrainY = 100;
    creature.tickMove({timeDelta, staffPosition, terrainY})

    const velocity = staffPosition.clone().sub(position).normalize().multiplyScalar(speed)
    const newPosition = position.clone().addScaledVector(velocity, timeDelta / 1000)
    expect(creature.el.object3D.position.x).toBeCloseTo(newPosition.x, 6);
    expect(creature.el.object3D.position.y).toBeCloseTo(newPosition.y, 1);
    expect(creature.el.object3D.position.z).toBeCloseTo(newPosition.z, 1);
  });

  it("should clear flags on clearTickStatus", () => {
    const speed = 1.4;
    const creature = new ViolentCloud(speed, 4500);
    creature.canMove = false;
    creature.isBurning = true;
    creature.wasBurning = false;

    creature.clearTickStatus();

    expect(creature.canMove).toBeTruthy();
    expect(creature.isBurning).toBeFalsy();
    expect(creature.wasBurning).toBeTruthy();
  });

  it("should be immobilized by proximity of triquetra", () => {
    const timeDelta = 1000 / 90;
    const speed = 1.4;
    const creature = new IrkBall(speed, 4500);
    const position = new THREE.Vector3(0.1, 0.1, 0.2);
    creature.place(position);

    creature.clearTickStatus();
    const barrier = {
      lines: [],
      segments: triquetraTemplate.segments.slice(0),
      arcs: triquetraTemplate.arcs.slice(0),
      circles: triquetraTemplate.circles.slice(0),
      template: triquetraTemplate,
    }
    const isActing = creature.barrierTickStatus({barrier, timeDelta});

    expect(isActing).toBeTruthy();
    expect(creature.canMove).toBeFalsy();

    creature.applyTickStatus();
    expect(creature.activityCount).toEqual(0);
    expect(creature.canMove).toBeFalsy();
  });

  it("should be active when near brimstone", () => {
    const timeDelta = 1000 / 60;
    const speed = 1.5;
    const creature = new ViolentCloud(speed, 5500);
    const position = new THREE.Vector3(-0.1, 0.1, -0.2);
    creature.place(position);

    expect(creature.activityCount).toEqual(0);

    creature.clearTickStatus();
    const barrier = {
      lines: [],
      segments: brimstoneUpTemplate.segments.slice(0),
      arcs: brimstoneUpTemplate.arcs.slice(0),
      circles: brimstoneUpTemplate.circles.slice(0),
      template: brimstoneUpTemplate,
    }
    const isActing = creature.barrierTickStatus({barrier, timeDelta});

    expect(isActing).toBeTruthy();
    expect(creature.canMove).toBeTruthy();

    creature.applyTickStatus();
    expect(creature.activityCount).toBeGreaterThan(0);
    expect(creature.canMove).toBeTruthy();
  });

  it("should flag & clean up when destroyed", () => {
    const timeDelta = 1000 / 75;
    const speed = 1.6;
    const creature = new IrkBall(speed, 6500);
    const position = new THREE.Vector3(-0.1, 0.1, -0.2);
    creature.place(position);

    expect(creature.hitPoints).toEqual(6500);

    creature.destroy();

    expect(creature.hitPoints).toEqual(0);
    expect(creature.forceBarriers).toBeFalsy();
    // tricky to check if Entity removed from DOM
  });
});

// unit tests for state handling for Barrier Mage
// Copyright © 2020-2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

require('./support/three.min');
const {AFRAME, MockElement} = require('./aframe-stub');
math = require('../src/math');
const {drawLinesOnElement} = require('../src/book');
require('../src/state');

global.Segment = math.Segment;
global.arcFrom3Points = math.arcFrom3Points;
global.circleFrom3Points = math.circleFrom3Points;
global.matchDrawnAgainstTemplates = math.matchDrawnAgainstTemplates;
global.pentacleTemplate = math.pentacleTemplate;
global.triquetraTemplate = math.triquetraTemplate;
global.borromeanRingsTemplate = math.borromeanRingsTemplate;

const TIP_LENGTH = 1.09;
const WHITE = new THREE.Color('white');
const SNAP_DISTANCE = 0.05;

class MockState {
  constructor() {
    this.rigEl = new MockElement({});
    this.staffEl = new MockElement({});
    this.straighting = false;
    this.curving = false;
    this.tipPosition = new THREE.Vector3();
    this.lastTipPosition = new THREE.Vector3();
    this.inProgress = {
      geometry: new THREE.BufferGeometry(),
      material: new THREE.LineBasicMaterial({color: 'gray'}),
      el: new MockElement({}),
    };
    this.barriers = [];
    this.trainingEls = [];
    this.scoreEls = [];
    this.creatures = [];
    this.consecutiveCreaturesDefeated = 0;
    this.totalCreaturesDefeated = 0;
    this.isStaffExploding = false;
    this.progress = {goodSymbols: 0, pentacles: 0, brimstones: 0, triquetras: 0};
    this.drawLargerSegmentHelp = {src: ['#holdtriggerdown', null, '#drawlarger', null, null], idx: 0, volume: 1.0};
    this.drawLargerCurveHelp = {src: ['#holdbuttondown', null, '#drawlarger', null, null], idx: 0, volume: 1.0};
    this.drawAccuratelyHelp = {src: ['#drawaccurately', '', ''], idx: 0, volume: 1.0};
    this.encouragementHelp = {src: ['#good', '#yes', null, '#practiceall', null, '#keepgoing', null, '#drawmore', null], idx: 0, volume: 1.0},

    this.inProgress.line = new THREE.Line(this.inProgress.geometry, this.inProgress.material);
  }
}

describe("nearPlayer", () => {
  let state;

  beforeEach(() => {
    state = new MockState();
    AFRAME.stateParam.handlers.cameraEl = new MockElement();
    AFRAME.stateParam.handlers.cameraPos = new THREE.Vector3();
    AFRAME.stateParam.handlers.getElevation = () => 100;
    AFRAME.stateParam.handlers.fadeEls = [];
    AFRAME.stateParam.handlers.lightTimeout = null;
  });

  it("should return a position near, but not too near, the player", () => {
    for (let playerElevation=0; playerElevation<=200; playerElevation+=10 ) {
      state.rigEl.object3D.position.set(Math.random()*1000-500, playerElevation, Math.random()*1000-500);
      const min = 10 + Math.random()*100;
      const max = min + 10 + Math.random()*100;

      const groundPosition = AFRAME.stateParam.handlers.nearPlayer(state, min, max);

      expect(groundPosition.y).toEqual(100);   // from mock getElevation()
      expect(state.rigEl.object3D.position.distanceTo(groundPosition)).toBeGreaterThanOrEqual(min);
      expect(state.rigEl.object3D.position.distanceTo(groundPosition)).toBeLessThanOrEqual(max + Math.abs(playerElevation - 100));
      groundPosition.y = playerElevation;
      expect(state.rigEl.object3D.position.distanceTo(groundPosition)).toBeLessThanOrEqual(max);
    }
  });
})

describe("straightBegin/straightEnd", () => {
  let state;

  beforeEach(() => {
    state = new MockState();
    AFRAME.stateParam.handlers.cameraEl = new MockElement();
    AFRAME.stateParam.handlers.cameraPos = new THREE.Vector3();
    AFRAME.stateParam.handlers.fadeEls = [];
    AFRAME.stateParam.handlers.lightTimeout = null;
  });

  it("should discard 0-length segments", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(0);

    state.staffEl.object3D.position.set(1, 2, 3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(1, 2, 3);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerSegmentHelp);
  });

  it("should discard 0-length segments without discarding previous points", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(0);
    state.staffEl.object3D.position.set(1, 2, 3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    state.staffEl.object3D.position.set(2, 2, 3);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerSegmentHelp);
  });

  it("should discard tiny segments", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1,2,3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);

    state.staffEl.object3D.position.set(1 + 2*SNAP_DISTANCE - 0.01, 2, 3);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerSegmentHelp);
  });

  it("should add a new line and a segment when new segment *is not* continuous", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);


    state.staffEl.object3D.position.set(1,0.5,3);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    const segment = state.barriers[0].segments[state.barriers[0].segments.length-1];
    expect(segment.center.x).toBeCloseTo(1, 6);
    expect(segment.center.y).toBeCloseTo(2.34, 6);
    expect(segment.center.z).toBeCloseTo(3, 6);
    expect(segment.length).toBeCloseTo(1.5, 6);
    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(2,3,4);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines.length).toEqual(2);
    expect(state.barriers[0].lines[1].points.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);


    state.staffEl.object3D.position.set(3,2,1);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[1].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(2);
    const segment2 = state.barriers[0].segments[state.barriers[0].segments.length-1];
    expect(segment2.a).toEqual(new THREE.Vector3(2, 3+TIP_LENGTH, 4));
    expect(segment2.b).toEqual(new THREE.Vector3(3, 2+TIP_LENGTH, 1));
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(state.barriers[0].mana).toBeNull();
  });

  it("should append to line and add segment when new segment *is* continuous", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);


    state.staffEl.object3D.position.set(2,3,4);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    const segment = state.barriers[0].segments[state.barriers[0].segments.length-1];
    expect(segment.center.x).toBeCloseTo(1.5, 6);
    expect(segment.center.y).toBeCloseTo(2.5+TIP_LENGTH, 6);
    expect(segment.center.z).toBeCloseTo(3.5, 6);
    expect(segment.length).toBeCloseTo(Math.sqrt(3), 6);
    // expect(segment.angle).toBeCloseTo(0.61548, 4);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);


    state.staffEl.object3D.position.set(2.02, 3.02, 4.02);   // snaps to 2, 3, 4

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);


    state.staffEl.object3D.position.set(3, 5, 7);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(3);
    expect(state.barriers[0].segments.length).toEqual(2);
    const segment2 = state.barriers[0].segments[1];
    expect(segment2.center.x).toBeCloseTo(2.5, 6);
    expect(segment2.center.y).toBeCloseTo(4+TIP_LENGTH, 6);
    expect(segment2.center.z).toBeCloseTo(5.5, 6);
    expect(segment2.length).toBeCloseTo(3.74166, 4);
    // expect(segment2.angle).toBeCloseTo(0.56394, 4);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(state.barriers[0].mana).toBeNull();
  });

  it("should end barrier when template recognized", () => {
    const showTrainingSpy = spyOn(AFRAME.stateParam.handlers, 'showTraining');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(1, 0, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, -1, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(0,1,0);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0.58779,-0.80902,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(-0.95106,0.30902,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0.95106,0.30902,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(3);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();

    state.staffEl.object3D.position.set(-0.58779,-0.80902,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(4);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(0,1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].segments.length).toEqual(5);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(state.barriers[0].template).toEqual(pentacleTemplate);
    expect(state.barriers[0].plane).toBeDefined();
    expect(state.barriers[0].plane.normal.x).toBeCloseTo(0, 6);
    expect(state.barriers[0].plane.normal.y).toBeCloseTo(0, 6);
    expect(state.barriers[0].plane.normal.z).toBeCloseTo(1, 6);
    expect(state.barriers[0].color).toEqual(pentacleTemplate.color);
    expect(state.barriers[0].mana).toBeGreaterThan(15000);
    expect(state.barriers.length).toEqual(2);
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[7]).toEqual(6000);
    expect(state.progress.goodSymbols).toEqual(1);
    expect(state.progress.pentacles).toEqual(1);
  });

  it("should not end barrier when template match is poor", () => {
    const showTrainingSpy = spyOn(AFRAME.stateParam.handlers, 'showTraining');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(-0.83,1,0);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0.83, -1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0.83, 1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(-0.83, -1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(3);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(-0.83, 1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(4);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(state.barriers[0].mana).toBeNull();
    expect(state.barriers[0].lines[state.barriers[0].lines.length-1].el.getAttribute('sound').src).toEqual('#fizzle');
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[7]).toEqual(6000);
  });

  it("should start a new barrier if new segment is far from old", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'rightHand'});

    state.staffEl.object3D.position.set(1,2,3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'rightHand'});
    state.staffEl.object3D.position.set(1,0.5,3);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'rightHand'});
    expect(state.barriers[state.barriers.length-1].segments.length).toEqual(1);

    state.staffEl.object3D.position.set(2,3,4);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'rightHand'});
    state.staffEl.object3D.position.set(3,2,1);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'rightHand'});
    expect(state.barriers[state.barriers.length-1].segments.length).toEqual(2);

    state.staffEl.object3D.position.set(7,2,1);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'rightHand'});
    expect(state.barriers[state.barriers.length-1].segments.length).toEqual(0);

    state.staffEl.object3D.position.set(7,2.5,1);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'rightHand'});
    expect(state.barriers[state.barriers.length-1].segments.length).toEqual(1);
  });
});

describe("curveBegin/curveEnd", () => {
  const HALF_SQRT3 = Math.sqrt(3) / 2;
  let state;

  beforeEach(() => {
    state = new MockState();
    AFRAME.stateParam.handlers.cameraEl = new MockElement();
    AFRAME.stateParam.handlers.cameraPos = new THREE.Vector3();
    AFRAME.stateParam.handlers.fadeEls = [];
    AFRAME.stateParam.handlers.lightTimeout = null;
  });

  it("should discard circles where all points same", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard circles where all points same, without removing previous points", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1,2,3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1,2,4);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);   // re-uses point

    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard arcs where second point same as first", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    state.staffEl.object3D.position.set(0, 0, 0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard arcs where third point same as second", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    state.staffEl.object3D.position.set(0, 0, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);

    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(0);   // discards points
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);   // discards arc
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard arcs where third point same as second, without removing previous points", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1,2,3);
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);   // re-uses point

    state.staffEl.object3D.position.set(0, 2, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(3);

    state.staffEl.object3D.position.set(0, 2, 0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);   // discards points
    expect(state.barriers[0].segments.length).toEqual(1);
    expect(state.barriers[0].arcs.length).toEqual(0);   // discards arc
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard tiny arcs", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1, 2, 3);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    state.staffEl.object3D.position.set(1, 2.01, 3 + SNAP_DISTANCE - 0.01);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);

    state.staffEl.object3D.position.set(1, 2, 3 + SNAP_DISTANCE*2 - 0.01);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should discard tiny circles", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(1, 2, 3);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(1);

    state.staffEl.object3D.position.set(1, 2 + 0.7*SNAP_DISTANCE*2, 3.00);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(2);

    state.staffEl.object3D.position.set(1, 2 + 0.7*SNAP_DISTANCE*2, 3 + 0.7*SNAP_DISTANCE*2);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    expect(state.barriers[0].lines[0].points.length).toEqual(3);

    state.staffEl.object3D.position.set(1, 2, 3 + SNAP_DISTANCE - 0.01);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(playHelpSpy).toHaveBeenCalledWith(state.staffEl, state.drawLargerCurveHelp);
  });

  it("should end barrier when template w/ arcs recognized", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');
    const showTrainingSpy = spyOn(AFRAME.stateParam.handlers, 'showTraining');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(0);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(0, 1,0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0,0,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, -0.5, -HALF_SQRT3);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toBeGreaterThan(10);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(1);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(playHelpSpy).not.toHaveBeenCalled();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(1);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(0,0,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, -0.5, HALF_SQRT3);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(2);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0,0,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(3);
    expect(state.barriers[0].circles.length).toEqual(0);
    expect(state.barriers[0].template).toEqual(triquetraTemplate);
    expect(state.barriers[0].plane).toBeDefined();
    expect(state.barriers[0].plane.normal.x).toBeCloseTo(-1, 6);
    expect(state.barriers[0].plane.normal.y).toBeCloseTo(0, 6);
    expect(state.barriers[0].plane.normal.z).toBeCloseTo(0, 6);
    expect(state.barriers[0].color).toEqual(triquetraTemplate.color);
    expect(state.barriers[0].mana).toBeGreaterThan(15000);
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[7]).toEqual(6000);
    expect(state.barriers.length).toEqual(2);
    expect(state.progress.goodSymbols).toEqual(1);
    expect(state.progress.triquetras).toEqual(1);
  });

  it("should end barrier when template w/ circles recognized", () => {
    const playHelpSpy = spyOn(AFRAME.stateParam.handlers, 'playHelp');
    const createPortalSpy = spyOn(AFRAME.stateParam.handlers, 'createPortal');
    const showTrainingSpy = spyOn(AFRAME.stateParam.handlers, 'showTraining');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(0);

    state.staffEl.object3D.position.set(0, -1.57735,0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(-0.5, 0.28868,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0.5, 0.28868, 0);
    AFRAME.stateParam.handlers.iterate(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0, -1.57735,0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(playHelpSpy).not.toHaveBeenCalled();
    expect(createPortalSpy).not.toHaveBeenCalled();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(-1.5, 0.28868, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(1);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(createPortalSpy).not.toHaveBeenCalled();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(0.5, 0.28868,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, -0.57735,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(-1.5, 0.28868, 0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(2);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(createPortalSpy).not.toHaveBeenCalled();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(1.5, 0.28868,0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(-0.5, 0.28868,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(0, -0.57735,0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    state.staffEl.object3D.position.set(1.67, 0.28868,0);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].segments.length).toEqual(0);
    expect(state.barriers[0].arcs.length).toEqual(0);
    expect(state.barriers[0].circles.length).toEqual(3);
    expect(state.barriers[0].template).toEqual(borromeanRingsTemplate);
    expect(state.barriers[0].plane).toBeDefined();
    expect(state.barriers[0].plane.normal.x).toBeCloseTo(0, 6);
    expect(state.barriers[0].plane.normal.y).toBeCloseTo(0, 6);
    expect(state.barriers[0].plane.normal.z).toBeCloseTo(1, 6);
    expect(state.barriers[0].color).toEqual(borromeanRingsTemplate.color);
    expect(state.barriers[0].mana).toBeGreaterThan(15000);
    expect(createPortalSpy).toHaveBeenCalled();
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[7]).toEqual(6000);
    expect(state.barriers.length).toBe(2);
    expect(state.progress.goodSymbols).toEqual(1);
  });

  it("should start a new barrier if new arc is far from old", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});

    state.staffEl.object3D.position.set(0, 1, 0);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(0, 0, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    state.staffEl.object3D.position.set(0, -0.5, -HALF_SQRT3);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers[state.barriers.length-1].arcs.length).toEqual(1);

    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    state.staffEl.object3D.position.set(0, 0, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    state.staffEl.object3D.position.set(0, -0.5, HALF_SQRT3);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers[state.barriers.length-1].arcs.length).toEqual(2);


    state.staffEl.object3D.position.set(4, -0.5, HALF_SQRT3);
    AFRAME.stateParam.handlers.curveBegin(state, {handId: 'leftHand'});
    expect(state.barriers[state.barriers.length-1].arcs.length).toEqual(0);
    state.staffEl.object3D.position.set(4, 0, 0);
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});
    state.staffEl.object3D.position.set(4, 0.5, HALF_SQRT3);
    AFRAME.stateParam.handlers.curveEnd(state, {handId: 'leftHand'});
    expect(state.barriers[state.barriers.length-1].arcs.length).toEqual(1);
  });
});

describe("destroyStaff", () => {
  let state;
  const OLD_CREATURES_DEFEATED = 10;

  beforeEach(() => {
    state = new MockState();
    state.consecutiveCreaturesDefeated = OLD_CREATURES_DEFEATED;
    state.totalCreaturesDefeated = OLD_CREATURES_DEFEATED;
    AFRAME.stateParam.handlers.cameraEl = new MockElement();
    AFRAME.stateParam.handlers.cameraPos = new THREE.Vector3();
    AFRAME.stateParam.handlers.fadeEls = [];
    AFRAME.stateParam.handlers.lightTimeout = null;
  });

  it("should prevent magic", () => {
    AFRAME.stateParam.handlers.destroyStaff(state, {});

    expect(state.staffEl).toBeFalsy();
    expect(state.tipPosition.x).toBeGreaterThanOrEqual(1000);
    expect(state.tipPosition.z).toBeGreaterThanOrEqual(1000);
    expect(state.tipPosition.y).toBeGreaterThanOrEqual(1);
    expect(state.staffHandId).toEqual("");
    expect(state.consecutiveCreaturesDefeated).toEqual(0);
    expect(state.totalCreaturesDefeated).toEqual(OLD_CREATURES_DEFEATED);

    state.straighting = true;
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    expect(state.tipPosition.x).toBeGreaterThanOrEqual(1000);

    state.straighting = false;
    state.curving = true;
    AFRAME.stateParam.handlers.iterate(state, {timeDelta: 1000});

    expect(state.tipPosition.x).toBeGreaterThanOrEqual(1000);

    AFRAME.stateParam.handlers.grabStaff(state, {handId: 'leftHand'})

    expect(state.staffHandId).toEqual("");

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'})

    expect(state.barriers.length).toEqual(0);
  });
})

// unit tests for state handling for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

require('./support/three.min');
const {AFRAME, MockElement} = require('./aframe-stub');
math = require('../src/math');
require('../src/state');

global.SegmentStraight = math.SegmentStraight;
global.matchSegmentsAgainstTemplates = math.matchSegmentsAgainstTemplates;
global.pentagramTemplate = math.pentagramTemplate;

const TIP_LENGTH = 1.09;

describe("straightBegin/straightEnd", () => {
  let state;

  beforeEach(() => {
    state = {
      staffEl: new MockElement({}),
      straighting: false,
      curving: false,
      tipPosition: new THREE.Vector3(),
      lastTipPosition: new THREE.Vector3(),
      inProgress: {},
      barriers: [],
      trainingEls: [],
      scoreEls: []
    };
    state.inProgress.geometry = new THREE.BufferGeometry();
    state.inProgress.material = new THREE.LineBasicMaterial({color: 'gray'});
    state.inProgress.line = new THREE.Line(state.inProgress.geometry, state.inProgress.material);
    state.inProgress.el = new MockElement({});
    state.inProgress.el.setObject3D('line', state.inProgress.line);
  });

  it("should add a new line and a segment when new segment *is not* continuous", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(0);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(1,0.5,3);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    const segment = state.barriers[0].segmentsStraight[state.barriers[0].segmentsStraight.length-1];
    expect(segment.center.x).toBeCloseTo(1, 6);
    expect(segment.center.y).toBeCloseTo(2.34, 6);
    expect(segment.center.z).toBeCloseTo(3, 6);
    expect(segment.length).toBeCloseTo(1.5, 6);
    expect(segment.angle).toBeCloseTo(Math.PI/2, 6);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(2,3,4);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines.length).toEqual(2);
    expect(state.barriers[0].lines[1].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(3,2,1);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[1].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(2);
    const segment2 = state.barriers[0].segmentsStraight[state.barriers[0].segmentsStraight.length-1];
    expect(segment2.a).toEqual(new THREE.Vector3(2, 3+TIP_LENGTH, 4));
    expect(segment2.b).toEqual(new THREE.Vector3(3, 2+TIP_LENGTH, 1));
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(state.barriers[0].mana).toBeNull();
  });

  it("should append to line and add segment when new segment *is* continuous", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(0);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(2,3,4);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    const segment = state.barriers[0].segmentsStraight[state.barriers[0].segmentsStraight.length-1];
    expect(segment.center.x).toBeCloseTo(1.5, 6);
    expect(segment.center.y).toBeCloseTo(2.5+TIP_LENGTH, 6);
    expect(segment.center.z).toBeCloseTo(3.5, 6);
    expect(segment.length).toBeCloseTo(Math.sqrt(3), 6);
    // expect(segment.angle).toBeCloseTo(0.61548, 4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(2.03, 3.03, 4.03);   // snaps to 2, 3, 4

    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(3, 5, 7);

    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].lines[0].points.length).toEqual(3);
    expect(state.barriers[0].segmentsStraight.length).toEqual(2);
    const segment2 = state.barriers[0].segmentsStraight[1];
    expect(segment2.center.x).toBeCloseTo(2.5, 6);
    expect(segment2.center.y).toBeCloseTo(4+TIP_LENGTH, 6);
    expect(segment2.center.z).toBeCloseTo(5.5, 6);
    expect(segment2.length).toBeCloseTo(3.74166, 4);
    // expect(segment2.angle).toBeCloseTo(0.56394, 4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(state.barriers[0].mana).toBeNull();
  });

  const WHITE = new THREE.Color('white');

  it("should end barrier when template recognized", () => {
    const showTrainingSpy = spyOn(AFRAME.stateParam.handlers, 'showTraining');

    AFRAME.stateParam.handlers.magicBegin(state, {handId: 'leftHand'});

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
    expect(state.barriers[0].segmentsStraight.length).toEqual(3);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();

    state.staffEl.object3D.position.set(-0.58779,-0.80902,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});
    AFRAME.stateParam.handlers.straightBegin(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(0,1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers[0].segmentsStraight.length).toEqual(5);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(state.barriers[0].template).toEqual(pentagramTemplate);
    expect(state.barriers[0].color).toEqual(pentagramTemplate.color);
    expect(state.barriers[0].mana).toBeGreaterThan(15000);
    expect(state.barriers.length).toEqual(2);
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[5]).toEqual(6000);
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
    expect(state.barriers[0].segmentsStraight.length).toEqual(3);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(showTrainingSpy).not.toHaveBeenCalled();

    state.staffEl.object3D.position.set(-0.83, 1,0);
    AFRAME.stateParam.handlers.straightEnd(state, {handId: 'leftHand'});

    expect(state.barriers.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
    expect(WHITE.equals(state.barriers[0].color)).toBeTruthy();
    expect(state.barriers[0].mana).toBeNull();
    expect(state.barriers[0].lines[state.barriers[0].lines.length-1].el.getAttribute('sound').src).toEqual('#fizzle');
    expect(showTrainingSpy).toHaveBeenCalled();
    expect(showTrainingSpy.calls.argsFor(0)[5]).toEqual(6000);
  });
});

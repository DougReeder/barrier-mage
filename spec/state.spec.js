// unit tests for state handling for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

require('./support/three.min');
const {AFRAME, MockElement} = require('./aframe-stub');
math = require('../src/math');
require('../src/state');

global.newSegmentStraight = math.newSegmentStraight;
global.matchSegmentsAgainstTemplates = math.matchSegmentsAgainstTemplates;

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
      centroidPt: null,
    };
    state.inProgress.geometry = new THREE.BufferGeometry();
    state.inProgress.material = new THREE.LineBasicMaterial({color: 'gray'});
    state.inProgress.line = new THREE.Line(state.inProgress.geometry, state.inProgress.material);
    state.inProgress.el = new MockElement({});
    state.inProgress.el.setObject3D('line', state.inProgress.line);
  });

  it("should add a new line and a segment when new segment *is not* continuous", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(0);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(1,0.5,3);

    AFRAME.stateParam.handlers.straightEnd(state, {});

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

    AFRAME.stateParam.handlers.straightBegin(state, {});

    expect(state.barriers[0].lines.length).toEqual(2);
    expect(state.barriers[0].lines[1].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(3,2,1);

    AFRAME.stateParam.handlers.straightEnd(state, {});

    expect(state.barriers[0].lines[1].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(2);
    const segment2 = state.barriers[0].segmentsStraight[state.barriers[0].segmentsStraight.length-1];
    expect(segment2.center.x).toBeCloseTo(2.5, 6);
    expect(segment2.center.y).toBeCloseTo(2.5+TIP_LENGTH, 6);
    expect(segment2.center.z).toBeCloseTo(2.5, 6);
    expect(segment2.length).toBeCloseTo(3.31662, 4);
    expect(segment2.angle).toBeCloseTo(0.30628, 4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
  });

  it("should append to line and add segment when new segment *is* continuous", () => {
    AFRAME.stateParam.handlers.magicBegin(state, {});


    state.staffEl.object3D.position.set(1,2,3);

    AFRAME.stateParam.handlers.straightBegin(state, {});

    expect(state.barriers[0].lines[0].points.length).toEqual(1);
    expect(state.barriers[0].segmentsStraight.length).toEqual(0);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(2,3,4);

    AFRAME.stateParam.handlers.straightEnd(state, {});

    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    const segment = state.barriers[0].segmentsStraight[state.barriers[0].segmentsStraight.length-1];
    expect(segment.center.x).toBeCloseTo(1.5, 6);
    expect(segment.center.y).toBeCloseTo(2.5+TIP_LENGTH, 6);
    expect(segment.center.z).toBeCloseTo(3.5, 6);
    expect(segment.length).toBeCloseTo(Math.sqrt(3), 6);
    expect(segment.angle).toBeCloseTo(0.61548, 4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(2.03, 3.03, 4.03);   // snaps to 2, 3, 4

    AFRAME.stateParam.handlers.straightBegin(state, {});

    expect(state.barriers[0].lines.length).toEqual(1);
    expect(state.barriers[0].lines[0].points.length).toEqual(2);
    expect(state.barriers[0].segmentsStraight.length).toEqual(1);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);


    state.staffEl.object3D.position.set(3, 5, 7);

    AFRAME.stateParam.handlers.straightEnd(state, {});

    expect(state.barriers[0].lines[0].points.length).toEqual(3);
    expect(state.barriers[0].segmentsStraight.length).toEqual(2);
    const segment2 = state.barriers[0].segmentsStraight[1];
    expect(segment2.center.x).toBeCloseTo(2.5, 6);
    expect(segment2.center.y).toBeCloseTo(4+TIP_LENGTH, 6);
    expect(segment2.center.z).toBeCloseTo(5.5, 6);
    expect(segment2.length).toBeCloseTo(3.74166, 4);
    expect(segment2.angle).toBeCloseTo(0.56394, 4);
    expect(state.barriers[0].segmentsCurved.length).toEqual(0);
  });
});

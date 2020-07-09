// state.js - state model for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

// math.js must be in a script before this.

function isDesktop() {
  return ! (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR());
}

const pentagramTemplate = [new THREE.Vector3(0,1,0), new THREE.Vector3(0.58779,-0.80902,0), new THREE.Vector3(-0.95106,0.30902,0), new THREE.Vector3(0.95106,0.30902,0), new THREE.Vector3(-0.58779,-0.80902), new THREE.Vector3(0,1,0)];

const STRAIGHT_PROXIMITY_SQ = 0.01;   // when drawing straight sections; square of 0.1 m
const CURVE_END_PROXIMITY_SQ = 0.0016;   // when beginning/ending curved sections; square of 0.04 m
const CURVE_PROXIMITY_SQ = 0.0004;   // when drawing curved sections; square of 0.02 m

AFRAME.registerState({
  initialState: {
    rigEl: null,
    leftHandEl: null,
    rightHandEl: null,
    staffEl: null,
    staffHandId: "",   // or "leftHand" or "rightHand"
    straighting: false,
    curving: false,
    tipPosition: null,
    lastTipPosition: null,
    inProgress: {},
    barriers: [],
    colors: ["red", "orange", "yellow", "green", "blue", "violet"],
    centroidPt: null,
  },

  handlers: {
    setRigEl: function (state, rigEl) {
      state.rigEl = rigEl;
      state.leftHandEl = document.getElementById("leftHand");
      state.rightHandEl = document.getElementById("rightHand");
      if (isDesktop()) {
        state.leftHandEl.setAttribute('hand-controls', 'handModelStyle', 'highPoly');
        state.rightHandEl.setAttribute('hand-controls', 'handModelStyle', 'highPoly');
      }
      state.staffEl = document.getElementById('staff');
      state.tipPosition = new THREE.Vector3();
      state.lastTipPosition = new THREE.Vector3();

      state.inProgress.geometry = new THREE.BufferGeometry();
      state.inProgress.material = new THREE.LineBasicMaterial({color: 'gray'});
      state.inProgress.line = new THREE.Line(state.inProgress.geometry, state.inProgress.material);
      state.inProgress.el = document.createElement('a-entity');
      state.inProgress.el.setObject3D('line', state.inProgress.line);
      AFRAME.scenes[0].appendChild(state.inProgress.el);
      console.log("state.inProgress.el.object3D:", state.inProgress.el.object3D);

      state.centroidPt = new THREE.Vector3();
    },

    /** event from gesture component on hand */
    grabStaff: function (state, evt) {
      state.staffEl.parentNode.removeChild(state.staffEl);
      state.staffEl = document.createElement('a-entity');
      state.staffEl.setAttribute('gltf-model', "#staffModel");
      if ('leftHand' === evt.handId) {
        state.staffEl.setAttribute('position', '0.01 0 0');
        state.staffEl.setAttribute('rotation', '-40 0 10');
        state.leftHandEl.appendChild(state.staffEl);
      } else {
        state.staffEl.setAttribute('position', '-0.02 0 0');
        state.staffEl.setAttribute('rotation', '-40 0 -10');
        state.rightHandEl.appendChild(state.staffEl);
      }
      state.staffHandId = evt.handId;
    },

    magicBegin: function (state, evt) {
      console.log("magicBegin:", evt.handId);
      state.barriers.push({
        color: state.colors[(state.barriers.length) % state.colors.length],
        lines: [],
      });
    },

    straightBegin: function (state, evt) {
      console.log("straightBegin:", evt.handId);

      this.snapTipPosition(state);

      state.inProgress.points = [state.tipPosition.clone(), state.tipPosition.clone()];
      state.inProgress.geometry.setFromPoints(state.inProgress.points);
      state.inProgress.geometry.computeBoundingSphere();

      this.createNewLineIfNeeded(state, STRAIGHT_PROXIMITY_SQ);

      state.lastTipPosition.copy(state.tipPosition);

      state.straighting = true;
    },

    straightEnd: function (state, evt) {
      console.log("straightEnd:", evt.handId);
      state.straighting = false;

      this.snapTipPosition(state);

      state.inProgress.points = [state.tipPosition.clone(), state.tipPosition.clone()];
      state.inProgress.geometry.setFromPoints(state.inProgress.points);
      state.inProgress.geometry.computeBoundingSphere();

      this.appendTipPositionToBarrier(state);
    },

    curveBegin: function (state, evt) {
      console.log("curveBegin:", evt.handId);

      this.snapTipPosition(state, CURVE_END_PROXIMITY_SQ);

      this.createNewLineIfNeeded(state, CURVE_END_PROXIMITY_SQ);

      state.lastTipPosition.copy(state.tipPosition);
      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      line.curveBeginInd = line.points.length-1;

      state.curving = true;
    },

    curveEnd: function (state, evt) {
      console.log("curveEnd:", evt.handId);
      state.curving = false;

      this.snapTipPosition(state, CURVE_END_PROXIMITY_SQ);

      this.appendTipPositionToBarrier(state);

      // smooths the curve
      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      const sampledPoints = [];
      for (let i=line.curveBeginInd; i<line.points.length; i+=5) {
        sampledPoints.push(line.points[i]);
      }
      sampledPoints.push(line.points[line.points.length-1]);
      const curve = new THREE.CatmullRomCurve3(sampledPoints);
      const newPoints = curve.getPoints(line.points.length - line.curveBeginInd);
      line.points.splice(line.curveBeginInd, line.points.length, ...newPoints);
      line.geometry.setFromPoints(line.points);
      line.geometry.computeBoundingSphere();
    },

    snapTipPosition: function (state, proximitySq = STRAIGHT_PROXIMITY_SQ) {
      state.staffEl.object3D.updateMatrixWorld();
      state.tipPosition.set(0, 1.09, 0);   // relative to hand
      state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

      const barrier = state.barriers[state.barriers.length - 1];
      let closestDistanceSq = Number.POSITIVE_INFINITY;
      barrier.lines.forEach(line => {
        line.points.forEach(point => {
          const distanceSq = state.tipPosition.distanceToSquared(point);
          if (distanceSq <= proximitySq && distanceSq < closestDistanceSq) {
            state.tipPosition.copy(point);
            closestDistanceSq = distanceSq;
          }
        });
      });
    },

    createNewLineIfNeeded: function (state, proximitySq = STRAIGHT_PROXIMITY_SQ) {
      const barrier = state.barriers[state.barriers.length-1];
      let distSqToLast = Number.POSITIVE_INFINITY;
      if (barrier.lines.length > 0) {
        const points = barrier.lines[barrier.lines.length-1].points;
        if (points.length > 0) {
          distSqToLast = state.tipPosition.distanceToSquared(points[points.length-1]);
        }
      }
      if (distSqToLast <= proximitySq) {   // appends to existing line
        console.log("appending to existing line", barrier.lines.length-1);
      } else {   // creates new line
        console.log("creating new line", barrier.lines.length, barrier.color);
        barrier.lines.push({
          points: [state.tipPosition.clone()],
          geometry: new THREE.BufferGeometry(),
          material: new THREE.LineBasicMaterial({color: barrier.color}),
        });
      }
    },

    magicEnd: function (state, evt) {
      console.log("magicEnd:", evt.handId);
    },

    iterate: function (state, action) {
      state.staffEl.object3D.updateMatrixWorld();
      state.tipPosition.set(0, 1.09, 0);   // relative to hand
      state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

      if (state.straighting) {
        state.inProgress.points[1].copy(state.tipPosition);
        state.inProgress.geometry.setFromPoints(state.inProgress.points);
        state.inProgress.geometry.computeBoundingSphere();
      } else if (state.curving) {
        const distSq = state.tipPosition.distanceToSquared(state.lastTipPosition);
        // console.log("tipPosition:", JSON.stringify(state.tipPosition), "   distSq:", distSq);
        if (distSq >= CURVE_PROXIMITY_SQ) {
          this.appendTipPositionToBarrier(state);
          state.lastTipPosition.copy(state.tipPosition);
        }
      }
    },

    appendTipPositionToBarrier: function updateBarrier(state) {
      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      line.points.push(state.tipPosition.clone());

      if (line.points.length >= 2) {   // TODO: when code is complete this should always true by now
        line.geometry.setFromPoints(line.points);
        line.geometry.computeBoundingSphere();

        if (!line.line) {
          line.line = new THREE.Line(line.geometry, line.material);
          line.el = document.createElement('a-entity');
          line.el.setObject3D('line', line.line);
          AFRAME.scenes[0].appendChild(line.el);
          console.log("line.el.object3D:", line.el.object3D);
        }
      }

      if (line.points.length === pentagramTemplate.length) {   // compare to template
        const transformedTemplate = pentagramTemplate.map(p => new THREE.Vector3().copy(p));
        transformTemplateToActual(line.points, transformedTemplate);
        for (let i=1; i<transformedTemplate.length; ++i) {   // presume closed template
          const dotEl = document.createElement('a-entity');
          dotEl.setAttribute('geometry', 'primitive:tetrahedron; radius:0.01');
          dotEl.setAttribute('material', 'shader:flat; color:white; fog:false;');
          dotEl.object3D.position.copy(transformedTemplate[i]);
          AFRAME.scenes[0].appendChild(dotEl);

          // const numberEl = document.createElement('a-text');
          // numberEl.setAttribute('value', i + 1);
          // numberEl.object3D.position.copy(transformedTemplate[i]);
          // numberEl.setAttribute('look-at', "[camera]");
          // AFRAME.scenes[0].appendChild(numberEl);
        }

        const score = 1 / (rmsd(line.points, transformedTemplate) / transformedTemplate.scale);
        calcCentroid(line.points, state.centroidPt);
        console.log("score:", score, "   centroid:", JSON.stringify(state.centroidPt));
        const scoreEl = document.createElement('a-text');
        scoreEl.setAttribute('value', score.toPrecision(2));
        scoreEl.object3D.position.copy(state.centroidPt);
        scoreEl.setAttribute('align', 'center');
        scoreEl.setAttribute('baseline', 'top');
        scoreEl.setAttribute('color', 'black');
        scoreEl.setAttribute('look-at', "[camera]");
        AFRAME.scenes[0].appendChild(scoreEl);
      }

    }
  }
});


AFRAME.registerComponent('rig-tick-state', {
  init: function () {
    AFRAME.scenes[0].emit('setRigEl', this.el);
  },

  tick: function (time, timeDelta) {
    AFRAME.scenes[0].emit('iterate', {time: time, timeDelta: timeDelta});
  }
});

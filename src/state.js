// state.js - state model for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

function isDesktop() {
  return ! (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR());
}

AFRAME.registerState({
  initialState: {
    rigEl: null,
    leftHandEl: null,
    rightHandEl: null,
    staffEl: null,
    staffHandId: "",   // or "leftHand" or "rightHand"
    tracing: false,
    tipPosition: null,
    lastTipPosition: null,
    barriers: [],
    currentBarrierInd: -1,
    curve: null,
    colors: ["red", "orange", "yellow", "green", "blue", "violet"]
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
      state.curve = new THREE.CatmullRomCurve3([], false);
    },

    /** event from gesture component on hand */
    grabStaff: function (state, evt) {
      console.log("state grabStaff:", arguments);
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
      if (evt.handId === state.staffHandId) {
        state.staffEl.object3D.updateMatrixWorld();
        state.lastTipPosition.set(0, 1.09, 0);
        state.lastTipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);
        console.log("lastTipPosition:", JSON.stringify(state.lastTipPosition));
        state.barriers[++state.currentBarrierInd] = {
          guidePoints: [state.lastTipPosition.clone()],
          geometry: new THREE.BufferGeometry(),
          material: new THREE.LineBasicMaterial({color: state.colors[(state.currentBarrierInd) % state.colors.length]}),
        };
        state.tracing = true;
      } else {
      }
      console.log("magicBegin:", evt.handId, state.tracing);
    },

    magicEnd: function (state, evt) {
      if (evt.handId === state.staffHandId) {
        state.tracing = false;
      } else {
      }
      console.log("magicEnd:", evt.handId, state.tracing);
    },

    iterate: function (state, action) {
      if (state.tracing) {
        state.staffEl.object3D.updateMatrixWorld();
        state.tipPosition.set(0, 1.09, 0);   // relative to hand
        state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

        const distSq = state.tipPosition.distanceToSquared(state.lastTipPosition);
        // console.log("tipPosition:", JSON.stringify(state.tipPosition), "   distSq:", distSq);
        if (distSq >= 0.0016) {
          updateBarrier();
          state.lastTipPosition.copy(state.tipPosition);
        }
      }

      function updateBarrier() {
        const barrier = state.barriers[state.currentBarrierInd];
        barrier.guidePoints.push(state.tipPosition.clone());
        state.curve.points = barrier.guidePoints;
        const points = state.curve.getPoints(Math.max(barrier.guidePoints.length, 100));
        console.log("points:", points);
        barrier.geometry.setFromPoints(points);
        barrier.geometry.computeBoundingSphere();

        if (!barrier.line) {
          barrier.line = new THREE.Line(barrier.geometry, barrier.material);
          barrier.el = document.createElement('a-entity');
          barrier.el.setObject3D('line', barrier.line);
          AFRAME.scenes[0].appendChild(barrier.el);
          console.log("barrier.el.object3D:", barrier.el.object3D);
        }

        const dotEl = document.createElement('a-entity');
        dotEl.setAttribute('geometry', 'primitive:tetrahedron; radius:0.01');
        dotEl.setAttribute('material', 'shader:flat; color:white; fog:false;');
        dotEl.setAttribute('position', state.tipPosition);
        AFRAME.scenes[0].appendChild(dotEl);
      }
    },
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

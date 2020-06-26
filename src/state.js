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
    traceStartInd: null,
    barriers: [],
    currentBarrierInd: -1,
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
      state.barriers[++state.currentBarrierInd] = {
        guidePoints: [],
        geometry: new THREE.BufferGeometry(),
        material: new THREE.LineBasicMaterial({color: state.colors[(state.currentBarrierInd) % state.colors.length]}),
      };
    },

    traceBegin: function (state, evt) {
      console.log("traceStart:", evt.handId);
      state.staffEl.object3D.updateMatrixWorld();
      state.tipPosition.set(0, 1.09, 0);   // relative to hand
      state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

      const barrier = state.barriers[state.currentBarrierInd];
      let closestPoint = new THREE.Vector3();
      let closestDistanceSq = Number.POSITIVE_INFINITY;
      barrier.guidePoints.forEach(point => {
        const distanceSq = state.tipPosition.distanceToSquared(point);
        if (distanceSq <= 0.01 && distanceSq < closestDistanceSq) {
          closestPoint.copy(point);
          closestDistanceSq = distanceSq;
        }
      });
      if (closestDistanceSq <= 0.01) {
        state.tipPosition.copy(closestPoint);
        console.log("re-using", JSON.stringify(closestPoint));
      }

      this.updateBarrier(state);
      state.lastTipPosition.copy(state.tipPosition);
      state.traceStartInd = barrier.guidePoints.length-1;

      state.tracing = true;
    },

    traceEnd: function (state, evt) {
      console.log("traceEnd:", evt.handId);
      state.tracing = false;

      const barrier = state.barriers[state.currentBarrierInd];
      const traceStartPosition = barrier.guidePoints[state.traceStartInd];
      const allNear = barrier.guidePoints.slice(state.traceStartInd).every(point => point.distanceToSquared(traceStartPosition) <= 0.01);
      if (allNear) {
        barrier.guidePoints.length = state.traceStartInd+1;
        console.log("eliminating wiggle points", barrier.guidePoints.length);
      }
    },

    magicEnd: function (state, evt) {
      console.log("magicEnd:", evt.handId);
    },

    iterate: function (state, action) {
      if (state.tracing) {
        state.staffEl.object3D.updateMatrixWorld();
        state.tipPosition.set(0, 1.09, 0);   // relative to hand
        state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

        const distSq = state.tipPosition.distanceToSquared(state.lastTipPosition);
        // console.log("tipPosition:", JSON.stringify(state.tipPosition), "   distSq:", distSq);
        if (distSq >= 0.0016) {
          this.updateBarrier(state);
          state.lastTipPosition.copy(state.tipPosition);
        }
      }
    },

    updateBarrier: function updateBarrier(state) {
      const barrier = state.barriers[state.currentBarrierInd];
      barrier.guidePoints.push(state.tipPosition.clone());

      if (barrier.guidePoints.length >= 2) {
        barrier.geometry.setFromPoints(barrier.guidePoints);
        barrier.geometry.computeBoundingSphere();

        if (!barrier.line) {
          barrier.line = new THREE.Line(barrier.geometry, barrier.material);
          barrier.el = document.createElement('a-entity');
          barrier.el.setObject3D('line', barrier.line);
          AFRAME.scenes[0].appendChild(barrier.el);
          console.log("barrier.el.object3D:", barrier.el.object3D);
        }
      }

      const dotEl = document.createElement('a-entity');
      dotEl.setAttribute('geometry', 'primitive:tetrahedron; radius:0.01');
      dotEl.setAttribute('material', 'shader:flat; color:white; fog:false;');
      dotEl.setAttribute('position', state.tipPosition);
      AFRAME.scenes[0].appendChild(dotEl);
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

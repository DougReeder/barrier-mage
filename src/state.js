// state.js - state model for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

// math.js must be in a script before this.

function isDesktop() {
  return ! (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR());
}

const STRAIGHT_PROXIMITY_SQ = 0.01;   // when drawing straight sections; square of 0.1 m
const CURVE_END_PROXIMITY_SQ = 0.0025;   // when beginning/ending curved sections; square of 0.05 m
const CURVE_PROXIMITY_SQ = 0.0004;   // when drawing curved sections; square of 0.02 m
const WHITE = new THREE.Color('white');
const FADEOUT_DURATION = 15000;
const TRAINING_DURATION = 6000;
const TRAINING_FADE_DURATION = 1000;

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
    trainingEls: [],
    scoreEls: []
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
      // console.log("magicBegin:", evt.handId);
      state.barriers.push({
        color: WHITE,
        lines: [],
        segmentsStraight: [],
        segmentsCurved: [],
        mana: null,   // not yet active
      });
    },

    straightBegin: function (state, evt) {
      // console.log("straightBegin:", evt.handId);

      this.snapTipPosition(state);

      state.inProgress.points = [state.tipPosition.clone(), state.tipPosition.clone()];
      state.inProgress.geometry.setFromPoints(state.inProgress.points);
      state.inProgress.geometry.computeBoundingSphere();

      this.createNewLineIfNeeded(state, STRAIGHT_PROXIMITY_SQ);

      state.lastTipPosition.copy(state.tipPosition);

      state.straighting = true;
    },

    straightEnd: function (state, evt) {
      // console.log("straightEnd:", evt.handId);
      state.straighting = false;

      this.snapTipPosition(state);

      state.inProgress.points = [state.tipPosition.clone(), state.tipPosition.clone()];
      state.inProgress.geometry.setFromPoints(state.inProgress.points);
      state.inProgress.geometry.computeBoundingSphere();

      this.appendTipPositionToBarrier(state);

      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      barrier.segmentsStraight.push(new SegmentStraight(line.points[line.points.length-2],line.points[line.points.length-1]));

      this.matchAndDisplayTemplates(state);
    },

    curveBegin: function (state, evt) {
      // console.log("curveBegin:", evt.handId);

      this.snapTipPosition(state, CURVE_END_PROXIMITY_SQ);

      this.createNewLineIfNeeded(state, CURVE_END_PROXIMITY_SQ);

      state.lastTipPosition.copy(state.tipPosition);
      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      line.curveBeginInd = line.points.length-1;

      state.curving = true;
    },

    curveEnd: function (state, evt) {
      // console.log("curveEnd:", evt.handId);
      state.curving = false;

      this.snapTipPosition(state, CURVE_END_PROXIMITY_SQ);

      this.appendTipPositionToBarrier(state);

      // smooths the curve
      const barrier = state.barriers[state.barriers.length-1];
      const line = barrier.lines[barrier.lines.length-1];
      let arc;
      if (state.tipPosition.distanceToSquared(line.points[line.curveBeginInd]) > STRAIGHT_PROXIMITY_SQ) {
        const midInd = line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) / 2);
        arc = arcFrom3Points(
            line.points[line.curveBeginInd],
            line.points[midInd],
            line.points[line.points.length - 1]
        );
      } else {
        const secondInd = line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) / 3);
        const thirdInd = line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) * 2 / 3);
        arc = arcFrom3Points(
            line.points[line.curveBeginInd],
            line.points[secondInd],
            line.points[thirdInd],
            true
        );
      }
      line.points.splice(line.curveBeginInd, line.points.length, ...arc.points);
      line.geometry.setFromPoints(line.points);
      line.geometry.computeBoundingSphere();

      this.matchAndDisplayTemplates(state);
    },

    snapTipPosition: function (state, proximitySq = STRAIGHT_PROXIMITY_SQ) {
      state.staffEl.object3D.updateMatrixWorld();
      state.tipPosition.set(0, 1.09, 0);   // relative to hand
      state.tipPosition.applyMatrix4(state.staffEl.object3D.matrixWorld);

      const barrier = state.barriers[state.barriers.length - 1];
      if (!barrier) {return;}
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
        // console.log("appending to existing line", barrier.lines.length-1);
      } else {   // creates new line
        // console.log("creating new line", barrier.lines.length, barrier.color);
        barrier.lines.push({
          points: [state.tipPosition.clone()],
          geometry: new THREE.BufferGeometry(),
          material: new THREE.LineBasicMaterial({color: barrier.color, transparent: true}),
        });
      }
    },

    magicEnd: function (state, evt) {
      // console.log("magicEnd:", evt.handId);
      const barrier = state.barriers[state.barriers.length-1];
      if (barrier && ! barrier.template) {
        this.removeBarrier(state, state.barriers.length-1);
      }
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

      state.barriers.forEach((barrier, i) => {
        if (barrier && barrier.mana > 0) {
          barrier.mana -= action.timeDelta * barrier.template.manaUseMultiplier;
          const fraction = Math.max(barrier.mana / FADEOUT_DURATION, 0);
          if (fraction < 1.0) {
            barrier.color.copy(barrier.template.color);
            barrier.color.multiplyScalar(fraction);
            barrier.lines.forEach(line => {
              line.material.opacity = fraction;
              line.material.color.set(barrier.color);
            });

          }
          if (barrier.mana <= 0) {
            this.removeBarrier(state, i);
          }
        }
      });

      state.trainingEls.forEach((trainingEl, i) => {
        if (! trainingEl.hasOwnProperty('fadeRemainingMs')) {
          return;
        }
        trainingEl.fadeRemainingMs -= action.timeDelta;
        const opacity = Math.max(trainingEl.fadeRemainingMs / TRAINING_FADE_DURATION, 0);
        for (let j=0; j<5; ++j) {   // Templates have at most 5 lines.
          const lineAtrbt = trainingEl.getAttribute('line__'+j);
          if (lineAtrbt) {
            Object.assign(lineAtrbt, {opacity: opacity})
            trainingEl.setAttribute('line__'+j, lineAtrbt);
          }
        }

        if (trainingEl.fadeRemainingMs <= 0) {
          trainingEl.parentNode.removeChild(trainingEl);
          // Yes, this skips the next element, but on the next iteration things will be fine.
          state.trainingEls.splice(i, 1);
        }
      });

      state.scoreEls.forEach((scoreEl, i) => {
        if (! scoreEl.hasOwnProperty('fadeRemainingMs')) {
          return;
        }
        scoreEl.fadeRemainingMs -= action.timeDelta;
        const opacity = Math.max(scoreEl.fadeRemainingMs / TRAINING_FADE_DURATION, 0);
        scoreEl.setAttribute('transparent', true);
        scoreEl.setAttribute('opacity', opacity);

        if (scoreEl.fadeRemainingMs <= 0) {
          scoreEl.parentNode.removeChild(scoreEl);
          // Yes, this skips the next element, but on the next iteration things will be fine.
          state.scoreEls.splice(i, 1);
        }
      });
    },

    removeBarrier: function (state, barrierInd) {
      const barrier = state.barriers[barrierInd];
      console.log("removing barrier:", barrier);
      barrier.lines.forEach(line => {
        line.el.removeObject3D('line');
        line.el.parentNode.removeChild(line.el);
      });
      state.barriers[barrierInd] = null;  // can't splice out if we're looping
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
          // console.log("line.el.object3D.position:", line.el.object3D.position);
        }
      }
    },

    matchAndDisplayTemplates: function (state) {
      const barrier = state.barriers[state.barriers.length - 1];

      const [score, rawScore, template, centroid, bestSegmentsStraightXformed] = matchSegmentsAgainstTemplates(barrier.segmentsStraight, barrier.segmentsCurved);

      if (template && score >= 0) {
        barrier.mana = 25000 + score * 30000;

        barrier.template = template;
        barrier.color = template.color.clone();
        barrier.lines.forEach(line => {
          line.material.color.set(barrier.color);
        });
        this.magicEnd(state, {handId: state.staffHandId});
        this.magicBegin(state, {handId: state.staffHandId});

        const line = barrier.lines[barrier.lines.length-1];
        line.el.setAttribute('sound', {src: template.audioTag, autoplay: true, refDistance:2.0});

        switch (template.name) {
          case "dagaz":
            barrier.mana = FADEOUT_DURATION;

            let lightEl = state.staffEl.querySelector('[light]');
            if (!lightEl) {
              // console.log("making staff glow");
              lightEl = document.createElement('a-entity');
              lightEl.setAttribute('light', {type: 'point', intensity: 3.0, distance: 20});
              lightEl.setAttribute('material', {shader: 'flat', color: '#F3E5AB'});
              lightEl.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 0.03,
                segmentsHeight: 12,
                segmentsWidth: 24
              });
              lightEl.setAttribute('position', '0, 1.18, 0');   // relative to hand
              state.staffEl.appendChild(lightEl);

              const glowEl = document.createElement('a-entity');
              glowEl.setAttribute('material', {color: '#F3E5AB', transparent: true, opacity: 0.25});
              glowEl.setAttribute('geometry', {primitive: 'sphere', radius: 0.10});
              glowEl.setAttribute('position', '0, 1.18, 0');   // relative to hand
              state.staffEl.appendChild(glowEl);
            }
            break;
        }
      } else if (template && score >= -2.5) {   // fizzle
        const line = barrier.lines[barrier.lines.length-1];
        line.el.setAttribute('sound', {src: '#fizzle', autoplay: true, volume: 0.75});
      }
      if (template && score >= -2.5) {   // success or fizzle
        console.log("name:", template.name, "   score:", score, "   minScore:", template.minScore, "   mana:", barrier.mana ? Math.round(barrier.mana) : barrier.mana);

        let duration;
        if (barrier.mana) {
          duration = Math.min(barrier.mana/template.manaUseMultiplier, TRAINING_DURATION);
        } else {
          duration = TRAINING_DURATION;
        }
        this.showTraining(state, bestSegmentsStraightXformed, rawScore, score, centroid, duration);
      }
    },

    showTraining: function (state, bestSegmentsStraightXformed, rawScore, score, centroid, duration) {
      const trainingEl = document.createElement('a-entity');
      bestSegmentsStraightXformed.forEach((segment, i) => {
        trainingEl.setAttribute('line__' + i,
            {start: segment.a, end: segment.b, color: 'black'});
      });
      AFRAME.scenes[0].appendChild(trainingEl);
      state.trainingEls.push(trainingEl);

      const scoreEl = document.createElement('a-text');
      scoreEl.setAttribute('value', /* rawScore.toFixed(0) + "   " + */ score.toFixed(0));
      scoreEl.object3D.position.copy(centroid);
      scoreEl.setAttribute('align', 'center');
      scoreEl.setAttribute('baseline', 'top');
      scoreEl.setAttribute('color', 'black');
      scoreEl.setAttribute('look-at', "#leftHand");
      AFRAME.scenes[0].appendChild(scoreEl);
      state.scoreEls.push(scoreEl);

      setTimeout(() => {
        trainingEl.fadeRemainingMs = TRAINING_FADE_DURATION;
        scoreEl.fadeRemainingMs = TRAINING_FADE_DURATION;
      }, duration - TRAINING_FADE_DURATION);
    }
  }
});


AFRAME.registerComponent('rig-tick-state', {
  init: function () {
    AFRAME.scenes[0].emit('setRigEl', this.el);

    AFRAME.scenes[0].addEventListener('enter-vr', (event) => {
      const environmentSound = document.getElementById('environmentSound');
      environmentSound.components.sound.playSound();
    });
    AFRAME.scenes[0].addEventListener('exit-vr', (event) => {
      const environmentSound = document.getElementById('environmentSound');
      environmentSound.components.sound.pauseSound();
    });
  },

  tick: function (time, timeDelta) {
    AFRAME.scenes[0].emit('iterate', {time: time, timeDelta: timeDelta});
  }
});

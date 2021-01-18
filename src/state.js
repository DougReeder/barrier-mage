// state.js - state model for Barrier Mage
// Copyright © 2020-2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

// math.js and creatures.js must be in a script before this.

function isDesktop() {
  return ! (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR());
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
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
    scoreEls: [],
    creatures: [],
    isStaffExploding: false
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
      this.cameraEl = document.querySelector('[camera]');
      this.cameraPos = new THREE.Vector3();
      this.blackoutEl = this.cameraEl.querySelector('#blackout');

      state.inProgress.geometry = new THREE.BufferGeometry();
      state.inProgress.material = new THREE.LineBasicMaterial({color: 'gray'});
      state.inProgress.line = new THREE.Line(state.inProgress.geometry, state.inProgress.material);
      state.inProgress.el = document.createElement('a-entity');
      state.inProgress.el.setObject3D('line', state.inProgress.line);
      AFRAME.scenes[0].appendChild(state.inProgress.el);

      const terrainGeometry = rigEl.sceneEl.querySelector('a-atoll-terrain').getAttribute('geometry');
      this.getElevation = terrainGeometry.getElevation;

      setTimeout(() => {
        this.createCreature(state);
      }, 3000);
    },

    /** event from gesture component on hand */
    grabStaff: function (state, evt) {
      if (! state.staffEl) { return; }
      state.staffEl.parentNode.removeChild(state.staffEl);
      state.staffEl = document.createElement('a-entity');
      state.staffEl.setAttribute('id', 'staff');
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
      if (! state.staffEl) { return; }
      state.barriers.push({
        color: WHITE,
        lines: [],
        segments: [],
        arcs: [],
        circles: [],
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
      barrier.segments.push(new Segment(line.points[line.points.length-2],line.points[line.points.length-1]));

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
      const beginPoint = line.points[line.curveBeginInd];
      const midPoint = line.points[line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) / 2)];
      const circleThreshold = Math.max((beginPoint.distanceToSquared(midPoint) / 16), STRAIGHT_PROXIMITY_SQ);
      let points;
      if (state.tipPosition.distanceToSquared(beginPoint) > circleThreshold) {
        let arc;
        ({arc, points} = arcFrom3Points(
            beginPoint,
            midPoint,
            line.points[line.points.length - 1]
        ));

        barrier.arcs.push(arc);
      } else {   // circle
        const secondInd = line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) / 3);
        const thirdInd = line.curveBeginInd + Math.round((line.points.length - 1 - line.curveBeginInd) * 2 / 3);
        let circle;
        ({circle, points} = circleFrom3Points(
            beginPoint,
            line.points[secondInd],
            line.points[thirdInd]
        ));
        barrier.circles.push(circle);
      }
      line.points.splice(line.curveBeginInd, line.points.length, ...points);
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

    dropStaff: function (state, evt) {
      console.log("dropStaff", evt.handId);

      const positionWorld = new THREE.Vector3();
      state.staffEl.object3D.getWorldPosition(positionWorld);
      const quaternionWorld = new THREE.Quaternion();
      state.staffEl.object3D.getWorldQuaternion(quaternionWorld);

      state.staffEl.parentNode.removeChild(state.staffEl);

      const targetElevation = this.getElevation(positionWorld.x, positionWorld.z) + 0.1;

      state.staffEl = document.createElement('a-entity');
      state.staffEl.setAttribute('id', 'staff');
      state.staffEl.setAttribute('gltf-model', "#staffModel");
      state.staffEl.object3D.position.copy(positionWorld);
      state.staffEl.object3D.setRotationFromQuaternion (quaternionWorld);
      state.staffEl.setAttribute('animation', {property: 'object3D.position.y', to: targetElevation, easing: 'easeInCubic'});
      state.rigEl.sceneEl.appendChild(state.staffEl);

      state.staffHandId = '';
    },

    destroyStaff: function(state, evt) {
      state.staffEl.parentNode.removeChild(state.staffEl);
      state.staffEl = null;
      state.tipPosition = new THREE.Vector3(1000, 1.1, 1000);
      state.staffHandId = '';
    },

    createCreature: function (state) {
      const creatureX = 15.00, creatureZ = -50.00;
      const terrainY = this.getElevation(creatureX, creatureZ);
      const creatureEl = placeCreature(creatureX, creatureZ, terrainY);
      const creature = {el: creatureEl, canMove: true, hitPoints: 5000, forceBarriers: new Set()};
      state.creatures.push(creature);

      creatureEl.addEventListener("sound-ended", () => {
        // When creature is close, its sound is soon repeated.
        const staffDistance = creatureEl.object3D.position.distanceTo(state.tipPosition);
        setTimeout(() => {
          if (creature.hitPoints > 0) {
            creatureEl.components.sound.playSound();
          }
        }, staffDistance * 100);   // 10 m = 1 sec
      });
    },

    iterate: function (state, {time, timeDelta}) {
      if (state.staffEl) {
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
      }

      // updates creatures and flags barriers affecting them
      this.cameraPos.setFromMatrixPosition(this.cameraEl.object3D.matrixWorld);
      state.barriers.forEach(barrier => {
        if (barrier) {
          barrier.wasActing = barrier.isActing;
          barrier.isActing = false;
        }
      });
      state.creatures.forEach(creature => {
        // creature interacts with completed barriers
        clearCreatureTickStatus(creature);
        state.barriers.forEach(barrier => {
          if (barrier && barrier.template) {
            barrier.isActing |= creatureBarrier({creature, barrier, timeDelta})
          }
        });
        applyCreatureStatuses(creature)

        // creature attacks staff if near
        const terrainY = this.getElevation(creature.el.object3D.position.x, creature.el.object3D.position.z)
        const isNearStaff = creatureTickMove({creature, timeDelta, staffPosition:state.tipPosition, terrainY});
        if (isNearStaff && ! state.isStaffExploding) {
          state.isStaffExploding = true;
          const particleEl = document.createElement('a-entity');
          particleEl.setAttribute('position', {x: 0, y: 1.00, z: 0});
          particleEl.setAttribute('particle-system', {
            velocityValue: "0 1 0",
            maxAge: 1,
            dragValue: 1.0,
            color: "#ff1811,#1d18ff,#1d18ff",
            size: 0.2,
            texture: "assets/smokeparticle.png"
          });
          particleEl.setAttribute('sound', {src:'#smash', autoplay: true, refDistance:1.0});
          document.getElementById('staff').appendChild(particleEl);

          setTimeout(() => {
            particleEl.parentNode.removeChild(particleEl);
            AFRAME.scenes[0].emit("destroyStaff", {});
          }, 3000);
        }

        // grays out player view if near creature
        const cameraDistance = creature.el.object3D.position.distanceTo(this.cameraPos);
        const opacity = Math.min(Math.max(1 - (cameraDistance-1) / 2, 0.0), 1.0);
        this.blackoutEl.setAttribute('material', 'opacity', opacity);
      });

      state.barriers.forEach((barrier, i) => {
        if (barrier && barrier.isActing && ! barrier.wasActing) {
          barrier.lines[barrier.lines.length-1].el.components.sound.playSound();
        }
        if (barrier && barrier.mana > 0) {
          barrier.mana -= timeDelta * barrier.template.manaUseMultiplier;
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
        trainingEl.fadeRemainingMs -= timeDelta;
        const opacity = Math.max(trainingEl.fadeRemainingMs / TRAINING_FADE_DURATION, 0);
        for (let j=0; j<5; ++j) {   // Templates have at most 5 segments.
          const lineAtrbt = trainingEl.getAttribute('line__'+j);
          if (lineAtrbt) {
            Object.assign(lineAtrbt, {opacity: opacity})
            trainingEl.setAttribute('line__'+j, lineAtrbt);
          }
        }
        for (let j=0; j<5; ++j) {   // Templates have at most 5 arcs.
          const linesAtrbt = trainingEl.getAttribute('lines__'+j);
          if (linesAtrbt) {
            Object.assign(linesAtrbt, {opacity: opacity})
            trainingEl.setAttribute('lines__'+j, linesAtrbt);
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
        scoreEl.fadeRemainingMs -= timeDelta;
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
      barrier.template = null;
      state.barriers[barrierInd] = null;  // can't splice out if we're looping

      state.creatures.forEach(creature => {
        creature.forceBarriers.delete(barrier);
      });
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

      const [score, rawScore, template, centroid, plane, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed] = matchDrawnAgainstTemplates(barrier.segments, barrier.arcs, barrier.circles);

      if (template && score >= 0) {
        barrier.mana = 25000 + score * 30000;

        barrier.template = template;
        barrier.color = template.color.clone();
        barrier.lines.forEach(line => {
          line.material.color.set(barrier.color);
        });
        barrier.plane = plane;
        this.magicEnd(state, {handId: state.staffHandId});
        this.magicBegin(state, {handId: state.staffHandId});

        const line = barrier.lines[barrier.lines.length-1];
        line.el.setAttribute('sound', {src: template.audioTag, volume:1.333, autoplay: true, refDistance:2.0});

        switch (template.name) {
          case "borromean rings":
            this.createPortal(state, centroid);
            break;

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
              lightEl.setAttribute('animation', {
                property: 'geometry.radius',
                from: 0.001, to: 0.03,
                easing: 'easeOutSine',
                dur: '2000'   // ms
              });
              state.staffEl.appendChild(lightEl);

              const glowEl = document.createElement('a-entity');
              glowEl.setAttribute('material', {color: '#F3E5AB', transparent: true, opacity: 0.25});
              glowEl.setAttribute('geometry', {primitive: 'sphere', radius: 0.10});
              glowEl.setAttribute('position', '0, 1.18, 0');   // relative to hand
              glowEl.setAttribute('animation', {
                property: 'geometry.radius',
                from: 0.001, to: 0.10,
                easing: 'easeOutSine',
                dur: '2000'   // ms
              });
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
        this.showTraining(state, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed, rawScore, score, centroid, duration);
      }
    },

    showTraining: function (state, bestSegmentsXformed, bestArcsXformed, bestCirclesXformed, rawScore, score, centroid, duration) {
      const trainingEl = document.createElement('a-entity');
      bestSegmentsXformed.forEach((segment, i) => {
        trainingEl.setAttribute('line__' + i,
            {start: segment.a, end: segment.b, color: 'black'});
      });
      bestArcsXformed.forEach((arc, i) => {
        const {points} = arcFrom3Points(arc.end1, arc.midpoint, arc.end2);
        const pointData = points.map(point => point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ' ' + point.z.toFixed(3)).join(',');
        trainingEl.setAttribute('lines__a' + i,
            {points: pointData, color: 'black'});
      });
      bestCirclesXformed.forEach((circle, i) => {
        const {points} = circleFrom3Points(circle.p1, circle.p2, circle.p3);
        const pointData = points.map(point => point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ' ' + point.z.toFixed(3)).join(',');
        trainingEl.setAttribute('lines__c' + i,
            {points: pointData, color: 'black'});
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
    },

    createPortal: function (state, centroid) {
      const displacement = new THREE.Vector3();
      displacement.subVectors(centroid, state.rigEl.object3D.position);
      const cameraPosition = document.querySelector('[camera]').object3D.position;
      displacement.x -= cameraPosition.x;
      displacement.z -= cameraPosition.z;
      displacement.y -= 1;
      displacement.normalize();   // 1m past barrier

      const linkEl = document.createElement('a-entity');
      linkEl.object3D.position.addVectors(centroid, displacement);
      console.log("centroid:", centroid, "   displacement:", displacement);
      linkEl.object3D.setRotationFromAxisAngle(Y_AXIS, Math.atan2(displacement.x, displacement.z));
      linkEl.setAttribute('link', {
        href: 'https://dougreeder.github.io/elfland-glider/',
        title: 'Elfland Glider',
        image: 'https://dougreeder.github.io/elfland-glider/city/screenshot-city.png',
        on: 'hitstart',
        visualAspectEnabled: true
      });
      linkEl.setAttribute('scale', '0.001 0.001 0.001');
      linkEl.setAttribute('animation', {
        property: 'scale',
        from: '0.001 0.001 0.001', to:'1 1 0.001',
        easing: 'easeOutSine',
        dur: '2000'   // ms
      });
      console.log("linkEl:", linkEl);
      AFRAME.scenes[0].appendChild(linkEl);
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

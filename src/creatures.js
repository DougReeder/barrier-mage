// creatures.js - fantasy creatures for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

const CREATURE_ELEVATION = 1.10;

AFRAME.registerComponent('creatures', {
  schema: {
    staffPosition: {type: 'vec3'}
  },

  init: function () {
    try {
      let terrainGeometry = this.el.querySelector('a-atoll-terrain').getAttribute('geometry');
      this.getElevation = terrainGeometry.getElevation;
      this.cameraEl = document.querySelector('[camera]');
      this.cameraPos = new THREE.Vector3();
      this.blackoutEl = this.cameraEl.querySelector('#blackout');

      const creatureX = 15.00, creatureZ = -50.00;
      this.placeCreature(creatureX, creatureZ);

      this.heading = new THREE.Vector3();
    } catch (err) {
      console.error("while initializing creatures:", err);
    }
  },

  update: function() {
    console.log("creatures update data:", this.data, "   event:", this.event);
  },

  placeCreature: function (creatureX, creatureZ) {
    this.creatureEl = document.createElement('a-sphere');
    this.creatureEl.setAttribute('id', 'creature');
    this.creatureEl.classList.add('creature');
    this.creatureEl.setAttribute('segments-height', 72);
    this.creatureEl.setAttribute('segments-width', 144);
    this.creatureEl.setAttribute('material', {shader: 'displacement'});
    const creatureY = this.getElevation(creatureX, creatureZ) + CREATURE_ELEVATION;
    this.creatureEl.setAttribute('position', {x: creatureX, y: creatureY, z: creatureZ});
    this.creatureEl.setAttribute('sound', {src:'#ominous', volume:2, autoplay: true});
    this.creatureEl.addEventListener("sound-ended", () => {
      const staffDistance = this.creatureEl.object3D.position.distanceTo(this.data.staffPosition);
      setTimeout(() => {
        this.creatureEl.components.sound.playSound();
      }, staffDistance*100);   // 10 m = 1 sec
    });
    AFRAME.scenes[0].appendChild(this.creatureEl);
  },

  tick: function(time, timeDelta) {
    this.heading.copy(this.data.staffPosition);
    this.heading.sub(this.creatureEl.object3D.position).normalize().multiplyScalar(timeDelta/1000);
    this.creatureEl.object3D.position.add(this.heading);
    const minElevation = this.getElevation(this.creatureEl.object3D.position.x, this.creatureEl.object3D.position.z) + CREATURE_ELEVATION;
    if (this.creatureEl.object3D.position.y < minElevation) {
      this.creatureEl.object3D.position.y = minElevation;
    }
    const staffDistance = this.creatureEl.object3D.position.distanceTo(this.data.staffPosition);
    if (staffDistance < 0.5 && ! this.isStaffExploding) {
      this.isStaffExploding = true;
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

    this.cameraPos.setFromMatrixPosition(this.cameraEl.object3D.matrixWorld);
    const cameraDistance = this.creatureEl.object3D.position.distanceTo(this.cameraPos);
    const opacity = Math.min(Math.max(1 - (cameraDistance-1) / 2, 0.0), 1.0);
    this.blackoutEl.setAttribute('material', 'opacity', opacity);
  }
});

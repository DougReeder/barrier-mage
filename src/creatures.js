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

    this.cameraPos.setFromMatrixPosition(this.cameraEl.object3D.matrixWorld);
    const distance = this.creatureEl.object3D.position.distanceTo(this.cameraPos);
    const opacity = Math.min(Math.max(1 - (distance-1) / 2, 0.0), 1.0);
    this.blackoutEl.setAttribute('material', 'opacity', opacity);
  }
});

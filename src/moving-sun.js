// moving-sun.js - sun movement component for Barrier Mage
// Copyright © 2020 Doug Reeder; Licensed under the GNU GPL-3.0

AFRAME.registerComponent('moving-sun', {
  init: function () {
    this.positionSph = new THREE.Spherical(1, Math.PI/2, 0);
    this.position = new THREE.Vector3();

    this.atollTerrain = document.querySelector('a-atoll-terrain');
    this.sss = document.querySelector('a-simple-sun-sky');
    this.directional = document.getElementById('directional');
  },

  tick: function (time) {
    this.positionSph.phi = Math.PI * (0.30 - 0.15 * Math.sin(time / 160000 * 2 * Math.PI));
    this.positionSph.theta = 2 * Math.PI * ( 0.25 + time / 240000);
    this.position.setFromSpherical(this.positionSph);
    let positionStr = this.position.x + ' ' + this.position.y + ' ' + this.position.z;

    this.atollTerrain.setAttribute('sun-position', positionStr);
    this.sss.setAttribute('sun-position', positionStr);
    this.directional.setAttribute('position', positionStr);
  }
});

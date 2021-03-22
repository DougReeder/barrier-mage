// portal.js - teleportation for Barrier Mage
// Copyright © 2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

AFRAME.registerComponent('portal', {
  schema: {
    position: {type:'vec3', default: {x:0, z:0, y:100}},
    on: {default: 'hitstart'},
  },

  init: function () {
    this.rigEl = document.getElementById('rig');

    this.handlers = {
      teleport: this.teleport.bind(this),
    }
  },

  update: function (oldData) {
    if (this.data.on !== oldData.on) {
      this.el.removeEventListener(oldData.on, this.handlers.teleport);
      this.el.addEventListener(this.data.on, this.handlers.teleport);
    }
  },

  play: function () {
    this.el.addEventListener(this.data.on, this.handlers.teleport);
  },

  pause: function () {
    this.el.removeEventListener(this.data.on, this.handlers.teleport);
  },

  teleport: function () {
    this.rigEl.object3D.position.copy(this.data.position);
  }
});

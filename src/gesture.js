// gesture.js - hand gesture component for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

AFRAME.registerComponent('gesture', {
  schema: {
  },

  init: function () {
    console.log("gesture init:", this.el.id);
    // Bind event handlers
    this.gripdown = this.gripdown.bind(this);
    this.triggerdown = this.triggerdown.bind(this);
  },

  // update: function () {
  //   console.log("update:", this.data);
  // },

  play: function () {
    console.log(`gesture play: ${this.el.id}: adding event listeners`);
    this.el.addEventListener('gripdown', this.gripdown);
    this.el.addEventListener('triggerdown', this.triggerdown);
  },

  pause: function () {
    console.log("gesture pause: removing event listeners");
    this.el.removeEventListener('gripdown', this.gripdown);
    this.el.removeEventListener('triggerdown', this.triggerdown);
  },

  gripdown: function (evt) {
    console.log("gripdown:", this.el.id, arguments);
    AFRAME.scenes[0].emit("grabStaff", {handId: this.el.id});
  },

  triggerdown: function (evt) {
    console.log("triggerdown:", this.el.id, arguments);
  },

});

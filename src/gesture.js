// gesture.js - hand gesture component for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

AFRAME.registerComponent('gesture', {
  schema: {
  },

  init: function () {
    // Bind event handlers
    this.gripdown = this.gripdown.bind(this);
    this.triggerdown = this.triggerdown.bind(this);
    this.triggerup = this.triggerup.bind(this);
  },

  // update: function () {
  //   console.log("update:", this.data);
  // },

  play: function () {
    console.log(`gesture play: ${this.el.id}: adding event listeners`);
    this.el.addEventListener('gripdown', this.gripdown);
    this.el.addEventListener('triggerdown', this.triggerdown);
    this.el.addEventListener('triggerup', this.triggerup);
  },

  pause: function () {
    console.log("gesture pause: removing event listeners");
    this.el.removeEventListener('gripdown', this.gripdown);
    this.el.removeEventListener('triggerdown', this.triggerdown);
    this.el.removeEventListener('triggerup', this.triggerup);
  },

  gripdown: function (evt) {
    AFRAME.scenes[0].emit("magicEnd", {handId: this.el.id});
    AFRAME.scenes[0].emit("grabStaff", {handId: this.el.id});
    AFRAME.scenes[0].emit("magicBegin", {handId: this.el.id});
  },

  triggerdown: function (evt) {
    if (this.el.children.length) {   // contains staff
      AFRAME.scenes[0].emit("traceBegin", {handId: this.el.id});
    }
  },

  triggerup: function (evt) {
    if (this.el.children.length) {   // contains staff
      AFRAME.scenes[0].emit("traceEnd", {handId: this.el.id});
    }
  },
});

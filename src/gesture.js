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
    this.thumbbuttondown = this.thumbbuttondown.bind(this);
    this.thumbbuttonup = this.thumbbuttonup.bind(this);
  },

  // update: function () {
  //   console.log("update:", this.data);
  // },

  play: function () {
    console.log(`gesture play: ${this.el.id}: adding event listeners`);
    this.el.addEventListener('gripdown', this.gripdown);
    this.el.addEventListener('triggerdown', this.triggerdown);
    this.el.addEventListener('triggerup', this.triggerup);
    this.el.addEventListener('abuttondown', this.thumbbuttondown);
    this.el.addEventListener('xbuttondown', this.thumbbuttondown);
    this.el.addEventListener('trackpaddown', this.thumbbuttondown);
    this.el.addEventListener('abuttonup', this.thumbbuttonup);
    this.el.addEventListener('xbuttonup', this.thumbbuttonup);
    this.el.addEventListener('trackpadup', this.thumbbuttonup);
  },

  pause: function () {
    console.log("gesture pause: removing event listeners");
    this.el.removeEventListener('gripdown', this.gripdown);
    this.el.removeEventListener('triggerdown', this.triggerdown);
    this.el.removeEventListener('triggerup', this.triggerup);
    this.el.removeEventListener('abuttondown', this.thumbbuttondown);
    this.el.removeEventListener('xbuttondown', this.thumbbuttondown);
    this.el.removeEventListener('trackpaddown', this.thumbbuttondown);
    this.el.removeEventListener('abuttonup', this.thumbbuttonup);
    this.el.removeEventListener('xbuttonup', this.thumbbuttonup);
    this.el.removeEventListener('trackpadup', this.thumbbuttonup);
  },

  gripdown: function (evt) {
    AFRAME.scenes[0].emit("magicEnd", {handId: this.el.id});
    if (this.el.querySelector('#staff')) {   // contains staff
      AFRAME.scenes[0].emit("dropStaff", {handId: this.el.id});
    } else {
      AFRAME.scenes[0].emit("grabStaff", {handId: this.el.id});
      AFRAME.scenes[0].emit("magicBegin", {handId: this.el.id});
    }
  },

  triggerdown: function (evt) {
    if (this.el.querySelector('#staff')) {   // contains staff
      AFRAME.scenes[0].emit("straightBegin", {handId: this.el.id});
    }
  },

  triggerup: function (evt) {
    if (this.el.querySelector('#staff')) {   // contains staff
      AFRAME.scenes[0].emit("straightEnd", {handId: this.el.id});
    }
  },

  thumbbuttondown: function (evt) {
    if (this.el.querySelector('#staff')) {   // contains staff
      AFRAME.scenes[0].emit("curveBegin", {handId: this.el.id});
    }
  },

  thumbbuttonup: function (evt) {
    if (this.el.querySelector('#staff')) {   // contains staff
      AFRAME.scenes[0].emit("curveEnd", {handId: this.el.id});
    }
  },
});

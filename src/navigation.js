AFRAME.registerComponent('atoll-walk', {
  init: function () {
    try {
      this.rig = document.getElementById('rig');

      let terrainGeometry = this.el.querySelector('a-atoll-terrain').getAttribute('geometry');
      this.getElevation = terrainGeometry.getElevation;
      // console.log("atoll-walk init; getElevation:", this.getElevation);
    } catch (err) {
      console.error("while initializing atoll-walk:", err);
    }
  },

  tick: function () {
    const rigPosition = this.rig.getAttribute('position');
    rigPosition.y = this.getElevation(rigPosition.x, rigPosition.z);
  }
});

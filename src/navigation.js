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

    setTimeout(() => {
      try {
        const staffEl = document.getElementById('staff');
        const staffPosition = staffEl.getAttribute('position');
        staffPosition.y = this.getElevation(staffPosition.x, staffPosition.z) + 0.95;
      } catch (err2) {
        console.error("while positioning staff:", err2);
      }
    },8);
  },

  tick: function () {
    const rigPosition = this.rig.getAttribute('position');
    rigPosition.y = this.getElevation(rigPosition.x, rigPosition.z);
  }
});

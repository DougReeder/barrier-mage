// aframe-lines.js -A component and primitive to draw a series of lines, for A-Frame WebXR.
// Similar to the line primitive, but draws multiple connected lines.
// Copyright © 2020 by Doug Reeder under the MIT License

AFRAME.registerComponent('lines', {
  schema: {
    points: {type: 'array'},
    color: {type: 'color', default: 'rgb(0, 0, 0)'},
    opacity: {type: 'number', default: 1},
    visible: {default: true},
    log: {type: 'boolean', default: false}
  },

  multiple: true,

  /** Called once when component is attached. Generally for initial setup. */
  init: function () {
    this.material = new THREE.LineBasicMaterial();
    this.geometry = new THREE.BufferGeometry();
    this.line = new THREE.Line( this.geometry, this.material );
  },

  /** Called when properties are changed, incl. right after init */
  update: function () {
    if (this.data.log) {
      console.log("lines update", this.data, this.el);
    }

    const data = this.data;
    const el = this.el;

    this.material.setValues( {
      color: data.color,
      opacity: data.opacity,
      transparent: data.opacity < 1,
      visible: data.visible
    } );

    const points = this.parse(data.points);
    if (this.data.log) {
      console.log(`${points.length} points`);
    }

    this.geometry.setFromPoints( points );

    el.setObject3D(this.attrName, this.line);
  },

  parse: function (dataPoints) {
    const points = [];
    dataPoints.forEach(point => {
      const coordStr = point.split(/\s+/, 3);
      const coord = coordStr.map(cStr => {
        const c = parseFloat(cStr);
        return Number.isFinite(c) ? c : 0;
      });
      switch (coord.length) {
        case 0:
          coord[0] = 0;
          // falls through
        case 1:
          coord[1] = 0;
          // falls through
        case 2:
          coord[2] = 0;
      }
      points.push(new THREE.Vector3(coord[0], coord[1], coord[2]));
    });
    return points;
  },

  /** Called when a component is removed (e.g., via removeAttribute). */
  remove: function () {
    this.el.removeObject3D(this.attrName);
  }

});


AFRAME.registerPrimitive('a-lines', {
  defaultComponents: {
    lines: {}
  },

  mappings: {
    'points': 'lines.points',
    'color': 'lines.color',
    'opacity': 'lines.opacity',
    'visible': 'lines.visible',
    'log': 'lines.log'
  }
});

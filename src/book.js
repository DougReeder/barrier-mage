// book.js - book of help in off hand for Barrier Mage
// A-Frame doesn't support any module system well, so functions are just defined globally.
// Copyright © 2021–2024 Doug Reeder; Licensed under the GNU GPL-3.0

function drawLinesOnElement(segments, arcs, circles, el, color = 'black') {
  segments.forEach((segment, i) => {
    el.setAttribute('line__s' + i,
        {start: segment.a, end: segment.b, color: color});
  });
  arcs.forEach((arc, i) => {
    const {points} = arcFrom3Points(arc.end1, arc.midpoint, arc.end2);
    const pointData = points.map(point => point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ' ' + point.z.toFixed(3)).join(',');
    el.setAttribute('lines__a' + i,
        {points: pointData, color: color});
  });
  circles.forEach((circle, i) => {
    const {points} = circleFrom3Points(circle.p1, circle.p2, circle.p3);
    const pointData = points.map(point => point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ' ' + point.z.toFixed(3)).join(',');
    el.setAttribute('lines__c' + i,
        {points: pointData, color: color});
  });
}

AFRAME.registerComponent('book', {
  NUM_PAGES: 5,

  schema: {
    page: {default: 0}
  },

  init: function () {
    this.bookEl = document.createElement('a-entity');
    this.bookEl.setAttribute('id', 'book');
    this.bookEl.setAttribute('gltf-model', '#openBook');

    if ('leftHand' === this.el.id) {
      this.bookEl.setAttribute('position', {x:0.05, y:0, z:0});
      this.bookEl.setAttribute('rotation', {x:0, y:0, z:-90});
    } else {   // right hand
      this.bookEl.setAttribute('position', {x:-0.05, y:0, z:0});
      this.bookEl.setAttribute('rotation', {x:0, y:0, z:90});
    }
    this.bookEl.setAttribute('sound', {src: '#pageturn', poolSize: 2});
    this.el.appendChild(this.bookEl);

    this.handlers = {
      pageForward: this.pageForward.bind(this),
      pageBack: this.pageBack.bind(this),
    }
  },

  update: function () {
    if (this.pageLeftEl) { this.bookEl.removeChild(this.pageLeftEl); }
    if (this.pageRightEl) { this.bookEl.removeChild(this.pageRightEl); }

    if (this.data.page <= 1) {
      this.pageLeftEl = document.createElement('a-image');
      this.pageLeftEl.setAttribute('position', {x:-0.10 , y:0.0125 , z:0.001});
      this.pageLeftEl.setAttribute('width', 0.2 );
      this.pageLeftEl.setAttribute('height', 0.25977 );

      this.pageRightEl = document.createElement('a-image');
      this.pageRightEl.setAttribute('position', {x:0.10 , y:0.0125 , z:0.0});
      this.pageRightEl.setAttribute('src', '#controls_diagram_right');
      this.pageRightEl.setAttribute('width', 0.2 );
      this.pageRightEl.setAttribute('height', 0.25977 );

      if (this.data.page === 0) {
        this.pageLeftEl.setAttribute('src', '#controls_diagram_left');
        this.pageRightEl.setAttribute('src', '#controls_diagram_right');
      } else {
        this.pageLeftEl.setAttribute('src', '#symbol_quality_left');
        this.pageRightEl.setAttribute('src', '#symbol_quality_right');
      }
    } else {
      this.pageLeftEl = document.createElement('a-entity');
      this.pageLeftEl.setAttribute('position', {x:-0.10 , y:0.0125 , z:0.025});
      this.pageRightEl = document.createElement('a-entity');
      this.pageRightEl.setAttribute('position', {x:0.10 , y:0.0125 , z:0.025});

      switch (this.data.page) {
        default:
        case 2:
          this.pageLeftEl.setAttribute('scale', {x:0.08, y:0.08, z:0.08});
          this.pageLeftEl.setAttribute('text', {value:"Brimstone\nto burn\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:5, font:'mozillavr', align:'center'});
          drawLinesOnElement(brimstoneUpTemplate.segments, brimstoneUpTemplate.arcs, brimstoneUpTemplate.circles, this.pageLeftEl);

          this.pageRightEl.setAttribute('scale', {x:0.08, y:0.08, z:0.08});
          this.pageRightEl.setAttribute('text', {value:"Triquetra knot\nto bind\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:5, font:'mozillavr', align:'center'});
          drawLinesOnElement(triquetraTemplate.segments, triquetraTemplate.arcs, triquetraTemplate.circles, this.pageRightEl);
          break;
        case 3:
          this.pageLeftEl.setAttribute('scale', {x:0.045, y:0.045, z:0.045});
          this.pageLeftEl.setAttribute('text', {value:"Borromean rings\nto link\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:8.88888, font:'mozillavr', align:'center'});
          drawLinesOnElement(borromeanRingsTemplate.segments, borromeanRingsTemplate.arcs, borromeanRingsTemplate.circles, this.pageLeftEl);

          this.pageRightEl.setAttribute('scale', {x:0.07, y:0.07, z:0.07});
          this.pageRightEl.setAttribute('text', {value:"Pentacle\nto protect\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:5.7142, font:'mozillavr', align:'center'});
          drawLinesOnElement(pentacleTemplate.segments, pentacleTemplate.arcs, pentacleTemplate.circles, this.pageRightEl);
          break;
        case 4:
          this.pageLeftEl.setAttribute('scale', {x:0.08, y:0.08, z:0.08});
          this.pageLeftEl.setAttribute('text', {value:"Quicksilver\nto detect\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:5, font:'mozillavr', align:'center'});
          drawLinesOnElement(quicksilverTemplate.segments, quicksilverTemplate.arcs, quicksilverTemplate.circles, this.pageLeftEl);

          this.pageRightEl.setAttribute('scale', {x:0.075, y:0.075, z:0.075});
          this.pageRightEl.setAttribute('text', {value:"Dagaz (day rune)\nto illuminate\n\n\n\n\n\n\n\n\n\n\n\n\n\n", color:'black', width:5.33333, font:'mozillavr', align:'center'});
          drawLinesOnElement(dagazTemplate.segments, dagazTemplate.arcs, dagazTemplate.circles, this.pageRightEl);
          break;
      }
    }
    this.pageLeftEl.setAttribute('id', 'pageLeft');
    this.pageLeftEl.object3D.quaternion.setFromEuler( new THREE.Euler( -Math.PI/2, -0.05, 0 ) );

    this.pageRightEl.setAttribute('id', 'pageRight');
    this.pageRightEl.object3D.quaternion.setFromEuler( new THREE.Euler( -Math.PI/2, 0.05, 0 ) );

    this.bookEl.appendChild(this.pageLeftEl);
    this.bookEl.appendChild(this.pageRightEl);
  },

  remove: function () {
    this.el.removeChild(this.bookEl);
    this.bookEl = null;
    this.pageLeftEl = null;
    this.pageRightEl = null;
  },

  play: function () {
    this.el.addEventListener('triggerdown', this.handlers.pageForward);
    this.el.addEventListener('abuttondown', this.handlers.pageBack);
    this.el.addEventListener('xbuttondown', this.handlers.pageBack);
    this.el.addEventListener('trackpaddown', this.handlers.pageBack);
  },

  pause: function () {
    this.el.removeEventListener('triggerdown', this.handlers.pageForward);
    this.el.removeEventListener('abuttondown', this.handlers.pageBack);
    this.el.removeEventListener('xbuttondown', this.handlers.pageBack);
    this.el.removeEventListener('trackpaddown', this.handlers.pageBack);
  },

  pageForward: function (evt) {
    if (this.el.components.book) {
      this.el.setAttribute('book', 'page', (this.data.page + 1) % this.NUM_PAGES);
      this.bookEl.components.sound.playSound();
    }
  },

  pageBack: function () {
    if (this.el.components.book) {
      let newPage = this.data.page > 0 ? this.data.page - 1 : this.NUM_PAGES - 1;
      this.el.setAttribute('book', 'page', newPage);
      this.bookEl.components.sound.playSound();
    }
  },
});


try {   // pulled in via require for testing
  module.exports = {
    drawLinesOnElement,
  }
} catch (err) {
  // pulled in via script tag
}

// creatures.js - fantasy creatures for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

const CREATURE_ELEVATION = 1.10;
const BARRIER_EFFECT_DIST = 1.0;

const heading = new THREE.Vector3();

function placeCreature(creatureX, creatureZ, terrainY) {
  const creatureEl = document.createElement('a-sphere');
  creatureEl.setAttribute('id', 'creature');
  creatureEl.classList.add('creature');
  creatureEl.setAttribute('segments-height', 72);
  creatureEl.setAttribute('segments-width', 144);
  creatureEl.setAttribute('material', {shader: 'displacement'});
  const creatureY = terrainY + CREATURE_ELEVATION;
  creatureEl.setAttribute('position', {x: creatureX, y: creatureY, z: creatureZ});
  creatureEl.setAttribute('sound', {src:'#ominous', volume:3, autoplay: true});
  AFRAME.scenes[0].appendChild(creatureEl);
  return creatureEl;
}

function creatureTickMove({creature, timeDelta, staffPosition, terrainY}) {
  if (creature.canMove) {
    heading.copy(staffPosition);
    heading.sub(creature.el.object3D.position).normalize().multiplyScalar(timeDelta / 1000);
    creature.el.object3D.position.add(heading);   // 1m / sec
    const minElevation = terrainY + CREATURE_ELEVATION;
    if (creature.el.object3D.position.y < minElevation) {
      creature.el.object3D.position.y = minElevation;
    }
  }

  const staffDistance = creature.el.object3D.position.distanceTo(staffPosition);
  return staffDistance < 0.5;
}

function clearCreatureTickStatus(creature) {
  creature.canMove = true;
}

function creatureBarrier({creature, barrier}) {
  const dist = distanceToBarrier(creature.el.object3D.position, barrier);
  if ("triquetra" === barrier.template.name && dist <= BARRIER_EFFECT_DIST) {
    creature.canMove = false;
    return true;
  }
  return false;
}

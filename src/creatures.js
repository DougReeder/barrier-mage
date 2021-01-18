// creatures.js - fantasy creatures for Barrier Mage
// Copyright © 2020-2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

const CREATURE_ELEVATION = 1.10;
const BARRIER_EFFECT_DIST = 1.0;
const COLOR_OUTER = '#c8f307';
const COLOR_OUTER_BRIMSTONE = '#ff8400';
const COLOR_INNER = '#0080ff';
const ACTIVITY_LENGTH = 1000;

const heading = new THREE.Vector3();

function placeCreature(creatureX, creatureZ, terrainY) {
  const creatureEl = document.createElement('a-sphere');
  creatureEl.setAttribute('id', 'creature');
  creatureEl.classList.add('creature');
  creatureEl.setAttribute('segments-height', 72);
  creatureEl.setAttribute('segments-width', 144);
  creatureEl.setAttribute('material', {
    shader: 'displacement',
    colorOuter: COLOR_OUTER, colorOuterActive: COLOR_OUTER_BRIMSTONE,
    activity: 0.0,
    colorInner: COLOR_INNER
  });
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
    if (creature.hitPoints <= 0) {
      heading.negate();
    }
    creature.forceBarriers.forEach(barrier => {
      if (barrier.plane.distanceToPoint(creature.el.object3D.position) < BARRIER_EFFECT_DIST) {
        const alteration = barrier.plane.normal.clone().multiplyScalar(heading.dot(barrier.plane.normal));
        heading.sub(alteration)
      }
    });
    creature.el.object3D.position.add(heading);   // 1m / sec
    const minElevation = terrainY + CREATURE_ELEVATION;
    if (creature.el.object3D.position.y < minElevation) {
      creature.el.object3D.position.y = minElevation;
    }
  }

  if (creature.activityCount > 0) {
    if ((creature.activityCount -= timeDelta) > 0) {
      let activity;
      if (creature.activityUp) {
        activity = 1 - creature.activityCount / ACTIVITY_LENGTH;
      } else {
        activity = creature.activityCount / ACTIVITY_LENGTH;
      }
      creature.el.setAttribute('material', 'activity', activity);
    } else {
      creature.el.setAttribute('material', 'activity', creature.activityUp ? 1.0 : 0.0);
    }
  }

  const staffDistance = creature.el.object3D.position.distanceTo(staffPosition);
  return staffDistance < 0.5;
}

function clearCreatureTickStatus(creature) {
  creature.canMove = true;
  creature.wasBurning = creature.isBurning;
  creature.isBurning = false;
}

function creatureBarrier({creature, barrier, timeDelta}) {
  const dist = distanceToBarrier(creature.el.object3D.position, barrier);
  if ("triquetra" === barrier.template.name && dist <= BARRIER_EFFECT_DIST) {
    creature.canMove = false;
    return true;
  } else if ("pentacle" === barrier.template.name) {
    // actual effect calculated using plane.distanceToPoint()
    // uses larger value here because distanceToBarrier is to the nearest point
    if (dist <= BARRIER_EFFECT_DIST * 1.5) {
      creature.forceBarriers.add(barrier);
    } else {
      creature.forceBarriers.delete(barrier);
    }
  } else if ("brimstone" === barrier.template.name.slice(0, 9) && dist <= BARRIER_EFFECT_DIST) {
    creature.hitPoints -= timeDelta;
    creature.isBurning = true;
    return true;
  }

  return false;
}

function applyCreatureStatuses(creature) {
  if (creature.isBurning && !creature.wasBurning) {
    creature.activityUp = true;
    creature.activityCount = ACTIVITY_LENGTH;
  } else if (!creature.isBurning && creature.wasBurning) {
    creature.activityUp = false;
    creature.activityCount = ACTIVITY_LENGTH;
  }
}

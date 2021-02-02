// creatures.js - fantasy creatures for Barrier Mage
// Copyright © 2020-2021 P. Douglas Reeder; Licensed under the GNU GPL-3.0

const CREATURE_ELEVATION = 1.10;
const MIN_BARRIER_EFFECT_DIST = 0.60;   // based on the distance between symbol points, when drawn large
const COLOR_OUTER = '#c8f307';
const COLOR_OUTER_BRIMSTONE = '#ff8400';
const COLOR_INNER_CLOUD = '#0080ff';
const COLOR_INNER_IRK = '#6907f3';
const ACTIVITY_LENGTH = 1000;


class Creature {
  static positionDiff = new THREE.Vector3();   // re-used, instead of re-creating every tick
  static velocity = new THREE.Vector3();   // re-used, instead of re-creating every tick

  /**
   * Constructs creature, but not its Entity
   * @param {Number} speed in m/s
   * @param {Number} hitPoints nominally the number of ms it can take damage
   */
  constructor(shader = 'smooth-noise', radius = 1.0, colorInner = COLOR_INNER_CLOUD, sound = '', speed = 1.0, hitPoints = 1000) {
    if (typeof shader !== 'string') throw new Error("shader must be string");
    if (typeof speed !== 'number') throw new Error("speed must be number");
    if (typeof hitPoints !== 'number') throw new Error("hitPoints must be number");
    this.shader = shader;
    this.radius = radius;
    this.barrierEffectDist = Math.max(radius, MIN_BARRIER_EFFECT_DIST);
    this.colorInner = colorInner;
    this.sound = sound;
    this.el = null;
    this.speed = speed;
    this.canMove = true;
    this.hitPoints = hitPoints;
    this.activityCount = 0;   // interpolate between inactive (0.0) & active (1.0)
    this.forceBarriers = new Set()
  }

  /**
   * Creates the creature entity.
   * @param position {THREE.Vector3} the location of the ground underneath the creature
   */
  place(position) {
    console.log("placing creature at ground position", position)
    this.el = document.createElement('a-sphere');
    this.el.setAttribute('id', 'creature');
    this.el.classList.add('creature');
    this.el.setAttribute('radius', this.radius)
    this.el.setAttribute('segments-height', 72);
    this.el.setAttribute('segments-width', 144);
    this.el.setAttribute('material', {
      shader: this.shader,
      colorOuter: COLOR_OUTER, colorOuterActive: COLOR_OUTER_BRIMSTONE,
      activity: 0.0,
      colorInner: this.colorInner
    });
    position.y += CREATURE_ELEVATION;
    this.el.setAttribute('position', position);
    this.el.setAttribute('sound', {src: this.sound, volume: 3, autoplay: true});
    AFRAME.scenes[0].appendChild(this.el);
  }

  tickMove({timeDelta, staffPosition, terrainY}) {
    if (this.canMove) {
      Creature.positionDiff.copy(staffPosition);
      Creature.positionDiff.sub(this.el.object3D.position);
      Creature.velocity.copy(Creature.positionDiff).normalize().multiplyScalar(this.speed).multiplyScalar(timeDelta / 1000);
      if (this.hitPoints > 0) {   // avoids overshoot and thus jittering around target
        Creature.velocity.clampLength(0, Creature.positionDiff.length());
      } else {   // creature flees
        Creature.velocity.negate();
      }
      this.forceBarriers.forEach(barrier => {
        if (barrier.plane.distanceToPoint(this.el.object3D.position) < this.barrierEffectDist) {
          const alteration = barrier.plane.normal.clone().multiplyScalar(Creature.velocity.dot(barrier.plane.normal));
          Creature.velocity.sub(alteration)
        }
      });
      this.el.object3D.position.add(Creature.velocity);
      const minElevation = terrainY + CREATURE_ELEVATION;
      if (this.el.object3D.position.y < minElevation) {
        this.el.object3D.position.y = minElevation;
      }
    }

    if (this.activityCount > 0) {
      if ((this.activityCount -= timeDelta) > 0) {
        let activity;
        if (this.activityUp) {
          activity = 1 - this.activityCount / ACTIVITY_LENGTH;
        } else {
          activity = this.activityCount / ACTIVITY_LENGTH;
        }
        this.el.setAttribute('material', 'activity', activity);
      } else {
        this.el.setAttribute('material', 'activity', this.activityUp ? 1.0 : 0.0);
      }
    }

    const staffDistance = this.el.object3D.position.distanceTo(staffPosition);
    return staffDistance < 0.5;
  }

  /** call each tick before iterating over barriers */
  clearTickStatus() {
    this.canMove = true;
    this.wasBurning = this.isBurning;
    this.isBurning = false;
  }

  /** call each tick for each barrier */
  barrierTickStatus({barrier, timeDelta}) {
    const dist = distanceToBarrier(this.el.object3D.position, barrier);
    if ("triquetra" === barrier.template.name && dist <= this.barrierEffectDist) {
      this.canMove = false;
      return true;
    } else if ("pentacle" === barrier.template.name) {
      // actual effect calculated using plane.distanceToPoint()
      // uses larger value here because distanceToBarrier is to the nearest point
      if (dist <= this.barrierEffectDist * 1.5) {
        this.forceBarriers.add(barrier);
      } else {
        this.forceBarriers.delete(barrier);
      }
    } else if ("brimstone" === barrier.template.name.slice(0, 9) && dist <= this.barrierEffectDist) {
      this.hitPoints -= timeDelta;
      this.isBurning = true;
      return true;
    }

    return false;
  }

  /** call each tick after iterating over barriers */
  applyTickStatus() {
    if (this.isBurning && !this.wasBurning) {
      this.activityUp = true;
      this.activityCount = ACTIVITY_LENGTH;
    } else if (!this.isBurning && this.wasBurning) {
      this.activityUp = false;
      this.activityCount = ACTIVITY_LENGTH;
    }
  }

  /**
   * removes entity from scene; does not remove from array of creatures
   */
  destroy() {
    console.log("creature destroyed");
    this.el.parentNode.removeChild(this.el);
    this.hitPoints = 0;
    this.forceBarriers = undefined;   // removes references to barriers
  }

}

class IrkBall extends Creature {
  /**
   * Constructs creature, but not its Entity
   * @param {Number} speed in m/s
   * @param {Number} hitPoints nominally the number of ms it can take damage
   */
  constructor(speed = 1.0, hitPoints = 3000) {
    if (typeof speed !== 'number') throw new Error("speed must be number");
    if (typeof hitPoints !== 'number') throw new Error("hitPoints must be number");
    super('smooth-noise', 0.25, COLOR_INNER_IRK, '#irksome', speed, hitPoints);
  }
}

class ViolentCloud extends Creature {
  /**
   * Constructs creature, but not its Entity
   * @param {Number} speed in m/s
   * @param {Number} hitPoints nominally the number of ms it can take damage
   */
  constructor(speed = 1.0, hitPoints = 5000) {
    if (typeof speed !== 'number') throw new Error("speed must be number");
    if (typeof hitPoints !== 'number') throw new Error("hitPoints must be number");
    super('displacement', 1.0, COLOR_INNER_CLOUD, '#ominous', speed, hitPoints);
  }
}

try {   // pulled in via require for testing
  module.exports = {
    IrkBall,
    ViolentCloud
  }
} catch (err) {
  // pulled in via script tag
}

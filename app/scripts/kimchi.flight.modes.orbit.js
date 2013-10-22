/**
 * Orbit mode. The user can rotate, zoom, and pan with the cursor using {@link
 *   external:THREE.OrbitControls|THREE.OrbitControls}. Instance of {@link
 *   module:KIMCHI.flight.Mode|Mode}.
 * @namespace orbit
 * @memberOf  module:KIMCHI.flight.modes
 */
var KIMCHI = (function (KIMCHI) {
  'use strict';

  var flight, Mode, mode, targetBody;

  flight = KIMCHI.flight;
  Mode = flight.Mode;
  mode = new Mode('orbit');
  KIMCHI.flight.modes.orbit = mode;



  /**
   * setTargetBody() must be called at least once before enabling orbit mode.
   * @memberOf module:KIMCHI.flight.modes.orbit
   */
  mode.enable = function () {
    Mode.prototype.enable.call(this);

    KIMCHI.orbitControls.enable();
  };

  /**
   * @memberOf module:KIMCHI.flight.modes.orbit
   */
  mode.disable = function () {
    Mode.prototype.disable.call(this);

    KIMCHI.orbitControls.disable();
  };

  /**
   * @memberOf module:KIMCHI.flight.modes.orbit
   */
  mode.animationFrame = function (delta) {
    // if the target Body is moving, the OrbitControls target Vector3 (where it
    // is looking) has to be updated
    if (KIMCHI.config.get('bodiesSpeed') > 0) {
      KIMCHI.orbitControls.target = targetBody.object3Ds.main.position.clone();
    }
    

    // update the controls to move the space
    KIMCHI.orbitControls.update();

    return flight.updateSpaceTime(delta);
  };

  /**
   * This function is here instead of in THREE.OrbitControls because that
   *   class is KIMCHI-independent. Call this before flight.setMode('orbit').
   * @param    {Body} body
   * @memberOf module:KIMCHI.flight.modes.orbit
   */
  mode.setTargetBody = function (body) {
    targetBody = body;
    KIMCHI.orbitControls.target = body.object3Ds.main.position.clone();
    KIMCHI.orbitControls.minDistance = body.getCollisionDistance();
  };



  return KIMCHI;
}(KIMCHI || {}));
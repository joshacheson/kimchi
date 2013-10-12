/**
 * Automatically guided flight.
 * @namespace auto
 * @memberOf  module:KIMCHI.flight.modes
 */
var KIMCHI = (function (KIMCHI, Q, $, THREE) {
  'use strict';

  var flight, Mode, mode, keydown, update, translateTo;



  flight = KIMCHI.flight;
  Mode = flight.Mode;
  mode = new Mode('auto');
  KIMCHI.flight.modes.auto = mode;

  mode.enable = function () {
    Mode.prototype.enable.call(this);

    // KIMCHI.$document.on('keydown', keydown);
  };

  mode.disable = function () {
    Mode.prototype.disable.call(this);

    KIMCHI.ui.notice.clear(); // TODO move this
    // KIMCHI.$document.off('keydown', keydown);
  };

  /**
   * Fly to the given Body.
   * @returns  {Promise}
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.flyTo = function (body) {
    var deferred = Q.defer();

    // KIMCHI.ui.notice.set(KIMCHI.config.get('noticeFlyTo')(body));
    KIMCHI.config.set('bodiesSpeed', 0);

    console.log('.flight.modes.auto: panning to ' + body.name);
    mode.panTo(body).then(function () {
      console.log('.flight.modes.auto: translating to ' + body.name);
      translateTo(body).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise;
  };

  /**
   * Pan (gradually rotate) the camera towards the given Body (without
   *   translating).
   * @returns  {Promise}
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  mode.panTo = (function () {
    var deferred, initialQuaternion, rotationMatrix, targetQuaternion, t;

    rotationMatrix = new THREE.Matrix4();
    targetQuaternion = new THREE.Quaternion();

    return function (body) {
      deferred = Q.defer();

      initialQuaternion = KIMCHI.camera.quaternion.clone();

      rotationMatrix.lookAt(
        KIMCHI.camera.position,
        body.object3Ds.main.position,
        KIMCHI.camera.up
      );

      targetQuaternion.setFromRotationMatrix(rotationMatrix);

      t = 0;
      mode.animationFrame = function (delta) {
        // avoid rounding imprecision because we want the final rotation to be
        // centered exactly onto the target body (t = 1); the t += 0.05
        // calculations can be imprecise
        if (t > 1 && t < 1 + 0.05) {
          t = 1;
        }

        if (t <= 1) {
          KIMCHI.camera.quaternion.copy(
            initialQuaternion.clone().slerp(targetQuaternion, t)
          );
          update(delta);

          t += 0.05;
        } else { // done
          deferred.resolve();
          // can't return false here because then the follow-up translateTo()
          // won't animate
        }
      };

      return deferred.promise;
    };
  }());



  /**
   * The event handler for pressing Escape to stop auto flight and return to
   *   menu mode.
   * @private
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  // keydown = (function () {
  //   var keydownInProgress = false;

  //   return function (event) {
  //     if (event.which === 27) { // Esc
  //       keydownInProgress = true;
  //       $(this).one('keyup', function (event) {
  //         if (event.which === 27 && keydownInProgress) {
  //           flight.setMode('menu');
  //           keydownInProgress = false;
  //         }
  //       });
  //     }
  //   };
  // }());

  /**
   * Helper function called in every animationFrame() to update space.
   * @param    {Number} delta
   * @private
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  update = function (delta) {
    // do not move the Body Meshes themselves
    KIMCHI.space.updateBodyChildren();
  };

  /**
   * Translate the camera to the given Body until within range of collision.
   * @returns  {Promise}
   * @private
   * @memberOf module:KIMCHI.flight.modes.auto
   */
  translateTo = function (body) {
    var deferred = Q.defer();

    mode.animationFrame = function (delta) {
      var translationZ;

      if (!body.isColliding(KIMCHI.camera)) {
        translationZ = KIMCHI.config.get('controlsZSpeed') * delta *
          flight.getTranslationSpeedMultiplier([body]);

        this.speed = translationZ / delta;

        KIMCHI.camera.translateZ(-translationZ);

        update(delta);
      } else { // done
        deferred.resolve();
        // return false; // stop animating
      }
    };

    return deferred.promise;
  };



  return KIMCHI;
}(KIMCHI || {}, Q, jQuery, THREE));
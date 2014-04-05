/**
 * Contains astronomical bodies, which are represented by instances of the
 *   {@link Body} class, and their associated THREE.Object3D objects. Include
 *   data/kimchi.space.bodies.js before this script
 * @namespace space
 * @memberOf  module:KIMCHI
 */
var KIMCHI = (function (KIMCHI, _, THREE) {
  'use strict';

  var space, bodies;
  if (typeof KIMCHI.space === 'object') {
    space = KIMCHI.space;
  } else {
    space = {};
    KIMCHI.space = space;
  }

  /**
   * Contains instances of Body.
   * @memberOf module:KIMCHI.space
   */
  bodies = {};
  space.bodies = bodies;



  /**
   * Populate the private bodies object.
   * @memberOf module:KIMCHI.space
   */
  space.init = function () {
    _.each(space.data, function (options) {
      bodies[options.name] = new space.Body(options);
    });
  };

  /**
   * Create orbits.
   * @memberOf module:KIMCHI.space
   */
  space.ready = function () {
    _.each(bodies, function (body) {
      body.createOrbit();
    });
  };


  /**
   * TODO check bodies[name] actually exists
   * @param    {String} name
   * @returns  {Body}
   * @memberOf module:KIMCHI.space
   */
  space.getBody = function (name) {
    return bodies[name];
  };

  /**
   * Each Body may have more than one Object3D, e.g. for orbit lines and text
   *   labels. The parameter can be used to restrict the array returned.
   * @param    {String} [type]
   * @returns  {Array}  Object3Ds from the Bodies.
   * @memberOf module:KIMCHI.space
   */
  space.getObject3Ds = function (type) {
    var object3Ds = _.pluck(bodies, 'object3Ds');
    if (typeof type === 'undefined') {
      // flatten the nested object
      return _.reduce(object3Ds, function (allObject3Ds, bodyObject3Ds) {
        return allObject3Ds.concat(_.values(bodyObject3Ds));
      }, []);
    } else {
      return _.filter(_.pluck(object3Ds, type));
    }
  };

  /**
   * @returns  {Array} Object3Ds of Bodies set to be collideable with the
   *   camera.
   * @memberOf module:KIMCHI.space
   */
  space.getCollideableObject3Ds = function () {
    return _(bodies).filter('collideable').pluck('object3Ds').pluck('main')
      .valueOf();
  };

  /**
   * @returns {Object} Bodies with names as keys.
   * @memberOf module:KIMCHI.space
   */
  space.getCollideableBodies = function () {
    // _.filter(bodies, 'collideable') returns an Array, not an Object with keys
    var collideableBodies = {};
    _.each(bodies, function (body, name) {
      if (body.collideable) {
        collideableBodies[name] = body;
      }
    });
    return collideableBodies;
  };



  /**
   * Translate the Bodies. Does not move their children.
   *   TODO: In the future, for optimization, consider first storing the
   *   ephemeris batch array element in one variable for all bodies.
   * @memberOf module:KIMCHI.space
   */
  space.translateBodies = function (delta) {
    _.each(bodies, function (body) {
      body.translate(delta);
    });
  };

  /**
   * Rotate the Bodies.
   * @memberOf module:KIMCHI.space
   */
  space.rotateBodies = function (delta) {
    _.each(bodies, function (body) {
      body.rotate(delta);
    });
  };

  /**
   * Without moving the Body Meshes themselves, update the visibility,
   *   position, and size of all Object3Ds associated with the Bodies (such as
   *   text label Meshes). This function should be called whenever the camera
   *   moves.
   * @function
   * @memberOf module:KIMCHI.space
   */
  space.updateBodyChildren = (function () {
    var bodyDistance, label, labelDistance, labelLocalLength,
      labelLocalVector, labelWorldVector, cameraPosition, bodyPosition;

    cameraPosition = new THREE.Vector3();
    bodyPosition = new THREE.Vector3();

    return function () {
      // update the label Meshes
      if (KIMCHI.config.get('showLabels')) {
        _.each(bodies, function (body) {

          bodyDistance = body.getDistance(KIMCHI.camera);
          label = body.object3Ds.label;

          if (bodyDistance > body.labelVisibleDistance) {
            label.visible = false;
          } else {
            // store positions for the calculations below
            cameraPosition.copy(KIMCHI.camera.position);
            bodyPosition.copy(body.object3Ds.main.position);

            // rotate to face the camera
            label.quaternion.copy(KIMCHI.camera.quaternion);

            // distance between the label to the camera
            labelDistance = (bodyDistance - body.getScaledRadius()) / 2;
            // distance between the center of the Body Mesh and the label
            labelLocalLength = labelDistance + body.getScaledRadius();
            // vector from the center of the Body Mesh to the label
            labelLocalVector = cameraPosition.sub(bodyPosition)
              .setLength(labelLocalLength);
            // vector from the origin of the world to the label
            labelWorldVector = bodyPosition.add(labelLocalVector);
            // move it in front of the Body Mesh so it's not hidden inside
            label.position.copy(labelWorldVector);

            // scale
            label.scale.setXYZ(labelDistance / 1000);

            // show
            label.visible = true;
          }
        });
      }

      // update orbit lines
      if (KIMCHI.config.get('bodiesSpeed') > 0) {
        _.each(bodies, function (body) {
          if (body.hasOrbitLine) {
            var geometry = body.object3Ds.orbit.geometry;
            var limit = KIMCHI.config.get('orbitsLineSegments');

            // move all vertices forward, except for the last vertex
            for (var i = 0; i <= limit * 2 - 1; i++) {
              geometry.vertices[i].copy(geometry.vertices[i + 1]);
            }

            // set the last vertex to the next position
            var positionArray = KIMCHI.ephemeris.getPositionArray(
              body.ephemerisIndex, limit
            );
            if (positionArray !== null) {
              geometry.vertices[limit * 2].fromArray(positionArray);
            }

            // this property needs to be set to update the vertices
            geometry.verticesNeedUpdate = true;
          }
        });
      }
    };
  }());



  /**
   * @param    {Object} [bodies]
   * @returns  {Array}  Objects with keys 'name' and 'distance', with the latter
   *   being the distance between the camera and the Body.
   * @memberOf module:KIMCHI.space
   */
  space.getDistances = function (bodies) {
    if (typeof bodies === 'undefined') {
      bodies = KIMCHI.space.bodies;
    }

    return _.map(bodies, function (body, name) {
      return {
        'name': name,
        'distance': body.getDistance(KIMCHI.camera)
      };
    });
  };

  /**
   * @param    {Object} [bodies]
   * @returns  {Array}  Objects with keys 'name' and 'distance', with the
   *   latter being the distance between the camera and the Body. Sorted
   *   ascending.
   * @memberOf module:KIMCHI.space
   */
  space.getSortedDistances = function (bodies) {
    return space.getDistances(bodies).sort(function (body1, body2) {
      return body1.distance - body2.distance;
    });
  };

  /**
   * @param    {Object} [bodies]
   * @returns  {Number} The distance to the closest Body Mesh.
   * @memberOf module:KIMCHI.space
   */
  space.getClosestDistance = function (bodies) {
    return KIMCHI.space.getSortedDistances(bodies)[0].distance;
  };



  return KIMCHI;
}(KIMCHI || {}, _, THREE));

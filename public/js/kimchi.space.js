var KIMCHI = (function (KIMCHI, $, THREE) {
	'use strict';

	/**
	 * Contains astronomical bodies, which are represented by instances of the
	 * {@link space.Body} class, and their associated Object3Ds.
	 * @namespace space
	 */
	var space = {};
	KIMCHI.space = space;

	/**
	 * Raw data for each body, to be passed into the {@link space.Body}
	 * constructor.
	 * @memberOf space
	 */
	space.data = [
		{
			'name': 'Sun',
			'radius': 696000,
			'position': new THREE.Vector3(0, 0, 0),
			'visibleDistance': 1000000,
			'move': function () {},
			'mesh': new THREE.Mesh(
				new THREE.SphereGeometry(696000 * KIMCHI.config.scales.radius, KIMCHI.config.sphereSegments, KIMCHI.config.sphereSegments),
				new THREE.MeshBasicMaterial({ // not Lambert since sunlight is in the center of the sun
					'map': new THREE.ImageUtils.loadTexture('images/textures/sun.jpg')
				})
			)
		},
		{
			'name': 'Mercury',
			'radius': 2439.64,
			'position': new THREE.Vector3(0, 0.38709893, 0),
			'visibleDistance': 20,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Venus',
			'radius': 6051.59,
			'position': new THREE.Vector3(0, 0.72333199, 0),
			'visibleDistance': 20,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Earth',
			'radius': 6378,
			'position': new THREE.Vector3(0, 1.00000011, 0),
			'visibleDistance': 50,
			'move': function () {
			this.mesh.rotateOnAxis((new THREE.Vector3(1, 2, 3)).normalize(), 0.1);
//		this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.025);
			},
			'children': [
				{
					'name': 'Moon',
					'radius': 1737,
					'position': new THREE.Vector3(0, 1.00000011, 0),
					'visibleDistance': 20,
					'move': function () {
						this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.025);
					}
				}
			]
		},
		{
			'name': 'Mars',
			'radius': 3397,
			'position': new THREE.Vector3(0, 1.52366231, 0),
			'visibleDistance': 50,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Jupiter',
			'radius': 71492,
			'position': new THREE.Vector3(0, 5.20336301, 0),
			'visibleDistance': 250,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Saturn',
			'radius': 60267,
			'position': new THREE.Vector3(0, 9.53707032, 0),
			'visibleDistance': 250,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Uranus',
			'radius': 25557.25,
			'position': new THREE.Vector3(0, 19.19126393, 0),
			'visibleDistance': 30,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Neptune',
			'radius': 24766,
			'position': new THREE.Vector3(0, 30.06896348, 0),
			'visibleDistance': 1000,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		},
		{
			'name': 'Pluto',
			'radius': 1148.07,
			'position': new THREE.Vector3(0, 39.482, 0),
			'visibleDistance': 1000,
			'move': function () {
				this.mesh.orbit(new THREE.Vector3(0, 0, 1), 0.0025);
			}
		}
	];



	/**
	 * Class for astronomical bodies. All spheres for now.
	 * @param {Object} options
	 *   name: Required. Displayed to users.<br>
	 *   radius: In km.<br>
	 *   position: Vector3 of the body's initial position, in AU. Not to be
	 *     confused with Mesh.position, which gives the current position.<br>
	 *   rotation: Vector3 of the body's initial Euler rotation.<br>
	 *   visibleDistance: How far away the text mesh remains visible.
	 *     TODO rename to labelMeshDistance or something.<br>
	 *   move: Optional. Given an Object3D, perform rotations and revolutions.<br>
	 *   texturePath: Optional path to the texture image. The default is name.jpg.
	 * @memberOf space
	 */
	space.Body = function (options) {
		var length, curve;

		_.assign(this, { // default options
			'name': '',
			'radius': 0,
			'position': new THREE.Vector3(),
			'rotation': new THREE.Euler(),
			'collideable': true,
			'visibleDistance': 100,
			'move': function () {},
			'texturePath': 'images/textures/' + options.name.toLowerCase() + '.jpg'
		}, options);

		this.radius *= KIMCHI.config.scales.radius;

		// create a Mesh for the body; it can already be set in space.data
		if (typeof this.mesh !== 'object') { 
			this.mesh = new THREE.Mesh(
				new THREE.SphereGeometry(this.radius, KIMCHI.config.sphereSegments, KIMCHI.config.sphereSegments),
				new THREE.MeshLambertMaterial({
					'map': new THREE.ImageUtils.loadTexture(this.texturePath)
				})
			);
		}
		this.position.multiplyScalar(KIMCHI.config.scales.position);
		this.mesh.position.copy(this.position);
		this.mesh.rotation.copy(this.rotation);
		length = this.position.length();

		// create a Curve for the orbit, which can be used to create a Line
		curve = new THREE.EllipseCurve(0, 0, 2 * length, length, 0, 2 * Math.PI, true);
		this.line = curve.createLine({
			'color': KIMCHI.config.orbits.color,
			'opacity': KIMCHI.config.orbits.opacity,
			'lineSegments': KIMCHI.config.orbits.lineSegments,
		});

		/***
		 * Create a Mesh for the text label. We could do
		 *   this.mesh.add(this.labelMesh);
		 * but then the text Mesh rotates with the body and it is nontrivial to
		 * rotate it back.
		 */
		this.labelMesh = new THREE.Mesh(
			new THREE.TextGeometry(this.name, {
				'size': 10,
				'height': 0.1,
				'curveSegments': 10,
				'font': 'helvetiker',
				'bevelEnabled': true,
				'bevelThickness': 0.5,
				'bevelSize': 0.5
			}),
			new THREE.MeshBasicMaterial({
				'color': 0xeeeeff
			})
		);

//	this.$label = $('<div class="label">').text(this.name).appendTo('body');
	};



	/**
	 * Contains instances of {@link space.Body}.
	 * @memberOf space
	 */
	space.bodies = {};

	/**
	 * Populate {@link space.bodies}.
	 * @memberOf space
	 */
	space.init = function () {
		_.forEach(space.data, function (options, i) {
			space.bodies[options.name] = new space.Body(options);
		});
	};



	/**
	 * @returns {Array} Object3Ds from {@link space.bodies}. Note that each
	 *   {@link space.Body} may have more than one Object3D, e.g. for orbit lines
	 *   and text labels.
	 * @memberOf space
	 */
	space.getObject3Ds = function () {
		var object3Ds = [];
		_.forEach(space.bodies, function (body) {
			object3Ds.push(body.mesh, body.line, body.labelMesh);
		});
		return object3Ds;
	};
	/**
	 * @returns {Array} Object3Ds set to be collideable with the camera.
	 * @memberOf space
	 */
	space.getCollideableObject3Ds = function () {
		var object3Ds = [];
		_.forEach(space.bodies, function (body) {
			if (body.collideable) {
				object3Ds.push(body.mesh);
			}
		});
		return object3Ds;
	};



	/**
	 * Move the {@link space.bodies}. TODO use delta
	 * @memberOf space
	 */
	space.moveBodies = function (delta) {
		_.forEach(space.bodies, function (body) {
			var distance, scale;

			// move the body mesh (custom function)
			body.move();

			space.moveBodyChildren();
		});
	};

	/**
	 * Without moving the {@link space.Body} Meshes themselves, update the
	 * visibility, position, and size of all Object3Ds associated with the
	 * {@link space.bodies} (such as text label Meshes). This function should be
	 * called whenever the camera moves.
	 * @memberOf space
	 */
	space.moveBodyChildren = function () {
		_.forEach(space.bodies, function (body) {
			var distance, scale, projector, label;

			distance = THREE.Object3D.distance(KIMCHI.camera, body.mesh);

			// move the text mesh
			if (distance > body.visibleDistance) {
				body.labelMesh.visible = false;
			} else {
				body.labelMesh.visible = true;

				scale = distance / 1000;
				body.labelMesh.scale.set(scale, scale, scale);

				// the text mesh always face the camera
				body.labelMesh.quaternion.copy(KIMCHI.camera.quaternion.clone());

				// move it in front of the associated mesh so it's not hidden inside
				body.labelMesh.geometry.computeBoundingSphere();
				var v = KIMCHI.camera.position.clone().sub(body.mesh.position)
					.normalize().multiplyScalar(body.radius + 0.01);
				var w = body.mesh.position.clone().add(v);
				var x = body.mesh.position.clone().cross(v).cross(v)
					.normalize().multiplyScalar(
						body.labelMesh.geometry.boundingSphere.radius / 100
					);
				body.labelMesh.position.copy(w);//.add(x);
			}

/*
			// overlay text labels on top of the canvas
			if (distance > body.visibleDistance) { // too far away
				body.$label.hide();
			} else {
				projector = new THREE.Projector();
				label = {};
				label.width = body.$label.outerWidth();
				label.height = body.$label.outerHeight();
				label.position = projector.projectVector(body.mesh.position.clone(), KIMCHI.camera); // [-1, -1] to [1, 1]
				label.left = (label.position.x + 1) / 2 * KIMCHI.size.width;
				label.left -= label.width / 2; // center over body
				label.top = (1 - label.position.y) / 2 * KIMCHI.size.height;
				label.top -= label.height / 2;

				if (label.left < -label.width || label.left > KIMCHI.size.width ||
						label.top < -label.height || label.top > KIMCHI.size.height) {
					// the body is not visible on screen
					body.$label.hide();
				} else {
					body.$label.css({
						'left': label.left,
						'top': label.top,
					}).show();
				}
			}*/
		});
	};



	/**
	 * @returns {Array} All bodies sorted by current distance from the camera.
	 *   Each element is not a {@link space.Body}, but rather an object with
	 *   properties 'name' and 'distance'.
	 * @memberOf space
	 */
	space.getBodiesByDistance = function () {
		var bodies = [];

		_.forEach(space.bodies, function (body) {
			bodies.push({
				'name': name,
				'distance': THREE.Object3D.distance(KIMCHI.camera, body.mesh)
			});
		});

		// sort numerically
		bodies.sort(function (body1, body2) {
			return body1.distance - body2.distance;
		});

		return bodies;
	};



	return KIMCHI;
}(KIMCHI || {}, $, THREE));
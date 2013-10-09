// var options = angular.module('options', ['kimchi', 'three']);

angular.module('kimchi').controller('optionsCtrl', function ($scope, $timeout, Kimchi) {

  $scope.options = {
    'bodiesSpeed': [
      {
        'value': 0,
        'label': 'Off'
      },
      {
        'value': 1,
        'label': 'Fast'
      },
      {
        'value': 2,
        'label': 'Faster'
      },
      {
        'value': 8,
        'label': 'Fastest'
      }
    ],
    'bodiesSizeScale': [
      {
        'value': 1,
        'label': '1x'
      },
      {
        'value': 10,
        'label': '10x' // (distances lose scale)
      },
      {
        'value': 100,
        'label': '100x' // (distances lose more scale)
      },
      {
        'value': 1000,
        'label': '1000x' // (distances lose even more scale)
      },
      {
        'value': 'large',
        'label': 'Large' // (all bodies appear large without regard to scale)
      }
    ]
  };

  $timeout(function () {
    var keys, radioKeys, dropdownKeys;

    // Radio settings and dropdown settings are handled differently. When
    // editing these arrays, edit KIMCHI.config.userConfigurableKeys
    // accordingly.
    radioKeys = [
      'rotateBodies',
      'ambientLight',
      'showLabels',
      'showOrbits',
      'showStars',
      'controlsKeyboardSpeedMultiplier',
      'controlsLookSpeed'
    ];
    dropdownKeys = [
      'bodiesSpeed',
      'bodiesSizeScale'
    ];
    keys = radioKeys.concat(dropdownKeys);

    // initialize the values in KIMCHI.config
    Kimchi.config.init();

    // radios
    _.each(radioKeys, function (key) {
      // set the initial value (either default or from localStorage)
      $scope[key] = Kimchi.config.get(key);

      // watch for changes, and set the new value accordingly
      $scope.$watch(key, function (value) {
        Kimchi.config.set(key, value);
      });
    });

    // dropdowns
    _.each(dropdownKeys, function (key) {
      // set the initial value, which is an object
      $scope[key] = _.find($scope.options[key], {
        'value': Kimchi.config.get(key)
      });

      $scope.$watch(key, function (option) {
        Kimchi.config.set(key, option.value);
      });
    });
  });
});
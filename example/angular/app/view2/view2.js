(function () {
    'use strict';

    angular.module('myApp.view2', ['ui.router', 'myApp'])
        .config(routerConfig)
        .controller('View2Ctrl', function (userService) {
          var users = userService.getAll();
        });

    function routerConfig($stateProvider) {
        $stateProvider
            .state('view2', {
                url: '/view2',
                templateUrl: 'view2/view2.html',
                controller: 'View2Ctrl'
            });
    }
})();

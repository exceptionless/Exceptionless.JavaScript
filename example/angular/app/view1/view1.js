(function () {
    'use strict';

    angular.module('myApp.view1', ['ui.router'])
        .config(routerConfig)
        .controller('View1Ctrl', function () {
            throw "Error occurred inside of View1Ctrl";
        });

    function routerConfig($stateProvider) {
        $stateProvider
            .state('view1', {
                url: '/view1',
                templateUrl: 'view1/view1.html',
                controller: 'View1Ctrl'
            });
    }
})();

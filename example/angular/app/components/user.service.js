(function () {
    'use strict';

    angular.module('myApp')
        .factory('userService', userService);

    function userService($http) {
        return {
            getAll: getAll
        };

        function getAll() {
            return $http.get('http://random_domain_name_that_doesnt_exist.com/api/users');
        }
    }
})();

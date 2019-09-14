// login controller
angular.module("myApp")
    .controller("loginController", function ($scope, $http, $window, poiDetails,$rootScope,handleFavorites) {
        $scope.showDet=function(event){
            poiDetails.poiPopoverCtrl(event.target.id);
        };
        $scope.removeFavourite=function(){
            var userFavourite=JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
            handleFavorites.removeFavPOIs($rootScope.model_poiId,userFavourite);
        };
        $scope.addFavourite=function(){
            var userFavourite=JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
            handleFavorites.addFavPOIs($rootScope.model_poiId, $rootScope.model_title, 
                $rootScope.model_img, $rootScope.model_category, $rootScope.model_averagePoiRank, userFavourite);
        };
        //retrive
        $http({
            method: "GET",
            url:"http://localhost:3000/private/poi/getLastSavedFavouritePOI",
            headers: {"x-auth-token": $window.sessionStorage.getItem("token")},
        }).then(function mySuccess(response) {
                $scope.lastSavedPOIs=response.data;
        }, function myError(response) {
            console.log(response);
        });
        $http({
            method: "GET",
            url:"http://localhost:3000/private/users/getPopularPOI",
            headers: {"x-auth-token": $window.sessionStorage.getItem("token")},
        }).then(function mySuccess(response) {
                $scope.recommendedPOIs=response.data;
        }, function myError(response) {
            console.log(response);
        });
        //logged user check
        $scope.isUserLoggedIn = function () {
            if ($window.sessionStorage.getItem("token") != null)
                return true;
            else
                return false;
        } 
      
    });
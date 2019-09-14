// poi controller
angular.module("myApp").controller("favouritesController", function ($scope, $http, $window, poiDetails, handleFavorites,$rootScope) {
    $scope.userFavourites=JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
    //handle poi details presentaion
    $scope.showDet=function(event){
        poiDetails.poiPopoverCtrl(event.target.id);
    };
    //logged user check
    $scope.isUserLoggedIn= function(){
        if($window.sessionStorage.getItem("token")!=null )
            return true;
        else
            return false;
    };
    $scope.removeFavourite=function(){
       $scope.removeFavPOI($rootScope.model_poiId);
    };
    $scope.addFavourite=function(){
        var userFavourite=JSON.parse($window.sessionStorage.getItem('userFavouritePOIs'));
        handleFavorites.addFavPOIs($rootScope.model_poiId, $rootScope.model_title, 
            $rootScope.model_img, $rootScope.model_category, $rootScope.model_averagePoiRank, userFavourite);
    };
    //change sort parameter
    $scope.sort=function(){
        if($scope.sortByRank)
            return '-POIaverageRank';
        else
            return null;
    };
    //handle sort click
    $scope.toggleSortButtonText="sort by rank";
    $scope.handleSortClicked=function(){
        if($scope.toggleSortButtonText=="set to unsorted"){
            $scope.sortByRank=false;
            $scope.toggleSortButtonText="sort by rank"; 
        }
        else{
            $scope.sortByRank=true;
            $scope.toggleSortButtonText="set to unsorted";
        }
    } 
    //get categories
    var onSucessCategories=function(response){
        $scope.categories=response.data;
    };
    var onErrorCategories=function(response){
        console.log(response);
    };
    $http.get("http://localhost:3000/categories/getAllCategories").then(onSucessCategories,onErrorCategories);
    //remove Favourite POI from the user favourite poi list saved in the session storage
    
    $scope.removeFavPOI=function(poiID){
        handleFavorites.removeFavPOIs(poiID, $scope.userFavourites);
    };
    
    //save all favourites stored in the user sessiong storage
    $scope.saveLocalFavouritesList=function(){
        var favToBeSaved={POIs:[]};
        $scope.userFavourites.map(function(favorPOI){
            favToBeSaved.POIs.push({
               "id" :favorPOI.POIid,
               /* TODO: date will be assigned when user save to favourite */
               "date": favorPOI.InsertionDate
            });
        })
        $http({
            method: "POST",
            url:"http://localhost:3000/private/poi/saveFavouritePOIs",
            headers: {"x-auth-token":$window.sessionStorage.getItem("token")},
            data: favToBeSaved
        }).then(function mySuccess(response) {
            alert("saved!");
        }, function myError(response) {
            alert("save was unsuccesfull");
        });
    };
    var switchFavouriteElementOrder=function(elem1Idx,elem2Idx){
        var favorPoiTemp=$scope.userFavourites[elem2Idx];
        $scope.userFavourites[elem2Idx]=$scope.userFavourites[elem1Idx];
        $scope.userFavourites[elem1Idx]=favorPoiTemp;
    };
    jq('#sortableTable').sortable({
        start: function(e, ui) {
            // creates a temporary attribute on the element with the old index
            $(this).attr('data-previndex', ui.item.index());
        },
        update: function(e, ui) {
            // gets the new and old index then removes the temporary attribute
            var newIndex = ui.item.index();
            var oldIndex = $(this).attr('data-previndex');
            switchFavouriteElementOrder(oldIndex,newIndex);
            $window.sessionStorage.setItem("userFavouritePOIs",JSON.stringify($scope.userFavourites));
            $(this).removeAttr('data-previndex');
        }
    });
});


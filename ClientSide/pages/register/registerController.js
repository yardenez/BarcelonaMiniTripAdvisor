// register controller
angular.module("myApp").controller("registerController", function ($scope, $http, $location) {
    // set possible questions for register.
    $http({
        method: "GET",
        url: "http://localhost:3000/users/GetVerificationQuestions"
    }).then(function mySuccess(response) {
        $scope.questionList = response.data;
    }, function myError(response) {
        $scope.test = "No Questions";
    });

    $http({
        method: "GET",
        url: "http://localhost:3000/categories/getAllCategories"
    }).then(function mySuccess(response) {
        $scope.categoryList = response.data;
    }, function myError(response) {
        $scope.test = "Categrories not returned";
    });

    // TODO: remove all error functions.

    $http({
        method: "GET",
        url: "http://localhost:3000/users/getCountries"
    }).then(function mySuccess(response) {
        $scope.countryList = response.data;
    }, function myError(response) {
        $scope.test = "Countires not returned";
    });

    
    getCat = function () {
        var categories = [];
        for (a in $scope.categories) {
            categories.push({ "name": $scope.categories[a].CategoryName });
        }
        return categories;
    }

    // TODO: check pattern errors!
    //TODO: miltiple have to choose 2;
    $scope.register = function () {
        var chosenCategories = [];
        chosenCategories = getCat();
        if (chosenCategories.length < 2){
            alert("please choose 2 interests");
        }
        else {
            $http({
                method: "POST",
                url: "http://localhost:3000/users/register",
                data: {
                    "username": $scope.reg_username,
                    "password": $scope.reg_password,
                    "firstName": $scope.reg_firstName,
                    "lastName": $scope.reg_lastName,
                    "city": $scope.reg_city,
                    "country": $scope.countrySelect,
                    "email": $scope.reg_email,
                    "categories": chosenCategories,
                    "firstQuestionId": $scope.questionSelect1.QuestionId,
                    "firstAnswer": $scope.reg_answer1,
                    "secondQuestionId": $scope.questionSelect2.QuestionId,
                    "secondAnswer": $scope.reg_answer2
                }
            }).then(function mySuccess(response) {
                alert("User created successfully");
                $location.path('/home');
            }, function myError(response) {
                console.log(response)
            });
        }
    }


});




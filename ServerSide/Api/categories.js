const express = require("express");
const navigator = express();
var DButilsAzure = require('./DButils');

//Get a list of all categories.
navigator.get("/getAllCategories", (req, res) => {

    DButilsAzure.execQuery("SELECT CategoryName FROM Categories;")
        .then(result => res.status(200).send(result))
        .catch(function(err){
            console.log(err)
            res.status(400).send(err)
        })

});

//Return all POI in the given category.
navigator.get("/getPOIByCategory/:catId", (req, res) => {
    var catId = req.params.catId;
    catId = parseInt(catId,10);
    DButilsAzure.execQuery("SELECT POIname,POIimage FROM PointsOfInterest WHERE Category_ID=" + catId + ";")
        .then(result => res.status(200).send(result))
        .catch(function(err){
            console.log(err) //not needed?
            res.status(400).send(err)
        })
});


module.exports = navigator;
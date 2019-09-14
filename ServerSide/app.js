// load modules
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const users =require("./Api/users");
const poi =require("./Api/poi");
const categories =require("./Api/categories");
const bodyParser= require("body-parser");
const cors=require("cors");
const secret = "YardenAndLihiSecretKey";

app.use(express.json());
app.use(bodyParser.json(),cors());
app.options('*',cors());
//validate user token
app.use("/private", function(req,res,next) {
    const token = req.header("x-auth-token");
    // no token
    if (!token) res.status(401).send("Access denied. No token provided.");
    // verify token
    try {
        const decoded = jwt.verify(token, secret);
        req.decoded = decoded;
        next();
    } catch (exception) {
        res.status(400).send("Invalid token.");
    }
});

app.use("/private/users", users);
app.use("/private/poi", poi);
app.use("/users", users);
app.use("/poi", poi);
app.use("/categories", categories);

//activate the server
const port= process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Server is listening on port ${port}`);
});


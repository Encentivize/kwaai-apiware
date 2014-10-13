
var express=require("express");
var connectionString="mongodb://127.0.0.1:27017/testdb";
var http=require("http");

var schema={
    properties:{
        name:{type:"string"},
        description:{type:"string"}
    },
    required:["name"]
}


var app=express();
var kwaaiApiware=require('./index.js').apiWare(connectionString);
app.set('port', process.env.PORT || 1337);

kwaaiApiware.apify(app);

app.use(kwaaiApiware.validateApiCall());

app.apiRoute({
    collection:"test collection",
    schema:schema,
    apiPrefix:"/",
    routeName:"test",
    useName:true
});


/*
var app=express();

app.use(kwaaiApiWare.validateApiCall())
kwaaiApiWare.apiRoute(app,{
    schema:{},
    collection:{}

})*/


var server=http.createServer(app);
server.listen(app.get('port'), function(){console.log('Express server listening on port ' + app.get('port'));});
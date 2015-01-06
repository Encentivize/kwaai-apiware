//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var kwaaiCrudwareUtils=require('kwaai-crudware').utils;
var bodyParser=require('body-parser');
var mwFlowSeries=require("middleware-flow").series;
var methodOverride=require("method-override");
//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var apiWare=function(pDB)
{
    var kwaaiCrudware=require('kwaai-crudware').crudWare(pDB);

    this.apify=function(app){
        app.apiRoute=function(options){
            //check that we have the basics
            if (!options.schema){throw new Error("No schema defined for apiRoute")}
            if (!options.collection){throw new Error("No collection defined for apiRoute")}

            //load defaults
            if (!options.apiPrefix){options.apiPrefix=""}
            if (!options.preMW){options.preMW=[]}
            if (!options.preCreateMW){options.preCreateMW=[]}
            if (!options.preReadMW){options.preReadMW=[]}
            if (!options.preUpdateMW){options.preUpdateMW=[]}
            if (!options.preDeleteMW){options.preDeleteMW=[]}
            if (!options.postCreateMW){options.postCreateMW=[]}
            if (!options.postReadMW){options.postReadMW=[]}
            if (!options.postUpdateMW){options.postUpdateMW=[]}
            if (!options.postDeleteMW){options.postDeleteMW=[]}
            if (!options.postMW){options.postMW=[]}

            //since we're chainging middleware together, we need something to bookedn everything.
            var route=options.apiPrefix+options.routeName;

            options.preMW.push(
                kwaaiCrudwareUtils.setKwaaiOptions({collection: options.collection, schema: options.schema,validate:false,coerce:false,sendresponse:false})
            );

            if (options.roles){
                options.preMW.push(kwaaiCrudwareUtils.onlyForRoles(options.roles));
            }

            if (options.useName){
                options.preMW.push(
                    function(req,res,next){
                        req.kwaaioptions.useName=true;
                        next();
                    }
                )

                options.preCreateMW=options.preCreateMW.concat([
                    function(req,res,next){
                        req.query.name=req.body.name;
                        next();
                    }
                    ,kwaaiCrudware.countByQuery
                    ,function(req,res,next){
                        if (req.kwaaires.data.count>0){return res.status(409).send("item with name exists")}
                        next();
                    }
                ]);
            }

            //caching
            var cacheDelItem=function(req,res,next){
                return next();
            }
            var cacheGetItem=function(req,res,next){
                return next();
            }
            var cacheSetItem=function(req,res,next){
                return next();
            }

            if (options.cache){
                cacheDelItem=function(req,res,next){
                    if (options.cache&&options.cache.isAvailable){
                        options.cache.del(options.routeName + "_" + req.params.id);
                    }
                    return next();
                }

                cacheGetItem=function(req,res,next){
                    if (options.cache&&options.cache.isAvailable){
                        function cacheItemRetrieved(err,value){
                            if (!err&&value){
                                return res.status(200).send(value);
                            }
                            else{
                                return next();
                            }
                        }
                        options.cache.get(options.routeName + "_" + req.params.id,cacheItemRetrieved);
                    }else{
                        return next();
                    }
                }
                cacheSetItem=function(req,res,next){
                    if (options.cache&&options.cache.isAvailable) {
                        if (req.kwaaires.status >= 200 && req.kwaaires.status < 299) {
                            options.cache.set(options.routeName + "_" + req.params.id,req.kwaaires.data);
                            return next();
                        } else {
                            return next();
                        }
                    }else{
                        return next();
                    }
                }
            }

            options.postMW.push(function(req,res){
                if (req.kwaaires.data){res.status(req.kwaaires.status).send(req.kwaaires.data)}
                else{res.status(req.kwaaires.status).end()}
            });


            //schemas
            this.get(route+"/schema",function(req,res){res.send(200,options.schema)})
            this.use(function(req,res,next){
                res.setHeader("schema-location", route+"/schema");
                return next();
            })

            //options
            //send nothing for now
            this.options(route,
                function(req,res){
                    res.set('Allow',["GET","POST","OPTIONS"].join(","));
                    res.status(200).end();
                });

            //routes

            var queryFunc=function(req,res,next){
                   kwaaiCrudware.getByQuery(req,res,next);

            }

            this.get(route,[].concat(options.preMW).concat(options.preReadMW).concat(queryFunc).concat(options.postReadMW).concat(options.postMW));
            this.post(route,[].concat(options.preMW).concat([kwaaiCrudwareUtils.validateData,kwaaiCrudwareUtils.coerceData]).concat(options.preCreateMW).concat(kwaaiCrudware.insert).concat(options.postCreateMW).concat(options.postMW));
            this.get(route+"/:id",[].concat(options.preMW).concat(options.preReadMW).concat(cacheGetItem).concat(kwaaiCrudware.getById).concat(options.postReadMW).concat(cacheSetItem).concat(options.postMW));
            this.put(route+"/:id",[].concat(options.preMW).concat(cacheDelItem).concat([kwaaiCrudwareUtils.validateData,kwaaiCrudwareUtils.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updateFull).concat(options.postUpdateMW).concat(options.postMW));
            this.patch(route+"/:id",[].concat(options.preMW).concat(cacheDelItem).concat([kwaaiCrudwareUtils.validateData,kwaaiCrudwareUtils.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updatePart).concat(options.postUpdateMW).concat(options.postMW));
            this.delete(route+"/:id",[].concat(options.preMW).concat(cacheDelItem).concat(options.preDeleteMW).concat(kwaaiCrudware.delete).concat(options.postDeleteMW).concat(options.postMW));
            this.options(route+"/:id",
                function(req,res){
                    res.set('Allow',["GET","PUT","PATCH","DELETE","OPTIONS"].join(","));
                    res.status(200).end();
                });

        }
    }

    this.validateApiCall=validateApiCall;
    function validateApiCall(){
      var bodyParserOptions = {
        limit: '25mb'
      };
        return mwFlowSeries(
            ensureValidContentTypes
            ,bodyParser.json(bodyParserOptions)
            ,handleJSONError
            ,methodOverride('X-HTTP-Method')// Microsoft
            ,methodOverride('X-HTTP-Method-Override')// Google/GData
            ,methodOverride('X-Method-Override')// IBM
        );
    }

    this.ensureValidContentTypes= ensureValidContentTypes;
    function ensureValidContentTypes(req, res, next){
        if (req.method=="OPTIONS"){
            return next();
        }

        if (req.method=="GET"){
            res.contentType="application/json";
            return next();
        }

        var regexp= /^application\/([\w!#\$%&\*`\-\.\^~]*\+)?json/i;
        if (!regexp.test(req.headers['content-type']))
        {
            res.status(415).send('Unsupported content type');
        }
        else
        {
            next();
        }
    }

    this.handleJSONError=handleJSONError;
    function handleJSONError(err, req, res, next){
        console.error(err);
        res.status(400).send(err);
    }
}

module.exports=function(db){
    return new apiWare(db);
}

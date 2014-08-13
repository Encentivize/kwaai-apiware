//*********************************************************************************************************************************************************************
//requires
//*********************************************************************************************************************************************************************

var kwaaiCrudware=require('kwaai-crudware');
var connect=require('connect');
var mwFlowSeries=require("middleware-flow").series;

//*********************************************************************************************************************************************************************
//exports
//*********************************************************************************************************************************************************************

var mw=
{
    apify:
        function(app){
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
                options.preMW.push(kwaaiCrudware.setKwaaiOptions({collection: options.collection, schema: options.schema,validate:false,coerce:false,sendresponse:false}));

                if (options.roles){ options.preMW.push(kwaaiCrudware.onlyForRoles(options.roles));}

                options.postMW.push(function(req,res){
                    if (req.kwaaires.data){res.send(req.kwaaires.status, req.kwaaires.data)}
                    else{res.send(req.kwaaires.status)}
                });


                //schemas
                this.get(route+"/schema",function(req,res){res.send(200,options.schema)})
                this.use(function(req,res,next){res.setHeader("schema-location", route+"/schema");
                    return next();})

                //options
                //send nothing for now
                this.options(route,
                    function(req,res){
                        res.set('Allow',["GET","POST","OPTIONS"].join(","));
                        res.send(200);
                    });

                //routes
                this.get(route,[].concat(options.preMW).concat(options.preReadMW).concat(kwaaiCrudware.getByQuery).concat(options.postReadMW).concat(options.postMW));
                this.post(route,[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preCreateMW).concat(kwaaiCrudware.insert).concat(options.postCreateMW).concat(options.postMW));
                this.get(route+"/:id",[].concat(options.preMW).concat(options.preReadMW).concat(kwaaiCrudware.getById).concat(options.postReadMW).concat(options.postMW));
                this.put(route+"/:id",[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updateFull).concat(options.postUpdateMW).concat(options.postMW));
                this.patch(route+"/:id",[].concat(options.preMW).concat([kwaaiCrudware.validateData,kwaaiCrudware.coerceData]).concat(options.preUpdateMW).concat(kwaaiCrudware.updatePart).concat(options.postUpdateMW).concat(options.postMW));
                this.delete(route+"/:id",[].concat(options.preMW).concat(options.preDeleteMW).concat(kwaaiCrudware.delete).concat(options.postDeleteMW).concat(options.postMW));
                this.options(route+"/:id",
                    function(req,res){
                        res.set('Allow',["GET","PUT","PATCH","DELETE","OPTIONS"].join(","));
                        res.send(200);
                    });

            }
        }


    ,validateApiCall:
        function(){
            return mwFlowSeries(
                mw.ensureValidContentTypes
                ,connect.json()
                ,mw.handleJSONError
                ,connect.urlencoded()
                ,connect.methodOverride()
            );
        }

    ,ensureValidContentTypes:
        function(req, res, next){
            return next();
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
                res.send(415, 'Unsupported content type');
            }
            else
            {
                next();
            }
        }

    ,handleJSONError:
        function(err, req, res, next){
            console.error("json error %s",err);
            res.send(400,err);
        }
}

module.exports=mw;


function handleJsonError(err, req, res, next){
    console.error("json error %s",err);
    res.send(400,err);
}

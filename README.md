#kwaai-apiware

Express middleware specifically for creating restful JSON api's using JSON Schema, Mongo and Express


##Example
```javascript


```
##API

###apiRoute(app,options)
Adds an apiroute to express.
app: the express app
options:
* `collection`
* `schema`


###validateApiCall(req,res,next)
Validates the data passed to the JSON api to ensure it is valid JSON and the content type is correct.


###ensureValidContentTypes(req,res,next)
Ensures the content passed through to the api is valid JSON. Return 400 bad request.


###handleJSONError(req,res,next)
Formats the correct error when a JSON error is detected




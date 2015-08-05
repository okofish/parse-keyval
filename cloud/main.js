// These two lines are required to initialize Express in Cloud Code.
express = require('express');
app = express();
// Global app configuration section
app.set('views', 'cloud/views'); // Specify the folder to find templates
app.set('view engine', 'ejs'); // Set the template engine
app.use(express.bodyParser()); // Middleware for reading request body
// This is an example of hooking up a request handler with a specific request
// path and HTTP verb using the Express routing API.
app.get('/store', function(req, res) {
  var Record = Parse.Object.extend("Record");
  var record = new Record();
  for (var q in req.query) {
    var parsed = q;
    if (parseInt(parsed)) {
      parsed = parseInt(parsed)
    };
    record.set(q, req.query[q]);
  }
  //record.set("receiveTime", (new Date()).getTime());  // use this if you want high-accuracy recording of the time the server receives the request.
  // however, it's generally a good idea to pass a timestamp parameter with the request.
  record.save(null, {
    success: function(record) {
      console.log('New object created with objectId: ' + record.id);
      res.status(200).send({
        success: true,
        error: null,
        id: record.id
      });
    },
    error: function(record, error) {
      // error is a Parse.Error with an error code and message.
      console.error('Failed to create new object, with error code: ' + error.code + " - " + error.message);
      res.status(500).send({
        success: false,
        error: {
          code: error.code,
          message: error.message
        },
      });
      Parse.Analytics.track('error', {
        code: error.code.toString()
      });
    }
  });
  Parse.Analytics.track('request', {
    type: 'store'
  });
});
app.get('/get', function(req, res) {
  var Record = Parse.Object.extend("Record");
  var query = new Parse.Query(Record);
  query.ascending("score");
  query.limit(req.query.limit || 1000); // 1000 is the Parse maximum.
  query.skip(req.query.skip || 0);
  query.find({
    success: function(records) {
      res.status(200).send({
        success: true,
        error: null,
        count: records.length,
        data: records
      });
    },
    error: function(error) {
      console.error("Failed to retrieve records, with error code: " + error.code + " - " + error.message);
      res.status(500).send({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
      Parse.Analytics.track('error', {
        code: error.code.toString()
      });
    }
  });
  Parse.Analytics.track('request', {
    type: 'get'
  });
});
app.get('/count', function(req, res) {
  var Record = Parse.Object.extend("Record");
  var q = new Parse.Query(Record);
  q.count({
    success: function(count) {
      console.log("Successfully counted " + count + " records.");
      res.status(200).send({
        success: true,
        error: null,
        count: count
      });
    },
    error: function(error) {
      console.error("Failed to count records, with error code: " + error.code + " - " + error.message);
      res.status(500).send({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
      Parse.Analytics.track('error', {
        code: error.code.toString()
      });
    }
  });
  Parse.Analytics.track('request', {
    type: 'count'
  });
});
app.get('/delete', function(req, res) {
  if (req.query.id) {
    var Record = Parse.Object.extend("Record");
    var q = new Parse.Query(Record);
    q.get(req.query.id, {
      success: function(record) {
        // The object was retrieved.
        record.destroy({
          success: function(record) {
            // The object was deleted from the Parse Cloud.
            console.log("Successfully deleted object " + record.id);
            res.status(200).send({
              success: true,
              error: null,
              id: record.id
            });
          },
          error: function(record, error) {
            // The delete failed.
            console.error("Record deletion failed, with error code: " + error.code + " - " + error.message);
            res.status(500).send({
              success: false,
              error: {
                code: error.code,
                message: error.message
              }
            });
            Parse.Analytics.track('error', {
              code: error.code.toString()
            });
          }
        });
      },
      error: function(record, error) {
        // The object was not retrieved successfully.
        console.error("Record retrieval failed, with error code: " + error.code + " - " + error.message);
        res.status(500).send({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        try {
          Parse.Analytics.track('error', {
            code: error.code.toString()
          });
        } catch (e) {
          //console.error(e)
        }
      }
    });
  } else {
    res.status(400).send({
      success: false,
      error: {
        code: 400,
        message: 'Record id not included in request'
      }
    });
    Parse.Analytics.track('error', {
      code: '400'
    });
  }
  Parse.Analytics.track('request', {
    type: 'delete'
  });
});

app.get('/', function(req, res) {
  res.render('home', {
    hostname: req.get('host')
  })
});

app.use(function(req, res) {
  res.status(404).send({
    error: {
      code: 404,
      message: 'Endpoint not found.'
    }
  });
  Parse.Analytics.track('error', {
    code: '400',
    path: req.path
  });
});
app.listen();

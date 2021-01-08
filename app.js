var config = require('./settings');
var express = require('express');
var querystring= require('querystring');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var request = require('request');
var sessionstore = require('sessionstore');
var session = require('express-session');
//var models = require('./models');
var app = express();

const { accountSid, authToken } = config;
var client = require('twilio')(accountSid, authToken);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.locals.moment = require('moment');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(
    {
        secret: 'keyboard cat',
        store: sessionstore.createSessionStore(),
        resave: true,
        saveUninitialized: true
    }
));
app.use(express.static(path.join(__dirname, 'public')));
//app.set("models", models);
//const MerchantModel = app.get("models").merchant;

// Shopify Authentication
// This function initializes the Shopify OAuth Process
// The template in views/embedded_app_redirect.ejs is rendered 
app.get('/shopify_auth', function(req, res) {
    if (req.query.shop) {
        req.session.shop = req.query.shop;
        res.render('embedded_app_redirect', {
            shop: req.query.shop,
            api_key: config.oauth.api_key,
            scope: config.oauth.scope,
            redirect_uri: config.oauth.redirect_uri
        });
    }
})

// After the users clicks 'Install' on the Shopify website, they are redirected here
// Shopify provides the app the is authorization_code, which is exchanged for an access token
app.get('/access_token', verifyRequest, function(req, res) {
    if (req.query.shop) {
        var params = { 
            client_id: config.oauth.api_key,
            client_secret: config.oauth.client_secret,
            code: req.query.code
        }
        var req_body = querystring.stringify(params);
        console.log(req_body)
        request({
            url: 'https://' + req.query.shop + '/admin/oauth/access_token', 
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(req_body)
            },
            body: req_body
        }, 
        function(err,resp,body) {
            console.log(body);
            body = JSON.parse(body);
            req.session.access_token = body.access_token;
            console.log(req.session);
            res.redirect('/');
        })
    }
})

// Renders the install/login form
app.get('/install', function(req, res) {
    res.render('app_install', {
        title: 'Shopify Embedded App'
    });
})

// Renders content for a modal 
app.get('/modal_content', function(req, res) {
    if(req.query.var === 'sms'){
        res.render('modal_content', {
            title: 'Create Message'
        });
    }else{
        res.render('modal_history', {
            title: 'Message Hisory'
        });
    }
})

// The home page, checks if we have the access token, if not we are redirected to the install page
// This check should probably be done on every page, and should be handled by a middleware
app.get('/', function(req, res) {
    if (req.session.access_token) {
        res.render('index', {
            title: 'Sign up for Twilio',
            api_key: config.oauth.api_key,
            shop: req.session.shop
        });
    } else {
        res.redirect('/install');
    }
})

app.get('/customers', function(req, res){
    res.render('products', {
        title: 'Select Date Range', 
        api_key: config.oauth.api_key,
        shop: req.session.shop
    });
});

app.get('/privacypolicy', function(req, res){
    res.render('privacypolicy', {
        title: 'Privacy Policy', 
        api_key: config.oauth.api_key,
        shop: req.session.shop
    });
});

app.post('/customers', function(req, res, next) {
    const { created_at_min, created_at_max } = req.body;
    request.get({
        url: 'https://' + req.session.shop + 
        '.myshopify.com/admin/api/2020-01/customers.json?created_at_min='+created_at_min+'&created_at_max='+created_at_max,
        headers: {
            'X-Shopify-Access-Token': req.session.access_token
        }
    }, function(error, response, body){
        if(error){
             return next(error);
        }
        body = JSON.parse(body);
        const { customers } = body;
        let approved_customers = customers.filter(x => x.accepts_marketing)
        res.send(approved_customers);
    })
})

app.post('/submitsms', function(req, res){
    //must authorize
    var msg = req.body.textmessage + ' ' + req.body.url,
        batch = req.body.contact;
        batch.forEach(function(sms){
          client.messages
             .create({
                body: msg,
                from: '+19083565955',
                to: sms.phone
        })
        .then((message) => { 
            var textres = batch.length > 1 ? 'Your message has been sent to '+ batch.length +
            ' people' : 'Your message has been sent to '+ batch.length +' person';
            
            res.status(200).send(textres);
            message.sid
        });
    });
  });

function verifyRequest(req, res, next) {
    var map = JSON.parse(JSON.stringify(req.query));
    delete map['signature'];
    delete map['hmac'];

    var message = querystring.stringify(map);
    var generated_hash = crypto.createHmac('sha256', config.oauth.client_secret).update(message).digest('hex');
    if (generated_hash === req.query.hmac) {
        next();
    } else {
        return res.json(400);
    }

}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

/*
var server_ip_address = '127.0.0.1';
  app.set('port', process.env.PORT || 3000);
  var server = app.listen(app.get('port'), server_ip_address, function() {
  console.log('Express server listening on port ' + server.address().port);
});
*/

module.exports = app;

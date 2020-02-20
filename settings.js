require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
});

module.exports = {
	"oauth": {
		"api_key": process.env.api_key,
		"client_secret": process.env.client_secret,
		"redirect_uri": process.env.redirect_uri,
		"scope": process.env.scope
	},
	"db": {
		"MONGOOSE_URI": process.env.MONGOOSE_URI,
		"MONGOOSE_USER": process.env.MONGOOSE_USER,
		"MONGOOSE_PASS": process.env.MONGOOSE_PASS,
		"MONGOOSE_DB": process.env.MONGOOSE_DB
	},
	"app_url": "//localhost:3000",
	"accountSid":process.env.accountSid, 
	"authToken":process.env.authToken
}
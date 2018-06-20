require('dotenv').config();
var assert = require('assert');
var request = require('request');
var server = require('../server');
const btoa = require('btoa');
const {
  ISSUER,
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  DEFAULT_SCOPE } = process.env;

describe('/getData', function() {
  var app;

  before(function() {
    app = server;
  });

  after(function() {
    app.close();
  });

  it('Should reject request without jwt', (done) => {
    request.get('http://localhost:3009/getData', function(err, res, body){
      assert.equal(res.statusCode, 401);
      done();
    });
  });

  it('Should return data when passed a valid jwt', (done) => {
    const test = async() => {
      const token = btoa(`${TEST_CLIENT_ID}:${TEST_CLIENT_SECRET}`);
      try {
        const { token_type, access_token } = await request({
          uri: `${ISSUER}/v1/token`,
          json: true,
          method: 'POST',
          headers: {
            authorization: `Basic ${token}`,
          },
          form: {
            grant_type: 'client_credentials',
            scope: DEFAULT_SCOPE,
          },
        });

        const response = await request({
          uri: 'http://localhost:3009/getData',
          json: true,
          headers: {
            authorization: [token_type, access_token].join(' '),
          },
        });
        done();
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    };
    test();

  });
});

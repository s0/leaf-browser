define([], function(){
  'use strict';

  var KEYCODES = {
    ENTER: 13,
    L: 76,
    Q: 81,
    T: 84
  };

  var REGEXES = {
    // Basic regex that tries to attempt to match a domain name
    DOMAIN: /^[a-z0-9\-\_]+(\.[a-z0-9\-\_]+)+$/,
    URL: /^[a-z]+\:\/\/.*$/
  };

  return {
    KEYCODES: KEYCODES,
    REGEXES: REGEXES
  };

});

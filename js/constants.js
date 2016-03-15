define([], function(){
  'use strict';

  var KEYCODES = {
    ENTER: 13,
    ESC: 27,
    F: 70,
    L: 76,
    N: 78,
    Q: 81,
    R: 82,
    T: 84,
    W: 87
  };

  var REGEXES = {
    // Basic regex that tries to attempt to match a domain name
    URL_NO_PROTO: /^[a-z0-9\-\_]+(\.[a-z0-9\-\_]+)+(\/.*)?$/,
    URL: /^[a-z]+\:\/\/.*$/
  };

  return {
    KEYCODES: KEYCODES,
    REGEXES: REGEXES
  };

});

define(['tabs'], function(tabs){
  'use strict';

  var KEYCODES = {
    T: 84
  }

  function init() {

    $(window).keyup(function(e){
      if (e.ctrlKey && e.which == KEYCODES.T) {
        tabs.open_new_tab();
      }
    });

  }

  return {
    init: init
  };

});

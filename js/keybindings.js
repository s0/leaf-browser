define(['tabs'], function(tabs){
  'use strict';

  var KEYCODES = {
    T: 84
  };

  function init() {

    $(window).keyup(function(e){
      switch(e.which){
        case KEYCODES.T:
          if(e.ctrlKey)
            tabs.open_new_tab();
          break;
        default:
          console.log(e);
      }
    });

  }

  return {
    init: init
  };

});

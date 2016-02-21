define(['storage','tabs'], function(storage, tabs){
  'use strict';

  var KEYCODES = {
    Q: 81,
    T: 84
  };

  function init() {

    $(window).keyup(function(e){
      switch(e.which){
        case KEYCODES.T:
          if(e.ctrlKey)
            tabs.open_new_tab();
          break;
        case KEYCODES.Q:
          if(e.ctrlKey)
            storage.clear();
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

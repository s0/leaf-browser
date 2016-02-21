require(['keybindings', 'tabs'], function(keybindings, tabs){
  'use strict';

  $(document).ready(function(){

    var _templates = {};

    $('#templates').children().each(function(){
      var $this = $(this);
      _templates[$this.data('template')] = $this.children().first();
    });

    keybindings.init();
    tabs.init(_templates);

  });
});

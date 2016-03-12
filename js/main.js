require(['keybindings', 'tabs', 'welcome_screen'],
  function(keybindings, tabs, welcome_screen){
  'use strict';

  $(document).ready(function(){

    var _templates = {};

    $('#templates').children().each(function(){
      var $this = $(this);
      _templates[$this.data('template')] = $this.children().first();
    });

    welcome_screen.init();
    keybindings.init();
    tabs.init(_templates);

  });
});

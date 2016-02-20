require(['tabs'], function(tabs){
  'use strict';

  $(document).ready(function(){

    var _templates = {};

    $('#templates').children().each(function(){
      var $this = $(this);
      _templates[$this.data('template')] = $this.children().first();
    });

    tabs.init(_templates);

  });
});

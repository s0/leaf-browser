define([], function() {
  'use strict';

  function init() {
    var $welcome = $('#welcome');
    var $hints = $welcome.find('.hints');
    var _interval = setInterval(next_hint, 6000);
    var _animating = false;

    function next_hint() {
      if (_animating){
        return;
      }
      _animating = true;
      var $current = $hints.children('.selected');
      $current.removeClass('visible');
      setTimeout(function() {
        $current.removeClass('selected');
        var $next = $current.next();
        if ($next.length === 0){
          $next = $hints.children().first();
        }
        $next.addClass('visible').addClass('selected');
        _animating = false;
      }, 500);
    }

  }

  return {
    init: init
  };

});

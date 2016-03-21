require(['keybindings', 'tabs', 'tab_content', 'welcome_screen'],
  function(keybindings, tabs, tab_content, welcome_screen) {
  'use strict';

  $(document).ready(function() {

    var $main_container = $('#main-container');
    var _templates = {};

    $('#templates').children().each(function() {
      var $this = $(this);
      _templates[$this.data('template')] = $this.children().first();
    });

    $('.button-collapse').click(function() {
      $main_container.toggleClass('collapsed-tree');
    });

    $('.reveal-container .button').mouseover(function() {
      $main_container.addClass('reveal-tree');
    });

    $('.header .logo').click(function() {
      tabs.unselect_current_tab();
    });

    $(window).mousemove(function(e) {
      if (e.clientX > 300) {
        $main_container.removeClass('reveal-tree');
      }
    });

    welcome_screen.init();
    keybindings.init();
    tabs.init(_templates);
    tab_content.init(_templates);

  });
});

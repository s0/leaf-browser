define([], function(){
  'use strict';

  var $node_template;
  var $tab_tree;
  var $current;

  function init(templates){
    $node_template = templates['tab-tree-node'];
    $tab_tree = $('.tab-tree');

    var $new_tab_button = $('.new-tab-button');
    $new_tab_button.click(open_new_tab);
  }

  function open_new_tab(){
    var $node = $node_template.clone();
    $node.find('.label').text('New Tab');
    $node.find('.button').click(function(){
      if($current)
        $current.removeClass('selected');
      $current = $node;
      $node.addClass('selected');
    });
    $node.appendTo($current ? $current.children('.children') : $tab_tree);
  }




  return {
    init: init,
    open_new_tab: open_new_tab
  }

});

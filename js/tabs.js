define([], function(){
  'use strict';

  var _next_tab_id = 0;
  var $node_template;
  var $tab_tree;
  var _current;

  function init(templates){
    $node_template = templates['tab-tree-node'];
    $tab_tree = $('.tab-tree');

    var $new_tab_button = $('.new-tab-button');
    $new_tab_button.click(open_root_tab);
  }

  function open_root_tab(){
    var _tab = new Tab();
    _tab.append_to_root();
  }

  function open_new_tab(){
    var _tab = new Tab();
    _tab.append_to_tab(_current);
  }

  function Tab(){
    this.id = _next_tab_id ++;
    this.$node = $node_template.clone();

    // Setup New Tab
    this.$node.find('.label').text('New Tab');
    this.$node.find('.button').click(this.node_clicked.bind(this));
  }

  Tab.prototype.node_clicked = function(){
    this.select_tab();
  };

  Tab.prototype.select_tab = function(){
    if(_current)
      _current.unselect_tab();
    _current = this;
    this.$node.addClass('selected');
  };

  Tab.prototype.unselect_tab = function(){
    this.$node.removeClass('selected');
  };

  Tab.prototype.append_to_tab = function(tab){
    if (tab)
      this.$node.appendTo(tab.$node.children('.children'));
    else
      this.append_to_root();
  };

  Tab.prototype.append_to_root = function(){
    this.$node.appendTo($tab_tree);
  };

  return {
    init: init,
    open_new_tab: open_new_tab
  };

});

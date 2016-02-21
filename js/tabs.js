define(['storage'], function(storage){
  'use strict';

  var _next_tab_id = 0;
  var $node_template;
  var $tab_tree;
  var _current;
  var _tabs = {};

  function init(templates){
    $node_template = templates['tab-tree-node'];
    $tab_tree = $('.tab-tree');

    var $new_tab_button = $('.new-tab-button');
    $new_tab_button.click(open_root_tab);

    // Add existing tabs
    storage.load_tabs(function(tabs){
      load_tab_data(tabs);
    });

    storage.add_tabs_listener(load_tab_data);
  }

  function load_tab_data(tabs){
    console.log("data: ", tabs);
    $.each(tabs.tabs, function(id, tab_data){
      var _tab = _tabs[id];
      if (_tab === undefined){
        new Tab(id, tab_data);
      } else {
        _tab.update_by_data(tab_data);
      }
    });
    $.each(_tabs, function(id, tab) {
      if(!(id in tabs.tabs))
        tab.update_by_data(undefined);
    });
  }

  function open_root_tab(){
    get_free_tab_id(function(id){
      var _tab = new Tab(id);
      _tab.append_to_root();
    });
  }

  function open_new_tab(){
    get_free_tab_id(function(id){
      var _tab = new Tab(id);
      _tab.append_to_tab(_current);
    });
  }

  function get_free_tab_id (callback){
    storage.load_tabs(function(tabs){
      var _id = 0;
      while (_id in tabs.tabs)
        _id ++;
      callback(_id);
    });
  }

  function Tab(id, tab_data){
    _tabs[id] = this;
    this.id = id;
    this.$node = $node_template.clone();
    this.parent = null;

    if (tab_data === undefined) {
      // Store tab
      this.store_tab_data();
    } else {
      // Loaded by data
      this.update_by_data(tab_data);
    }

    // Setup New Tab
    this.$node.find('.label').text('New Tab: ' + id);
    this.$node.find('.button').click(this.node_clicked.bind(this));
  }

  Tab.prototype.update_by_data = function(data){
    // Never modify the data in this method
    if(data === undefined){
      // The tab has been deleted
      delete _tabs[this.id];
      this.$node.remove();
      return;
    }
    if (data.parent)
      this.parent = data.parent;
    if (data.parent){
      var _parent_tab = _tabs[data.parent];
      if (_parent_tab){
        this.$node.appendTo(_parent_tab.$node.children('.children'));
      } else {
        console.error("Parent does not exist");
      }
    } else {
      this.$node.appendTo($tab_tree);
    }
  };

  Tab.prototype.store_tab_data = function(){
    storage.set_tab_data(this.id, {
      parent: this.parent
    });
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
    if (tab){
      this.parent = tab.id;
      this.store_tab_data();
    } else {
      this.append_to_root();
    }
  };

  Tab.prototype.append_to_root = function(){
    this.parent = null;
    this.store_tab_data();
  };

  return {
    init: init,
    open_new_tab: open_new_tab
  };

});

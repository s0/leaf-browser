define(['constants', 'storage', 'tab_content', 'util'],
  function(C, storage, tab_content, util){
  'use strict';

  var _next_tab_id = 0;
  var $node_template;
  var $tab_tree;
  var $tabs;
  var _current = null;
  var _tabs = {};
  var _dragging_tab = null;

  function init(templates){
    $node_template = templates['tab-tree-node'];
    $tab_tree = $('.tab-tree');

    var $new_tab_button = $('.new-tab-button');
    $new_tab_button.click(open_new_root_tab);

    // Add existing tabs
    storage.load_tabs(function(tabs){
      load_tab_data(tabs);
    });

    storage.add_tabs_listener(load_tab_data);

    $(window).mousemove(function(e) {
      if (_dragging_tab) {
        if (!_dragging_tab.detatched && util.has_dragged(_dragging_tab.e, e)){
          _dragging_tab.tab.detatch();
          _dragging_tab.detatched = true;
        }
      }
    }).mouseup(function(e) {
      if (_dragging_tab && _dragging_tab.detatched) {
        _dragging_tab.tab.attach();
        e.preventDefault();
      }
      _dragging_tab = null;
    });
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
    if(_current !== null && !(_current in _tabs))
      _current = null;
  }

  function open_new_root_tab(){
    get_free_tab_id(function(id){
      var _tab = new Tab(id);
      _tab.append_to_root();
      _tab.select_tab();
    });
  }

  function open_new_tab(callback, select){
    get_free_tab_id(function(id){
      var _tab = new Tab(id);
      _tab.append_to_tab(_current);
      if (select) {
        _tab.select_tab();
      }
      if (callback) {
        callback(_tab);
      }
    });
  }

  function with_current(callback){
    if (_current !== null) {
      var _tab = _tabs[_current];
      if (_tab) {
        callback(_tab);
      }
    }
  }

  function close_current_tab(){
    with_current(function(tab){
      tab.close_tab();
    });
  }

  function escape_current_tab(){
    with_current(function(tab){
      tab.escape_tab();
    });
  }

  function unselect_current_tab(){
    with_current(function(tab){
      tab.unselect_tab();
    });
  }

  function refresh_current_tab(){
    with_current(function(tab){
      tab.get_webview().reload();
    });
  }

  function focus_address_bar() {
    with_current(function(tab) {
      tab.with_content(function(content) {
        content.focus_address_bar();
      });
    });
  }

  function start_find(){
    with_current(function(tab){
      tab.start_find();
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
    this.$children = this.$node.children('.children').first();
    this.$content = null;
    this.content = null;
    this.parent = null;

    if (tab_data === undefined) {
      // Store tab
      this.store_tab_data();
    } else {
      // Loaded by data
      this.update_by_data(tab_data);
    }

    this._setup_listeners();
  }

  $.extend(Tab.prototype, {
    _setup_listeners: function() {
      var $tab = this.$node.children('.tab');
      var $button = $tab.find('.button');
      var $arrow = $tab.find('.arrow');
      $arrow.click(this.arrow_clicked.bind(this));
      $button.click(this.button_clicked.bind(this)).mousedown(function(e) {
        if (!_dragging_tab){
          _dragging_tab = {
            tab: this,
            e: e
          };
        }
      }.bind(this));

      $button.find('.icon.close').click(function(e){
        this.close_tab();
        e.stopPropagation();
      }.bind(this));
    },


    has_children: function() {
      return this.$children.children().children('.tab').not('.hide').length !== 0;
    },

    with_each_ancestor: function(callback) {
      var _current = this;
      while (true) {
        _current = (_current.parent || _current.parent === 0) ? _tabs[_current.parent] : null;
        if (!_current){
          return;
        }
        if(callback(_current)){
          return;
        }
      }
    },

    update_tab_text: function() {
      var _text;
      if(this.tab_name && this.tab_name !== '') {
        _text = this.tab_name;
      } else {
        _text = this.title;
      }
      this.$node.children('.tab').find('.button .label').text(_text);
    },

    update_tab_color: function() {
      var _color = this.tab_color;
      var $color_indicator = this.$node.children('.tab').find('.color-indicator');
      if (!_color){
        this.with_each_ancestor(function(tab) {
          if (tab.tab_color){
            _color = tab.tab_color;
            return true;
          }
        });
      }
      if (_color) {
        $color_indicator.show().css('background-color', _color);
        $color_indicator.toggleClass('small', !this.tab_color);
      } else {
        $color_indicator.hide();
      }
    },

    update_by_data: function(data) {
      // Never modify the data in this method
      if(data === undefined){
        // The tab has been deleted
        delete _tabs[this.id];
        this.$node.children('.tab').addClass('hide');
        setTimeout(function (){
          this.$node.remove();
        }.bind(this), 500);
        if (this.$content) {
          this.$content.remove();
        }
        // Update Parent if Neccesary
        if (this.parent !== null) {
          _tabs[this.parent].update_display();
        }
        return;
      }

      // Parent
      if (this.parent !== data.parent || !this.setup) {
        var _attached = false;
        if (data.parent !== null) {
          var _parent_tab = _tabs[data.parent];
          if (_parent_tab) {
            if (util.is(this.$node).an_ancestor_of(_parent_tab.$node)) {
              console.error("Cyclic Parents!", _parent_tab, this);
            } else {
              _attached = true;
              this.$node.appendTo(_parent_tab.$children);
              this.parent = data.parent;
              _parent_tab.update_display();
            }
          } else {
            console.error("Parent does not exist");
          }
        }
        if (!_attached) {
          this.$node.appendTo($tab_tree);
          this.parent = null;
        }
      }

      if (data.expanded) {
        this.expanded = true;
        this.$node.addClass('expanded');
      } else {
        this.expanded = false;
        this.$node.removeClass('expanded');
      }

      // Url
      if (!this.url) {
        this.url = data.url;
      }

      // Title
      if (!this.title) {
        this.title = data.title ? data.title : "New Tab";
      }
      this.tab_name = data.tab_name;
      this.update_tab_text();

      // Color
      this.tab_color = data.tab_color;
      this.update_tab_color();

      this.pinned = !!data.pinned;

      this.setup = true;
      this.update_display();
      this.update_content_display();
    },

    update_display: function(){
      this.$node.toggleClass('has-children', this.has_children());
      this.$node.toggleClass('pinned', this.pinned);
    },

    with_content: function(callback, create) {
      var _new = false;
      if (!this.content && create) {
        _new = true;
        this.content = new tab_content.TabContent(this);
      }
      if (this.content) {
        callback(this.content);
      }
      return _new;
    },

    update_content_display: function(){
      this.with_content(function(content) {
        content.update_display();
      });
    },

    store_tab_data: function(){
      storage.set_tab_data(this.id, {
        parent: this.parent,
        expanded: this.expanded,
        url: this.url,
        title: this.title,
        tab_name: this.tab_name,
        tab_color: this.tab_color,
        pinned: this.pinned
      });
    },

    button_clicked: function(e){
      this.select_tab();
    },

    arrow_clicked: function(e){
      this.expanded = !this.expanded;
      this.store_tab_data();
    },

    select_tab: function(){
      with_current(function(tab){
        tab.unselect_tab();
      });
      _current = this.id;
      this.$node.addClass('selected');

      var _new = this.setup_tab_content();
      this.content.show();
      if (_new){
        this.content.focus_address_bar();
      }
    },

    // Return true if this is the first time that this.$content has been setup
    setup_tab_content: function($existing_webview){
      // Object to give TabContent to control tabs
      var _tab_control = {
        open_new_tab: open_new_tab
      };
      if (!this.content) {
        this.content = new tab_content.TabContent(_tab_control, this, $existing_webview);
        return true;
      }
      if ($existing_webview && this.content) {
        throw new Error("this.content already setup for tab", this);
      }
      return false;
    },

    unselect_tab: function(){
      this.$node.removeClass('selected');
      this.content.hide();
      if (this.id === _current) {
        _current = null;
      }
    },

    escape_tab: function(){
      this.with_content(function(content) {
        content.escape_content();
      });
    },

    start_find: function(){
      this.with_content(function(content) {
        content.start_find();
      });
    },

    close_tab: function(){
      // Don't close if pinned
      // TODO: show message
      if (this.pinned) {
        return;
      }
      // If the tab has children, don't close
      // TODO: confirm
      if (this.has_children()) {
        return;
      }
      // Switch to a new tab if possible (parent)
      if (_current === this.id) {
        if (this.parent !== null){
          var _parent = _tabs[this.parent];
          _parent.select_tab();
        } else {
          this.unselect_tab();
          _current = null;
        }
      }
      // Delete Tab Data
      storage.set_tab_data(this.id, undefined);
    },

    append_to_tab: function(id){
      if (id !== null){
        this.parent = id;
        this.store_tab_data();
        var _parent_tab = _tabs[this.parent];
        if(!_parent_tab.expanded){
          _parent_tab.expanded = true;
          _parent_tab.store_tab_data();
        }
      } else {
        this.append_to_root();
      }
    },

    append_to_root: function(){
      this.parent = null;
      this.store_tab_data();
    },

    detatch: function() {
      this.$node.addClass('detatched');
    },

    attach: function() {
      this.$node.removeClass('detatched');
    }
  });

  return {
    init: init,
    open_new_tab: open_new_tab,
    open_new_root_tab: open_new_root_tab,
    focus_address_bar: focus_address_bar,
    close_current_tab: close_current_tab,
    unselect_current_tab: unselect_current_tab,
    escape_current_tab: escape_current_tab,
    refresh_current_tab: refresh_current_tab,
    start_find: start_find
  };

});

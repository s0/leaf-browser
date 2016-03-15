define(['constants', 'storage'], function(C, storage){
  'use strict';

  var _next_tab_id = 0;
  var $node_template;
  var $tab_content_template;
  var $tab_webview_template;
  var $tab_tree;
  var $tabs;
  var _current = null;
  var _tabs = {};

  function init(templates){
    $node_template = templates['tab-tree-node'];
    $tab_content_template = templates['tab-content'];
    $tab_webview_template = templates['tab-webview'];
    $tab_tree = $('.tab-tree');
    $tabs = $('.app-right .tabs');

    var $new_tab_button = $('.new-tab-button');
    $new_tab_button.click(open_new_root_tab);

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

  function focus_address_bar(){
    with_current(function(tab){
      tab.focus_address_bar();
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

  function address_bar_text_to_url(text){
    if (C.REGEXES.DOMAIN.exec(text)) {
      return "https://" + text;
    }
    if (C.REGEXES.URL.exec(text)) {
      return text;
    }
    // Return a google search
    return 'https://www.google.com/search?q=' + text;
  }

  function url_to_address_bar_text(url){
    return url;
  }

  function Tab(id, tab_data){
    _tabs[id] = this;
    this.id = id;
    this.$node = $node_template.clone();
    this.$children = this.$node.children('.children').first();
    this.$content = null;
    this.parent = null;

    if (tab_data === undefined) {
      // Store tab
      this.store_tab_data();
    } else {
      // Loaded by data
      this.update_by_data(tab_data);
    }

    // Setup New Tab
    var $tab = this.$node.children('.tab');
    var $button = $tab.find('.button');
    var $arrow = $tab.find('.arrow');
    $button.click(this.button_clicked.bind(this));
    $arrow.click(this.arrow_clicked.bind(this));

    $button.find('.icon.close').click(function(e){
      this.close_tab();
      e.stopPropagation();
    }.bind(this));
  }

  Tab.prototype.has_children = function() {
    return this.$children.children().children('.tab').not('.hide').length !== 0;
  };

  Tab.prototype.with_each_ancestor = function(callback) {
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
  };

  Tab.prototype.update_tab_text = function() {
    var _text;
    if(this.tab_name && this.tab_name !== '') {
      _text = this.tab_name;
    } else {
      _text = this.title;
    }
    this.$node.children('.tab').find('.button .label').text(_text);
  };

  Tab.prototype.update_tab_color = function() {
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
  };

  Tab.prototype.update_by_data = function(data) {
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
      if (data.parent !== null){
        var _parent_tab = _tabs[data.parent];
        if (_parent_tab){
          this.$node.appendTo(_parent_tab.$children);
          this.parent = data.parent;
          _parent_tab.update_display();
        } else {
          console.error("Parent does not exist");
        }
      } else {
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
  };

  Tab.prototype.update_display = function(){
    this.$node.toggleClass('has-children', this.has_children());
    this.$node.toggleClass('pinned', this.pinned);
  };

  Tab.prototype.update_content_display = function(){
    if (this.$content){
      var _webview = this.get_webview();
      this.$content.find('input.tab-name').val(this.tab_name);
      this.$content.find('input.tab-color').val(this.tab_color);
      this.$content.find('.button-pin').toggleClass('pinned', this.pinned);
      this.$content.find('.button-back-to-pin').toggleClass('disabled',
        !this.pinned || !this.url || (_webview && this.url === _webview.src));
    }
  };

  Tab.prototype.store_tab_data = function(){
    storage.set_tab_data(this.id, {
      parent: this.parent,
      expanded: this.expanded,
      url: this.url,
      title: this.title,
      tab_name: this.tab_name,
      tab_color: this.tab_color,
      pinned: this.pinned
    });
  };

  Tab.prototype.button_clicked = function(e){
    this.select_tab();
  };

  Tab.prototype.arrow_clicked = function(e){
    this.expanded = !this.expanded;
    this.store_tab_data();
  };

  Tab.prototype.select_tab = function(){
    with_current(function(tab){
      tab.unselect_tab();
    });
    _current = this.id;
    this.$node.addClass('selected');

    this.setup_tab_content();
    this.$content.show();
  };

  Tab.prototype.get_webview = function(){
    return this.$content.find('webview').get(0);
  };

  Tab.prototype.setup_tab_content = function($existing_webview){
    if (this.$content && !$existing_webview) {
      return;
    }
    if (!this.$content) {
      this.$content = $tab_content_template.clone().appendTo($tabs).hide();
    }
    var $button_back_to_pin = this.$content.find('.button-back-to-pin');
    var $button_back = this.$content.find('.button-back');
    var $button_forward = this.$content.find('.button-forward');
    var $button_refresh = this.$content.find('.button-refresh');
    var $button_stop = this.$content.find('.button-stop');
    var $button_settings = this.$content.find('.button-settings');
    var $button_pin = this.$content.find('.button-pin');

    var $input_address_bar = this.$content.find('input.address-bar');
    var $input_tab_name = this.$content.find('input.tab-name');
    var $input_tab_color = this.$content.find('input.tab-color');

    var $find_input = this.$content.find('.find-text');
    var $find_next = this.$content.find('.button-find-next');
    var $find_prev = this.$content.find('.button-find-prev');
    var $find_info = this.$content.find('.find-info');
    var _last_find = null;

    this.update_content_display();

    var $webview;
    if ($existing_webview){
      $webview = $existing_webview;
    } else {
      $webview = $tab_webview_template.clone();
    }
    $webview.appendTo(this.$content.find('.webview-wrapper'));
    var _webview = $webview.get(0);

    if (this.url){
      _webview.src = this.url;
    } else {
      this.focus_address_bar();
    }

    // Functions

    var url_changed = function(url) {
      $input_address_bar.val(url_to_address_bar_text(url));
      // Store current url
      if (this.url !== url && !this.pinned) {
        this.url = url;
        this.store_tab_data();
      }
    }.bind(this);

    var update_title = function(){
      _webview.executeScript({ code: "document.title" }, function(arr){
        var _title;
        if (!arr || arr.length === 0 || !(arr[0])) {
          _title = "Untitled";
        } else {
          _title = arr[0];
        }
        if(this.title !== _title){
          this.title = _title;
          this.update_tab_text();
          this.store_tab_data();
        }
      }.bind(this));
    }.bind(this);

    var update_button_states = function() {
      if (_webview.canGoBack()) {
        $button_back.removeClass('disabled');
      } else {
        $button_back.addClass('disabled');
      }
      if (_webview.canGoForward()) {
        $button_forward.removeClass('disabled');
      } else {
        $button_forward.addClass('disabled');
      }
      this.update_content_display();
    }.bind(this);

    // Listeners

    $button_settings.click(function(){
      $tabs.toggleClass('show-settings');
    });

    $button_back_to_pin.click(function(){
      _webview.src = this.url;
    }.bind(this));

    $button_back.click(function(){
      _webview.back();
    });

    $button_forward.click(function(){
      _webview.forward();
    });

    $button_refresh.click(function(){
      _webview.reload();
    });

    $button_stop.click(function(){
      _webview.stop();
    });

    $button_pin.click(function() {
      if (this.pinned) {
        this.pinned = false;
      } else {
        this.pinned = true;
      }
      this.store_tab_data();
    }.bind(this));

    $input_address_bar.keyup(function(e){
      if(e.which === C.KEYCODES.ENTER){
        _webview.src = address_bar_text_to_url($input_address_bar.val());

      }
    }.bind(this));

    $input_tab_name.keyup(function(e){
      if(e.which === C.KEYCODES.ENTER){
        this.tab_name = $input_tab_name.val();
        this.update_tab_text();
        this.store_tab_data();
      }
    }.bind(this));

    $input_tab_color.keyup(function(e){
      if(e.which === C.KEYCODES.ENTER){
        this.tab_color = $input_tab_color.val();
        this.store_tab_data();
      }
    }.bind(this));

    $find_input.keyup(function(e) {
      var _find = $find_input.val();
      if (_find !== _last_find || e.which === C.KEYCODES.ENTER) {
        _last_find = _find;
        _webview.find(_find);
      }
    }.bind(this));

    $find_next.click(function() {
      _webview.find($find_input.val());
    });

    $find_prev.click(function() {
      _webview.find($find_input.val(), {
        backward: true
      });
    });

    _webview.addEventListener("findupdate", function(e){
      if (e.searchText === '') {
        $find_info.text('');
      } else {
        $find_info.text(e.activeMatchOrdinal + ' of ' + e.numberOfMatches);
      }
    });

    _webview.addEventListener("loadredirect", function(e){
      if(e.isTopLevel){
        url_changed(e.newUrl);
      }
    });

    _webview.addEventListener("loadstart", function(e){
      if(e.isTopLevel){
        url_changed(e.url);
      }
      this.$node.addClass("loading").removeClass("ready");
      this.$content.addClass("loading").removeClass("ready");
      update_button_states();
    }.bind(this));

    _webview.addEventListener("loadstop", function(){
      url_changed(_webview.src);
      update_title();
      this.$node.removeClass("loading").addClass("ready");
      this.$content.removeClass("loading").addClass("ready");
      update_button_states();
    }.bind(this));

    _webview.addEventListener('newwindow', function(e) {
      var $webview = $tab_webview_template.clone();
      e.window.attach($webview.get(0));
      open_new_tab(function(tab){
        tab.setup_tab_content($webview);
        if (e.windowOpenDisposition === 'ignore'
          || e.windowOpenDisposition === 'new_background_tab') {
            // Quickly momentatily display the content to trigger webview to load
            // TODO: improve this hack
            tab.$content.css('z-index', -100).show();
            setTimeout(function(){
              tab.$content.css('z-index', 'initial').hide();
            }, 100);
        } else {
          tab.select_tab();
        }
      }, false);
    });

    _webview.addEventListener('close', function() {
      this.close_tab();
    }.bind(this));

    // Intercept requests for pinned tabs
    _webview.request.onBeforeRequest.addListener(function(details) {
      if (this.pinned && details.type === 'main_frame' &&
        details.method === 'GET' && details.url !== this.url){
        var $webview = $tab_webview_template.clone();
        $webview.get(0).src = details.url;
        open_new_tab(function(tab){
          tab.setup_tab_content($webview);
        }, true);
        return {
          cancel: true
        };
      }
    }.bind(this),
    {urls: ['*://*/*']}, ['blocking']);
  };

  Tab.prototype.focus_address_bar = function(){
    this.$content.find('input.address-bar').focus().select();
  };

  Tab.prototype.unselect_tab = function(){
    this.$node.removeClass('selected');
    this.$content.hide();
    if (this.id === _current) {
      _current = null;
    }
  };

  Tab.prototype.escape_tab = function(){
    if (this.$content.hasClass('find-enabled')){
      this.$content.removeClass('find-enabled');
      this.get_webview().stopFinding("clear");
    } else {
      this.unselect_tab();
    }
  };

  Tab.prototype.start_find = function(){
    this.$content.addClass('find-enabled');
    var $find_input = this.$content.find('input.find-text').focus().select();
    this.get_webview().find($find_input.val());
  };

  Tab.prototype.close_tab = function(){
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
  };

  Tab.prototype.append_to_tab = function(id){
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
  };

  Tab.prototype.append_to_root = function(){
    this.parent = null;
    this.store_tab_data();
  };

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

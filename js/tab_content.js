define(['constants', 'util'], function(C, util){
  'use strict';

  var $tab_content_template;
  var $tab_content_alert_template;
  var $tab_webview_template;
  var $tabs;

  function init(templates){
    $tabs = $('.app-right .tabs');
    $tab_content_template = templates['tab-content'];
    $tab_content_alert_template = templates['tab-content-alert'];
    $tab_webview_template = templates['tab-webview'];
  }

  function TabContent(tab_control, tab, $existing_webview) {
    this.tab_control = tab_control;
    this.tab = tab;
    this.$content = $tab_content_template.clone().appendTo($tabs).hide();
    this.elems = {
      $button_back_to_pin: this.$content.find('.button-back-to-pin'),
      $button_back: this.$content.find('.button-back'),
      $button_forward: this.$content.find('.button-forward'),
      $button_refresh: this.$content.find('.button-refresh'),
      $button_stop: this.$content.find('.button-stop'),
      $button_reset: this.$content.find('.button-reset'),
      $button_settings: this.$content.find('.button-settings'),
      $button_pin: this.$content.find('.button-pin'),

      $input_address_bar: this.$content.find('input.address-bar'),
      $input_tab_name: this.$content.find('input.tab-name'),
      $input_tab_color: this.$content.find('input.tab-color'),

      $find_input: this.$content.find('.find-text'),
      $find_next: this.$content.find('.button-find-next'),
      $find_prev: this.$content.find('.button-find-prev'),
      $find_info: this.$content.find('.find-info'),

      $dialog_box: this.$content.find('.dialog .box'),
      $dialog_message: this.$content.find('.dialog .message'),
      $dialog_input_text: this.$content.find('.dialog .input-text'),
      $dialog_input: this.$content.find('.dialog input'),
      $dialog_cancel: this.$content.find('.dialog .button-cancel'),
      $dialog_ok: this.$content.find('.dialog .button-ok'),

      $alerts: this.$content.find('.alerts')
    };
    this._webview = null;
    this._setup_listeners();
    this.update_display();

    if ($existing_webview) {
      this._setup_webview($existing_webview);
    }
  }

  $.extend(TabContent.prototype, {
    _setup_webview: function($webview) {
      this._webview = $webview.get(0);
      $webview.appendTo(this.$content.find('.webview-wrapper'));

      this._webview.addEventListener("findupdate", function(e){
        if (e.searchText === '') {
          this.elems.$find_info.text('');
        } else {
          this.elems.$find_info.text(e.activeMatchOrdinal + ' of ' + e.numberOfMatches);
        }
      }.bind(this));

      this._webview.addEventListener("loadredirect", function(e){
        if(e.isTopLevel){
          this._url_changed(e.newUrl);
        }
      }.bind(this));

      this._webview.addEventListener("loadstart", function(e){
        if(e.isTopLevel){
          this._url_changed(e.url);
          this.dismiss_alerts();
        }
        this.tab.$node.addClass("loading").removeClass("ready");
        this.$content.addClass("loading").removeClass("ready");
        this._update_button_states();
      }.bind(this));

      this._webview.addEventListener("loadstop", function(){
        this._url_changed(this._webview.src);
        this._update_title();
        this.tab.$node.removeClass("loading").addClass("ready");
        this.$content.removeClass("loading").addClass("ready");
        this._update_button_states();
      }.bind(this));

      this._webview.addEventListener('newwindow', function(e) {
        var $webview = $tab_webview_template.clone();
        e.window.attach($webview.get(0));
        this.tab_control.open_new_tab(function(tab){
          tab.setup_tab_content($webview);
          if (e.windowOpenDisposition === 'ignore' ||
              e.windowOpenDisposition === 'new_background_tab') {
              // Quickly momentatily display the content to trigger webview to load
              // TODO: improve this hack
              tab.content.$content.css('z-index', -100).show();
              setTimeout(function(){
                tab.content.$content.css('z-index', 'initial').hide();
              }, 100);
          } else {
            tab.select_tab();
          }
        });
      }.bind(this));

      this._webview.addEventListener('close', function() {
        this.tab.close_tab();
      }.bind(this));

      this._webview.addEventListener('permissionrequest', function(e) {
        var _text = null;
        switch (e.permission) {
          case "media":
            _text = "The website " + e.request.url + " wants to be given access to your webcam and microphone";
            break;
          case "geolocation":
            _text = "The website " + e.request.url + " wants to be given access to your geographical location";
            break;
          case "pointerLock":
            _text = "The website " + e.request.url + " wants to lock your mouse cursor";
            break;
          case "download":
            e.request.allow();
            return;
          case "loadplugin":
            _text = "This website wants to run the plugin " + e.request.name;
            break;
          case "filesystem":
            _text = "The website " + e.request.url + " wants to be given access to files on your computer";
            break;
          case "fullscreen":
            _text = "The website " + e.request.origin + " wants to go full screen";
            break;
          default:
            console.error("Unknown permission request: ", e);
            return;
        }
        this.user_alert(_text, [
          {
            label: "Allow",
            callback: e.request.allow
          },
          {
            label: "Deny",
            callback: e.request.deny
          }
        ]);
        e.preventDefault();
      }.bind(this));

      this._webview.addEventListener('dialog', function(e) {
        console.log('alert', e);
        e.preventDefault();
        // Reset
        this.elems.$dialog_input_text.hide();
        this.elems.$dialog_input.val('');
        this.elems.$dialog_cancel.hide();

        // Setup
        this.elems.$dialog_message.text(e.messageText);
        if (e.messageType !== 'alert') {
          this.elems.$dialog_cancel.show();
          if (e.messageType === 'prompt') {
            this.elems.$dialog_input_text.show();
            this.elems.$dialog_input.val(e.defaultPromptText);
          }
        }

        // Listeners
        var close = function() {
          this.elems.$dialog_box.removeClass('open');
          this.elems.$dialog_cancel.off();
          this.elems.$dialog_ok.off();
        }.bind(this);
        this.elems.$dialog_cancel.click(function(){
          e.dialog.cancel();
          close();
        }.bind(this));
        this.elems.$dialog_ok.click(function(){
          e.dialog.ok(this.elems.$dialog_input.val());
          close();
        }.bind(this));
        this.elems.$dialog_box.addClass('open');
      }.bind(this));

      // Intercept requests for pinned tabs
      this._webview.request.onBeforeRequest.addListener(function(details) {
        if (this.tab.pinned && details.type === 'main_frame' &&
          details.method === 'GET' && details.url !== this.tab.url){
          var $webview = $tab_webview_template.clone();
          $webview.get(0).src = details.url;
          this.tab_control.open_new_tab(function(tab){
            tab.setup_tab_content($webview);
            tab.select_tab();
          });
          return {
            cancel: true
          };
        }
      }.bind(this),
      {urls: ['*://*/*']}, ['blocking']);
    },

    _setup_listeners: function(){
      this.elems.$button_settings.click(function(){
        $tabs.toggleClass('show-settings');
      });

      this.elems.$button_back_to_pin.click(function(){
        this.webview().src = this.tab.url;
      }.bind(this));

      this.elems.$button_back.click(function(){
        this.webview().back();
      }.bind(this));

      this.elems.$button_forward.click(function(){
        this.webview().forward();
      }.bind(this));

      this.elems.$button_refresh.click(function(){
        this.webview().reload();
      }.bind(this));

      this.elems.$button_stop.click(function(){
        this.webview().stop();
      }.bind(this));

      this.elems.$button_reset.click(function(){
        $(this.webview()).remove();
        this._webview = null;
        this.tab.$node.removeClass("ready");
      }.bind(this));

      this.elems.$button_pin.click(function() {
        if (this.tab.pinned) {
          this.tab.pinned = false;
        } else {
          this.tab.pinned = true;
        }
        this.tab.store_tab_data();
      }.bind(this));

      this.elems.$input_address_bar.keyup(function(e){
        if(e.which === C.KEYCODES.ENTER){
          this.webview().src = util.address_bar_text_to_url(this.elems.$input_address_bar.val());
        }
      }.bind(this));

      this.elems.$input_tab_name.keyup(function(e){
        if(e.which === C.KEYCODES.ENTER){
          this.tab.tab_name = this.elems.$input_tab_name.val();
          this.tab.update_tab_text();
          this.tab.store_tab_data();
        }
      }.bind(this));

      this.elems.$input_tab_color.keyup(function(e){
        if(e.which === C.KEYCODES.ENTER){
          this.tab.tab_color = this.elems.$input_tab_color.val();
          this.tab.store_tab_data();
        }
      }.bind(this));

      var _last_find = null;
      this.elems.$find_input.keyup(function(e) {
        var _find = this.elems.$find_input.val();
        if (_find !== _last_find || e.which === C.KEYCODES.ENTER) {
          _last_find = _find;
          this.webview().find(_find);
        }
      }.bind(this));

      this.elems.$find_next.click(function() {
        this.webview().find(this.elems.$find_input.val());
      }.bind(this));

      this.elems.$find_prev.click(function() {
        this.webview().find(this.elems.$find_input.val(), {
          backward: true
        });
      }.bind(this));
    },

    _url_changed: function(url) {
      this.elems.$input_address_bar.val(util.url_to_address_bar_text(url));
      // Store current url
      if (this.tab.url !== url && !this.tab.pinned) {
        this.tab.url = url;
        this.tab.store_tab_data();
      }
    },

    _update_title: function(){
      this.webview().executeScript({ code: "document.title" }, function(arr){
        var _title;
        if (!arr || arr.length === 0 || !(arr[0])) {
          _title = "Untitled";
        } else {
          _title = arr[0];
        }
        if(this.tab.title !== _title){
          this.tab.title = _title;
          this.tab.update_tab_text();
          this.tab.store_tab_data();
        }
      }.bind(this));
    },

    _update_button_states: function() {
      if (this.webview().canGoBack()) {
        this.elems.$button_back.removeClass('disabled');
      } else {
        this.elems.$button_back.addClass('disabled');
      }
      if (this.webview().canGoForward()) {
        this.elems.$button_forward.removeClass('disabled');
      } else {
        this.elems.$button_forward.addClass('disabled');
      }
      this.update_display();
    },

    webview: function() {
      if (!this._webview) {
        this._setup_webview($tab_webview_template.clone());
        if (this.tab.url) {
          this._webview.src = this.tab.url;
        }
      }
      return this._webview;
    },

    show: function() {
      this.webview();
      this.$content.show();
    },

    hide: function() {
      this.$content.hide();
    },

    focus_address_bar: function() {
      this.elems.$input_address_bar.focus().select();
    },

    update_display: function() {
      this.elems.$input_tab_name.val(this.tab.tab_name);
      this.elems.$input_tab_color.val(this.tab.tab_color);
      this.elems.$button_pin.toggleClass('pinned', this.tab.pinned);
      this.elems.$button_back_to_pin.toggleClass('disabled',
        !this.tab.pinned || !this.tab.url || (!this.webview || this.tab.url === this.webview().src));
    },

    start_find: function() {
      this.$content.addClass('find-enabled');
      this.elems.$find_input.focus().select();
      this.webview().find(this.elems.$find_input.val());
    },

    escape_content: function() {
      if (this.$content.hasClass('find-enabled')){
        this.$content.removeClass('find-enabled');
        this.webview().stopFinding("clear");
      }
    },

    user_alert: function(text, options) {
      var $alert = $tab_content_alert_template.clone();
      var $buttons = $alert.find('.buttons');
      $alert.find('.label').text(text);
      options.forEach(function(option) {
        var $button = $('<div/>').addClass('button').text(option.label);
        $button.click(function() {
          $alert.remove();
          if (option.callback) {
            option.callback();
          }
        });
        $button.appendTo($buttons);
      });
      this.elems.$alerts.append($alert);
    },

    dismiss_alerts: function() {
      this.elems.$alerts.children().remove();
    }
  });

  return {
    init: init,
    TabContent: TabContent
  };

});

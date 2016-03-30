define(['constants'], function(C){
  'use strict';

  return {
    address_bar_text_to_url: function(text){
      if (C.REGEXES.URL_NO_PROTO.exec(text)) {
        return "https://" + text;
      }
      if (C.REGEXES.URL.exec(text)) {
        return text;
      }
      // Return a google search
      return 'https://www.google.com/search?q=' + text;
    },

    url_to_address_bar_text: function(url){
      return url;
    },

    has_dragged: function(orig_event, current_event) {
      var _drag_factor = 10;
      return (current_event.clientX < orig_event.clientX - _drag_factor) ||
          (current_event.clientX > orig_event.clientX + _drag_factor) ||
          (current_event.clientY < orig_event.clientY - _drag_factor) ||
          (current_event.clientY > orig_event.clientY + _drag_factor);
    },

    is: function($elem) {
      return {
        an_ancestor_of: function($descendant) {
          var is_ancestor = false;
          $descendant.parents().each(function() {
            if ($elem.is(this))
              is_ancestor = true;
          });
          return is_ancestor;
        }
      };
    }
  };

});

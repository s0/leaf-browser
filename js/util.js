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
    }
  };

});

/**
 *  FullScreen widget:
 *
 *  var widget = new cdb.ui.common.FullScreen({
 *    doc: ".container", // optional; if not specified, we do the fullscreen of the whole window
 *    template: this.getTemplate("table/views/fullscreen")
 *  });
 *
 */

cdb.ui.common.FullScreen = cdb.core.View.extend({

  tagName: 'div',
  className: 'cartodb-fullscreen',

  events: {
    "click a": "_toggleFullScreen"
  },

  initialize: function() {
    _.bindAll(this, 'render');
    _.defaults(this.options, this.default_options);
    this._addWheelEvent();
  },

  _addWheelEvent: function() {
    var self    = this;
    var mapView = this.options.mapView;

    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        if (self.model.get("allowWheelOnFullscreen")) {
          mapView.options.map.set("scrollwheel", false);
        }
      }
      mapView.invalidateSize();
    });
  },

  _toggleFullScreen: function(ev) {
    if (ev) {
      this.killEvent(ev);
    }

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      if (docEl.webkitRequestFullScreen) {
        // Cartodb.js #361 :: Full screen button not working on Safari 8.0.3 #361
        // Safari has a bug that fullScreen doestn't work with Element.ALLOW_KEYBOARD_INPUT);
        // Reference: Ehttp://stackoverflow.com/questions/8427413/webkitrequestfullscreen-fails-when-passing-element-allow-keyboard-input-in-safar
        requestFullScreen.call(docEl, undefined);
      } else {
        // CartoDB.js #412 :: Fullscreen button is throwing errors
        // Nowadays (2015/03/25), fullscreen is not supported in iOS Safari. Reference: http://caniuse.com/#feat=fullscreen
        if (requestFullScreen) {
          requestFullScreen.call(docEl);
        }
      }

      if (mapView && this.model.get("allowWheelOnFullscreen")) {
        mapView.map.set("scrollwheel", true);
      }
    } else {
      cancelFullScreen.call(doc);
    }
  },

  render: function() {
    var options = _.extend(
      this.options,
      {
        mapUrl: location.href || ''
      }
    );
    this.$el.html(this.options.template(options));

    if (!this._canFullScreenBeEnabled()) {
      this.undelegateEvents();
      cdb.log.info('FullScreen API is deprecated on insecure origins. See https://goo.gl/rStTGz for more details.');
    }

    return this;
  },

  _canFullScreenBeEnabled: function() {
    if (this._isInIframe()) {
      var parentUrl = document.referrer;
      if (parentUrl.search('https:') !== 0) {
        return false;
      }
    }
    return true;
  },

  _isInIframe: function() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

});

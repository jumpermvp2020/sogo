/* -*- Mode: javascript; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* JavaScript for CKEditor module */

(function() {
  'use strict';

  ckEditor.$inject = ['$parse'];
  function ckEditor($parse) {
    var calledEarly, loaded;
    loaded = false;
    calledEarly = false;

    return {
      restrict: 'C',
      require: '?ngModel',
      compile: function(element, attributes, transclude) {
        var loadIt, local;

        local = this;
        loadIt = function() {
          return calledEarly = true;
        };

        element.ready(function() {
          return loadIt();
        });

        return {
          post: function($scope, element, attributes, controller) {
            if (calledEarly) {
              return local.link($scope, element, attributes, controller);
            }
            loadIt = (function($scope, element, attributes, controller) {
              return function() {
                local.link($scope, element, attributes, controller);
              };
            })($scope, element, attributes, controller);
          }
        };
      },

      link: function($scope, elm, attr, ngModel) {
        var ck, options = {}, locale, margin;
        if (!ngModel) {
          return;
        }

        if (calledEarly && !loaded) {
          return loaded = true;
        }
        loaded = false;

        if (attr.ckOptions)
          options = angular.fromJson(attr.ckOptions.replace(/'/g, "\""));

        if (attr.ckLocale) {
          locale = $parse(attr.ckLocale)($scope);
          options.language = locale;
          options.scayt_sLang = locale;
        }

        if (attr.ckMargin) {
          // Set the margin of the iframe editable content
          margin = attr.ckMargin;
          CKEDITOR.addCss('.cke_editable { margin-top: ' + margin +
                          '; margin-left: ' + margin +
                          '; margin-right: ' + margin + '; }');
        }

        // The Upload Image plugin requires a remote URL to be defined even though we won't use it
        options.imageUploadUrl = '/SOGo/';

        ck = CKEDITOR.replace(elm[0], options);


        // Update the model whenever the content changes
        ck.on('change', function() {
          $scope.$apply(function() {
            ngModel.$setViewValue(ck.getData());
          });
        });

        ck.on('paste', function(event) {
          var html;
          if (event.data.type == 'html') {
            html = event.data.dataValue;
            // Remove images to avoid ghost image in Firefox; images will be handled by the Image Upload plugin
            event.data.dataValue = html.replace(/<img( [^>]*)?>/gi, '');
          }
        });

        // Intercept the request when an image is pasted, keep an inline base64 version only.
        ck.on('fileUploadRequest', function(event) {
          var data, img;
          data = event.data.fileLoader.data;
          img = ck.document.createElement('img');
          img.setAttribute('src', data);
          ck.insertElement(img);
          event.cancel();
        });

        ngModel.$render = function(value) {
          ck.setData(ngModel.$viewValue);
        };
      }
    };
  }

  angular
    .module('ck', [])
    .directive('ckEditor', ckEditor);
})();

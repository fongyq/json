/**
 * jQuery json-viewer
 * @author: Alexandre Bodelot <alexandre.bodelot@gmail.com>
 * @link: https://github.com/abodelot/jquery.json-viewer
 */
(function($) {

  /**
   * Check if arg is either an array with at least 1 element, or a dict with at least 1 key
   * @return boolean
   */
  function isCollapsable(arg) {
    return arg instanceof Object && Object.keys(arg).length > 0;
  }

  /**
   * Check if a string looks like a URL, based on protocol
   * This doesn't attempt to validate URLs, there's no use and syntax can be too complex
   * @return boolean
   */
  function isUrl(string) {
    var protocols = ['http', 'https', 'ftp', 'ftps'];
    for (var i = 0; i < protocols.length; ++i) {
      if (string.startsWith(protocols[i] + '://')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Return the input string html escaped
   * @return string
   */
  function htmlEscape(s) {
    return s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;')
      .replace(/ /g, '&nbsp;');
  }

  /**
   * check whether an array only contains simple-type elements.
   * simple types: number, bool, null, string
   */
  function checkSimpleArray(a) {
    if (a.length === 0) return true;
    for (var i = 0; i < a.length; ++i) {
      var ai = a[i];
      if (typeof ai != 'number' && typeof ai != 'bigint' && typeof ai != 'boolean' && ai != null && typeof ai != 'string') {
        return false;
      }
    }
    return true;
  }
  function formatSimpleArray (a) {
    if (a.length === 0) return "[]";
    var sa = [];
    for (var i = 0; i < a.length; ++i) {
      if (typeof a[i] === 'string') {
        // sa.push('"' + a[i] + '"');
        sa.push('<span class="json-string">"' + htmlEscape(a[i]) + '"</span>')
      } else if (a[i] === null) {
        // sa.push("null");
        sa.push('<span class="json-null">null</span>')
      } else if (typeof a[i] === 'number' || typeof a[i] === 'bigint') {
        sa.push('<span class="json-literal">' + a[i] + '</span>');
      } else if (typeof a[i] === 'boolean') {
        sa.push('<span class="json-bool">' + a[i] + '</span>');
      } else {
        sa.push(a[i]);
      }
    }
    return "[" + sa.join(",") + "]";
  }

  /**
   * Transform a json object into html representation
   * Use <li> elements
   * @return string
   */
  function json2html(json, options) {
    var html = '';
    if (typeof json === 'string') {
      // Escape tags and quotes
      json = htmlEscape(json);

      if (isUrl(json)) {
        html += '<span class="json-url">"</span>' + 
          '<a href="' + json + '" class="json-url" target="_blank">' + json + '</a>' +
          '<span class="json-url">"</span>';
      } else {
        // Escape double quotes in the rendered non-URL string.
        json = json.replace(/&quot;/g, '\\&quot;');
        html += '<span class="json-string">"' + json + '"</span>';
      }
    } else if (typeof json === 'number' || typeof json === 'bigint') {
      html += '<span class="json-literal">' + json + '</span>';
    } else if (typeof json === 'boolean') {
      html += '<span class="json-bool">' + json + '</span>';
    } else if (json === null) {
      html += '<span class="json-null">null</span>';
    } else if (json instanceof Array) {
      if (json.length > 0) {
        if (!options.wrapSimpleArray && checkSimpleArray(json)) {
            html += formatSimpleArray(json);
        } else {
          html += '[<ol class="json-array">';
          for (var i = 0; i < json.length; ++i) {
            html += '<li>';
            // Add toggle button if item is collapsable
            if (isCollapsable(json[i])) {
              html += '<a href class="json-toggle"></a>';
            }
            html += json2html(json[i], options);
            // Add comma if item is not last
            if (i < json.length - 1) {
              html += ',';
            }
            html += '</li>';
          }
          html += '</ol>]';
        }
      } else {
        html += '[]';
      }
    } else if (typeof json === 'object') {
      // Optional support different libraries for big numbers
      // json.isLosslessNumber: package lossless-json
      // json.toExponential(): packages bignumber.js, big.js, decimal.js, decimal.js-light, others?
      if (options.bigNumbers && (typeof json.toExponential === 'function' || json.isLosslessNumber)) {
        html += '<span class="json-literal">' + json.toString() + '</span>';
      } else {
        var keyCount = Object.keys(json).length;
        if (keyCount > 0) {
          html += '{<ul class="json-dict">';
          for (var key in json) {
            if (Object.prototype.hasOwnProperty.call(json, key)) {
              // define a parameter of the json value first to prevent get null from key when the key changed by the function `htmlEscape(key)`
              let jsonElement = json[key];
              key = htmlEscape(key);
              var keyRepr = options.withQuotes ?
                '<span class="json-key">"' + key + '"</span>' : key;

              html += '<li>';
              // Add toggle button if item is collapsable
              if (isCollapsable(jsonElement)) {
                html += '<a href class="json-toggle">' + keyRepr + '</a>';
              } else {
                html += keyRepr;
              }
              html += ': ' + json2html(jsonElement, options);
              // Add comma if item is not last
              if (--keyCount > 0) {
                html += ',';
              }
              html += '</li>';
            }
          }
          html += '</ul>}';
        } else {
          html += '{}';
        }
      }
    }
    return html;
  }

  /**
   * Transform a json object into html representation
   * Use <p> elements
   * @return string
   */
  function json2htmlV2(json, options, indent) {
    var html = '';
    if (typeof json === 'string') {
      // Escape tags and quotes
      json = htmlEscape(json);

      if (isUrl(json)) {
        html += '<span class="json-url">"</span>' + 
          '<a href="' + json + '" class="json-url" target="_blank">' + json + '</a>' +
          '<span class="json-url">"</span>';
      } else {
        // Escape double quotes in the rendered non-URL string.
        json = json.replace(/&quot;/g, '\\&quot;');
        html += '<span class="json-string">"' + json + '"</span>';
      }
    } else if (typeof json === 'number' || typeof json === 'bigint') {
      html += '<span class="json-literal">' + json + '</span>';
    } else if (typeof json === 'boolean') {
      html += '<span class="json-bool">' + json + '</span>';
    } else if (json === null) {
      html += '<span class="json-null">null</span>';
    } else if (json instanceof Array) {
      if (json.length > 0) {
        if (!options.wrapSimpleArray && checkSimpleArray(json)) {
            html += formatSimpleArray(json);
        } else {
          html += '[<span class="json-array">';
          for (var i = 0; i < json.length; ++i) {
            html += '<p>' + indentUnit + indent;
            html += json2htmlV2(json[i], options, indent + indentUnit);
            // Add comma if item is not last
            if (i < json.length - 1) {
              html += ',';
            }
            html += '</p>';
          }
          html += '</span>' + indent + ']';
        }
      } else {
        html += '[]';
      }
    } else if (typeof json === 'object') {
        var keyCount = Object.keys(json).length;
        if (keyCount > 0) {
          html += '{<span class="json-dict">';
          for (var key in json) {
            if (Object.prototype.hasOwnProperty.call(json, key)) {
              // define a parameter of the json value first to prevent get null from key when the key changed by the function `htmlEscape(key)`
              var jsonElement = json[key];
              key = htmlEscape(key);
              var keyRepr = options.withQuotes ?
                '<span class="json-key">"' + key + '"</span>' : key;
              html += '<p>' + indentUnit + indent;
              html += keyRepr;
              html += ': ' + json2htmlV2(jsonElement, options, indent + indentUnit);
              // Add comma if item is not last
              if (--keyCount > 0) {
                html += ',';
              }
              html += '</p>';
            }
          }
          html += '</span>' + indent + '}';
        } else {
          html += '{}';
        }
    }
    return html;
  }

  /**
   * jQuery plugin method
   * @param json: a javascript object
   * @param options: an optional options hash
   */
  var indent2 = "&nbsp;&nbsp;";
  var indent4 = "&nbsp;&nbsp;&nbsp;&nbsp;";
  var indentUnit = "";
  $.fn.jsonViewer = function(json, options) {
    // Merge user options with default options
    options = Object.assign({}, {
      collapsed: false,
      rootCollapsable: true,
      withQuotes: false,
      withLinks: true,
      bigNumbers: false,
      wrapSimpleArray: true,
      indentUnit: 4,
      json2htmlVersion: 1
    }, options);

    if (options.indentUnit === 2) {
      indentUnit = indent2;
    } else {
      indentUnit = indent4;
    }

    if (options.json2htmlVersion === 1) {
      // jQuery chaining
      return this.each(function() {

        // Transform to HTML
        var html = json2html(json, options);
        if (options.rootCollapsable && isCollapsable(json)) {
          html = '<a href class="json-toggle"></a>' + html;
        }

        // Insert HTML in target DOM element
        $(this).html(html);
        $(this).addClass('json-document');

        // Bind click on toggle buttons
        $(this).off('click');
        $(this).on('click', 'a.json-toggle', function() {
          var target = $(this).toggleClass('collapsed').siblings('ul.json-dict, ol.json-array');
          target.toggle();
          if (target.is(':visible')) {
            target.siblings('.json-placeholder').remove();
          } else {
            var count = target.children('li').length;
            var placeholder = count + (count > 1 ? ' items' : ' item');
            target.after('<a href class="json-placeholder">' + placeholder + '</a>');
          }
          return false;
        });

        // Simulate click on toggle button when placeholder is clicked
        $(this).on('click', 'a.json-placeholder', function() {
          $(this).siblings('a.json-toggle').click();
          return false;
        });

        if (options.collapsed == true) {
          // Trigger click to collapse all nodes
          $(this).find('a.json-toggle').click();
        }
      });
    } else {
      return this.each(function() {
        var html = json2htmlV2(json, options, "");
        $(this).html(html);
        $(this).addClass('json-document');
      });
    }
  };
})(jQuery);

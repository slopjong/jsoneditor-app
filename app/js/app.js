/*!
 * @file app.js
 *
 * @brief
 * JSONEditor is an editor to display and edit JSON data in a treeview.
 *
 * Supported browsers: Chrome, Firefox, Safari, Opera, Internet Explorer 8+
 *
 * @license
 * This json editor is open sourced with the intention to use the editor as
 * a component in your own application. Not to just copy and monetize the editor
 * as it is.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (C) 2011-2013 Jos de Jong, http://jsoneditoronline.org
 *
 * @author  Jos de Jong, <wjosdejong@gmail.com>
 * @date    2013-04-30
 */


var treeEditor = null;
var codeEditor = null;

var jsoneditor_app = {};

/**
 * Get the JSON from the code editor and load it in the tree editor
 */
jsoneditor_app.CodeToTree = function() {
  try {
    treeEditor.set(codeEditor.get());
  }
  catch (err) {
    jsoneditor_app.notify.showError(jsoneditor_app.formatError(err));
  }
};

/**
 * Get the JSON from the tree editor and load it into the code editor
 */
jsoneditor_app.treeToCode = function () {
  try {
    codeEditor.set(treeEditor.get());
  }
  catch (err) {
    jsoneditor_app.notify.showError(jsoneditor_app.formatError(err));
  }
};

/**
 * Load the interface (tree editor, code editor, splitter)
 */
// TODO: split the method load in multiple methods, it is too large
jsoneditor_app.load = function(options) {

  options = options || {
    bootstrapEnabled: true
  };

  try {
    // notification handler
    jsoneditor_app.notify = new Notify();

    // default json document
    var json = {
      "array": [1, 2, 3],
      "boolean": true,
      "null": null,
      "number": 123,
      "object": {"a": "b", "c": "d", "e": "f"},
      "string": "Hello World"
    };

    // load url if query parameters contains a url
    if (window.QueryParams) {
      var qp = new QueryParams();
      var url = qp.getValue('url');
      if (url) {
        json = {};
        jsoneditor_app.openUrl(url);
      }
    }

    // Store whether tree editor or code editor is last changed
    jsoneditor_app.lastChanged = undefined;

    // code editor
    var container = document.getElementById("codeEditor");
    codeEditor = new jsoneditor.JSONEditor(container, {
      mode: 'code',
      change: function () {
        jsoneditor_app.lastChanged = codeEditor;
      },
      error: function (err) {
        jsoneditor_app.notify.showError(jsoneditor_app.formatError(err));
      }
    });
    codeEditor.set(json);

    // tree editor
    container = document.getElementById("treeEditor");
    treeEditor = new jsoneditor.JSONEditor(container, {
      mode: 'tree',
      change: function () {
        jsoneditor_app.lastChanged = treeEditor;
      },
      error: function (err) {
        jsoneditor_app.notify.showError(jsoneditor_app.formatError(err));
      }
    });
    treeEditor.set(json);
    // TODO: automatically synchronize data of code and tree editor? (tree editor should keep its state though)

    // splitter
    jsoneditor_app.splitter = new Splitter({
      container: document.getElementById('drag'),
      change: function () {
        jsoneditor_app.resize();
      }
    });

    // button Code-to-Tree
    var toTree = document.getElementById('toTree');
    toTree.onclick = function () {
      this.focus();
      jsoneditor_app.CodeToTree();
    };

    // button Tree-to-Code
    var toCode = document.getElementById('toCode');
    toCode.onclick = function () {
      this.focus();
      jsoneditor_app.treeToCode();
    };

    // web page resize handler
    jsoneditor.util.addEventListener(window, 'resize', jsoneditor_app.resize);

    // set focus on the code editor
    codeEditor.focus();

    // enforce FireFox to not do spell checking on any input field
    document.body.spellcheck = false;

    if (options.bootstrapEnabled) {
      // we override the old container with the 'auto' div
      container_parent = container.parentNode.parentNode;

      var outer_divs = [];

      var bootstrap_detected = false;

      // this should be a while loop going the dom tree up, finding
      // the node sequence we're looking for, the user could wrap the
      // jsoneditor by other container block elements
      for(var i=0; i<3; i++) {
        container_parent = container_parent.parentNode;
        outer_divs.push(container_parent);
        // TODO: try to detect bootstrap here by looking for
        //       the order .col* > .row > .container
      }

      bootstrap_detected = true;

      if (bootstrap_detected) {
        for(var i=0; i<outer_divs.length; i++) {
//          outer_divs[i].style.height = '100%';
        }
      }

      // quickfix, this should be done in css
      document.getElementById('auto').style.height = '400px';
    }
  } catch (err) {
    try {
      jsoneditor_app.notify.showError(err);
    }
    catch (e) {
      if (console && console.log) {
        console.log(err);
      }
      alert(err);
    }
  }
};

/**
 * Callback method called when a file or url is opened.
 * @param {Error} err
 * @param {String} data
 */
jsoneditor_app.openCallback = function (err, data) {
  if (!err) {
    if (data != null) {
      codeEditor.setText(data);
      try {
        var json = jsoneditor.util.parse(data);
        treeEditor.set(json);
      }
      catch (err) {
        treeEditor.set({});
        jsoneditor_app.notify.showError(jsoneditor_app.formatError(err));
      }
    }
  }
  else {
    jsoneditor_app.notify.showError(err);
  }
};

/**
 * Format a JSON parse/stringify error as HTML
 * @param {Error} err
 * @returns {string}
 */
jsoneditor_app.formatError = function (err) {
  var message = '<pre class="error">' + err.toString() + '</pre>';
  if (typeof(jsonlint) != 'undefined') {
    message +=
        '<a class="error" href="http://zaach.github.com/jsonlint/" target="_blank">' +
            'validated by jsonlint' +
            '</a>';
  }
  return message;
};

/**
 * Clear the current file
 */
jsoneditor_app.clearFile = function () {
  var json = {};
  codeEditor.set(json);
  treeEditor.set(json);
};

jsoneditor_app.resize = function() {
  var domTreeEditor = document.getElementById('treeEditor');
  var domCodeEditor = document.getElementById('codeEditor');
  var domSplitter = document.getElementById('splitter');
  var domSplitterButtons = document.getElementById('buttons');
  var domSplitterDrag = document.getElementById('drag');

  var margin = 15;

  // This is how the original jsoneditor_app calculated the available space.
  // It's better, however, to get the tree editor parent's dimension
  //var width = (window.innerWidth || document.body.offsetWidth ||
  //    document.documentElement.offsetWidth);

  // we take the parent node's width instead
  width = domTreeEditor.parentNode.offsetWidth;

  if (jsoneditor_app.splitter) {
    jsoneditor_app.splitter.setWidth(width);

    // calculate horizontal splitter position
    var value = jsoneditor_app.splitter.getValue();
    var showCodeEditor = (value > 0);
    var showTreeEditor = (value < 1);
    var showButtons = showCodeEditor && showTreeEditor;
    domSplitterButtons.style.display = showButtons ? '' : 'none';

    var splitterWidth = domSplitter.clientWidth;
    var splitterLeft;
    if (!showCodeEditor) {
      // code editor not visible
      splitterLeft = 0;
      domSplitterDrag.innerHTML = '&rsaquo;';
      domSplitterDrag.title = 'Drag right to show the code editor';
    }
    else if (!showTreeEditor) {
      // tree editor not visible
      splitterLeft = width * value - splitterWidth;
      domSplitterDrag.innerHTML = '&lsaquo;';
      domSplitterDrag.title = 'Drag left to show the tree editor';
    }
    else {
      // both tree and code editor visible
      splitterLeft = width * value - splitterWidth / 2;

      // TODO: find a character with vertical dots that works on IE8 too, or use an image
      var isIE8 = (jsoneditor.util.getInternetExplorerVersion() == 8);
      domSplitterDrag.innerHTML = (!isIE8) ? '&#8942;' : '|';
      domSplitterDrag.title = 'Drag left or right to change the width of the panels';
    }

    // resize code editor
    domCodeEditor.style.display = (value == 0) ? 'none' : '';
    domCodeEditor.style.width = Math.max(Math.round(splitterLeft), 0) + 'px';
    codeEditor.resize();

    // resize the splitter
    domSplitterDrag.style.height = (domSplitter.clientHeight -
        domSplitterButtons.clientHeight - 2 * margin -
        (showButtons ? margin : 0)) + 'px';
    domSplitterDrag.style.lineHeight = domSplitterDrag.style.height;

    // resize tree editor
    // the width has a -1 to prevent the width from being just half a pixel
    // wider than the window, causing the content elements to wrap...
    domTreeEditor.style.display = (value == 1) ? 'none' : '';
    domTreeEditor.style.left = Math.round(splitterLeft + splitterWidth) + 'px';
    domTreeEditor.style.width = Math.max(Math.round(width - splitterLeft - splitterWidth - 2), 0) + 'px';
  }
};

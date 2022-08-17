/*
# Styles
  * --audio-src: url(...), ..., ...
  * --audio-duration: ms|s|m|h
  * --audio-offset: ms|s|m|h
  * --audio-loop: infinite|number
  * --audio-state: playing|stopped|paused
  * --audio-playback: playthrough
    * playthrough: continues playing once triggered
    * stop: stops the playback once state changes
    * pause: pauses the playback once state changes
  * --audio-ontrigger: continue(def) | reset | multi
    * continue: continues playing if the audio is still playing
    * reset: resets the audio to the beginning
    * multi: creates a new audio playback source

P.S., none of this triggers for childrens TODO: add 'processChildren' bool to mConfig

*/
var KTK = KTK || {}; KTK.CSSA = (function() {
  // CSSA configuration options. Merged with user-passed configuration.
  var mConfig = {
    observeNodeConfig: { attributeFilter: ['style', 'class', 'id'] },
    observeDOMConfig: { childList: true },
    observeHeadConfig: { childList: true },
    processDOM: true,
    observeDOM: true,
    observeHead: true,
    recurseNodes: true,
    selectors: ['active', 'hover', 'focus', 'checked']
  };
  // MutatonObservers for the DOM and Nodes
  var observerDOM = new MutationObserver(observeDOMCallback);
  var observerNode = new MutationObserver(observeNodeCallback);
  var observerHead = new MutationObserver(observeHeadCallback);
  // Default properties acquired for managing audio states
  var defaultProperties = ['--audio-src','--audio-state','--audio-playback','--audio-offset','--audio-duration','--audio-ontrigger','--audio-loop','--audio-volume'];

  /* observeDOMCallback(mutatonRecords)
  * This function is the callback for MutationRecord updates to the DOM. For 
  * each added Node `processNode` and `obseveNode` is called.
  */
  function observeDOMCallback(mutationRecords) {
    for (var mutation of mutationRecords) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        processNode(mutation.addedNodes[i]);
        observeNode(mutation.addedNodes[i]);
      }
    }
  }

  /* observeDOM()
  * This function begins observing document.body with observerDOM. It also
  * uses the `observeDOMConfig` property as contained in `mConfig`.
  */
  function observeDOM() {
    observerDOM.observe(document.body, mConfig.observeDOMConfig);
  }

  /* processDOM()
  * This function runs through all Nodes in the document body and calls
  * `processNode` and `observeNode` on each.
  */
  function processDOM() {
    var nodes = document.body.querySelectorAll('*');
    for (var i = 0; i < nodes.length; i++) {
      processNode(nodes[i]);
      observeNode(nodes[i]);
    }
  }

  /* observeHeadCallback(mutatonRecords)
  * This function is the callback for MutationRecord updates to the Head. For 
  * each added Node `processNode` and `observeNode` is called.
  */
  function observeHeadCallback(mutationRecords) {
    for (var mutation of mutationRecords) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        if (mutation.addedNodes[i].rel == "stylesheet" || mutation.addedNodes[i].tagName === "style") {
          processDOM();
        }
      }
    }
  }

  /* observeHead()
  * This function begins observing document.head with observerHead. It also
  * uses the `observeHeadConfig` property as contained in `mConfig`.
  */
  function observeHead() {
    observerHead.observe(document.head, mConfig.observeHeadConfig);
  }

  /* observeNodeCallback(mutationRecords)
  * This function is the callback for MutationRecord updates to an individual
  * Node. This calls `processNode` for each mutation records.
  */
  function observeNodeCallback(mutationRecords) {
    for (var mutation of mutationRecords) {
      processNode(mutation.target);
    }
  }

  /* observeNode(Node which)
  * This function begins observing the passed node with observerNode. It also
  * uses the `observeNodeConfig` property as contained in `mConfig`.
  */
  function observeNode(which) {
    observerNode.observe(which, mConfig.observeNodeConfig);
    if (mConfig.recurseNodes) {
      for (var i = 0; i < which.children.length; i++) {
        observeNode(which.children[i]);
      }
    }
  }

  /* processNode()
  * This function runs all StyleProcessors stored in styleProcessors for a
  * given node, running the node through the associated styleProcessor if that
  * style value is found in the Node.
  */
  function processNode(which) {
    var cs = window.getComputedStyle(which, null);
    if (cs.getPropertyValue('--audio-src')) {
      setupNode(which);
    }
    if (mConfig.recurseNodes) {
      for (var i = 0; i < which.children.length; i++) {
        processNode(which.children[i]);
      }
    }
  }

  /* getSelector(Element elem)
  * This function gets a string value that represents the selector of the given
  * element. It is formatted as `tagname#id.class1.class2`.
  */
  function getSelector(elem) {
    return elem.tagName.toLowerCase() + (elem.id ? '#'+elem.id : '') + (elem.className ? '.'+elem.className.replace(' ', '.') : '');
  }

  /* hasSelectorRule(String selector)
  * This function checks the document's styleSheets for a rule that matches the
  * provided `selector`. It is worth noting that matching is effectively done
  * from the end of the selectorText to the beginning, providing matches for
  * `.my_div .selector:hover` matching if `.selector:hover` is provided.
  */
  function hasSelectorRule(selector) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules = document.styleSheets[i].cssRules;
      for (var j = 0; j < rules.length; j++) {
        if (!rules[j].selectorText) continue;
        // Okay, this is bogus, but we just check for rules that end with our desired selector
        if (rules[j].selectorText.indexOf(selector, rules[j].selectorText.length - selector.length) !== -1) return true;
      }
    }
    return false;
  }

  /* getPropertyValues(Element elem, Array properties)
  * This function gets the computed value properties for the given `elem` based
  * upon the provided `properties` array.
  *
  * Returns: Associative array of properties and their values.
  */
  function getPropertyValues(elem, search) {
    var values = {};
    var cs = window.getComputedStyle(elem, null);
    for (var i = 0; i < search.length; i++) {
      values[search[i]] = cs.getPropertyValue(search[i]).split(',');
      for (var j = 0; j < values[search[i]].length; j++) { values[search[i]][j] = values[search[i]][j].trim() }
    }
    return values;
  }

  function handleAudioStateIndex(elem, state, index) {
    var url_reg = /(?:\(['"]?)(.*?)(?:['"]?\))/;

    var url_parse = url_reg.exec(state['--audio-src'][index]);
    var cSrc       = url_parse ? url_parse[1] : '';
    var cPlaystate = state['--audio-state'][index] || 'stopped';
    var cPlayback  = state['--audio-playback'][index] || 'playthrough';
    var cOnTrigger = state['--audio-ontrigger'][index];
    var cLoop      = state['--audio-loop'][index] || 1;
    var cOffset    = state['--audio-offset'][index] || '0s';
    var cVolume    = parseInt(state['--audio-volume'][index] || 100) / 100;

    // Check/convert cOffset as if the <time> CSS data type
    if (cOffset.lastIndexOf('ms') !== -1) {
      cOffset = parseFloat(cOffset) * 1000;
    } else if (cOffset.lastIndexOf('s') !== -1) {
      cOffset = parseFloat(cOffset);
    }

    if (!elem.audio || !elem.audio[index]) {
      setupNodeAudio(elem, index);
    }

    if (elem.audio[index].origSrc !== cSrc) {
      elem.audio[index].origSrc = cSrc;
      elem.audio[index].src = cSrc;
    }

    elem.audio[index].volume = cVolume;

    if (cPlaystate == 'default') {
      cPlaystate = elem.last_state['--audio-state'][index];
      state['--audio-state'][index] = cPlaystate;
    }

    if (cPlaystate == 'playing' && elem.audio[index].paused) {
      if (cLoop === 'infinite' || ((cLoop = parseInt(cLoop)) > 0 && elem.audio[index].loop_count < cLoop)) {
        if (elem.audio[index].ended) elem.audio[index].currentTime = cOffset;
        elem.audio[index].play();
        elem.audio[index].loop_count++;
      }
    } else if (cPlaystate == 'playing' && !elem.audio[index].paused) {
      if (cOnTrigger == 'reset') {
        elem.audio[index].currentTime = cOffset;
        elem.audio[index].play();
      } else if (cOnTrigger == 'multi') {
        var spawn = elem.audio[index].cloneNode(false);
        spawn.currentTime = cOffset;
        spawn.volume = elem.audio[index].volume;
        spawn.play();
      }
    } else if (cPlaystate == 'paused' && elem.audio[index].paused) {
    } else if (cPlaystate == 'paused' && !elem.audio[index].paused) {
      elem.audio[index].pause();
    } else if (cPlaystate == 'stopped' && elem.audio[index].paused) {
      elem.audio[index].currentTime = cOffset;
      elem.audio[index].loop_count = 0;
    } else if (cPlaystate == 'stopped' && !elem.audio[index].paused) {
      if (cPlayback === 'playthrough') {
      } else {
        elem.audio[index].currentTime = cOffset;
        elem.audio[index].pause();
        elem.audio[index].loop_count = 0;
      }
    }
  }

  /* handleAudioState(Element elem, State state)
  * This function processes the audio styles, as contained in `state`,
  * for the audio `index` of the given element `elem`.
  *
  * It is called whenever the state of the element is changed in a way that
  * should affect audio, such as through the events declared in `updateSelectorHandlers`.
  */
  function handleAudioState(elem, state) {
    var max = 0;
    for (var i in state) {
      if (state[i].length > max) max = state[i].length;
    }
    for (var i = 0; i < max; i++) { handleAudioStateIndex(elem, state, i) }

    elem.last_state = state;
  }

  /* updateSelectorHandlers(NodeElement elem)
  * This function adds handlers for the provided element depending on if it has
  * defined selectors for the following pseudo-selectors, provided they are
  * defined in mConfig.selectors:
  *   * `:active`  -- Stores computed styles on `mousedown` and then processes on `mouseup`.
  *   * `:hover`   -- Processes on `mouseover` and `mouseout`
  *   * `:focus`   -- Processes on `focus` and `blur`
  *   * `:checked` -- Processes on `change`
  *
  * This tries to emulate the functionality of provided pseudo-selectors from
  * a JavaScript perspective.
  *
  * See `hasSelectorRule()` and `getSelector()` for more information on its approach.
  */
  function updateSelectorHandlers(elem) {
    if (!elem.cssaListeners) elem.cssaListeners = {};
    // :active
    if (!elem.cssaListeners.active && mConfig.selectors.indexOf('active') !== -1 && hasSelectorRule(getSelector(elem)+':active')) {
      elem.cssaListeners.active = true;
      (function(){
        var state = getPropertyValues(elem, defaultProperties);
        elem.addEventListener('mousedown', function(e) {
          // Fix due to Firefox only setting :active style _after_ mousedown, whilst Chromium-based sets it _before_ mousedown.
          setTimeout(_=>state = getPropertyValues(elem, defaultProperties), 0);
        });
        elem.addEventListener('mouseup', function(e) {
          handleAudioState(elem, state);
        });
      })();
    }
    // :hover
    if (!elem.cssaListeners.hover && mConfig.selectors.indexOf('hover') !== -1 && hasSelectorRule(getSelector(elem)+':hover')) {
      elem.cssaListeners.hover = true;
      elem.addEventListener('mouseover', function(e) {
        handleAudioState(elem, getPropertyValues(elem, defaultProperties));
      });
      elem.addEventListener('mouseout', function(e) {
        handleAudioState(elem, getPropertyValues(elem, defaultProperties));
      });
    }
    // :focus
    if (!elem.cssaListeners.focus && mConfig.selectors.indexOf('focus') !== -1 && hasSelectorRule(getSelector(elem)+':focus')) {
      elem.cssaListeners.focus = true;
      elem.addEventListener('focus', function(e) {
        handleAudioState(elem, getPropertyValues(elem, defaultProperties));
      });
      elem.addEventListener('blur', function(e) {
        handleAudioState(elem, getPropertyValues(elem, defaultProperties));
      });
    }
    // :checked
    if (!elem.cssaListeners.checked && mConfig.selectors.indexOf('checked') !== -1 && hasSelectorRule(getSelector(elem)+':checked')) {
      elem.cssaListeners.checked = true;
      elem.addEventListener('change', function(e) {
        handleAudioState(elem, getPropertyValues(elem, defaultProperties));
      });
    }
  }
  
  function setupNodeAudio(elem, index) {
    elem.audio = elem.audio || [];
    if (!elem.audio[index]) {
      elem.audio[index] = new Audio();
      elem.audio[index].autoplay = false;
      elem.audio[index].loop_count = 0;
      elem.audio[index].addEventListener('abort', function(e) {
      });
      elem.audio[index].addEventListener('play', function(e) {
      });
      elem.audio[index].addEventListener('pause', function(e) {
      });
      elem.audio[index].addEventListener('ended', function(e) {
        var state = getPropertyValues(elem, defaultProperties);
        handleAudioState(elem, state);
      });
      elem.audio[index].addEventListener('loadeddata', function(e) {
      });
    }
  }

  function setupNode(elem) {
    elem.last_state = getPropertyValues(elem, defaultProperties);

    handleAudioState(elem, getPropertyValues(elem, defaultProperties));

    updateSelectorHandlers(elem);
  };
  
  return {
    processNode: processNode,
    observeNode: observeNode,
    observeDOM: observeDOM,
    observeHead: observeHead,
    processDOM: processDOM,
    init: function(config) {
      Object.assign(mConfig, config);
      if (mConfig.processDOM) {
        processDOM();
      }
      if (mConfig.observeDOM) {
        observeDOM();
      }
      if (mConfig.observeHead) {
        observeHead();
      }
    }
  }
})();

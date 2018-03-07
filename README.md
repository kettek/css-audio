# css-audio
**This software should be considered as both *alpha* and a curiosity.**

## What is css-audio?
**css-audio** is an add-on mechanism for adding audio playback and control to elements in Web documents.

Although the author has specific uses for it in internal software projects, it is largely a curiosity created because it could be created. Enhancements, rewrites, or reimaginings are encouraged.

## How does it work?
**css-audio** works by using CSS custom properties with JavaScript to manage changes in these properties.

A brief example, to add a sound to a button that triggers on click, would be:

    button {
      --audio-src: url('click.ogg');
    }
    button:active {
      --audio-state: playing;
    }


## Basic Usage
Add the following to your HTML `<head>`:
>    &lt;script type='text/javascript' src='//kettek.net/s/css-audio/css-audio-0.1.0.min.js'>&lt;/script>
>    
>    &lt;script type='text/javascript'>window.addEventListener('load', function() { KTK.CSSA.init(); })&lt;/script>

Thereafter you can add a stylesheet to the document head defining your *Audio Properties* and any accompanying HTML elements to the document body.

## Audio Properties
The custom CSS properties that **css-audio** provides are as follows.

### `--audio-src`
The `--audio-src` property sets one or more audio sources on an element.

#### Syntax
Each audio source is specified as a `url(...)` value.

To specify multiple audio sources, supply multiple values separated by a comma:

```
--audio-src:
  url(audio1.ogg),
  url(audio2.ogg);
```

#### Values
* **<url&gt;**
  * Is a [<url&gt;](https://developer.mozilla.org/en-US/docs/Web/CSS/url) denoting the audio source to use. There can be several of them, separated by commas.

### `--audio-state`
The `--audio-state` property sets the desired state of the audio.

Changes to this property through selectors or other changes (such as style, class, or id) will result in the audio's state changing.

#### Syntax
Each audio source's state is specified as a String value.

To specify the state of multiple audio sources, supply multiple values separated by a comma:

```
--audio-state:
  playing,
  default;
```

#### Values
* **default**
  * The audio state should remain in whatever state it already is.
* **playing**
  * The audio should be playing.
* **paused**
  * The audio should pause its playback.
* **stopped** *default*
  * The audio should stop its playback.

### `--audio-playback`
The `--audio-playback` property sets how the audio should manage playback.

#### Syntax
Each audio source's playback method is specified as a String value.

To specify the playback method of multiple audio sources, supply multiple values separated by a comma:

```
--audio-playback:
  playthrough,
  cease;
```

#### Values
* **playthrough**
  * The audio should keep playing until it finishes if the `--audio-state` changes to a non-playing value.
* **cease** *default*
  * The audio should change its state to match `--audio-state` immediately.

### `--audio-loop`
The `--audio-loop` property sets how the audio should loop.

#### Syntax
Each audio source's looping rule is specified as either a Number or the `infinite` value.

To specify the looping rule of multiple audio sources, supply multiple values separated by a comma:

```
--audio-loop:
  infinite,
  2;
```

#### Values
* **infinite**
  * The audio should resume playback from `--audio-offset` once it finishes playing.
* **&lt;integer>**
  * The audio should loop the supplies amount of times. *Defaults to "1"*

### `--audio-ontrigger`
The `--audio-ontrigger` property sets how playback should behave when the audio source updates.

#### Syntax
Each audio source's trigger rule is specified as a String value.

To specify trigger rules for multiple audio sources, supply multiple values separated by a comma:

```
--audio-trigger:
  reset,
  multi;
```

#### Values
* **continue** *default*
  * The audio should continue playing if the audio is still playing.
* **reset**
  * The audio should immediately reset to the beginning of its offset and play.
* **multi**
  * The audio should create a new audio playback source that copies its rules and begin playback.

### `--audio-offset`
The `--audio-offset` property sets the playback offset for the audio source to start from.

#### Syntax
Each audio source's offset rule is specified as a `<time>` value.

The specify offset rules for multiple audio sources, supply multiple values separated by a comma:

```
--audio-offset:
  0.1s,
  500ms;
```

#### Values
* **&lt;time>**
  * Is a [&lt;time>](https://developer.mozilla.org/en-US/docs/Web/CSS/time) denoting the offset of the audio. There can be several of them, separated by commas. *Defaults to "0s"*

## Advanced Usage
### Initialization Options
**css-audio** can be passed a configuration object through the `init()` call, thereby changing some of the core functionality of **css-audio** to fit your needs.

These options and their effects are:

| Option            | Description   |  Value(s) | Default Value |
|-------------------|---------------|-----------|---------------|
| processDOM        | Should the DOM should be processed on init? | true/false | true |
| observeDOM        | Should the DOM be observed for added Elements? | true/false | true |
| observeNodeConfig | Options for MutationObserver.observe used on Nodes | See [MutationObserverInit](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit) | `{ attributeFilter: ['style', 'class', 'id'] }` |
| observeDOMConfig  | Options for MutationObserver.observe used on the DOM | See [MutationObserverInit](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit) | { childList: true } |
| selectors         | CSS selectors that should trigger handleAudioState for Nodes | Array of Strings | ['active', 'hover', 'focus', 'checked'] |

## Current Limitations
  * There is no proper triggering of children when the parent changes.
  
---  
  * Internal parsing for Element watching validity requires overspecific rules that specify the full class name, id, and tag name. Additionally, complex psuedo-class selectors will also not register.

```
<div class='button' id='unique'>click</div>
```

```
div.button#unique:active:hover {
  /* NO MATCH */
}
div.button#unique:active {
  /* MATCH */
}
div.button:active {
  /* NO MATCH */
}
div:active {
  /* NO MATCH */*
}
```
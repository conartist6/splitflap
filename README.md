About:
======

This tool is meant to create a digital display in the style of a Solari split-flap display of the type that were at one time common in train stations. For those who haven't seen one recently, a decent video of one is here http://www.youtube.com/watch?v=U8azGTsslNc&feature=fvwp. The goal of this code is to replicate as exactly as possible the unique aesthetics of those displays, and so unlike some other facsimilies, this tool will always have to flip through it's full "deck" of characters in order to change an alphabetic segment displaying a "b" over to an "a". As far as I am aware this is the only online facsimile that functions in this manner and also renders segments using regular fonts and not images.

Note in the linked video that the display lends itself to two styles. One style is that of the general message area at the bottom of the board, which is simply an array of displays each of which is capable of displaying letters, numbers, and as much punctation as might be needed to spell out a message. The other style can be seen in train destinations. Though these could easily be created in a similar way, mechanical boards preferenced whole-word segments where possible, as it was both cheaper not to replicate the electronics for each letter and more readable since monospace font was not a requirement. In a segment like this a flip might go from "Boston" to "Grand Central" It is the goal of this project to support both these styles, and in fact it shouldbe possible (if sluggish) to replicate even the board seen in the video.

Creating A Board:
=================

It will be possible to create a board in one of two ways, both of which are shown on the demo page.

*The easy way* is to call the constructor on an empty element (it will be jquery wrapped if it isn't already) and pass as parameters the number of segments that should be created, and a settings object if desired. Reasonable defaults will be set wherever possible, and no arguments are strictly required. If an element is not supplied, the board will be created in a jquery wrapped div not attached to the DOM. If an element is supplied, segments will be created within it. If you just want to spell out some words, this is for you.

*The hard way* is to call the contructor on a nonempty element which contains somewhere within it's tag hierarchy one or more elements with the class segment, which will be used as the segments for the display. Why would you want to do this? The simplest reason is to set up a display with some static content. For example for a clock display showing 12:51, the colon need not be part of a segment, and in fact it should display much narrower than the digits. Using this approach static content can be mixed in with display segments, and the segments themselves can have additional classes applied for them both to help with their styling and to get them set up.

Settings:
=========

*deck* This setting controls what cards will be available for use in a display segment. If a string is given it will split by character and each character will be available for use. If an array is given each element will be on a card. If an array with no numeric indicies is given, it will be assumed that the input is a map from css selectors to either strings or arrays as described earlier. If I were building the train station board shown in the video linked, I would set it up the hard way, and classes to my segments. They might end up looing like class="segment alphanumeric" and class="segment trainstation". Then I would define the value for this setting as {".alphanumeric": " abcdefghijklmnopqrstuvwxyz0123456789", ".trainstation": ["Boston", "Grand Central", "Old Saybrook", "Washington"]}. Since some glyph sets are quite common they are stored in the splitflap object's constructor. They are $.splitflap.alphabetic, $.splitflap.alphanumeric, $.splitflap.ten, $.splitflap.twelve, and $.splitflap.twentyfour.
The default deck is alphanumeric for all segments.

*tickLength* If a display is flipping as fast as possible to get to the next card, how many milliseconds will it wait to perorm the next flip? Internally this also affects optimization. If tickLength is 1000, and a complete flip takes only 250ms, then only two flaps will ever be visible at a time, and the display will compensate accordingly. If however tickms is 100 and a complete flip takes 250ms, then up to 3 cards may be showing at any given time. It is possible to adjust the animation lengths using css, and the display will in fact adjust its internal parameters accordingly.
The default tickLength is 120ms. Values < 1 are illegal. Very low values should be used at your own risk.

Usage
=====

Once you have instantiated a display, the only function you care about is

*print(target)* starts each segment of the display it is called on spinning towards a target glyph. Again target may be either a string or an array, though it must be an array if any segments of the display are capable of displaying more than one character. If the target is shorter (in characters or number of elements) than the number of segments, the segments will be populated in order with unused segments being set to the first character of the glyph set. For this reason the first character in the alphbetic and alphanumeric sets is space. Contents of target are case sensitive, though I will attempt to ensure that case sensitivity is not a requirement where there is no ambiguity.

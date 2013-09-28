(function () {
    function strToMs(timeString) {
        var matchTime = /([.0-9]*)([a-z]*)/i,
            match = matchTime.exec(timeString),
            base = match[1];
        if (match[2] == "s") base = parseFloat(base) * 1000;
        else base = parseInt(base);
        return Math.ceil(base);
    }

    function numRange(start, end) {
        function lzpad(string, paddedlen) {
            var padamt = paddedlen - string.length,
                o;
            if (padamt > 0) {
                for (o = new Array; padamt > 0; o[--padamt] = "0");
                return (o.join("") + string);
            }
            return string;
        }
        var i,
            zeropad = 0,
            output = [];
        if (start.charAt(0) == "0") {
            zeropad = start.length;
        }
        for (i = parseInt(start); i <= parseInt(end); i++) {
            output.push(lzpad(i.toString(), zeropad));
        }
        return output;
    }

    var glyphSets = {
        alphabetic: " ABCDEFGHIJLKMNOPQRSTUVWXYZ",
        alphanumeric: " ABCDEFGHIJLKMNOPQRSTUVWXYZ0123456789",
        extended: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*.?\"+-=/<>:)(",
        huge: " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*.?\"+-=/<>:)(",
        decimal: " 0123456789.",
        digits: " 012345679",
        hex: " 0123456789ABCDEF",
        twelve: numRange("1", "12"),
        twentyfour: numRange("0", "23"),
        minutes: numRange("00", "59")
    }

	var defaults = 	{
            tickLength: 120,
            glyphSet: glyphSets.alpabetic,
            initial: "",
            defaultSegments: 5
        }

        function flap(value) {
            return $("<li>" + value + "</li>");
        }

        function segment(display, element, options) {
            if (!element) {
				if(display.suppliedElements && !options.dryrun)
				{
					element = display.suppliedElements.eq(display.segments.length);
				}
				else
				{
					element = $("<div class=\"segment\"></div>");
					display.element.append(element);
				}
            }
            this.element = element;
			var glyphSet = display.options.glyphSet,
				glyphSetIndex = element.data("glyphSetIndex");

			if(!options.dryrun && glyphSetIndex !== undefined)
			{
				glyphSet = glyphSet[glyphSetIndex];
			}
			else glyphSet = glyphSet[0];

            this.top = $("<ol class=\"top\"></ol>");
            $.extend(this.top, {
                'currentFlap': null
            });
            this.bot = $("<ol class=\"bottom\"></ol>");
            $.extend(this.bot, {
                'currentFlap': null
            });
            element.append(this.top, this.bot);

            if (options.dryrun) {
                this.top.append(new flap(""));
                this.bot.append(new flap(""));
                return; 
            }

            var self = this;
            this.display = display;
            this.glyphSet = glyphSet;
            if (!options.initial) options.initial = glyphSet[0];
            this.target = options.initial;

            var i, z, targetIndex = this.glyphSet.indexOf(this.target);
            if (targetIndex == -1) targetIndex = 0;

            function wrap(val) {
                return (val + self.glyphSet.length) % self.glyphSet.length;
            }

            //Build the html for the segment's flaps' initial state.
            for (i = display.segTopLifespan - 1; i >= 0; i -= 1) {
                z = wrap(i + targetIndex - display.segTopLifespan);
                this.top.append(new flap(glyphSet[z]).css("display", "none"));
            }
            for (i = display.segBotLifespan - 1; i >= 0; i -= 1) {
                z = wrap(i + targetIndex - display.segBotLifespan);
                this.bot.prepend(new flap(glyphSet[z]).css("display", "none"));
            }
            for (i = 0; i < display.cacheFrames; i += 1) {
                z = wrap(i + targetIndex);
                this.top.prepend(new flap(glyphSet[z]));
                this.bot.append(new flap(glyphSet[z]));
            }

            this.bot.children().eq(display.segBotLifespan).css(display.stylePrefix + "transform", "scaleY(1)");
            this.top.currentFlap = this.top.children().eq(display.cacheFrames - 1);
            this.bot.currentFlap = this.bot.children().eq(-display.cacheFrames + 1);
            this.lastLoaded = wrap(targetIndex + display.cacheFrames - 2);
            this.flipping = false;
        };
    segment.prototype.flipTo = function (glyph) {
        var self = this;
        if (this.glyphSet.indexOf(glyph) < 0) return;
        this.target = glyph;
        if (!this.flipping) {
            this.flipping = true;
            (function inner() {
                if (self.top.currentFlap.text() != self.target) {
                    self.flip();
                    setTimeout(inner, self.display.options.tickLength);
                } else self.flipping = false;
            })();
        }
    };
    segment.prototype.flip = function () {
        this.lastLoaded = (this.lastLoaded + 1) % this.glyphSet.length;
        this.top.currentFlap.addClass("falling");
        this.top.currentFlap.siblings().last().remove();

        this.top.currentFlap.parent().prepend(new flap(this.glyphSet[this.lastLoaded]));
        this.top.currentFlap = this.top.currentFlap.prev();

        this.bot.currentFlap.addClass("falling");
        this.bot.currentFlap.siblings().first().remove();

        this.bot.currentFlap.parent().append(new flap(this.glyphSet[this.lastLoaded]));
        this.bot.currentFlap = this.bot.currentFlap.next();
    };

    $.widget("splitflap.splitflap", {
        options: defaults,
        _create: function () {
            if (!this.element.hasClass("splitflap")) {
                this.element.addClass("splitflap")
            }

			this.suppliedElements = this.element.find(".segment");
			if(this.suppliedElements.length)
			{
				this.options.segments = Math.max(this.options.segments, this.suppliedElements.length);
			}
			else this.suppliedElements = undefined;

			if (!this.options.segments) {
                if (this.options.initial) this.options.segments = this.options.initial.length;
				else if(this.suppliedElements) this.options.segments = this.suppliedElements.length;
                else this.options.segments = this.options.defaultSegments;
            }

            this.cacheFrames = 2;

			if(typeof this.options.glyphSet == "string")
				this.options.glyphSet = [this.options.glyphSet.split[""]];
			else if(this.options.glyphSet.length === undefined)
			{
				var i = 0,
					indexed = [];
				for(s in this.options.glyphSet)
				{
					indexed.push(this.options.glyphSet[s]);
					this.element.find(s).filter(".segment").data("glyphSetIndex", i);
					i+=1;
				}
				this.options.glyphSet = indexed;
			}
			else this.options.glyphSet = [this.options.glyphSet];

            var glyph, hasUpper = false,
                hasLower = false,
                lower = /[^A-Z]*/,
                upper = /[^a-z]*/ ;
            for (var set in this.options.glyphSet) {
				for (var g in this.options.glyphSet[set]) {
					glyph = this.options.glyphSet[set][g];
					hasLower = lower.test(glyph);
					hasUpper = upper.test(glyph);
					this.options.glyphSet[set][g] = glyph.replace(" ", "\u00A0");
				}
            }

            this.caseInsensitive = false;
            if (!(hasUpper && hasLower)) {
                this.caseInsensitive = true;
                if (hasUpper) {
			 this.caseLetter = "upper";
		} else {
			 this.caseLetter = "lower";
		}
            }

            //Create a segment in an element not attached to the dom in order to harvest CSS animation timing values
            //There has bot to be a better way to avoid writing out so much of this html twice.
            var tempSeg = new segment(this, null, {dryrun: true}),
                tempHtml = tempSeg.element,
                topFlap = tempSeg.top.children().first(),
                botFlap = tempSeg.bot.children().first();

            this.stylePrefix = "";
            if (topFlap.css("-webkit-transition-duration")) this.stylePrefix = "-webkit-";
            this.segTopLifespan = Math.floor(strToMs(topFlap.css(this.stylePrefix + "transition-duration")) / this.options.tickLength) + 1;
            this.segBotLifespan = Math.floor((strToMs(botFlap.css(this.stylePrefix + "transition-duration")) + strToMs(botFlap.css(this.stylePrefix + "transition-delay"))) / this.options.tickLength) + 2;
            tempHtml.remove();

            this.segments = [];
            for (var i = 0; i < this.options.segments; i += 1) {
                this.segments[i] = new segment(this, null, {initial: this.options.initial[i]});
            }
        },

        value: function (value) {
            // no value passed, act as a getter
            if (value === undefined) {
                value = [];
                for (segment in this.segments) {
                    value.push(segment.target);
                }
                return value.join("");
            }
			if(typeof value == "string") value = value.split("");
			for(var v in value)
			{
				value[v] = value[v].replace(" ", "\u00A0");
				    if (this.caseInsensitive) {
                    if (this.caseLetter == "upper") value[v] = value[v].toUpperCase();
                    else value[v] = value[v].toLowerCase();
                }
			}

            for (var i = 0; i < Math.min(value.length, this.segments.length); i += 1) {
                this.segments[i].flipTo(value[i]);
            }
            for (i = value.length; i < this.segments.length; i += 1) {
                this.segments[i].flipTo(this.segments[i].glyphSet[0]);
            }
        },
    });
    $.extend(true, $.splitflap, glyphSets);
})();

$(window).load(function()
{
      function flap(value)
      {
      };
      flap.prototype.template = _.template($("#tmpl_flap").text().trim(), "", {variable: "data"});
      
      function segment(display, el, settings)
      {
          var self = this;
          this.display = display;
          this.el = el;
          if(settings)
          {
              if(settings['values']) this.values = settings['values'];
              else this.values = this.display.values;
              if(settings['initial']) this.target = settings['initial'];
              else this.target = this.values[0];
          }
          
          this.top = this.el.find(".top");
          $.extend(this.top, {'currentFlap': null});
          this.bot = this.el.find(".bottom");
          $.extend(this.bot, {'currentFlap': null});

          var i, z, targetIndex = this.values.indexOf(this.target);
          if(targetIndex == -1) targetIndex = 0;
          var wrap=function(val)
          {
              return (val + self.values.length) % self.values.length;
          }
          for(i=display.segTopLifespan - 1; i>= 0; i-=1)
          {
	      z = wrap(i + targetIndex - display.segTopLifespan);
              this.top.append($(flap.prototype.template(this.values[z])).css("display", "none"));
          }
          for(i=0; i<display.cacheFrames; i+=1)
          {
	      z = wrap(i + targetIndex);
              this.top.prepend(flap.prototype.template(this.values[z]));
          }
          for(i=display.segBotLifespan - 1; i>= 0; i-=1)
	  {
	      z = wrap(i + targetIndex - display.segBotLifespan);
              this.bot.prepend($(flap.prototype.template(this.values[z])).css("display", "none"));
          }
          for(i=0; i<display.cacheFrames; i+=1)
          {
	      z = wrap(i + targetIndex);
              var botFlaps = $(flap.prototype.template(this.values[z]));
              if(!i)botFlaps.css(display.stylePrefix + "transform", "scaleY(1)");
              this.bot.append(botFlaps);
          }
          
          this.top.currentFlap = this.top.children().eq(display.cacheFrames - 1);
          this.bot.currentFlap = this.bot.children().eq(-display.cacheFrames + 1);
          this.lastLoaded = wrap(targetIndex + display.cacheFrames - 2);
          this.flipping = false;
      };
      segment.prototype.template = _.template($("#tmpl_segment").text().trim(), "", {variable: "data"});
      segment.prototype.setTarget = function(target)
      {
          this.target = target;
      };
      segment.prototype.flipTo = function(glyph)
      {
          var self = this;
          if(this.values.indexOf(glyph) < 0) return;
          this.setTarget(glyph);
          if(!this.flipping)
          {
              this.flipping = true;
              (function inner(){
                  if(self.top.currentFlap.text() != self.target)
                  {
                      self.flip();
                      setTimeout(inner, self.display.tickMs);
                  }
                  else self.flipping = false;
              })();
          }
      };
      segment.prototype.flip = function()
      {
          this.lastLoaded = (this.lastLoaded + 1) % this.values.length;
          this.top.currentFlap.addClass("falling");
          this.top.currentFlap.siblings().last().remove();
          
	  this.top.currentFlap.parent().prepend(flap.prototype.template(this.values[this.lastLoaded]));
          this.top.currentFlap = this.top.currentFlap.prev();
          
          this.bot.currentFlap.addClass("falling");
          this.bot.currentFlap.siblings().first().remove();
          
	  this.bot.currentFlap.parent().append(flap.prototype.template(this.values[this.lastLoaded]));
          this.bot.currentFlap = this.bot.currentFlap.next();
      };
      
      function display(el, segments, settings)
      {
          this.el = $(el);
          this.settings = settings;
          el.addClass("split-flap");
          if(!this.settings) this.settings = [];
          if(this.settings['tickLength']) this.tickMs = 
this.settings['tickLength'];
          else this.tickMs = 120;
          this.cacheFrames = 2;
          var numeric = digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
          var alphabetic = [" ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q","R","S","T","U","V","W","X","Y","Z"];
          if(!this.settings['values']) this.values = alphabetic;
          else this.values = this.settings['values'];
	  var value, hasUpper = false, hasLower = false, upper = /[A-Z]/, lower = /[a-z]/
	  for(v in this.values)
	  {
	      value = this.values[v];
	      if(lower.test(value)) hasLower = true;
	      if(upper.test(value)) hasUpper = true;
	      this.values[v] = value.replace(" ", "\u00A0");
	  }
	  this.caseInsensitive = false;
	  if(!(hasUpper && hasLower))
	  {
	      this.caseInsensitive = true;
	      if(hasUpper) this.case = "upper";
	      else this.case = "lower";
	  }
          var initial = this.settings['initial'];
          if(typeof initial == "string") initial = initial.split("");
          if(initial && !segments) this.segments = initial.length;
          else if(!segments) segments = 7;
          
	  //Render a segment template in order to snatch values out of its css
          var tempSegment = $(segment.prototype.template()), tempTop, tempBot;
          tempTop = tempSegment.find(".top").append($(flap.prototype.template()));
          tempBot = tempSegment.find(".bottom").append($(flap.prototype.template()));
          $("#split-flap").append(tempSegment);
	  tempTop = tempTop.children("li").first();
	  this.stylePrefix = "";
	  if(tempTop.css("-webkit-transition-duration")) this.stylePrefix = "-webkit-"; 
          this.segTopLifespan = Math.floor(this.strToMs(tempTop.css(this.stylePrefix + "transition-duration")) / this.tickMs) + 1;
          var tempBot = tempBot.find("li").first();
          this.segBotLifespan = Math.floor((this.strToMs(tempBot.css(this.stylePrefix + "transition-duration")) + this.strToMs(tempBot.css(this.stylePrefix + "transition-delay"))) / this.tickMs) + 2;
          tempSegment.remove();
          this.segments = [];
          var i, init, html;
          for(i=0; i<segments; i+=1)
          {
              if(initial) init = {initial: initial[i]};
              html = $(segment.prototype.template());
              this.el.append(html);
              this.segments.push(new segment(this, html, init));
          }
      }
      display.prototype.print = function(target)
      {
          if(typeof target == "string")
	  {
	      if(this.caseInsensitive)
	      {
		  if(this.case == "upper") target = target.toUpperCase();
		  else target = target.toLowerCase();
	      }
	      target = target.replace(" ", "\u00A0");
	      target = target.split("");
	  }
          var i, glyph;
          for(i=0; i < Math.min(target.length, this.segments.length); i+=1)
          {
              glyph = target[i];
              this.segments[i].flipTo(glyph);
          }
          for(i=target.length; i<this.segments.length; i+=1)
          {
              this.segments[i].flipTo(this.segments[i].values[0]);
          }
      };
      display.prototype.matchTime = /([.0-9]*)([a-z]*)/i;
      display.prototype.strToMs = function(timeString)
      {
          var match = this.matchTime.exec(timeString);
          var base = match[1];
          if(match[2] == "s") base = parseFloat(base) * 1000;
          else base = parseInt(base);
          return Math.ceil(base);
      }
      window.display = display;
  });

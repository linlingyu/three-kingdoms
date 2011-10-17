/**
 * ie6png 简易解决方案
 * filename: fixpng.js
 * author: dron
 * date: 2011-04-12
 */

module.declare(function(require, exports, module){
	/**
	 * useage: png.fixAll(selector)  or  png.fix(el)
	 */
	var Ucren = require("./ucren");
	var E = Ucren.Element, Q = Ucren.queryElement;

	Ucren.each([
		".png-positer{ position: relative; width: 0; height: 0; line-height: 0; z-index: -1; }",
		".png-layer{ position: absolute; left: 0; top: 0; overflow: hidden; }",
		".png-inner{ }"
	], Ucren.appendStyle.bind(Ucren));

	var C = function(className){
		var div = document.createElement("div");
			div.className = className;
		return div;
	};

	var png = {
		fixAll: function(selector){
			Ucren.each(Q(selector), this.fix.bind(this));
		},

		fix: function(el){
			if(!el.clientWidth || !el.clientHeight){
				if(E(el).count("pngfixed") < 5)
					return this.fix.saturate(this, el).defer(this, 10);
			}

			if(E(el).attr("pngfixed"))
				return ;
			E(el).attr("pngfixed", true);

			var elStyle = el.currentStyle;
			var image = elStyle.backgroundImage;

			if(image == "none")
				return ;

			var positer = C("png-positer");
			E(el).insert(positer);

			var layer = C("png-layer");

			var repeat = elStyle.backgroundRepeat;
			var positionX = elStyle.backgroundPositionX;
			var positionY = elStyle.backgroundPositionY;

			if(image)
				image = /^url\(\"(.+?)\"\)$/.test(image) && RegExp.$1;

			if(positionX)
				positionX = /(\-?\d+)px/.test(positionX) && RegExp.$1 - 0;

			if(positionY)
				positionY = /(\-?\d+)px/.test(positionY) && RegExp.$1 - 0;

			E(positer).insert(layer);
			E(layer).width(E(el).width());
			E(layer).height(E(el).height());

			var inner = C("png-inner");
			E(layer).add(inner);

			var listenScrollChange = function(x, y){
				var startTime = new Date().getTime();
				var x = setInterval(function(){
					if(layer.scrollTop != y){ // fix scrollTop error
						layer.scrollTop = y;
						clearInterval(x);
					}
					if(new Date().getTime() - startTime > 2000)
						clearInterval(x);
				}, 10);
			};

			var img = new Image();

			img.onload = function(){
				E(inner).usePNGbackground(image);

				if(repeat == "repeat-x")
					E(inner).width(E(el).width()).height(this.height);
				else if(repeat == "repeat-y")
					E(inner).height(E(el).height()).width(this.width);
				else
					E(inner).width(this.width).height(this.height);

				layer.scrollLeft = - positionX;
				layer.scrollTop = - positionY;
				listenScrollChange(- positionX, - positionY);
			};

			img.src = image;

			E(el).style("backgroundImage", "none");

			E(layer).observe(el, function(conf){
				if(conf.width)
					this.width(conf.width);
				if(conf.height)
					this.height(conf.height);
			});

			E(inner).observe(layer, function(conf){
				if(repeat == "repeat-x" && conf.width)
					this.width(conf.width);
				if(repeat == "repeat-y" && conf.height)
					this.height(conf.height);
			});
		}
	};

	return png;
});
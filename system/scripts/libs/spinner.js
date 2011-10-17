/**
 * spinner
 * filename: spinner.js
 * author: dron
 * date: 2011-5-26
 */

module.declare(function(require, exports, module){
	var Raphael = require("./raphael");
	var Ucren = require("./ucren"), E = Ucren.Element;

	function spinner(holderid, R1, R2, count, stroke_width, colour) {
		var sectorsCount = count || 12,
			color = colour || "#fff",
			width = stroke_width || 15,
			r1 = Math.min(R1, R2) || 35,
			r2 = Math.max(R1, R2) || 60,
			cx = r2 + width,
			cy = r2 + width,
			r = Raphael(holderid, r2 * 2 + width * 2, r2 * 2 + width * 2),

			sectors = [],
			opacity = [],
			beta = 2 * Math.PI / sectorsCount,

			pathParams = {stroke: color, "stroke-width": width, "stroke-linecap": "round"};
			Raphael.getColor.reset();
		for (var i = 0; i < sectorsCount; i++) {
			var alpha = beta * i - Math.PI / 2,
				cos = Math.cos(alpha),
				sin = Math.sin(alpha);
			opacity[i] = 1 / sectorsCount * i;
			sectors[i] = r.path([["M", cx + r1 * cos, cy + r1 * sin], ["L", cx + r2 * cos, cy + r2 * sin]]).attr(pathParams);
			if (color == "rainbow") {
				sectors[i].attr("stroke", Raphael.getColor());
			}
		}
		var tick;
		(function ticker() {
			opacity.unshift(opacity.pop());
			for (var i = 0; i < sectorsCount; i++) {
				sectors[i].attr("opacity", opacity[i]);
			}
			r.safari();
			tick = setTimeout(ticker, 1000 / sectorsCount);
		})();
		return function () {
			clearTimeout(tick);
			r.remove();
		};
	}

	var install = function(){
		Ucren.appendStyle(
			".spinner-mask{background-color:#000;position:absolute;width:100%;height:100%;left:0;top:0;filter:alpha(opacity=50);-ms-filter:alpha(opacity=.5);-moz-user-select:none;-webkit-user-select:none;}",
			".spinner-el{width:200px;height:200px;overflow:hidden;position:absolute;margin:0}");

		var de = document.documentElement;
		var container = this.container = document.createElement("div");
			container.className = "spinner-mask";
		document.body.appendChild(container);

		this.el = document.createElement("div");
		this.el.className = "spinner-el";
		this.el.style.left = (de.clientWidth - 200) / 2 + "px";
		this.el.style.top = (de.clientHeight - 200) / 2 + "px";
		document.body.appendChild(this.el);

		this.initialized = true;
	};

	exports.show = function(){
		if(!this.initialized)
			install.call(this);
		this.remove = spinner(this.el, 50, 80, 12, 20, "#fff");
		this.container.style.display =
		this.el.style.display = "block";
	};

	exports.hide = function(){
		if(this.container){
			this.remove();
			this.container.style.display =
			this.el.style.display = "none";
		}
	};
});
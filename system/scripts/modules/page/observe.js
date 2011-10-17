module.declare(function(require, exports, module){

	var Ucren = require("../../libs/ucren");
	var E = Ucren.Element, Q = Ucren.queryElement;
	var resizies = [];

	var resizeCallBack = function(){
		var width, height, de;
		de = document.documentElement;
		width = de.clientWidth;
		height = de.clientHeight;
		Ucren.each(resizies, function(resize){
			resize({
				width: width,
				height: height
			});
		});
	};

	var observeFn = function(el, change, conf){
		Ucren.each(conf, function(value, key){
			if(change[key]){
				value = eval(value.replace(/\$/g, "change"));
				if(key == "width" || key == "height")
					value = Math.max(0, value);
				el[key](value);
			}
		});
	};

	var observe = function(element, conf){
		var parent;
		parent = element.dom.parentNode;
		var f = function(change){
			observeFn(this, change, conf);
		};
		if(parent != document.body){
			element.observe(parent, f);
		}else{
			resizies.push(f.bind(element));
		}
	};

	var parse = function(mapping){
		Ucren.each(mapping, function(conf, selector){
			var elements = Q(selector);
			Ucren.each(elements, function(element){
				element = E(element);
				observe(element, conf);
			});
		});
		resizeCallBack();
	};

	Ucren.addEvent(window, "resize", resizeCallBack);

	exports.parse = parse;
});
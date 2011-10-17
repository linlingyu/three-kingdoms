/**
 * ucren-lite
 * filename: boot.js
 * author: dron
 * date: 2009-03-15
 * contact: ucren.com
 */

module.declare(function(require, exports, module){
	var Ucren;
	//
	// [基本数据类型扩展]
	//

	// String.prototype.trim
	String.prototype.trim = function(){
		return this.replace(/^\s+|\s+$/, "");
	};

	// String.prototype.format
	String.prototype.format = function(conf){
		var rtn = this, blank = {};
		Ucren.each(conf, function(item, key){
			item = item.toString().replace(/\$/g, "$$$$");
			rtn = rtn.replace(RegExp("@{" + key + "}", "g"), item);
		});
		return rtn.toString();
	};

	// String.prototype.htmlEncode
	String.prototype.htmlEncode = function(){
		var div = document.createElement("div");
		return function(){
			var text;
			div.appendChild(document.createTextNode(this));
			text = div.innerHTML;
			div.innerHTML = "";
			return text;
		};
	}();

	// String.prototype.byteLength
	String.prototype.byteLength = function(){
		return this.replace(/[^\x00-\xff]/g, "--").length;
	};

	// String.prototype.subByte
	String.prototype.subByte = function(len, tail){
		var s = this;
		if(s.byteLength() <= len)
			return s;
		tail = tail || "";
		len -= tail.byteLength();
		return s = s.slice(0, len).replace(/([^\x00-\xff])/g, "$1 ")
			.slice(0, len)
			.replace(/[^\x00-\xff]$/, "")
			.replace(/([^\x00-\xff]) /g, "$1") + tail;
	}

	// Function.prototype.defer
	Function.prototype.defer = function(scope, timeout){
		var me = this;
		var fn = function(){
			me.apply(scope, arguments);
		};
		return setTimeout(fn, timeout);
	};


	// Function.prototype.bind
	Function.prototype.bind = function(scope){
		var me = this;
		return function(){
			return me.apply(scope, arguments);
		}
	};

	// Function.prototype.improve
	Function.prototype.improve = function(fn){
		var origin = this;
		return function(){
			var args = [].slice.call(arguments);
				args.unshift(origin);
			return fn.apply(this, args);
		};
	};

	// Function.prototype.saturate
	Function.prototype.saturate = function(scope/*, args */){
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function(){
			return fn.apply(scope, args);
		}
	};

	// Function.prototype.when
	Function.prototype.when = function(cond){
		var f = function(x){
			if(x = cond()){
				clearInterval(f.timer);
				return this.call(this, x);
			}
		}.bind(this);
		f.timer = setInterval(f, 100);
	};

	// Function.prototype.condition
	Function.prototype.condition = function(cond){
		var fn = this;
		return function(){
			if(cond.apply(this, arguments)){
				return fn.apply(this, arguments);
			}
		};
	};

	// Function.prototype.infrequently
	Function.prototype.infrequently = function(interval){
		interval = interval || 100;
		var fn = this;
		var callbacks = {};
		var count = 0;
		var nul = function(){};
		var stoped = false;
		var returnFunc = function(){
			var self = this, args = Array.prototype.slice.call(arguments, 0);
			callbacks[count] = function(count){
				return function(){
					if(stoped)
						return ;
					fn.apply(self, args);
					delete callbacks[count];
					setTimeout(callbacks[count + 1] || nul, interval);
				};
			}(count);
			if(count == 0){
				setTimeout(callbacks[count] || nul, interval);
			}
			count ++;
		};
		returnFunc.stop = function(){
			stoped = true;
		};
		return returnFunc;
	};

	// Function.prototype.concatArguments
	Function.prototype.concatArguments = function(scope/*, args */){
		var me = this;
		var outerArg = Array.prototype.slice.call(arguments, 1);
		return function(){
			var innerArg = Array.prototype.slice.call(arguments, 0);
			return me.apply(scope, innerArg.concat(outerArg));
		};
	};

	// Array.prototype.indexOf
	Array.prototype.indexOf = function(item, i){
		i || (i = 0);
		var length = this.length;
		if(i < 0)
			i = length + i;
		for(; i < length; i++)
			if(this[i] === item)
				return i;
		return -1;
	};

	// Array.prototype.lastIndexOf
	Array.prototype.lastIndexOf = function(item, i) {
		i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
		var n = this.slice(0, i).reverse().indexOf(item);
		return (n < 0) ? n : i - n - 1;
	};

	// Array.prototype.every
	Array.prototype.every = function(fn, context) {
		for (var i = 0, len = this.length >>> 0; i < len; i++) {
			if (i in this && !fn.call(context, this[i], i, this)) {
				return false;
			}
		}
		return true;
	};

	// Array.prototype.filter
	Array.prototype.filter = function(fn, context) {
		var result = [ ], val;
		for (var i = 0, len = this.length >>> 0; i < len; i++) {
			if (i in this) {
				val = this[i]; // in case fn mutates this
				if (fn.call(context, val, i, this)) {
					result.push(val);
				}
			}
		}
		return result;
	};

	// Array.prototype.forEach
	Array.prototype.forEach = function(fn, context) {
		for (var i = 0, len = this.length >>> 0; i < len; i++) {
			if (i in this) {
				fn.call(context, this[i], i, this);
			}
		}
	};

	// Array.prototype.map
	Array.prototype.map = function(fn, context) {
		var result = [ ];
		for (var i = 0, len = this.length >>> 0; i < len; i++) {
			if (i in this) {
				result[i] = fn.call(context, this[i], i, this);
			}
		}
		return result;
	};

	// Array.prototype.some
	Array.prototype.some = function(fn, context) {
		for (var i = 0, len = this.length >>> 0; i < len; i++) {
			if (i in this && fn.call(context, this[i], i, this)) {
				return true;
			}
		}
		return false;
	};

	// Array.prototype.remove
	Array.prototype.remove = function(value){
		var idx = this.indexOf(value);
		if (idx !== -1) {
			this.splice(idx, 1);
		}
		return this;
	};

	// Array.prototype.reduce
	Array.prototype.reduce = function(fn /*, initial*/) {
		var len = this.length >>> 0, i = 0, rv;

		if (arguments.length > 1) {
			rv = arguments[1];
		} else {
			do {
				if (i in this) {
					rv = this[i++];
					break;
				}
				if (++i >= len) {
					throw new TypeError();
				}
			}
			while (true);
		}

		for (; i < len; i++) {
			if (i in this) {
				rv = fn.call(null, rv, this[i], i, this);
			}
		}

		return rv;
	};

	// Array.prototype.scramble
	Array.prototype.scramble = function(){
		var len = this.length, idx = 0, ary = this.slice(0), result = [];
		while(len --)
			result[idx ++] = ary.splice(Ucren.randomNumber(len), 1);
		return result;
	};

	// Number.prototype.pad (disable)
//	Number.prototype.pad = function(length){
//		var num = this.toString().split(".")[0];
//		if(length - num.length > -1){
//			return Array(length - num.length + 1).join("0") + num;
//		}else{
//			return num;
//		}
//	};

	Ucren = {

		//
		// [全局属性]
		//

		// Ucren.isIe
		isIe: /msie/i.test(navigator.userAgent),

		// Ucren.isIe6
		isIe6: /msie 6/i.test(navigator.userAgent),

		// Ucren.isFirefox
		isFirefox: /firefox/i.test(navigator.userAgent),

		// Ucren.isSafari
		isSafari: /safari/i.test(navigator.userAgent),

		// Ucren.isOpera
		isOpera: /opera/i.test(navigator.userAgent),

		// Ucren.isChrome
		isChrome: /chrome/i.test(navigator.userAgent), //todo isChrome = true, isSafari = true

		// Ucren.isStrict
		isStrict: document.compatMode == "CSS1Compat",

		// Ucren.tempDom
		tempDom: document.createElement("div"),

		//
		// [全局方法]
		//

		// Ucren.apply
		apply: function(form, to, except){
			if(!to)to = {};
			if(except){
				Ucren.each(form, function(item, key){
					if(key in except)
						return ;
					to[key] = item;
				});
			}else{
				Ucren.each(form, function(item, key){
					to[key] = item;
				});
			}
			return to;
		},

		// Ucren.appendStyle
		appendStyle: function(text){
			var style;

			if(arguments.length > 1)
				text = Array.prototype.join.call(arguments, "");

			if(document.createStyleSheet){
				style = document.createStyleSheet();
				style.cssText = text;
			}else{
				style = document.createElement("style");
				style.type = "text/css";
				//style.innerHTML = text; fix Chrome bug
				style.appendChild(document.createTextNode(text));
				document.getElementsByTagName("head")[0].appendChild(style);
			}
		},

		// Ucren.addEvent
		addEvent: function(target, name, fn){
			var call = function(){
				fn.apply(target, arguments);
			};
			if(target.dom){
				target = target.dom;
			}
			if(window.attachEvent){
				target.attachEvent("on" + name, call);
			}else if(window.addEventListener){
				target.addEventListener(name, call, false);
			}else{
				target["on" + name] = call;
			}
			return call;
		},

		// Ucren.delEvent
		delEvent: function(target, name, fn){
			if(window.detachEvent){
				target.detachEvent("on" + name, fn);
			}else if(window.removeEventListener){
				target.removeEventListener(name, fn, false);
			}else if(target["on" + name] == fn){
				target["on" + name] = null;
			}
		},

		// Ucren.Class
		Class: function(initialize, methods, befores, afters){
			var fn, prototype, blank;
			initialize = initialize || function(){};
			methods = methods || {};
			blank = {};
			fn = function(){
				this.instanceId = Ucren.id();
				initialize.apply(this, arguments);
			};
			prototype = fn.prototype;
			Ucren.registerClassEvent.call(prototype);
			Ucren.each(methods, function(item, key){
				prototype[key] = function(method, name){
					if(typeof(method) == "function"){
						return function(){
							var args, rtn;
							args = Array.prototype.slice.call(arguments, 0);
							if(befores &&
								befores.apply(this, [name].concat(args)) === false){
								return ;
							}
							this.fireEvent("before" + name, args);
							rtn = method.apply(this, args);
							if(afters)
								afters.apply(this, [name].concat(args));
							this.fireEvent(name, args);
							return rtn;
						};
					}else{
						return method;
					}
				}(item, key);
			});
			prototype.getOriginMethod = function(name){
				return methods[name];
			};
			return fn;
		},

		//private
		registerClassEvent: function(){
			this.on = function(name, fn){
				var instanceId = this.instanceId;
				Ucren.dispatch(instanceId + name, fn.bind(this));
			};
			this.onbefore = function(name, fn){
				var instanceId = this.instanceId;
				Ucren.dispatch(instanceId + "before" + name, fn.bind(this));
			};
			this.un = function(name, fn){
				//todo
			};
			this.fireEvent = function(name, args){
				var instanceId = this.instanceId;
				Ucren.dispatch(instanceId + name, args);
			};
		},

		// Ucren.createFuze
		createFuze: function(){
			var queue, fn, infire;
			queue = [];
			fn = function(process){
				if(infire){
					process();
				}else{
					queue.push(process);
				}
			};
			fn.fire = function(){
				while(queue.length){
					queue.shift()();
				}
				infire = true;
			};
			fn.extinguish = function(){
				infire = false;
			};
			fn.wettish = function(){
				if(queue.length){
					queue.shift()();
				}
			};
			return fn;
		},

		// Ucren.createIf
		createIf: function(expressionFunction){
			return function(callback){
				var expression = expressionFunction();
				var returnValue = {
					Else: function(callback){
						callback = callback || nul;
						expression || callback();
					}
				};
				callback = callback || nul;
				expression && callback();
				return returnValue;
			};
		},

		// Ucren.dispatch
		dispatch: function(arg1, arg2, arg3){
			var fn, send, incept;

			if(typeof(arg2) == "undefined"){
				arg2 = [];
			}

			fn = arguments.callee;
			if(!fn.map){
				fn.map = {};
			}

			send = function(processId, args, scope){
				var map, processItems;
				map = fn.map;
				if(processItems = map[processId]){
					Ucren.each(processItems, function(item){
						item.apply(scope, args);
					});
				}
			};

			incept = function(processId, fun){
				var map;
				map = fn.map;
				if(!map[processId]){
					map[processId] = [];
				}
				map[processId].push(fun);
			};

			if(typeof(arg2) == "function"){
				incept.apply(this, arguments);
			}else if(arg2 instanceof Array){
				send.apply(this, arguments);
			}
		},

		// Ucren.each (not recommended)
		each: function(unknown, fn){
			/// unknown 是 array 的，会慢慢退化，建议用 Array.prototype.forEach 替代
			/// unknown 为其它类似的，短期内将暂时支持
			if(unknown instanceof Array || (typeof unknown == "object" &&
				typeof unknown[0] != "undefined" && unknown.length)){
				if(typeof unknown == "object" && Ucren.isSafari)
					unknown = Array.prototype.slice.call(unknown);
//				for(var i = 0, l = unknown.length; i < l; i ++){
//					if(fn(unknown[i], i) === false){
//						break;
//					}
//				}
				unknown.forEach(fn);
			}else if(typeof(unknown) == "object"){
				var blank = {};
				for(var i in unknown){
					if(blank[i]){
						continue;
					}
					if(fn(unknown[i], i) === false){
						break;
					}
				}
			}else if(typeof(unknown) == "number"){
				for(var i = 0; i < unknown; i ++){
					if(fn(i, i) === false){
						break;
					}
				}
			}else if(typeof(unknown) == "string"){
				for(var i = 0, l = unknown.length; i < l; i ++){
					if(fn(unknown.charAt(i), i) === false){
						break;
					}
				}
			}
		},

		// Ucren.Element
		Element: function(el, returnDom){
			var rtn, handleId;
			if(el && el.isUcrenElement){
				return returnDom ? el.dom : el;
			}
			el = typeof(el) == "string" ? document.getElementById(el) : el;

			if(!el)
				return null;

			if(returnDom)
				return el;

			handleId = el.getAttribute("handleId");
			if(typeof handleId == "string"){
				return Ucren.handle(handleId - 0);
			}else{
				rtn = new Ucren.BasicElement(el);
				handleId = Ucren.handle(rtn);
				el.setAttribute("handleId", handleId + "");
				return rtn;
			}
		},

		// Ucren.Event
		Event: function(e){
			e = e || window.event;

			if(!e){
				var c = arguments.callee.caller;
				while(c){
					e = c.arguments[0];
					if(e && typeof(e.altKey) == "boolean"){ // duck typing
						break;
					}
					c = c.caller;
					e = null;
				}
			}

			return e;
		},

		// Ucren.fixNumber
		fixNumber: function(unknown, defaultValue){
			return typeof(unknown) == "number" ? unknown : defaultValue;
		},

		// Ucren.fixString
		fixString: function(unknown, defaultValue){
			return typeof(unknown) == "string" ? unknown : defaultValue;
		},

		// Ucren.fixConfig
		fixConfig: function(conf){
			var defaultConf;
			defaultConf = {};
			if(typeof conf == "undefined"){
				return defaultConf;
			}else if(typeof conf == "function"){
				return new conf;
			}else{
				return conf;
			}
		},

		// Ucren.handle
		handle: function(unknown){
			var fn, type, number;
			fn = arguments.callee;
			if(!fn.cache){
				fn.cache = {};
			}
			if(typeof(fn.number) == "undefined"){
				fn.number = 0;
			}
			type = typeof(unknown);
			if(type == "number"){
				return fn.cache[unknown.toString()];
			}else if(type == "object" || type == "function"){
				number = fn.number ++;
				fn.cache[number.toString()] = unknown;
				return number;
			}
		},

		// Ucren.id
		id: function(){
			var id = arguments.callee;
			id.number = ++ id.number || 0;
			return "_" + id.number;
		},

		// Ucren.loadImage
		loadImage: function(urls, onLoadComplete){
			var length = urls.length;
			var loaded = 0;
			var check = function(){
				if(loaded == length)
					onLoadComplete && onLoadComplete();
			};
			Ucren.each(urls, function(url){
				var img = document.createElement("img");
				img.onload = img.onerror = function(){
					this.onload = this.onerror = null;
					loaded ++;
					check();
				};
				Ucren.tempDom.appendChild(img);
				img.src = url;
			});
		},

		// Ucren.loadScript
		loadScript: function(src, callback){
			Ucren.request(src, function(text){
				eval(text);
				callback && callback(text);
			});
		},

		// Ucren.makeElement
		makeElement: function(tagName, attributes){
			var el = document.createElement(tagName);
			var setStyle = function(unknown){
				if(typeof unknown == "string")
					el.style.cssText = unknown;
				else
					Ucren.apply(unknown, el.style);
			};

			for (var prop in attributes) {
				if (prop === "class")
					el.className = attributes[prop];
				else if (prop === "for")
					el.htmlFor = attributes[prop];
				else if(prop === "style")
					setStyle(attributes[prop]);
				else
					el.setAttribute(prop, attributes[prop]);
			}

			return el;
		},

		// Ucren.nameSpace
		nameSpace: function(path){
			if(typeof(path) == "string"){
				var parts, part, rtn;
				parts = path.split(".");
				rtn = window;
				while(parts.length){
					part = parts.shift();
					if(typeof(rtn[part]) != "object" &&
						typeof(rtn[part]) != "function"){
						rtn[part] = {};
					}
					rtn = rtn[part];
				}
				return rtn;
			}
		},

		// Ucren.nul
		nul: function(){
			return false;
		},

		// Ucren.queryString
		queryString: function(name, sourceString){
			var source, pattern, result;
			source = sourceString || location.href;
			pattern = new RegExp("(\\?|&)" + name + "=([^&#]*)(#|&|$)", "i");
			result = source.match(pattern);
			return result ? result[2] : "";
		},

		// Ucren.randomNumber
		randomNumber: function(num){
			return Math.floor(Math.random() * num);
		},

		// Ucren.randomWord
		randomWord: function(){
			var cw = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			return function(length, sourceString){
				var words, re = [];
				words = sourceString || cw;
				Ucren.each(length, function(index){
					re[index] = words.charAt(this.randomNumber(words.length));
				}.bind(this));
				return re.join("");
			}
		}(),

		// Ucren.request
		request: function(url, callback){
			request = Ucren.request;
			var xhr = request.xhr;
			if(!request.xhr){
				if(window.XMLHttpRequest){
					xhr = request.xhr = new XMLHttpRequest();
				}else{
					xhr = request.xhr = new ActiveXObject("Microsoft.XMLHTTP");
				}
			}
			xhr.open("GET", url, true);
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4 && xhr.status == 200){
					callback(xhr.responseText);
				}
			};
			xhr.send(null);
		},

		// Ucren.decodeColor
		decodeColor: function(){
			var r = /^\#?(\w{2})(\w{2})(\w{2})$/;
			var x = function(x){
				return parseInt(x, 16);
			};
			return function(color){
				r.test(color);
				return {
					red: x(RegExp.$1),
					green: x(RegExp.$2),
					blue: x(RegExp.$3)
				};
			}
		}(),

		// Ucren.encodeColor
		encodeColor: function(){
			var x = function(x){
				return x.toString(16).split(".")[0];
			};
			x = x.improve(function(origin, x){
				x = origin(x);
				return x.length == 1 ? "0" + x : x;
			});
			return function(data){
				return ["#", x(data.red), x(data.green), x(data.blue)].join("");
			}
		}()
	};

	//
	// [底层操作类]
	//

	// Ucren.BasicDrag
	Ucren.BasicDrag = Ucren.Class(
		/* constructor */ function(conf){
			conf = Ucren.fixConfig(conf);
			this.type = Ucren.fixString(conf.type, "normal");

			var isTouch = this.isTouch = "ontouchstart" in window;

			this.TOUCH_START = isTouch ? "touchstart" : "mousedown",
			this.TOUCH_MOVE = isTouch ? "touchmove" : "mousemove",
			this.TOUCH_END = isTouch ? "touchend" : "mouseup";
		},

		/* methods */ {
			bind: function(el, handle){
				el = Ucren.Element(el);
				handle = Ucren.Element(handle) || el;

				var evt = {};

				evt[this.TOUCH_START] = function(e){
					e = Ucren.Event(e);
					this.startDrag();
					e.cancelBubble = true;
					e.stopPropagation && e.stopPropagation();
					return e.returnValue = false;
				}.bind(this);

				handle.addEvents(evt);
				this.target = el;
			},

			//private
			getCoors: function(e){
				var coors = [];
				if (e.targetTouches && e.targetTouches.length) { 	// iPhone
					var thisTouch = e.targetTouches[0];
					coors[0] = thisTouch.clientX;
					coors[1] = thisTouch.clientY;
				}else{ 								// all others
					coors[0] = e.clientX;
					coors[1] = e.clientY;
				}
				return coors;
			},

			//private
			startDrag: function(){
				var target, draging, e;
				target = this.target;
				draging = target.draging = {};

				this.isDraging = true;

				draging.x = parseInt(target.style("left"), 10) || 0;
				draging.y = parseInt(target.style("top"), 10) || 0;

				e = Ucren.Event();
				var coors = this.getCoors(e);
				draging.mouseX = coors[0];
				draging.mouseY = coors[1];

				this.registerDocumentEvent();
			},

			//private
			endDrag: function(){
				this.isDraging = false;
				this.unRegisterDocumentEvent();
			},

			//private
			registerDocumentEvent: function(){
				var target, draging;
				target = this.target;
				draging = target.draging;

				draging.documentSelectStart =
					Ucren.addEvent(document, "selectstart", function(e){
						e = e || event;
						e.stopPropagation && e.stopPropagation();
						e.cancelBubble = true;
						return e.returnValue = false;
					});

				draging.documentMouseMove =
					Ucren.addEvent(document, this.TOUCH_MOVE, function(e){
						var ie, nie;
						e = e || event;
						ie = Ucren.isIe && e.button != 1;
						nie = !Ucren.isIe && e.button != 0;
						if((ie || nie) && !this.isTouch)
							this.endDrag();
						var coors = this.getCoors(e);
						draging.newMouseX = coors[0];
						draging.newMouseY = coors[1];
						e.stopPropagation && e.stopPropagation();
						return e.returnValue = false;
					}.bind(this));

				draging.documentMouseUp =
					Ucren.addEvent(document, this.TOUCH_END, function(){
						this.endDrag();
					}.bind(this));

				clearInterval(draging.timer);
				draging.timer = setInterval(function(){
					var x, y, dx, dy;
					if(draging.newMouseX){
						dx = draging.newMouseX - draging.mouseX;
						dy = draging.newMouseY - draging.mouseY;
						x = draging.x + dx;
						y = draging.y + dy;
						if(this.type == "calc"){
							this.returnValue(dx, dy, x, y);
						}else{
							target.left(x).top(y);
						}
					}
				}.bind(this), 10);
			},

			//private
			unRegisterDocumentEvent: function(){
				var draging = this.target.draging;
				Ucren.delEvent(document, this.TOUCH_MOVE, draging.documentMouseMove);
				Ucren.delEvent(document, this.TOUCH_END, draging.documentMouseUp);
				Ucren.delEvent(document, "selectstart", draging.documentSelectStart);
				clearInterval(draging.timer);
			},

			//private
			returnValue: function(dx, dy){
				//todo something
			}
		}
	);

	// Ucren.Template
	Ucren.Template = Ucren.Class(
		/* constructor */ function(){
			this.string = Array.prototype.join.call(arguments, "");
		},

		/* methods */ {
			apply: function(conf){
				return this.string.format(conf);
			}
		}
	);

	// Ucren.BasicElement
	Ucren.BasicElement = Ucren.Class(
		/* constructor */ function(el){
			this.dom = el;
		this.countMapping = {};
		},

		/* methods */ {
			isUcrenElement: true,

			attr: function(name, value){
				if(typeof value == "string"){
					this.dom.setAttribute(name, value);
				}else{
					return this.dom.getAttribute(name);
				}
				return this;
			},

			style: function(/* unknown1, unknown2 */){
				var getStyle = Ucren.isIe ?
					function(name){
						return this.dom.currentStyle[name];
					} :

					function(name){
						var style;
						style = document.defaultView.getComputedStyle(this.dom, null);
						return style.getPropertyValue(name);
					};

				return function(unknown1, unknown2){
					if(typeof unknown1 == "object"){
						Ucren.each(unknown1, function(value, key){
							this[key] = value;
						}.bind(this.dom.style));
					}else if(typeof unknown1 == "string" && typeof unknown2 == "undefined"){
						return getStyle.call(this, unknown1);
					}else if(typeof unknown1 == "string" && typeof unknown2 != "undefined"){
						this.dom.style[unknown1] = unknown2;
					}
					return this;
				};
			}(),

			hasClass: function(name){
				var className = " " + this.dom.className + " ";
				return className.indexOf(" " + name + " ") > -1;
			},

			setClass: function(name){
				if(typeof(name) == "string")
					this.dom.className = name.trim();
				return this;
			},

			addClass: function(name){
				var el, className;
				el = this.dom;
				className = " " + el.className + " ";
				if(className.indexOf(" " + name + " ") == -1){
					className += name;
					className = className.trim();
					className = className.replace(/ +/g, " ");
					el.className = className;
				}
				return this;
			},

			delClass: function(name){
				var el, className;
				el = this.dom;
				className = " " + el.className + " ";
				if(className.indexOf(" " + name + " ") > -1){
					className = className.replace(" " + name + " ", " ");
					className = className.trim();
					className = className.replace(/ +/g, " ");
					el.className = className;
				}
				return this;
			},

			html: function(html){
				var el = this.dom;

				if(typeof html == "string"){
					el.innerHTML = html;
				}else if(html instanceof Array){
					el.innerHTML = html.join("");
				}else{
					return el.innerHTML;
				}
				return this;
			},

			left: function(number){
				var el = this.dom;
				if(typeof(number) == "number"){
					el.style.left = number + "px";
					this.fireEvent("infect", [{ left: number }]);
				}else{
					return this.getPos().x;
				}
				return this;
			},

			top: function(number){
				var el = this.dom;
				if(typeof(number) == "number"){
					el.style.top = number + "px";
					this.fireEvent("infect", [{ top: number }]);
				}else{
					return this.getPos().y;
				}
				return this;
			},

			width: function(unknown){
					var el = this.dom;
				if(typeof unknown == "number"){
					el.style.width = unknown + "px";
					this.fireEvent("infect", [{ width: unknown }]);
				}else if(typeof unknown == "string"){
					el.style.width = unknown;
					this.fireEvent("infect", [{ width: unknown }]);
					}else{
					return this.getSize().width;
					}
					return this;
				},

			height: function(unknown){
					var el = this.dom;
				if(typeof unknown == "number"){
					el.style.height = unknown + "px";
					this.fireEvent("infect", [{ height: unknown }]);
				}else if(typeof unknown == "string"){
					el.style.height = unknown;
					this.fireEvent("infect", [{ height: unknown }]);
					}else{
					return this.getSize().height;
					}
					return this;
				},

			count: function(name){
				return this.countMapping[name] = ++ this.countMapping[name] || 1;
			},

			display: function(bool){
				var dom = this.dom;
				if(typeof(bool) == "boolean"){
					dom.style.display = bool ? "block" : "none";
					this.fireEvent("infect", [{ display: bool }]);
				}else{
					return this.style("display") != "none";
				}
				return this;
			},

			first: function(){
				var c = this.dom.firstChild;
				while(c && !c.tagName && c.nextSibling){
					c = c.nextSibling;
				}
				return c;
			},

			add: function(dom){
				var el;
				el = Ucren.Element(dom);
				this.dom.appendChild(el.dom);
				return this;
			},

			remove: function(dom){
				var el;
				if(dom){
					el = Ucren.Element(dom);
					el.html("");
					this.dom.removeChild(el.dom);
				}else{
					el = Ucren.Element(this.dom.parentNode);
					el.remove(this);
				}
				return this;
			},

			insert: function(dom){
				var tdom;
				tdom = this.dom;
				if(tdom.firstChild){
					tdom.insertBefore(dom, tdom.firstChild);
				}else{
					this.add(dom);
				}
				return this;
			},

			addEvents: function(conf){
				var blank, el, rtn;
				blank = {};
				rtn = {};
				el = this.dom;
				Ucren.each(conf, function(item, key){
					rtn[key] = Ucren.addEvent(el, key, item);
				});
				return rtn;
			},

			removeEvents: function(conf){
				var blank, el;
				blank = {};
				el = this.dom;
				Ucren.each(conf, function(item, key){
					Ucren.delEvent(el, key, item);
				});
				return this;
			},

			getPos: function(){
				var el, parentNode, pos, box, offset;
				el = this.dom;
				pos = {};

				if(el.getBoundingClientRect){
					box = el.getBoundingClientRect();
					offset = Ucren.isIe ? 2 : 0;
					var doc = document;
					var scrollTop = Math.max(doc.documentElement.scrollTop,
						doc.body.scrollTop);
					var scrollLeft = Math.max(doc.documentElement.scrollLeft,
						doc.body.scrollLeft);
					return {
						x: box.left + scrollLeft - offset,
						y: box.top + scrollTop - offset
					};
				}else{
					pos = {
						x: el.offsetLeft,
						y: el.offsetTop
					};
					parentNode = el.offsetParent;
					if(parentNode != el){
						while(parentNode){
							pos.x += parentNode.offsetLeft;
							pos.y += parentNode.offsetTop;
							parentNode = parentNode.offsetParent;
						}
					}
					if(Ucren.isSafari && this.style("position") == "absolute"){ // safari doubles in some cases
						pos.x -= document.body.offsetLeft;
						pos.y -= document.body.offsetTop;
					}
				}

				if(el.parentNode){
					parentNode = el.parentNode;
				}else{
					parentNode = null;
				}

				while(parentNode && parentNode.tagName.toUpperCase() != "BODY" &&
					parentNode.tagName.toUpperCase() != "HTML"){ // account for any scrolled ancestors
					pos.x -= parentNode.scrollLeft;
					pos.y -= parentNode.scrollTop;
					if(parentNode.parentNode){
						parentNode = parentNode.parentNode;
					}else{
						parentNode = null;
					}
				}

				return pos;
			},

			getSize: function(){
				var dom = this.dom;
				var display = this.style("display");

				if (display && display !== "none") {
					return { width: dom.offsetWidth, height: dom.offsetHeight };
					}

				var style = dom.style;
				var originalStyles = {
					visibility: style.visibility,
					position:   style.position,
					display:    style.display
				};

				var newStyles = {
					visibility: "hidden",
					display:    "block"
				};

				if (originalStyles.position !== "fixed")
				  newStyles.position = "absolute";

				this.style(newStyles);

				var dimensions = {
					width:  dom.offsetWidth,
					height: dom.offsetHeight
				};

				this.style(originalStyles);

				return dimensions;
			},

			observe: function(el, fn){
				el = Ucren.Element(el);
				el.on("infect", fn.bind(this));
				return this;
			},

			usePNGbackground: function(image){
				var dom;
				dom = this.dom;
				if(/\.png$/i.test(image) && Ucren.isIe6){
					dom.style.filter =
						"progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
						image + "',sizingMethod='scale');";
					/// 	_background: none;
					///  _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='images/pic.png',sizingMethod='scale');
				}else{
					dom.style.backgroundImage = "url(" + image + ")";
				}
				return this;
			},

			setAlpha: function(){
				var reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/;
				return function(value){
					var element = this.dom, es = element.style;
					if(typeof es.opacity === "string"){
						es.opacity = value;
					}else if(es.filter === "string"){
						if (element.currentStyle && !element.currentStyle.hasLayout)
							es.zoom = 1;

						if (reOpacity.test(es.filter)) {
							value = value >= 99.99 ? "" : ("alpha(opacity=" + value + ")");
							es.filter = es.filter.replace(reOpacity, value);
						} else {
							es.filter += " alpha(opacity=" + value + ")";
						}
					}
					return this;
				};
			}(),

			fadeIn: function(callback){
				if(typeof this.fadingNumber == "undefined")
					this.fadingNumber = 0;
				this.setAlpha(this.fadingNumber);

				var fading = function(){
					this.setAlpha(this.fadingNumber);
					if(this.fadingNumber == 100){
						clearInterval(this.fadingInterval);
						callback && callback();
					}else
						this.fadingNumber += 10;
				}.bind(this);

				this.display(true);
				clearInterval(this.fadingInterval);
				this.fadingInterval = setInterval(fading, Lichee.isIe ? 20 : 30);

				return this;
			},

			fadeOut: function(callback){
				if(typeof this.fadingNumber == "undefined")
					this.fadingNumber = 100;
				this.setAlpha(this.fadingNumber);

				var fading = function(){
					this.setAlpha(this.fadingNumber);
					if(this.fadingNumber == 0){
						clearInterval(this.fadingInterval);
						this.display(false);
						callback && callback();
					}else
						this.fadingNumber -= 10;
				}.bind(this);

				clearInterval(this.fadingInterval);
				this.fadingInterval = setInterval(fading, Lichee.isIe ? 20 : 30);

				return this;
			},

			useMouseAction: function(className, actions){
				/**
				 *  调用示例:  el.useMouseAction("xbutton", "over,out,down,up");
				 *  使用效果:  el 会在 "xbutton xbutton-over","xbutton xbutton-out","xbutton xbutton-down","xbutton xbutton-up"
				 *             等四个 className 中根据相应的鼠标事件来进行切换。
				 *  特别提示:  useMouseAction 可使用不同参数多次调用。
				 */
				if(!this.MouseAction)
					this.MouseAction = new Ucren.MouseAction({ element: this });
				this.MouseAction.use(className, actions);
				return this;
			}
		}
	);

	// Ucren.DataStack
	Ucren.DataStack = Ucren.Class(
		/* constructor */ function(conf){
			conf = Ucren.fixConfig(conf);
			this.fields = conf.fields || [];
			this.records = conf.records || [];
			this.go(0);
		},

		/* methods */ {
			go: function(number){
				this.pointer = Ucren.fixNumber(number, 0);
				this.currentRecord = this.records[this.pointer];
			},

			pos: function(name, value){
				Ucren.each(this.records, function(item, key){
					if(item[name] === value){
						this.go(i);
						return false;
					}
				}.bind(this));
			},

			load: function(records){
				this.records = records || [];
				this.go(0);
			},

			loadFromXml: function(file){
				//todo
			},

			read: function(unknown){
				var type = typeof(unknown);
				switch(type){
					case "number":
						return this.records[unknown];
						break;
					case "string":
						return this.currentRecord[unknown];
						break;
					default:
						return this.currentRecord;
						break;
				}
			},

			append: function(record){
				this.records.push(record);
			},

			insertBefore: function(index, record){
				this.records.splice(index, 0, record);
			},

			del: function(n){
				this.records.splice(n, 1);
				this.go(0);
			},

			edit: function(name, value){
				this.currentRecord[name] = value;
			},

			sortBy: function(name, type){
				type = Ucren.fixString(type, "asc");
				switch(type){
					case "asc":
						this.records.sort(function(a, b){
							return a[name] < b[name] ? -1 : 1;
						});
						break;
					case "desc":
						this.records.sort(function(a, b){
							return a[name] > b[name] ? -1 : 1;
						});
						break;
				}
			},

			count: function(){
				return this.records.length;
			},

			each: function(fn){
				Ucren.each(this.records, fn);
			}
		}
	);

	// Ucren.Timer
	Ucren.Timer = Ucren.Class(
		/* constructor */ function(conf){
			this.time = Ucren.isIe ? conf.time : conf.time * 1.5;
			this.mapping = {};
			this.count = 0;
		},

		/* methods */ {
			add: function(id, fn){
				if(!this.mapping[id])
					this.mapping[id] = fn,
					++ this.count == 1 && this.start();
			},
			remove: function(id){
				if(this.mapping[id])
					delete this.mapping[id],
					-- this.count || this.stop();
			},
			start: function(){
				var callF = function(fn){ fn.call(); };
				var intervalF = function(){ Ucren.each(this.mapping, callF); };
				return function(){
					clearInterval(this.interval);
					this.interval = setInterval(intervalF.bind(this), this.time);
				};
			}(),
			stop: function(){
				clearInterval(this.interval);
			}
		}
	);

	//
	// [基础控件]
	//

	// Ucren.Color
	Ucren.Color = Ucren.Class(
		/* constructor */ function(){},

		/* methods */ {
			setHex: function(value){
				value = Ucren.decodeColor(value);
				this.setRGB(value.red, value.green, value.blue);
				return this;
			},

			getHex: function(){
				return Ucren.encodeColor(this.getRGB());
			},

			setRGB: function(red, green, blue){
				red = Math.min(255, Math.max(0, red));
				green = Math.min(255, Math.max(0, green));
				blue = Math.min(255, Math.max(0, blue));
				this.update((red << 16) | (green << 8 ) | blue);
				return this;
			},

			getRGB: function(){
				return {
					red: this.value >> 16 & 0xFF,
					green: this.value >> 8 & 0xFF,
					blue: this.value & 0xFF
				}
			},

			setHSB: function(hue, sat, bri){
				var rgbInfo = Ucren.Color.HSB2RGB(hue, sat, bri);
				this.setRGB(rgbInfo.red, rgbInfo.green, rgbInfo.blue);
				return this;
			},

			getHSB: function(){
				var rgbInfo = this.getRGB();
				return Ucren.Color.RGB2HSB(rgbInfo.red, rgbInfo.green, rgbInfo.blue);
			},

			transTo: function(targetColor, percent){
				targetColor = (new Ucren.Color).setHex(targetColor);
				var thiz, that, dr, rg, rb;
				thiz = this.getRGB();
				that = targetColor.getRGB();
				return Ucren.encodeColor({
					red: thiz.red + (that.red - thiz.red) * percent,
					green: thiz.green + (that.green - thiz.green) * percent,
					blue: thiz.blue + (that.blue - thiz.blue) * percent
				});
			},

			//privates
			update: function(value){
				this.value = value;
			}
		}
	);

	//private Ucren.Color.HSB2RGB
	Ucren.Color.HSB2RGB = function(hue, sat, bri) {
		hue = hue < 0 ? hue % 360 + 360 : hue >= 360 ? hue % 360 : hue;
		sat = sat < 0 ? 0 : sat > 100 ? 100 : sat;
		bri = bri < 0 ? 0 : bri > 100 ? 100 : bri;

		sat *= 0.01;
		bri *= 0.01;

		if(sat == 0){
			var val = bri * 255;
			return {
				red: val,
				green: val,
				blue: val
			};
		}

		var max = bri * 255;
		var min = max * (1 - sat);
		return this._hMinMax2RGB(hue, min, max);
    };

	//private Ucren.Color.RGB2HSB
	Ucren.Color.RGB2HSB = function(red, green, blue) {
        red = (red < 0)? 0 : (red > 255) ? 255 : Math.round(red);
        green = (green < 0) ? 0 : (green > 255) ? 255 : Math.round(green);
        blue = (blue < 0) ? 0 : (b > 255) ? 255 : Math.round(blue);

        var min = Math.min(red, green, blue);
        var max = Math.max(red, green, blue);
        var sat;

        if(max == 0){
            return {
				hue: 0,
				sat: 0,
				bri: 0
			}
        }else{
            sat = (max - min) / max * 100;
        }

        var bri = max / 255 * 100;

        var hue = this._getHue(red, green, blue, max, min);
        return {
			hue: hue,
			sat: sat,
			bri: bri
		}
    },

	//private Ucren.Color._hMinMax2RGB
	Ucren.Color._hMinMax2RGB = function(h, min, max) {
		var r,g,b;
		var area = Math.floor(h / 60);

		switch (area) {
			case 0:
				r = max;
				//0 - 0, 60-255
				g = min+h * (max-min)/ 60;
				b = min;
				break;
			case 1:
				r = max - (h - 60) * (max - min) / 60;
				g = max;
				b = min;
				break;
			case 2:
				r = min;
				g = max;
				b = min + (h - 120) * (max - min) / 60;
				break;
			case 3:
				r = min;
				g = max - (h - 180) * (max - min) / 60;
				b = max;
				break;
			case 4:
				r = min + (h - 240) * (max - min) / 60;
				g = min;
				b = max;
				break;
			case 5:
				r = max;
				g = min;
				b = max - (h - 300) * (max - min) / 60;
				break;
			case 6:
				r = max;
				//0 - 0, 60-255
				g = min + h  * (max - min) / 60;
				b = min;
				break;
		}

		r = Math.min(255, Math.max(0, Math.round(r)));
		g = Math.min(255, Math.max(0, Math.round(g)));
		b = Math.min(255, Math.max(0, Math.round(b)));

		return {
			red: r,
			green: g,
			blue: b
		};
    };

	//private Ucren.Color._getHue
	Ucren.Color._getHue = function(red, green, blue, max, min) {
		var range = max - min;
		if(range == 0)
			return 0;

		var rr = (max - red);
		var gg = (max - green);
		var bb = (max - blue);

		var h;
		switch(max){
			case red:
				h = bb - gg;
				break;
			case green:
				h = 2 * range + rr - bb;
				break;
			case blue:
				h = 4 * range + gg - rr;
				break;
		}

		h *= -60;
		h /= range;
		h = h < 0 ? h + 360 : h;

		return h;
    };

	// Ucren.ColorTheme (颜色组)
	Ucren.ColorTheme = Ucren.Class(
		/* constructor */ function(conf){
			/// colors mapping:
			/// e.g. { bg1: "#xxx", bg2: "#xxx", ft1: "#xxx", text: "#xxx" }
			this.reference = conf.reference || {};
			this.colors = Ucren.apply(this.reference, {});
		},

		/* methods */ {
			adjustColor: function(colorKey, colorValue){
				/// e.g. adjustColor("bg2", "#xxx")
				var thizColorHSBInfo = (new Ucren.Color).setHex(this.reference[colorKey]).getHSB();
				var targetColorHSBInfo = (new Ucren.Color).setHex(colorValue).getHSB();
				var diffH = targetColorHSBInfo.hue - thizColorHSBInfo.hue;
				var diffS = targetColorHSBInfo.sat - thizColorHSBInfo.sat;
				var diffB = targetColorHSBInfo.bri - thizColorHSBInfo.bri;
				this.update(diffH, diffS, diffB);
			},

			getColor: function(colorKey){
				return this.colors;
			},

			//privates
			update: function(diffH, diffS, diffB){
				Ucren.each(this.colors, function(color, key){
					var c = (new Ucren.Color).setHex(colorValue);
					var ohsb = c.getHSB();
					c.setHSB(ohsb.hue + diffH, ohsb.sat + diffS, ohsb.bri + diffB);
					this[key] = c.getHex();
				}.bind(this.colors));
			}
		}
	);

	/*
	.ucrenlite-basicslippage-layer{
		overflow: hidden;
		line-height: 0;
	}
	.ucrenlite-basicslippage-inner{
		text-decoration: none;
		text-align: center;
		font-size: 14px;
		display: block;
	}
	*/

	// Ucren.BasicSlippage
	Ucren.BasicSlippage = Ucren.Class(
		/* constructor */ function(conf){
			conf = Ucren.fixConfig(conf);
			this.container = Ucren.Element(conf.container);
			this.width = Ucren.fixNumber(conf.width, 16);
			this.height = Ucren.fixNumber(conf.height, 16);
			this.image = conf.image;
			this.length = Ucren.fixNumber(conf.length, 1);
			this.direction = Ucren.fixString(conf.direction, "vertical");
			this.position =
			this.defaultPosition = Ucren.fixNumber(conf.defaultPosition, 0);
			this.reviseOffset = Ucren.fixNumber(conf.reviseOffset, 0);

			this.loadingBackgroundColor = Ucren.fixString(conf.loadingBackgroundColor, "");
			this.loadingColor = Ucren.fixString(conf.loadingColor, "");
			this.loadingText = Ucren.fixString(conf.loadingText, "");

			this.enableAnimation = !! conf.enableAnimation;
			this.animationInterval = Ucren.fixNumber(conf.animationInterval, 100);

			this.isVertical = this.direction == "vertical";
			this.isHorizontal = this.direction == "horizontal";
		},

		/* methods */ {
			render: function(){
				var html, innerWidth, innerHeight;
				this.layerId = Ucren.id();
				this.innerId = Ucren.id();
				if(this.isVertical){
					innerWidth = this.width;
					innerHeight = this.height * this.length;
				}else if(this.isHorizontal){
					innerWidth = this.width * this.length;
					innerHeight = this.height;
				}
				html = Ucren.BasicSlippage.template.apply({
					layerId: this.layerId,
					innerId: this.innerId,
					width: this.width,
					height: this.height,
					innerWidth: innerWidth,
					innerHeight: innerHeight,
					loadingText: this.loadingText
				});
				this.container.html(html);
				this.layer = Ucren.Element(this.layerId);
				this.inner = Ucren.Element(this.innerId);
				this.change(this.defaultPosition);
				this.offset();

				var innerStyle = this.inner.dom.style;
					innerStyle.backgroundColor = this.loadingBackgroundColor;
					innerStyle.color = this.loadingColor;
					innerStyle.lineHeight = this.height + "px";

				this.inner.html(this.loadingText);

				Ucren.loadImage([this.image], function(){
					this.inner.dom.style.backgroundColor = "";
					this.inner.html("");
					this.inner.usePNGbackground(this.image);
				}.bind(this));

				if(this.enableAnimation){
					this.disposeAnimation();
				}
			},

			change: function(number){
				var style;
				style = this.inner.dom.style;
				number = Ucren.fixNumber(number, 0);
				this.position = number;
				if(this.isVertical){
					style.marginTop = - this.height * number + "px";
				}else if(this.isHorizontal){
					style.marginLeft = - this.width * number + "px";
				}
			},

			animationTo: function(number){
				var timer;
				number = Ucren.fixNumber(number, 0);
				timer = this.timer;
				timer.stop();
				this.targetPosition = number;
				timer.start();
			},

			//private
			offset: function(){
				if(!this.reviseOffset){
					return false;
				}
				if(this.isVertical){
					this.inner.width(this.width * (this.reviseOffset + 1));
				}else if(this.isHorizontal){
					this.inner.height(this.height * (this.reviseOffset + 1));
				}
				this.reverseDirection();
				this.change(this.reviseOffset);
				this.reverseDirection();
			},

			//private
			reverseDirection: function(){
				this.isVertical = !this.isVertical;
				this.isHorizontal = !this.isHorizontal;
			},

			//private
			disposeAnimation: function(){
				var timer =
				this.timer = new Ucren.Timer({
					time: this.animationInterval });
				this.targetPosition = 0;
				timer.add(Ucren.id(), function(){
					var position;
					if(this.position < this.targetPosition){
						position = this.position + 1;
					}else if(this.position > this.targetPosition){
						position = this.position - 1;
					}else{
						return this.timer.stop();
					}
					this.change(position);
				}.bind(this));
			}
		}
	);

	Ucren.BasicSlippage.template = new Ucren.Template(
		"<div id='@{layerId}' class='ucrenlite-basicslippage-layer' ",
		"style='width: @{width}px; height: @{height}px;'>",
			"<a id='@{innerId}' class='ucrenlite-basicslippage-inner' href='ucren:' onclick='return false;' hidefocus='hidefocus' onfocus='this.blur();' ",
			"style='width: @{innerWidth}px; height: @{innerHeight}px;'>",
				"@{loadingText}",
			"</a>",
		"</div>");

	// Ucren.MouseAction (for Ucren.BasicElement)
	Ucren.MouseAction = Ucren.Class(
		/* constructor */ function(conf){
			conf = Ucren.fixConfig(conf);
			this.element = Ucren.Element(conf.element);
			this.setup();
		},

		/* methods */ {
			use: function(className, actions){
				this.className = className;

				this.actions = {};
				if(actions){
					Ucren.each(actions.split(","), function(value){
						this[value] = true;
					}.bind(this.actions));
				}

				this.element.setClass(this.className);
				if(this.lastActionName)
					this.actionEvents["mouse" + this.lastActionName]();
			},

			//private
			setup: function(){
				var actionEvent = function(actionName){
					return function(){
						if(this.actions[actionName]){
							if(actionName == "out"){
								this.element.setClass(this.className);
							}else{
								if(actionName == "up")
									actionName = "over";
								this.element.setClass(this.className + " " +
									this.className + "-" + actionName);
							}
						}
						this.lastActionName = actionName;
					};
				};

				this.actionEvents = {
					mouseover: actionEvent("over").bind(this),
					mouseout: actionEvent("out").bind(this),
					mousedown: actionEvent("down").bind(this),
					mouseup: actionEvent("up").bind(this)
				};
				this.element.addEvents(this.actionEvents);
			}
		}
	);

	// Ucren.queryElement
	Ucren.queryElement = function(){

		var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|[\'\"][^\'\"]*[\'\"]|[^\[\]\'\"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
			done = 0,
			toString = Object.prototype.toString,
			hasDuplicate = false,
			baseHasDuplicate = true;

		[0, 0].sort(function(){
			baseHasDuplicate = false;
			return 0;
		});

		var Sizzle = function(selector, context, results, seed) {
			results = results || [];
			context = context || document;

			var origContext = context;

			if(context.nodeType !== 1 && context.nodeType !== 9){
				return [];
			}

			if(!selector || typeof selector !== "string"){
				return results;
			}

			var parts = [], m, set, checkSet, extra, prune = true, contextXML = Sizzle.isXML(context),
				soFar = selector, ret, cur, pop, i;

			do {
				chunker.exec("");
				m = chunker.exec(soFar);

				if(m){
					soFar = m[3];

					parts.push(m[1]);

					if(m[2]){
						extra = m[3];
						break;
					}
				}
			} while(m);

			if(parts.length > 1 && origPOS.exec(selector)){
				if(parts.length === 2 && Expr.relative[ parts[0] ]){
					set = posProcess(parts[0] + parts[1], context);
				} else {
					set = Expr.relative[ parts[0] ] ?
						[ context ] :
						Sizzle(parts.shift(), context);

					while(parts.length){
						selector = parts.shift();

						if(Expr.relative[ selector ]){
							selector += parts.shift();
						}

						set = posProcess(selector, set);
					}
				}
			} else {
				if(!seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
						Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1])){
					ret = Sizzle.find(parts.shift(), context, contextXML);
					context = ret.expr ? Sizzle.filter(ret.expr, ret.set)[0] : ret.set[0];
				}

				if(context){
					ret = seed ?
						{ expr: parts.pop(), set: makeArray(seed) } :
						Sizzle.find(parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML);
					set = ret.expr ? Sizzle.filter(ret.expr, ret.set) : ret.set;

					if(parts.length > 0){
						checkSet = makeArray(set);
					} else {
						prune = false;
					}

					while(parts.length){
						cur = parts.pop();
						pop = cur;

						if(!Expr.relative[ cur ]){
							cur = "";
						} else {
							pop = parts.pop();
						}

						if(pop == null){
							pop = context;
						}

						Expr.relative[ cur ](checkSet, pop, contextXML);
					}
				} else {
					checkSet = parts = [];
				}
			}

			if(!checkSet){
				checkSet = set;
			}

			if(!checkSet){
				Sizzle.error(cur || selector);
			}

			if(toString.call(checkSet) === "[object Array]"){
				if(!prune){
					results.push.apply(results, checkSet);
				} else if(context && context.nodeType === 1){
					for(i = 0; checkSet[i] != null; i ++){
						if(checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i]))){
							results.push(set[i]);
						}
					}
				} else {
					for(i = 0; checkSet[i] != null; i ++){
						if(checkSet[i] && checkSet[i].nodeType === 1){
							results.push(set[i]);
						}
					}
				}
			} else {
				makeArray(checkSet, results);
			}

			if(extra){
				Sizzle(extra, origContext, results, seed);
				Sizzle.uniqueSort(results);
			}

			return results;
		};

		Sizzle.uniqueSort = function(results){
			if(sortOrder){
				hasDuplicate = baseHasDuplicate;
				results.sort(sortOrder);

				if(hasDuplicate){
					for(var i = 1; i < results.length; i ++){
						if(results[i] === results[i-1]){
							results.splice(i--, 1);
						}
					}
				}
			}

			return results;
		};

		Sizzle.matches = function(expr, set){
			return Sizzle(expr, null, null, set);
		};

		Sizzle.find = function(expr, context, isXML){
			var set;

			if(!expr){
				return [];
			}

			for(var i = 0, l = Expr.order.length; i < l; i ++){
				var type = Expr.order[i], match;

				if((match = Expr.leftMatch[ type ].exec(expr))){
					var left = match[1];
					match.splice(1,1);

					if(left.substr(left.length - 1) !== "\\"){
						match[1] = (match[1] || "").replace(/\\/g, "");
						set = Expr.find[ type ](match, context, isXML);
						if(set != null){
							expr = expr.replace(Expr.match[ type ], "");
							break;
						}
					}
				}
			}

			if(!set){
				set = context.getElementsByTagName("*");
			}

			return {set: set, expr: expr};
		};

		Sizzle.filter = function(expr, set, inplace, not){
			var old = expr, result = [], curLoop = set, match, anyFound,
				isXMLFilter = set && set[0] && Sizzle.isXML(set[0]);

			while(expr && set.length){
				for(var type in Expr.filter){
					if((match = Expr.leftMatch[ type ].exec(expr)) != null && match[2]){
						var filter = Expr.filter[ type ], found, item, left = match[1];
						anyFound = false;

						match.splice(1,1);

						if(left.substr(left.length - 1) === "\\"){
							continue;
						}

						if(curLoop === result){
							result = [];
						}

						if(Expr.preFilter[ type ]){
							match = Expr.preFilter[ type ](match, curLoop, inplace, result, not, isXMLFilter);

							if(!match){
								anyFound = found = true;
							} else if(match === true){
								continue;
							}
						}

						if(match){
							for(var i = 0; (item = curLoop[i]) != null; i ++){
								if(item){
									found = filter(item, match, i, curLoop);
									var pass = not ^ !!found;

									if(inplace && found != null){
										if(pass){
											anyFound = true;
										} else {
											curLoop[i] = false;
										}
									} else if(pass){
										result.push(item);
										anyFound = true;
									}
								}
							}
						}

						if(found !== undefined){
							if(!inplace){
								curLoop = result;
							}

							expr = expr.replace(Expr.match[ type ], "");

							if(!anyFound){
								return [];
							}

							break;
						}
					}
				}

				if(expr === old){
					if(anyFound == null){
						Sizzle.error(expr);
					} else {
						break;
					}
				}

				old = expr;
			}

			return curLoop;
		};

		Sizzle.error = function(msg){
			throw "Syntax error, unrecognized expression: " + msg;
		};

		var Expr = Sizzle.selectors = {
			order: [ "ID", "NAME", "TAG" ],
			match: {
				ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
				CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
				NAME: /\[name=[\'\"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)[\'\"]*\]/,
				ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*([\'\"]*)(.*?)\3|)\s*\]/,
				TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
				CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,
				POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
				PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\(([\'\"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
			},
			leftMatch: {},
			attrMap: {
				"class": "className",
				"for": "htmlFor"
			},
			attrHandle: {
				href: function(elem){
					return elem.getAttribute("href");
				}
			},
			relative: {
				"+": function(checkSet, part){
					var isPartStr = typeof part === "string",
						isTag = isPartStr && !/\W/.test(part),
						isPartStrNotTag = isPartStr && !isTag;

					if(isTag){
						part = part.toLowerCase();
					}

					for(var i = 0, l = checkSet.length, elem; i < l; i ++){
						if((elem = checkSet[i])){
							while((elem = elem.previousSibling) && elem.nodeType !== 1){}

							checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
								elem || false :
								elem === part;
						}
					}

					if(isPartStrNotTag){
						Sizzle.filter(part, checkSet, true);
					}
				},
				">": function(checkSet, part){
					var isPartStr = typeof part === "string",
						elem, i = 0, l = checkSet.length;

					if(isPartStr && !/\W/.test(part)){
						part = part.toLowerCase();

						for(; i < l; i ++){
							elem = checkSet[i];
							if(elem){
								var parent = elem.parentNode;
								checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
							}
						}
					} else {
						for(; i < l; i ++){
							elem = checkSet[i];
							if(elem){
								checkSet[i] = isPartStr ?
									elem.parentNode :
									elem.parentNode === part;
							}
						}

						if(isPartStr){
							Sizzle.filter(part, checkSet, true);
						}
					}
				},
				"": function(checkSet, part, isXML){
					var doneName = done++, checkFn = dirCheck, nodeCheck;

					if(typeof part === "string" && !/\W/.test(part)){
						part = part.toLowerCase();
						nodeCheck = part;
						checkFn = dirNodeCheck;
					}

					checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
				},
				"~": function(checkSet, part, isXML){
					var doneName = done++, checkFn = dirCheck, nodeCheck;

					if(typeof part === "string" && !/\W/.test(part)){
						part = part.toLowerCase();
						nodeCheck = part;
						checkFn = dirNodeCheck;
					}

					checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
				}
			},
			find: {
				ID: function(match, context, isXML){
					if(typeof context.getElementById !== "undefined" && !isXML){
						var m = context.getElementById(match[1]);
						return m ? [m] : [];
					}
				},
				NAME: function(match, context){
					if(typeof context.getElementsByName !== "undefined"){
						var ret = [], results = context.getElementsByName(match[1]);

						for(var i = 0, l = results.length; i < l; i ++){
							if(results[i].getAttribute("name") === match[1]){
								ret.push(results[i]);
							}
						}

						return ret.length === 0 ? null : ret;
					}
				},
				TAG: function(match, context){
					return context.getElementsByTagName(match[1]);
				}
			},
			preFilter: {
				CLASS: function(match, curLoop, inplace, result, not, isXML){
					match = " " + match[1].replace(/\\/g, "") + " ";

					if(isXML){
						return match;
					}

					for(var i = 0, elem; (elem = curLoop[i]) != null; i ++){
						if(elem){
							if(not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0)){
								if(!inplace){
									result.push(elem);
								}
							} else if(inplace){
								curLoop[i] = false;
							}
						}
					}

					return false;
				},
				ID: function(match){
					return match[1].replace(/\\/g, "");
				},
				TAG: function(match, curLoop){
					return match[1].toLowerCase();
				},
				CHILD: function(match){
					if(match[1] === "nth"){
						var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
							match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
							!/\D/.test(match[2]) && "0n+" + match[2] || match[2]);
						match[2] = (test[1] + (test[2] || 1)) - 0;
						match[3] = test[3] - 0;
					}

					match[0] = done++;

					return match;
				},
				ATTR: function(match, curLoop, inplace, result, not, isXML){
					var name = match[1].replace(/\\/g, "");

					if(!isXML && Expr.attrMap[name]){
						match[1] = Expr.attrMap[name];
					}

					if(match[2] === "~="){
						match[4] = " " + match[4] + " ";
					}

					return match;
				},
				PSEUDO: function(match, curLoop, inplace, result, not){
					if(match[1] === "not"){
						if((chunker.exec(match[3]) || "").length > 1 || /^\w/.test(match[3])){
							match[3] = Sizzle(match[3], null, null, curLoop);
						} else {
							var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
							if(!inplace){
								result.push.apply(result, ret);
							}
							return false;
						}
					} else if(Expr.match.POS.test(match[0]) || Expr.match.CHILD.test(match[0])){
						return true;
					}

					return match;
				},
				POS: function(match){
					match.unshift(true);
					return match;
				}
			},
			filters: {
				enabled: function(elem){
					return elem.disabled === false && elem.type !== "hidden";
				},
				disabled: function(elem){
					return elem.disabled === true;
				},
				checked: function(elem){
					return elem.checked === true;
				},
				selected: function(elem){
					elem.parentNode.selectedIndex;
					return elem.selected === true;
				},
				parent: function(elem){
					return !!elem.firstChild;
				},
				empty: function(elem){
					return !elem.firstChild;
				},
				has: function(elem, i, match){
					return !!Sizzle(match[3], elem).length;
				},
				header: function(elem){
					return (/h\d/i).test(elem.nodeName);
				},
				text: function(elem){
					return "text" === elem.type;
				},
				radio: function(elem){
					return "radio" === elem.type;
				},
				checkbox: function(elem){
					return "checkbox" === elem.type;
				},
				file: function(elem){
					return "file" === elem.type;
				},
				password: function(elem){
					return "password" === elem.type;
				},
				submit: function(elem){
					return "submit" === elem.type;
				},
				image: function(elem){
					return "image" === elem.type;
				},
				reset: function(elem){
					return "reset" === elem.type;
				},
				button: function(elem){
					return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
				},
				input: function(elem){
					return (/input|select|textarea|button/i).test(elem.nodeName);
				}
			},
			setFilters: {
				first: function(elem, i){
					return i === 0;
				},
				last: function(elem, i, match, array){
					return i === array.length - 1;
				},
				even: function(elem, i){
					return i % 2 === 0;
				},
				odd: function(elem, i){
					return i % 2 === 1;
				},
				lt: function(elem, i, match){
					return i < match[3] - 0;
				},
				gt: function(elem, i, match){
					return i > match[3] - 0;
				},
				nth: function(elem, i, match){
					return match[3] - 0 === i;
				},
				eq: function(elem, i, match){
					return match[3] - 0 === i;
				}
			},
			filter: {
				PSEUDO: function(elem, match, i, array){
					var name = match[1], filter = Expr.filters[ name ];

					if(filter){
						return filter(elem, i, match, array);
					} else if(name === "contains"){
						return (elem.textContent || elem.innerText || Sizzle.getText([ elem ]) || "").indexOf(match[3]) >= 0;
					} else if(name === "not"){
						var not = match[3];

						for(var j = 0, l = not.length; j < l; j++){
							if(not[j] === elem){
								return false;
							}
						}

						return true;
					} else {
						Sizzle.error("Syntax error, unrecognized expression: " + name);
					}
				},
				CHILD: function(elem, match){
					var type = match[1], node = elem;
					switch (type) {
						case 'only':
						case 'first':
							while((node = node.previousSibling))	 {
								if(node.nodeType === 1){
									return false;
								}
							}
							if(type === "first"){
								return true;
							}
							node = elem;
						case 'last':
							while((node = node.nextSibling))	 {
								if(node.nodeType === 1){
									return false;
								}
							}
							return true;
						case 'nth':
							var first = match[2], last = match[3];

							if(first === 1 && last === 0){
								return true;
							}

							var doneName = match[0],
								parent = elem.parentNode;

							if(parent && (parent.sizcache !== doneName || !elem.nodeIndex)){
								var count = 0;
								for(node = parent.firstChild; node; node = node.nextSibling){
									if(node.nodeType === 1){
										node.nodeIndex = ++count;
									}
								}
								parent.sizcache = doneName;
							}

							var diff = elem.nodeIndex - last;
							if(first === 0){
								return diff === 0;
							} else {
								return (diff % first === 0 && diff / first >= 0);
							}
					}
				},
				ID: function(elem, match){
					return elem.nodeType === 1 && elem.getAttribute("id") === match;
				},
				TAG: function(elem, match){
					return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
				},
				CLASS: function(elem, match){
					return (" " + (elem.className || elem.getAttribute("class")) + " ")
						.indexOf(match) > -1;
				},
				ATTR: function(elem, match){
					var name = match[1],
						result = Expr.attrHandle[ name ] ?
							Expr.attrHandle[ name ](elem) :
							elem[ name ] != null ?
								elem[ name ] :
								elem.getAttribute(name),
						value = result + "",
						type = match[2],
						check = match[4];

					return result == null ?
						type === "!=" :
						type === "=" ?
						value === check :
						type === "*=" ?
						value.indexOf(check) >= 0 :
						type === "~=" ?
						(" " + value + " ").indexOf(check) >= 0 :
						!check ?
						value && result !== false :
						type === "!=" ?
						value !== check :
						type === "^=" ?
						value.indexOf(check) === 0 :
						type === "$=" ?
						value.substr(value.length - check.length) === check :
						type === "|=" ?
						value === check || value.substr(0, check.length + 1) === check + "-" :
						false;
				},
				POS: function(elem, match, i, array){
					var name = match[2], filter = Expr.setFilters[ name ];

					if(filter){
						return filter(elem, i, match, array);
					}
				}
			}
		};

		var origPOS = Expr.match.POS,
			fescape = function(all, num){
				return "\\" + (num - 0 + 1);
			};

		for(var type in Expr.match){
			Expr.match[ type ] = new RegExp(Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source));
			Expr.leftMatch[ type ] = new RegExp(/(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape));
		}

		var makeArray = function(array, results) {
			array = Array.prototype.slice.call(array, 0);

			if(results){
				results.push.apply(results, array);
				return results;
			}

			return array;
		};

		try {
			Array.prototype.slice.call(document.documentElement.childNodes, 0)[0].nodeType;
		} catch(e){
			makeArray = function(array, results) {
				var ret = results || [], i = 0;

				if(toString.call(array) === "[object Array]"){
					Array.prototype.push.apply(ret, array);
				} else {
					if(typeof array.length === "number"){
						for(var l = array.length; i < l; i ++){
							ret.push(array[i]);
						}
					} else {
						for(; array[i]; i ++){
							ret.push(array[i]);
						}
					}
				}

				return ret;
			};
		}

		var sortOrder;

		if(document.documentElement.compareDocumentPosition){
			sortOrder = function(a, b){
				if(!a.compareDocumentPosition || !b.compareDocumentPosition){
					if(a == b){
						hasDuplicate = true;
					}
					return a.compareDocumentPosition ? -1 : 1;
				}

				var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
				if(ret === 0){
					hasDuplicate = true;
				}
				return ret;
			};
		} else if("sourceIndex" in document.documentElement){
			sortOrder = function(a, b){
				if(!a.sourceIndex || !b.sourceIndex){
					if(a == b){
						hasDuplicate = true;
					}
					return a.sourceIndex ? -1 : 1;
				}

				var ret = a.sourceIndex - b.sourceIndex;
				if(ret === 0){
					hasDuplicate = true;
				}
				return ret;
			};
		} else if(document.createRange){
			sortOrder = function(a, b){
				if(!a.ownerDocument || !b.ownerDocument){
					if(a == b){
						hasDuplicate = true;
					}
					return a.ownerDocument ? -1 : 1;
				}

				var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
				aRange.setStart(a, 0);
				aRange.setEnd(a, 0);
				bRange.setStart(b, 0);
				bRange.setEnd(b, 0);
				var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
				if(ret === 0){
					hasDuplicate = true;
				}
				return ret;
			};
		}

		Sizzle.getText = function(elems){
			var ret = "", elem;

			for(var i = 0; elems[i]; i ++){
				elem = elems[i];

				if(elem.nodeType === 3 || elem.nodeType === 4){
					ret += elem.nodeValue;

				} else if(elem.nodeType !== 8){
					ret += Sizzle.getText(elem.childNodes);
				}
			}

			return ret;
		};

		(function(){
			var form = document.createElement("div"),
				id = "script" + (new Date()).getTime();
			form.innerHTML = "<a name='" + id + "'/>";

			var root = document.documentElement;
			root.insertBefore(form, root.firstChild);

			if(document.getElementById(id)){
				Expr.find.ID = function(match, context, isXML){
					if(typeof context.getElementById !== "undefined" && !isXML){
						var m = context.getElementById(match[1]);
						return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
					}
				};

				Expr.filter.ID = function(elem, match){
					var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
					return elem.nodeType === 1 && node && node.nodeValue === match;
				};
			}

			root.removeChild(form);
			root = form = null; // release memory in IE
		})();

		(function(){
			var div = document.createElement("div");
			div.appendChild(document.createComment(""));

			if(div.getElementsByTagName("*").length > 0){
				Expr.find.TAG = function(match, context){
					var results = context.getElementsByTagName(match[1]);

					if(match[1] === "*"){
						var tmp = [];

						for(var i = 0; results[i]; i ++){
							if(results[i].nodeType === 1){
								tmp.push(results[i]);
							}
						}

						results = tmp;
					}

					return results;
				};
			}

			div.innerHTML = "<a href='#'></a>";
			if(div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
					div.firstChild.getAttribute("href") !== "#"){
				Expr.attrHandle.href = function(elem){
					return elem.getAttribute("href", 2);
				};
			}

			div = null; // release memory in IE
		})();

		if(document.querySelectorAll){
			(function(){
				var oldSizzle = Sizzle, div = document.createElement("div");
				div.innerHTML = "<p class='TEST'></p>";

				if(div.querySelectorAll && div.querySelectorAll(".TEST").length === 0){
					return;
				}

				Sizzle = function(query, context, extra, seed){
					context = context || document;

					if(!seed && context.nodeType === 9 && !Sizzle.isXML(context)){
						try {
							return makeArray(context.querySelectorAll(query), extra);
						} catch(e){}
					}

					return oldSizzle(query, context, extra, seed);
				};

				for(var prop in oldSizzle){
					Sizzle[ prop ] = oldSizzle[ prop ];
				}

				div = null; // release memory in IE
			})();
		}

		(function(){
			var div = document.createElement("div");

			div.innerHTML = "<div class='test e'></div><div class='test'></div>";

			if(!div.getElementsByClassName || div.getElementsByClassName("e").length === 0){
				return;
			}

			div.lastChild.className = "e";

			if(div.getElementsByClassName("e").length === 1){
				return;
			}

			Expr.order.splice(1, 0, "CLASS");
			Expr.find.CLASS = function(match, context, isXML) {
				if(typeof context.getElementsByClassName !== "undefined" && !isXML){
					return context.getElementsByClassName(match[1]);
				}
			};

			div = null; // release memory in IE
		})();

		function dirNodeCheck(dir, cur, doneName, checkSet, nodeCheck, isXML){
			for(var i = 0, l = checkSet.length; i < l; i ++){
				var elem = checkSet[i];
				if(elem){
					elem = elem[dir];
					var match = false;

					while(elem){
						if(elem.sizcache === doneName){
							match = checkSet[elem.sizset];
							break;
						}

						if(elem.nodeType === 1 && !isXML){
							elem.sizcache = doneName;
							elem.sizset = i;
						}

						if(elem.nodeName.toLowerCase() === cur){
							match = elem;
							break;
						}

						elem = elem[dir];
					}

					checkSet[i] = match;
				}
			}
		}

		function dirCheck(dir, cur, doneName, checkSet, nodeCheck, isXML){
			for(var i = 0, l = checkSet.length; i < l; i ++){
				var elem = checkSet[i];
				if(elem){
					elem = elem[dir];
					var match = false;

					while(elem){
						if(elem.sizcache === doneName){
							match = checkSet[elem.sizset];
							break;
						}

						if(elem.nodeType === 1){
							if(!isXML){
								elem.sizcache = doneName;
								elem.sizset = i;
							}
							if(typeof cur !== "string"){
								if(elem === cur){
									match = true;
									break;
								}

							} else if(Sizzle.filter(cur, [elem]).length > 0){
								match = elem;
								break;
							}
						}

						elem = elem[dir];
					}

					checkSet[i] = match;
				}
			}
		}

		Sizzle.contains = document.compareDocumentPosition ? function(a, b){
			return !!(a.compareDocumentPosition(b) & 16);
		} : function(a, b){
			return a !== b && (a.contains ? a.contains(b) : true);
		};

		Sizzle.isXML = function(elem){
			var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
			return documentElement ? documentElement.nodeName !== "HTML" : false;
		};

		var posProcess = function(selector, context){
			var tmpSet = [], later = "", match,
				root = context.nodeType ? [context] : context;

			while((match = Expr.match.PSEUDO.exec(selector))){
				later += match[0];
				selector = selector.replace(Expr.match.PSEUDO, "");
			}

			selector = Expr.relative[selector] ? selector + "*" : selector;

			for(var i = 0, l = root.length; i < l; i ++){
				Sizzle(selector, root[i], tmpSet);
			}

			return Sizzle.filter(later, tmpSet);
		};

		return Sizzle;
	}();


	// Ucren.initialize
	//Ucren.initialize = function(){
	//	var encode = function(str){W
	//		var re = "", c, lc = 0;
	//		Ucren.each(str, function(value){
	//			c = value.charCodeAt(0);
	//			re += Math.abs(lc - c);
	//			lc = c;
	//		});
	//		return re;
	//	};
	//
	//	var nul = function(){
	//		// todo
	//	};
	//
	//	var obj = {};
	//
	//	if(encode(location.href).indexOf("18151396453122") == -1){
	//		Ucren.each(Ucren, function(value, key){
	//			switch(typeof(value)){
	//				case "function":
	//					Ucren[key] = nul;
	//					break;
	//				case "object":
	//					Ucren[key] = obj;
	//					break;
	//				case "number":
	//					Ucren[key] = 0;
	//					break;
	//				case "string":
	//					Ucren[key] = "";
	//					break;
	//			}
	//		});
	//	}
	//}();

	//
	// [数据操作相关]
	//

	// Ucren.JSON
	Ucren.JSON = new function(){
		var useHasOwn = {}.hasOwnProperty ? true : false;

		var pad = function(n) {
			return n < 10 ? "0" + n : n;
		};

		var m = {
			"\b": '\\b',
			"\t": '\\t',
			"\n": '\\n',
			"\f": '\\f',
			"\r": '\\r',
			'"' : '\\"',
			"\\": '\\\\'
		};

		var encodeString = function(s){
			if(/[\"\\\x00-\x1f]/.test(s)) {
				return '"' + s.replace(/([\x00-\x1f\\\"])/g, function(a, b) {
					var c = m[b];
					if(c){
						return c;
					}
					c = b.charCodeAt();
					return "\\u00" +
						Math.floor(c / 16).toString(16) +
						(c % 16).toString(16);
				}) + '"';
			}
			return '"' + s + '"';
		};

		var encodeArray = function(o){
			var a = ["["], b, i, l = o.length, v;
				for(i = 0; i < l; i += 1) {
					v = o[i];
					switch (typeof v) {
						case "undefined":
						case "function":
						case "unknown":
							break;
						default:
							if(b) {
								a.push(',');
							}
							a.push(v === null ? "null" : Ucren.JSON.encode(v));
							b = true;
					}
				}
				a.push("]");
				return a.join("");
		};

		var encodeDate = function(o){
			return '"' + o.getFullYear() + "-" +
					pad(o.getMonth() + 1) + "-" +
					pad(o.getDate()) + "T" +
					pad(o.getHours()) + ":" +
					pad(o.getMinutes()) + ":" +
					pad(o.getSeconds()) + '"';
		};

		this.encode = function(o){
			if(typeof o == "undefined" || o === null){
				return "null";
			}else if(o instanceof Array){
				return encodeArray(o);
			}else if(o instanceof Date){
				return encodeDate(o);
			}else if(typeof o == "string"){
				return encodeString(o);
			}else if(typeof o == "number"){
				return isFinite(o) ? String(o) : "null";
			}else if(typeof o == "boolean"){
				return String(o);
			}else {
				var a = ["{"], b, i, v;
				for(i in o) {
					if(!useHasOwn || o.hasOwnProperty(i)) {
						v = o[i];
						switch (typeof v) {
						case "undefined":
						case "function":
						case "unknown":
							break;
						default:
							if(b){
								a.push(',');
							}
							a.push(this.encode(i), ":",
									v === null ? "null" : this.encode(v));
							b = true;
						}
					}
				}
				a.push("}");
				return a.join("");
			}
		};

		this.decode = function(json){
			return eval("(" + json + ')');
		};
	};

	if(Ucren.isIe)
		document.execCommand("BackgroundImageCache", false, true);

	return Ucren;
});
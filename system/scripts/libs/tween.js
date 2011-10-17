/**
 * json
 * filename: tween.js
 * author: dron
 * date: 2011-05-19
 */

module.declare(function(require, exports, module){
	var Ucren = require("./ucren");

	var exponential = function(index, offset, target, framesNum){
		if(index == 0)
			return offset;
		else if(index == framesNum)
			return offset + target;
		else if((index /= framesNum / 2) < 1)
			return target / 2 * Math.pow(2, 10 * (index - 1)) + offset;
		else
			return target / 2 * (-Math.pow(2, -10 * -- index) + 2) + offset;
	};

	var elasticOut = function(index, offset, target, framesNum, a, p){
		var s;
		if(index == 0)
			return offset;
		else if((index /= framesNum) == 1)
			return offset + target;

		if(!p)
			p = framesNum * .3;

		if(!a || a < Math.abs(target)){
			a = target;
			s = p / 4;
		}else
			s = p / (2 * Math.PI) * Math.asin(target / a);

		return a * Math.pow(2, -10 * index) * Math.sin((index * framesNum - s) * (2 * Math.PI) / p) + target + offset;
	};

	exports.snail = function(snailFn, start, end, framesNum, framesIntervalTime, frameCallback, endCallback){
		snailFn = this.getSnailFn(snailFn);
		framesIntervalTime = framesIntervalTime || 20;
		var moving = function(index){
			frameCallback(snailFn(index, start, end - start, framesNum));
			if(index == framesNum)
				endCallback && endCallback();
		}.infrequently(Ucren.isIe ? framesIntervalTime : framesIntervalTime * 1.5);
		for(var index = 0; index <= framesNum; index ++)
			moving(index);
		return moving;
	};

	exports.getSnailFn = function(unknown){
		if(typeof unknown == "function")
			return unknown;
		else if(typeof unknown == "string")
			return eval(unknown);
	};
});
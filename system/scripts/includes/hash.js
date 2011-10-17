/**
 * 用于监控地址栏 hash 值变化
 * 建议用编译环境的 include 语法来包含此函数
 * filename: hash.js
 * author: dron
 * date: 2011-6-19
 * contact: ucren.com
 */
function hash(unknown, callback){
	var f;
	if(unknown instanceof RegExp){
		f = function(h){
			if(unknown.test(h))
				callback(h, RegExp.$1, RegExp.$2, RegExp.$3);
		}
	}else if(typeof unknown == "string"){
		f = function(h){
			if(h == unknown)
				callback(h);
		}
	}

	hash.callbacks.push(f);
	if(!hash.interval)
		hash.interval = setInterval(hash.intervalFunction, 100);
}

hash.callbacks = [];
hash.lastHash = "";
hash.interval = null;
hash.intervalFunction = function(){
	if(location.hash != hash.lastHash){
		var h = hash.lastHash = location.hash, cbs = hash.callbacks;
		if(/^#(.*)$/.test(h)){
			h = RegExp.$1;
		}
		for(var i = 0, r, l = cbs.length; i < l; i ++){
			cbs[i].call(null, h);
		}
	}
};
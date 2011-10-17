module.declare(function(require, exports, module){

	// states
	var states = {
		installed: false,
		started: false
	};

	// defined exports
	exports.install = function(){
		if(states.installed)
			return ;
		states.installed = true;
		// your code
	};

	exports.uninstall = function(){
		if(!states.installed)
			return ;
		states.installed = false;
		// your code
	};

	exports.start = function(){
		if(states.started)
			return ;
		states.started = true;
		// your code
	};

	exports.stop = function(){
		if(!states.started)
			return ;
		states.started = false;
		// your code
	};
});
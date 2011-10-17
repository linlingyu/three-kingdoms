module.declare(function(require, exports, module){
	var observe = require("./observe");

/*
	// example:
	page.adjust({
		"#page": {
			width: "$.width",
			height: "$.height"
		},
		"#menu": {
			width: "200",
			height: "$.height"
		},
		"#container": {
			width: "$.width - 200",
			height: "$.height"
		}
	});
 */

	exports.adjust = function(mapping){
		observe.parse(mapping);
	};
});
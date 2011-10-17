/**
 * 用于准备页面图片时显示 loading
 * 建议用编译环境的 include 语法来包含此函数
 * filename: loading.js
 * author: dron
 * date: 2011-5-26
 * contact: ucren.com
 */
function loading(imgs, callback){
	FlyScript.load("scripts/libs/spinner", "scripts/libs/ucren", function(spinner, Ucren){
		var showDefer = spinner.show.defer(spinner, 100);
		var fn = function(){
			clearTimeout(showDefer);
			callback && callback();
			spinner.hide.defer(spinner, 1000); };
		Ucren.loadImage(imgs, fn);
	});
}
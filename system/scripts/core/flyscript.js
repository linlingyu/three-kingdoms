/*

FlyScript 1.0.0 - A CommonJS Module Loader
Copyright (c) 2011 Kevin H. Smith (http://www.flyscript.org)
Licensed under the MIT license.

Credits:  Much of this work was pioneered by James Burke with RequireJS.
Kris Zyp came up with the algorithm to figure out what the current script
tag is for a given function call.  Everyone on the CommonJS mailing list
is awesome.

*/
function FlyScript_NO_OP() {} // Avoid closing over any state

(function(GLOBAL) {
"use strict";


// =========
// CONSTANTS
// =========


var UNDEF,
	NO_OP = FlyScript_NO_OP,
	READY_STATE = "loaded|complete",
	PKG_MODULE = "package.json",
	ROOT_KEY = "/:ROOT:/",
	TEST_INTERACTIVE = !GLOBAL.addEventListener,
	ENUM_BUG = (function() { var o = { constructor: 1 }; for (var i in o) return false; return true; })(),
	TRIM_RE = /^\s+|(\.js)?\s*$/gi,
	ROOT_RE = /^\/:ROOT:\//,
	PROTOCOL_RE = /^[a-z]+:\/\//i,
	REQUIRE_RE = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|[;=(,:!^]\s*\/(?:\\.|[^\/\\])+\/|(?:^|\W)\s*require\s*\(\s*("[^"\\]*"|'[^'\\]*')\s*\)/g;


// ============
// SHARED STATE
// ============


var _mountDir = {},
	_mountID = {},
	_homeFile = location.pathname,
	_homeDir = dir(_homeFile),
	_scriptRoot = _homeDir,
	_noCache = false,
	_scriptTimeout = 10000,
	_head = null;


// =========
// UTILITIES
// =========


// Determines whether an object contains a key
function has(obj, k)
{
	return Object.prototype.hasOwnProperty.call(obj, k);
}

// Enumerates object properties
function each(obj, fn)
{
	var i, op = Object.prototype;

	if (!obj)
		return;

	for (i in obj)
		if (!ENUM_BUG || op[i] === UNDEF)
			if (fn.call(obj, i, obj[i]) === false) return;

	if (ENUM_BUG) for (i in op)
		if (has(obj, i) || obj[i] !== op[i])
			if (fn.call(obj, i, obj[i]) === false) return;
}

// Finds the longest matching property name in a hash
function matchProp(obj, str)
{
	var p = null;

	if (has(obj, str))
		return str;

	if (str) each(obj, function(k)
	{
		if (str.indexOf(k) === 0 && (p === null || k.length > p.length))
			p = k;
	});

	return p;
}

// Calls a function asap in a future turn
function asap(fn) { return setTimeout(fn, 10); }

// Returns true if a string ends with the specified value
function endsWith(s, t) { return s.slice(-t.length) === t; }

// Type-testing functions
function isStr(x) { return x && typeof x === "string"; }
function isNum(x) { return typeof x === "number"; }
function isObj(x) { return x && typeof x === "object"; }
function isFn(x) { return typeof x === "function"; }
function isURL(x) { return PROTOCOL_RE.test(x); }

// Adds/removes a trailing slash
function addSlash(p) { return endsWith(p, "/") ? p : (p + "/"); }
function removeSlash(p) { return endsWith(p, "/") ? p.slice(0, -1) : p; }

// Removes relative segments from a path
function collapse(path)
{
	var a = path.split("/"), out = [], i, e;

	for (i = 0; i < a.length; ++i)
	{
		e = a[i];

		if (e === ".") continue;
		else if (e === ".." && out.length > 0) out.pop();
		else out.push(e);
	}

	return out.join("/");
}

// Gets the directory from a path
function dir(path)
{
	var i = path.lastIndexOf("/");
	return (i >= 0) ? path.substring(0, i + 1) : "";
}

// Appends a file suffix
function suffix(id)
{
	if (endsWith(id, "/"))
		id += PKG_MODULE;
	else if (id.search(/[#\?]/) === -1)
		id += ".js";

	return id;
}

// Returns a finalized script URL
function scriptURL(src)
{
	if (_noCache)
		src += (src.indexOf("?") >= 0 ? "&" : "?") + (new Date()).getTime();

	return src;
}

// Inserts an element in the head of the document
function toHead(s)
{
	var d, h = _head;

	if (!_head)
	{
		d = document;

		h = (_head = d.getElementsByTagName("head")[0]) ||
			d.getElementsByTagName("body")[0] ||
			d.documentElement.firstChild;
	}

	h.insertBefore(s, h.firstChild);
}


// =============
// CONFIGURATION
// =============


// Configures the loader (may be called only once!)
function configure(op)
{
	if (!isObj(op)) op = {};

	var r;

	// Set script root
	if (isStr(op.scriptRoot))
	{
		r = addSlash(op.scriptRoot);

		if (r.charAt(0) !== "/")
			r = collapse(_homeDir + r);

		_scriptRoot = r;
	}

	// Set script timeout
	if (isNum(op.scriptTimeout))
		_scriptTimeout = Math.floor(op.scriptTimeout);

	// Set cache buster
	_noCache = !!op.noCache;
}

// Add a module namespace mounting
function mount(p, m)
{
	if (isObj(p))
		return each(p, function(pre) { mount(pre, p[pre]); });

	if (!isStr(p) || p.substring(0, 1) === ".")
		return;

	if (m === UNDEF) { m = p; p = ""; }
	else if (!p) p = "";

	// Convert relative URL mappings
	if (isStr(m) && m.substring(0, 1) === ".")
		m = collapse(_homeDir + m);

	if (endsWith(p, "/")) _mountDir[p] = isStr(m) ? addSlash(m) : m;
	else _mountID[p] = m;
}


// Creates a module loader
function createLoader()
{


// =======
// CLASSES
// =======


function Wait(fn)
{
	this.fn = fn;
	this.ready = false;
}

function Module(id, uri)
{
	var exp = {},
		path = dir(id),
		ref = false,
		deref;

	this.id = id;
	this.uri = uri || $baseURI;

	// Returns the URI of a resource relative to the module uri
	this.getURI = function(p)
	{
		return p ? collapse(dir(this.uri) + p) : this.uri;
	};

	// Returns the exports object for the module
	this._exp = function(by)
	{
		ref = by || true;
		return exp;
	};

	// Sets the exports object for the module
	this.setExports = function(e)
	{
		if (!ref) exp = e;
		else throw new Error("Circular initialization error in module '" + id + "'. Referenced by '" + ref + "'.");
	};

	// Dereferences a module ID
	this._deref = deref = function(ident)
	{
		var m, f;

		ident = resolve(ident, path, true);
		m = has($modules, ident) ? $modules[ident] : null;

		// Attempt to convert Wait to Module
		if (m && m instanceof Wait)
		{
			if (m.ready && m.fn)
			{
				f = m.fn;
				$modules[ident] = m = new Module(ident, m.uri);
				m.declare(f);
			}
			else
			{
				m = null;
			}
		}

		return m ? m._exp(id) : null;
	};

	// The require function
	this._req = function(ident)
	{
		if ($pending)
			flushQueue();

		var m = deref(ident);
		if (m === null) throw new Error("Module '" + ident + "' is not loaded.");

		return m;
	};

	// Dynamically loads a list of modules
	this.load = function()
	{
		var ids = [], a = arguments, fn, i;

		for (i = 0; i < a.length; ++i)
		{
			if (!a[i]) continue;
			else if (isStr(a[i])) ids.push(a[i]);
			else if (isFn(a[i])) fn = a[i];
			else if (isFn(a[i].concat)) ids = ids.concat(a[i]);
		}

		$loadQueue.push([ids, fn || NO_OP, path, null]);
		flushQueue();
	};

	// Initializes the module
	this.declare = function(d, f)
	{
		if (f === UNDEF)
			f = d;

		if (isFn(f))
		{
			var e = f(this._req, exp, this);
			if (e !== UNDEF && e !== exp) this.setExports(e);
		}
		else if (isObj(f))
		{
			this.setExports(f);
		}

		return exp;
	};
}


// ==============
// PATH FUNCTIONS
// ==============


// Returns a globally unique module ID
function resolve(id, path, full, lib)
{
	if (!isStr(id)) return "";

	// Trim input
	id = id.replace(TRIM_RE, "");

	var c = id.charAt(0),
		map,
		term,
		pos,
		pkg;

	if (c === ".") // Relative
	{
		id = (path || "") + id;
	}
	else if (c !== "/" && !isURL(id)) // Absolute
	{
		// Perform mappings...
		if (path && full && (pkg = matchProp($packages, path)))
		{
			map = $packages[pkg].mappings;

			// Get first term
			term = ((pos = id.indexOf("/")) > 0 ? id.substring(0, pos) : id);

			if (has(map, term))
			{
				map = map[term];

				if (has($alias, map))
					map = $alias[map];

				id = pos > 0 ?
					(map + id.substring(pos + 1)) :
					(removeSlash(map));

				return resolve(id, "", true, map + "*");
			}
		}

		id = ROOT_KEY + id;
	}

	id = collapse(id);

	if (full)
	{
		if (has($alias, id)) id = $alias[id];
		else if (has($alias, lib)) id = $alias[lib] + id.substring(lib.length - 1);
	}

	return id;
}


// ====================
// SCRIPT TAG FUNCTIONS
// ====================


// Fetches modules by injecting script tags
function fetchScripts(tags)
{
	var s, t;

	expose();

	while (t = tags.shift())
	{
		s = document.createElement("script");

		if (t.id)
			$scripts[t.id] = s;

		s._module = t;
		s.type = "text/javascript";
		s.src = t.src;
		s.async = true;
		s.onload =
		s.onerror =
		s.onreadystatechange = scriptLoad(s);

		scriptTimer(s);

		toHead(s);
		setContext(t.id, t.uri);
	}
}

// Fetches modules in a web worker context
function fetchScriptsWorker(tags)
{
	var tmr;

	fetch();

	function fetch()
	{
		if (tmr)
			clearTimeout(tmr); // workaround for FF importScripts bug

		var t;

		while (t = tags.shift())
		{
			try
			{
				expose();
				importScripts(t.src);
				t.done = true;
			}
			finally
			{
				hide();
				setContext(t.id, t.uri);
				$fetchCount -= 1;

				// Restart if error
				if (!t.done)
					tmr = asap(fetch);
			}
		}

		flushQueue();
	}
}

// Returns a function called when the script is loaded
function scriptLoad(s)
{
	return function(evt)
	{
		if (typeof s.readyState === "undefined" || READY_STATE.indexOf(s.readyState) >= 0)
			scriptDone(s);
	};
}

// Starts a timeout timer for a script
function scriptTimer(s)
{
	function timeout()
	{
		// Opera reports "interactive" while script is fetching.  Poll
		// in order to determine if HTTP error is encountered
		if (s.readyState === "interactive")
		{
			s._timer = setTimeout(timeout, 200);
		}
		else if (!s._timer)
		{
			s._timer = setTimeout(timeout, _scriptTimeout);
		}
		else
		{
			s._timer = 0;
			scriptDone(s);
		}
	}

	timeout();
}

// Called when script tag has finished executing
function scriptDone(s)
{
	if (s._done) return;

	var tag = s._module,
		id = tag.id,
		uri = tag.uri,
		cb;

	if (s._timer)
		clearTimeout(s._timer);

	s._done = true;
	s.onerror = s.onload = s.onreadystatechange = NO_OP;

	// Clear memory in IE
	if (s.clearAttributes)
		try { s.clearAttributes(); }
		catch (x) {}

	if (id)
		delete $scripts[id];

	if (--$fetchCount === 0)
	{
		hide();
		$scripts = {};
	}

	setContext(id, uri);
	flushQueue();
}

// Expose global hooks during loading
function expose()
{
	if (!$restore)
	{
		$restore = [ GLOBAL.module, GLOBAL.CommonJS ];
		GLOBAL.module = $gModule;
		GLOBAL.CommonJS = $gCommonJS;
	}
}

// Hide global hooks
function hide()
{
	if ($restore)
	{
		GLOBAL.module = $restore[0];
		GLOBAL.CommonJS = $restore[1];
		$restore = null;
	}
}

// Executes a script context hook
function scriptHook(fn)
{
	onContext(fn);

	// For IE, find executing script by looking for "interactive" state
	if (TEST_INTERACTIVE) each($scripts, function(i, tag)
	{
		if (tag.readyState === "interactive")
		{
			setContext(tag._module.id, tag._module.uri);
			return false;
		}
	});
}

// Use importScripts if executing in a web worker
if (typeof document === "undefined" && typeof importScripts !== "undefined")
	fetchScripts = fetchScriptsWorker;


// ==============
// LOAD FUNCTIONS
// ==============


// Returns a list of URLs from a list of module IDs
function mapScripts(ids)
{
	var map = {},
		list = [],
		tags = [],
		pre,
		i,
		e,
		m;

	// Find mount mappings for each input ID
	for (i = 0; i < ids.length; ++i)
	{
		list.push(e = { id: ids[i], top: ids[i].replace(ROOT_RE, ""), pre: "" });

		if (has(_mountID, e.top))
		{
			e.pre = e.top;
			e.mount = _mountID[e.top];
		}
		else if ((pre = matchProp(_mountDir, e.top)) !== null)
		{
			e.pre = pre;
			e.mount = _mountDir[pre];
		}
	}

	// Perform simple mappings and concatenate functional mappings
	for (i = 0; i < list.length; ++i)
	{
		e = list[i];
		m = e.mount;

		if (isStr(m))
		{
			tags.push({ src: suffix(m + e.top.substring(e.pre.length)), id: e.id });
		}
		else if (isFn(m))
		{
			if (!has(map, e.pre))
			{
				map[e.pre] = [];
				map[e.pre].fn = m;
			}

			map[e.pre].push(e.top);
		}
		else
		{
			tags.push({ src: suffix(e.id.replace(ROOT_RE, _scriptRoot)), id: e.id });
		}
	}

	// Perform functional mappings
	each(map, function(p, a) { tags = tags.concat(a.fn(a)); });

	// Perform final transformations
	for (i = 0; i < tags.length; ++i)
	{
		tags[i].uri = tags[i].src;
		tags[i].src = scriptURL(tags[i].src);
	}

	return tags;
}

// Flushes the load queue
function flushQueue()
{
	if ($loadQueue.length === 0)
		return;

	var more = true,
		cbs = [],
		args,
		result,
		q1,
		q2;

	$pending = false;

	// Attempt to complete each load until nothing more can be completed
	while (more)
	{
		more = false;

		// Take load queue
		q1 = $loadQueue;
		q2 = [];
		$loadQueue = [];

		// Process each load call
		while (args = q1.pop())
		{
			result = load.apply(GLOBAL, args);

			if (result.fetch)
			{
				// Put load back on queue
				q2.unshift(args);
				$fetchQueue = $fetchQueue.concat(result.fetch);
			}
			else
			{
				cbs.push(result);
				more = true;
			}
		}

		// If entries were added to load queue, restart flush
		if ($loadQueue.length > 0)
			more = true;

		// Add entries back to load queue
		$loadQueue = q2.concat($loadQueue);

		// If everything received, flush everything through (breaking cycles)
		if ($fetchCount === 0 && $loadQueue.length)
		{
			each($modules, function(id, m)
			{
				if (m instanceof Wait && !m.ready)
					more = m.ready = true;
			});
		}
	}

	runCallbacks(cbs);
	asap(beginFetch);
}

// Begins a fetch operation
function beginFetch()
{
	var list;

	if ($fetchQueue.length)
	{
		list = $fetchQueue;
		$fetchQueue = [];
		fetchScripts(list);
	}
}

// Runs a list of load callbacks
function runCallbacks(list)
{
	var tmr = asap(run);

	function run()
	{
		var a, i, j, cb, fn, ids;

		if (tmr) clearTimeout(tmr);

		try
		{
			// Execute callbacks
			while (cb = list.shift())
			{
				if (!isFn(cb.fn)) continue;

				fn = cb.fn;
				ids = cb.ids;

				for (a = [], j = 0; j < ids.length; ++j)
					a.push($baseMod._deref(ids[j]));

				cb = null;
				fn.apply(GLOBAL, a);
			}
		}
		finally
		{
			// Restore callback if error occurred before execution
			if (cb)
				list.unshift(cb);

			// Restart if necessary
			if (list.length > 0)
				tmr = asap(run);
		}
	}
}

// Builds a list of module IDs that must be fetched
function getFetchList(ids)
{
	var list = [], ok = true, pkg, id, i;

	for (i = 0; i < ids.length; ++i)
	{
		id = ids[i];

		if (!has($modules, id))
		{
			ok = false;

			// Skip fetch if waiting for package bundle
			if ((pkg = matchProp($packages, id)) && $packages[pkg] === null)
				continue;

			$modules[id] = new Wait();
			list.push(id);
		}
		else if ($modules[id] instanceof Wait && !$modules[id].ready)
		{
			ok = false;
		}
	}

	return ok ? null : list;
}

// Internal load call
function load(ids, fn, path, parent)
{
	var rids = [], idList, id, a, i, w;

	// Resolve input IDs
	for (i = 0; i < ids.length; ++i)
		rids.push(resolve(ids[i], path, true));

	ids = rids;
	idList = getFetchList(ids);

	// If everything is loaded...
	if (idList === null)
	{
		// Install parent IDs
		if (parent)
		{
			for (i = 0; i < parent.length; ++i)
			{
				id = parent[i];

				if ((w = $modules[id]) && w instanceof Wait && w.fn !== UNDEF)
					w.ready = true;
			}
		}

		return { fn: fn, ids: ids };
	}
	else
	{
		idList = mapScripts(idList);
		$fetchCount += idList.length;

		return { fetch: idList };
	}
}


// =================
// MODULE DEFINITION
// =================


// Executes a callback when the calling script module ID and uri are known
function onContext(fn)
{
	$contextCB.push(fn);
}

// Sets the current script context
function setContext(id, uri)
{
	var restore = $context, cb;
	$context = { id: id, uri: uri };

	// Execute script callbacks
	while (cb = $contextCB.shift())
		cb(id, uri);

	if (!has($modules, id))
		attach(id, [], null);

	$context = restore;
}

// Create a package bundle
function bundle(data)
{
	var p = {};
	p[PKG_MODULE] = data || {};
	return p;
}

// Returns a list of require call arguments
function parseRequire(txt)
{
	var dep = [], m;

	if (txt += "")
		for (REQUIRE_RE.lastIndex = 0; m = REQUIRE_RE.exec(txt);)
			if (m[1]) dep.push(m[1].slice(1, -1));

	return dep;
}

// Attaches a package or module
function attach(id, dep, fn, scan)
{
	var ids = {}, path, txt, m;

	id = resolve(id);
	path = dir(id);

	// Normalize input
	if (fn === UNDEF)
	{
		fn = dep;
		dep = null;
	}

	if (endsWith(id, "/"))
	{
		attachPackage(removeSlash(path || ""), bundle(fn));
	}
	else
	{
		dep = dep || (scan && isFn(fn) && parseRequire(fn)) || [];
		ids[id] = fn;
		attachSet(ids, dep, path);
	}
}

// Attaches a package
function attachPackage(path, ids)
{
	if (!has(ids, PKG_MODULE))
		return;

	var path = isStr(path) ? resolve(addSlash(path)) : _homeDir,
		pid = removeSlash(path),
		data = ids[PKG_MODULE],
		map = {},
		idx = {},
		dep = [],
		exp;

	// Get package data from package module
	if (isFn(data))
		data = (new Module(path)).declare(data);

	// Resolve module IDs
	each(ids, function(id, fn) { idx[path + id] = fn; });
	ids = idx;

	// Process mappings
	each(data.mappings, function(id, to)
	{
		// Get mapping from "location" key or first array entry
		if (!isStr(to)) to = to && (to.location || to[0]) || null;
		if (!isStr(to)) return;

		if (!isURL(to))
			to = "./" + to;

		var pkg = addSlash(to = resolve(to, path));

		if (!has($packages, pkg) && !endsWith(to, "/"))
			$packages[pkg] = null;

		dep.push(to);
		map[id] = pkg;
	});

	// Add alias from package to main (or package data)
	$alias[pid] = resolve(path + (isStr(data.main) ? data.main : PKG_MODULE));

	exp = isObj(data.exports) && data.exports || {};

	// Add lib export (directories.lib)
	if (!exp["*"] && isObj(data.directories) && isStr(data.directories.lib))
		exp["*"] = data.directories.lib;

	// Add alias for each export
	each(exp, function(id, to)
	{
		if (id === "*") to = addSlash(to);
		$alias[path + id] = resolve(path + to);
	});

	// Store package data
	$packages[path] = { mappings: map };

	// Attach package modules
	attachSet(ids, dep, null);

	if ($context.id && $context.id !== pid)
	{
		// Create mapping alias from location to global id
		$alias[addSlash($context.id)] = path;

		// Add main alias
		$alias[$context.id] = $alias[pid];
	}
}

// Registers a collection of modules
function attachSet(ids, dep, path)
{
	var list = [],
		fn,
		m;

	// Normalize input
	if (!isObj(ids)) return;
	if (!dep || dep.concat === UNDEF) dep = [];

	each(ids, function(id, fn)
	{
		fn = fn || null;
		id = resolve(id);

		// Convert string to function
		if (isStr(fn))
			fn = new Function("require", "exports", "module", fn);

		// Add factories and track wait objects
		if (!has($modules, id))
		{
			$modules[id] = new Wait(fn);
			list.push(id);
		}
		else
		{
			m = $modules[id];

			if (m instanceof Wait && m.fn === UNDEF)
			{
				m.fn = fn;
				list.push(id);
			}
		}
	});

	$loadQueue.push([ dep, null, path, list ]);
	$pending = true;

	// Associate modules with a URI
	each(ids, function(id) { $modules[resolve(id)].uri = $context.uri + ""; });
}


// ============
// LOADER STATE
// ============


var $alias = {},
	$modules = {},
	$packages = {},
	$loadQueue = [],
	$fetchQueue = [],
	$pending = false,
	$baseURI = _homeFile,
	$baseMod = new Module($baseURI),
	$context = {},
	$contextCB = [],
	$scripts = {},
	$fetchCount = 0,
	$restore = null;

var $gModule =
{
	declare: function(dep, fn) { scriptHook(function(id) { attach(id, dep, fn, true); }); }
};

var $gCommonJS =
{
	attachModule: function(id, dep, fn) { scriptHook(function() { attach(id, dep, fn); }); },
	attachPackage: function(uri, ids) { scriptHook(function() { attachPackage(uri, ids); }); },
	parseDependencies: parseRequire,
	getCallingContext: onContext
};


// ================
// BUILT-IN MODULES
// ================


attach("path", null, function()
{
	function base(p, ext)
	{
		p = p.substring(p.lastIndexOf("/") + 1);

		if (ext && endsWith(p, ext))
			p = p.slice(0, -ext.length);

		return p;
	}

	return {

		"normalize": collapse,
		"normalizeArray": function(a) { return collapse(a.join("/")).split("/"); },
		"dirname": function(p) { return (p = dir(p)).slice(0, -1); },
		"basename": base,
		"extname": function(p)
		{
			p = base(p);
			var i = p.lastIndexOf(".");
			return (i === -1 ? "" : p.substring(i || p.length));
		},
		"join": function()
		{
			var a = arguments, i, out = a[0] || "";

			for (i = 1; i < a.length; ++i)
				out = addSlash(out) + a[i];

			return collapse(out);
		}

	};
});

return {

	attachModule: attach,
	attachPackage: attachPackage,
	parseDependencies: parseRequire,
	load: $baseMod.load,
	debug:
	{
		modules: $modules,
		aliases: $alias,
		packages: $packages
	}

};

} // END createLoader


this.FlyScript = this.CommonJS = createLoader();
this.FlyScript.configure = configure;
this.FlyScript.mount = mount;


}).call(this, this);

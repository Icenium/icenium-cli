///<reference path=".d.ts"/>

//--- begin part copied from AngularJS

//The MIT License
//
//Copyright (c) 2010-2012 Google, Inc. http://angularjs.org
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//	The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

var FN_NAME_AND_ARGS = /^function\s*([^\(]*)\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function annotate(fn) {
	var $inject,
		fnText,
		argDecl,
		last;

	if (typeof fn == 'function') {
		if (!($inject = fn.$inject)) {
			$inject = { args: [], name: "" };
			fnText = fn.toString().replace(STRIP_COMMENTS, '');
			argDecl = fnText.match(FN_NAME_AND_ARGS);
			$inject.name = argDecl[1];
			if (fn.length) {
				argDecl[2].split(FN_ARG_SPLIT).forEach(function(arg){
					arg.replace(FN_ARG, function(all, underscore, name){
						$inject.args.push(name);
					});
				});
			}
			fn.$inject = $inject;
		}
	}
	return $inject;
}

//--- end part copied from AngularJS

var _ = <UnderscoreStatic> require("underscore");
var util = require("util");


var indent = "";
function trace(formatStr: string, ...args: any[]) {
	formatStr = indent + formatStr;
	args.unshift(formatStr);

	// uncomment following line when debugging dependency injection
	//console.log(util.format.apply(null, args));
}

function pushIndent() {
	indent += "  ";
}

function popIndent() {
	indent = indent.slice(0, -2);
}

export interface IDependency {
	require?: string;
	resolver?: () => any;
	instance?: any;
}

export class Yok implements IInjector {
	private COMMANDS_NAMESPACE: string = "commands";
	private modules: {
		[name: string]: IDependency;
	} = {};

	private resolutionProgress: any = {};

	public requireCommand(name: string, file: string) {
		this.require(this.createCommandName(name), file);
	}

	public require(name: string, file: string): void {
		var dependency: IDependency = {
			require: file
		};
		this.modules[name] = dependency;
	}

	public registerCommand(name: string, resolver: any): void {
		this.register(this.createCommandName(name), resolver);
	}

	public register(name: string, resolver: any): void {
		trace("registered '%s'", name);

		var dependency = this.modules[name] || {};

		if (_.isFunction(resolver)) {
			dependency.resolver = resolver;
		} else {
			dependency.instance = resolver;
		}

		this.modules[name] = dependency;
	}

	public resolveCommand(name: string): ICommand {
		var command: ICommand;
		try {
			command = this.resolve(this.createCommandName(name));
		}
		catch (error) {
		}

		return command;
	}

	public resolve(param: any, ctorArguments?: {[key: string]: {}}): any {
		if (_.isFunction(param)) {
			return this.resolveConstructor(<Function> param, ctorArguments);
		} else {
			return this.resolveByName(<string> param);
		}
	}

	private resolveConstructor(ctor: Function, ctorArguments?:  {[key: string]: {}}): any {
		annotate(ctor);

		var resolvedArgs = ctor.$inject.args.map(paramName => {
			if(ctorArguments && ctorArguments[paramName]) {
				return ctorArguments[paramName];
			} else {
				return this.resolve(paramName);
			}
		});

		var name = ctor.$inject.name;
		if (name && name[0] === name[0].toUpperCase()) {
			function EmptyCtor() {}
			EmptyCtor.prototype = ctor.prototype;
			var obj = new EmptyCtor();

			ctor.apply(obj, resolvedArgs);
			return obj;
		} else {
			return ctor.apply(null, resolvedArgs);
		}
	}

	private resolveByName(name: string): any {
		if (name[0] === "$") {
			name = name.substr(1);
		}

		if (this.resolutionProgress[name]) {
			throw new Error(util.format("cyclic dependency detected on dependency '%s'", name));
		}
		this.resolutionProgress[name] = true;

		trace("resolving '%s'", name);
		pushIndent();

		try {
			var dependency = this.resolveDependency(name);

			if (!dependency) {
				throw new Error("unable to resolve " + name);
			}

			if (!dependency.instance) {
				if (!dependency.resolver) {
					throw new Error("no resolver registered for " + name);
				}

				dependency.instance = this.resolveConstructor(dependency.resolver);
			}
		}
		finally {
			popIndent();
			delete this.resolutionProgress[name];
		}

		return dependency.instance;
	}

	private resolveDependency(name: string): IDependency {
		var module = this.modules[name];
		if (!module) {
			throw new Error("unable to resolve " + name);
		}

		if (module.require) {
			require(module.require);
		}
		return module;
	}

	public getRegisteredCommandsNames(): string[] {
		var modulesNames: string[] = _.keys(this.modules);
		var commandsNames: string[] = _.filter(modulesNames, (moduleName: string) => moduleName.startsWith(util.format("%s.", this.COMMANDS_NAMESPACE)));
		return _.map(commandsNames, (commandName: string) => commandName.substr(this.COMMANDS_NAMESPACE.length + 1));
	}

	private createCommandName(name: string) {
		return util.format("%s.%s", this.COMMANDS_NAMESPACE, name);
	}
}

export var injector = new Yok();
injector.register("injector", injector);













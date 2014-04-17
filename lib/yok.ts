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

var util = require("util");
var assert = require("assert");

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

function forEachName(names: any, action: (name: string) => void): void {
	if (_.isString(names)) {
		action(names);
	} else {
		names.forEach(action);
	}
}

export interface IDependency {
	require?: string;
	resolver?: () => any;
	instance?: any;
	shared?: boolean;
}

export class Yok implements IInjector {
	private COMMANDS_NAMESPACE: string = "commands";
	private modules: {
		[name: string]: IDependency;
	} = {};

	private resolutionProgress: any = {};
	private hierarchicalCommands: {[key: string]: string[]} = {};

	public requireCommand(names: any, file: string) {
		forEachName(names, (commandName) => {
			var commands = commandName.split("|");

			if(commands.length > 1) {
				var parentCommandName = commands[0];

				if(!this.hierarchicalCommands[parentCommandName]) {
					this.hierarchicalCommands[parentCommandName] = [];
				}

				this.hierarchicalCommands[parentCommandName].push(commands[1]);
			}

			if(commands.length > 1 && !this.modules[this.createCommandName(commands[0])]) {
				this.require(this.createCommandName(commands[0]), file);
			} else {
				this.require(this.createCommandName(commandName), file);
			}
		});
	}

	public require(names: any, file: string): void {
		forEachName(names, (name) => this.requireOne(name, file));
	}

	private requireOne(name: string, file: string): void {
		var dependency: IDependency = {
			require: file,
			shared: true
		};
		if (!this.modules[name]) {
			this.modules[name] = dependency;
		} else {
			throw new Error(util.format("module '%s' require'd twice.", name));
		}
	}

	public registerCommand(names: any, resolver: any): void {
		forEachName(names, (name) => {
			var commands = name.split("|");
			this.register(this.createCommandName(name), resolver);

			if(commands.length > 1) {
				this.createHierarchicalCommand(commands[0]);
			}
		});
	}

	private getDefaultCommand(name: string) {
		var subCommands = this.hierarchicalCommands[name];
		var defaultCommand = _.find(subCommands, (command) => command.startsWith("*"));
		return defaultCommand;
	}

	private createHierarchicalCommand(name: string) {
		var factory = () => {
			return {
				execute: (args: string[]): IFuture<void> => {
					return (() => {
						var commandsService = $injector.resolve("commandsService");
						var commandName: string = null;

						if(args.length > 0) {
							commandName = args[0];
						} else {
							var defaultCommand = this.getDefaultCommand(name);
							commandName = defaultCommand || "help";
						}

						if(commandName !== "help") {
							commandName = util.format("%s|%s", name, commandName);
						}

						commandsService.tryExecuteCommand(commandName, commandName === "help" ? [name] : _.rest(args));
					}).future<void>()();
				}
			};
		};

		$injector.registerCommand(name, factory);
	}

	public isDefaultCommand(commandName: string): boolean {
		return commandName.indexOf("*") > 0 && commandName.indexOf("|") > 0;
	}

	public register(name: string, resolver: any, shared: boolean = true): void {
		trace("registered '%s'", name);

		var dependency = this.modules[name] || {};
		dependency.shared = shared;

		if (_.isFunction(resolver)) {
			dependency.resolver = resolver;
		} else {
			dependency.instance = resolver;
		}

		this.modules[name] = dependency;
	}

	public resolveCommand(name: string): ICommand {
		var command: ICommand;

		var commandModuleName = this.createCommandName(name);
		if (!this.modules[commandModuleName]) {
			return null;
		}
 		command = this.resolve(commandModuleName);

		return command;
	}

	public resolve(param: any, ctorArguments?: {[key: string]: any}): any {
		if (_.isFunction(param)) {
			return this.resolveConstructor(<Function> param, ctorArguments);
		} else {
			assert.ok(!ctorArguments);
			return this.resolveByName(<string> param);
		}
	}

	private resolveConstructor(ctor: Function, ctorArguments?:  {[key: string]: any}): any {
		annotate(ctor);

		var resolvedArgs = ctor.$inject.args.map(paramName => {
			if(ctorArguments && ctorArguments.hasOwnProperty(paramName)) {
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

			if (!dependency.instance || !dependency.shared) {
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

	public getRegisteredCommandsNames(includeDev: boolean): string[] {
		var modulesNames: string[] = _.keys(this.modules);
		var commandsNames: string[] = _.filter(modulesNames, (moduleName: string) => moduleName.startsWith(util.format("%s.", this.COMMANDS_NAMESPACE)));
		var commands = _.map(commandsNames, (commandName: string) => commandName.substr(this.COMMANDS_NAMESPACE.length + 1));
		if (!includeDev) {
			commands = _.reject(commands, (command) => command.startsWith("dev-"));
		}
		return commands;
	}

	public getChildrenCommandsNames(commandName: string): string[] {
		return this.hierarchicalCommands[commandName];
	}

	private createCommandName(name: string) {
		return util.format("%s.%s", this.COMMANDS_NAMESPACE, name);
	}

	public dispose(): void {
		Object.keys(this.modules).forEach((moduleName) => {
			var instance = this.modules[moduleName].instance;
			if (instance && instance.dispose && instance !== this) {
				instance.dispose();
			}
		})
	}
}

export var injector = new Yok();
injector.register("injector", injector);

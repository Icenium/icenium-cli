///<reference path="../.d.ts"/>
"use strict";

export enum CodeEntityType {
	Line,
	Block
}

export class Line implements Swagger.ILine {
	public content: string;

	constructor(content: string) {
		this.content = content;
	}

	public get codeEntityType() {
		return CodeEntityType.Line;
	}

	public static create(content: string): Swagger.ILine {
		return new Line(content);
	}
}
$injector.register("swaggerLine", Line);

export class Block implements Swagger.IBlock {
	public opener: string;
	public codeEntities: Swagger.ICodeEntity[];

	constructor(opener?: string) {
		this.opener = opener;
		this.codeEntities = [];
	}

	public get codeEntityType() {
		return CodeEntityType.Block;
	}

	public addBlock(block: Swagger.IBlock): void {
		this.codeEntities.push(block);
	}

	public addLine(line: Swagger.ILine): void {
		this.codeEntities.push(line);
	}

	public addBlocks(blocks: Swagger.IBlock[]): void {
		_.each(blocks, (block: Swagger.IBlock) => this.addBlock(block));
	}

	public writeLine(content: string): void {
		let line = Line.create(content);
		this.codeEntities.push(line);
	}
}
$injector.register("swaggerBlock", Block);
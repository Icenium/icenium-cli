///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import codeEntityLib = require("./code-entity");

export class SwaggerCodePrinter {
	private static INDENT_CHAR = "\t";
	private static NEW_LINE_CHAR = os.EOL;
	private static START_BLOCK_CHAR = "{";
	private static END_BLOCK_CHAR = "}";

	public composeBlock(block: Swagger.IBlock, indentSize: number = 0): string {
		let content = this.getIndentation(indentSize);

		if(block.opener) {
			content += block.opener;
			content += SwaggerCodePrinter.START_BLOCK_CHAR;
			content += SwaggerCodePrinter.NEW_LINE_CHAR;
		}

		_.each(block.codeEntities, (codeEntity: Swagger.ICodeEntity) => {
			if(codeEntity.codeEntityType === codeEntityLib.CodeEntityType.Line) {
				content += this.composeLine(<Swagger.ILine>codeEntity, indentSize + 1);
			} else if(codeEntity.codeEntityType === codeEntityLib.CodeEntityType.Block){
				content += this.composeBlock(<Swagger.IBlock>codeEntity, indentSize + 1);
			}
		});

		if(block.opener) {
			content += this.getIndentation(indentSize);
			content += SwaggerCodePrinter.END_BLOCK_CHAR;
		}

		content += SwaggerCodePrinter.NEW_LINE_CHAR;

		return content;
	}

	private getIndentation(indentSize: number): string {
		return Array(indentSize).join(SwaggerCodePrinter.INDENT_CHAR);
	}

	private composeLine(line: Swagger.ILine, indentSize: number): string {
		let content = this.getIndentation(indentSize);
		content += line.content;
		content += SwaggerCodePrinter.NEW_LINE_CHAR;

		return content;
	}
}
$injector.register("swaggerCodePrinter", SwaggerCodePrinter);

import express = require("express");
import * as http from "http";

export class Express implements IExpress {
	private app: express.Application;

	constructor(private $dispatcher: IFutureDispatcher) {
		this.app = express();
	}

	public run(): void {
		this.$dispatcher.run();
	}

	public listen(port: number, callback?: Function): http.Server {
		return this.app.listen(port, callback);
	}

	public post(route: string, callback: (_req: express.Request, _res: express.Response) => Promise<void>): void {
		this.app.post(route, (req: express.Request, res: express.Response) => {
			this.$dispatcher.dispatch(() => callback(req, res));
		});
	}
}

$injector.register("express", Express);

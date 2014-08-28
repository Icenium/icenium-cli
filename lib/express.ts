///<reference path=".d.ts"/>

"use strict";

import express = require("express");
import http = require("http");

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

    public post(route: string, callback: (req: express.Request, res: express.Response) => IFuture<void>) : void {
        this.app.post(route, (req: express.Request, res: express.Response) => {
            this.$dispatcher.dispatch(() => callback(req, res));
        });
    }
}

$injector.register("express", Express);
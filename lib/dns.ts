///<reference path=".d.ts"/>
"use strict";

import dns = require("dns");
import Future = require("fibers/future");
import ip = require("ip");

export class DomainNameSystem implements IDomainNameSystem {
	private reverse(ipAddress: string): IFuture<string[]> {
		var future = new Future<string[]>();
		dns.reverse(ipAddress, (err: Error, domains: string[]) => {
			if(err) {
				future.return([]);
			} else {
				future.return(domains);
			}
		});

		return future;
	}

	public getDomains(): IFuture<string[]> {
		return (() => {
			var ipAddress = ip.address();
			var domains = this.reverse(ipAddress).wait();
			return domains;
		}).future<string[]>()();
	}
}
$injector.register("domainNameSystem", DomainNameSystem);

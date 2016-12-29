import dns = require("dns");
import Future = require("fibers/future");
import ip = require("ip");

export class DomainNameSystem implements IDomainNameSystem {
	private reverse(ipAddress: string): IFuture<string[]> {
		let future = new Future<string[]>();
		dns.reverse(ipAddress, (err: Error, domains: string[]) => {
			if(err) {
				future.return([]);
			} else {
				future.return(domains);
			}
		});

		return future;
	}

	public async getDomains(): Promise<string[]> {
			let ipAddress = ip.address();
			let domains = await  this.reverse(ipAddress);
			return domains;
	}
}
$injector.register("domainNameSystem", DomainNameSystem);

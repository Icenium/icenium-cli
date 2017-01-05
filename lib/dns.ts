import dns = require("dns");
import Future = require("fibers/future");
import ip = require("ip");

export class DomainNameSystem implements IDomainNameSystem {
	private async reverse(ipAddress: string): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			dns.reverse(ipAddress, (err: Error, domains: string[]) => {
				if (err) {
					resolve([]);
				} else {
					resolve(domains);
				}
			});

		});
	}

	public async getDomains(): Promise<string[]> {
		let ipAddress = ip.address();
		let domains = await this.reverse(ipAddress);
		return domains;
	}
}
$injector.register("domainNameSystem", DomainNameSystem);

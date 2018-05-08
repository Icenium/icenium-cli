interface IRejectUnauthorized {
	/**
	 * Defines if NODE_TLS_REJECT_UNAUTHORIZED should be set to true or false. Default value is true.
	 */
	rejectUnauthorized: boolean;
}

/**
 * Proxy settings required for http request.
 */
interface IProxySettings extends IRejectUnauthorized {
	/**
	 * Hostname of the machine used for proxy.
	 */
	hostname: string;

	/**
	 * Port of the machine used for proxy that allows connections.
	 */
	port: string;

	/**
	 * Protocol of the proxy - http or https
	 */
	protocol?: string;


	proxy?: string;
}

interface IVersionData {
	major: string;
	minor: string;
	patch: string;
}

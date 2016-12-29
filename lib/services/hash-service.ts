import Future = require("fibers/future");
let crypto = require("crypto");
import * as util from "util";

export class HashService implements IHashService {
	constructor(private $fs: IFileSystem,
		private $errors: IErrors) { }

	// From crypto documentation:
	private static validHashEncodings: string[] = ["hex", "binary", "base64"];
	private static validInputEncodings: string[] = ["utf8", "ascii", "binary"];

	public async getFileHash(filePath: string, inputEncoding: string, hashAlgorithm: string, hashEncoding: string): Promise<string> {
			this.validateInputParameters(filePath, inputEncoding, hashAlgorithm, hashEncoding);

			let cryptoHash = crypto.createHash(hashAlgorithm);
			let future = new Future<void>();
			let fileStr = this.$fs.createReadStream(filePath);
			fileStr.on("data", (chunk: NodeBuffer) => {
				cryptoHash.update(chunk, inputEncoding);
			});

			fileStr.on("end", () => {
				if(!future.isResolved()) {
					future.return();
				}
			});

			fileStr.on("error", (err: Error) => {
				if(!future.isResolved()) {
					future.throw(err);
				}
			});

			future.wait();
			return cryptoHash.digest(hashEncoding);
	}

	private validateInputParameters(filePath: string, inputEncoding: string, hashAlgorithm: string, hashEncoding: string): void {
		if(!this.$fs.exists(filePath)) {
			this.$errors.fail(util.format("Specified file %s does not exist.", filePath));
		}

		if(!_.includes(HashService.validInputEncodings, inputEncoding)) {
			this.$errors.fail(util.format("Specified input file encoding %s is not valid. Valid values are %s", inputEncoding, HashService.validInputEncodings));
		}

		this.validateHashAlgorithm(hashAlgorithm);

		if(!_.includes(HashService.validHashEncodings, hashEncoding)) {
			this.$errors.fail(util.format("Specified hash encoding %s is not valid. Valid values are %s", hashEncoding, HashService.validHashEncodings));
		}
	}

	private validateHashAlgorithm(hashAlgorithm: string): void {
		let hashes = crypto.getHashes();
		if(!_.includes(hashes, hashAlgorithm)) {
			this.$errors.fail(util.format("Specified hash algorithm %s is not valid. Valid algorithms are %s", hashAlgorithm, hashes));
		}
	}
}
$injector.register("hashService", HashService);

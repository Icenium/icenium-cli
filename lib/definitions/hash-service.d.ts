interface IHashService {
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "base64"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "base64"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "base64"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "hex"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "hex"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "hex"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "binary"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "binary"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "binary"): IFuture<string>
	getFileHash(filePath: string, inputEncoding: string, hashAlgorithm: string, hashEncoding: string): IFuture<string>
}

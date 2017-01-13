interface IHashService {
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "base64"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "base64"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "base64"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "hex"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "hex"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "hex"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "utf8", hashAlgorithm: string, hashEncoding: "binary"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "ascii", hashAlgorithm: string, hashEncoding: "binary"): Promise<string>
	getFileHash(filePath: string, inputEncoding: "binary", hashAlgorithm: string, hashEncoding: "binary"): Promise<string>
	getFileHash(filePath: string, inputEncoding: string, hashAlgorithm: string, hashEncoding: string): Promise<string>
}

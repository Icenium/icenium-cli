interface IMultipartUploadService {
	/**
	 * Upload file by chunks (multiple parts instead of single one).
	 *
	 * @param projectZipFile Full path to the zipped project.
	 * @param bucketKey Key that will be used for identifying the parts of the upload. Each chunk must use the same bucketKey.
	 */
	uploadFileByChunks(projectZipFile: string, bucketKey: string): Promise<void>;
}

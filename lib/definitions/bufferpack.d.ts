declare module "bufferpack" {
	interface NodeBuffer {
		/** Shorthand for `ref.address`. */
		address(): number;
		/** Shorthand for `ref.deref`. */
		deref(): any;
		/** Shorthand for `ref.isNull`. */
		isNull(): boolean;
		/** Shorthand for `ref.readCString`. */
		readCString(offset?: number): string;
		/** Shorthand for `ref.readInt64BE`. */
		readInt64BE(offset?: number): string;
		/** Shorthand for `ref.readInt64LE`. */
		readInt64LE(offset?: number): string;
		/** Shorthand for `ref.readObject`. */
		readObject(offset?: number): string;
		/** Shorthand for `ref.readPointer`. */
		readPointer(offset?: number): string;
		/** Shorthand for `ref.readUInt64BE`. */
		readUInt64BE(offset?: number): string;
		/** Shorthand for `ref.readUInt64LE`. */
		readUInt64LE(offset?: number): string;
		/** Shorthand for `ref.ref`. */
		ref(): NodeBuffer;
		/** Shorthand for `ref.reinterpret`. */
		reinterpret(size: number, offset?: number): NodeBuffer;
		/** Shorthand for `ref.reinterpretUntilZeros`. */
		reinterpretUntilZeros(size: number, offset?: number): NodeBuffer;
		/** Shorthand for `ref.writeCString`. */
		writeCString(offset: number, string: string, encoding?: string): void;
		/** Shorthand for `ref.writeInt64BE`. */
		writeInt64BE(offset: number, input: number): any;
		/** Shorthand for `ref.writeInt64BE`. */
		writeInt64BE(offset: number, input: string): any;
		/** Shorthand for `ref.writeInt64LE`. */
		writeInt64LE(offset: number, input: number): any;
		/** Shorthand for `ref.writeInt64LE`. */
		writeInt64LE(offset: number, input: string): any;
		/** Shorthand for `ref.writeObject`. */
		writeObject(offset: number, object: Object): void;
		/** Shorthand for `ref.writePointer`. */
		writePointer(offset: number, pointer: NodeBuffer): void;
		/** Shorthand for `ref.writeUInt64BE`. */
		writeUInt64BE(offset: number, input: number): any;
		/** Shorthand for `ref.writeUInt64BE`. */
		writeUInt64BE(offset: number, input: string): any;
		/** Shorthand for `ref.writeUInt64LE`. */
		writeUInt64LE(offset: number, input: number): any;
		/** Shorthand for `ref.writeUInt64LE`. */
		writeUInt64LE(offset: number, input: string): any;

		/**
		 * Generate string for inspecting.
		 * String includes the hex-encoded memory address of the Buffer instance.
		 * @override
		 */
		inspect(): string;
	}

	export function pack(endian: string, lengths: number[]): string;
	export function unpack(endian: string, data: NodeBuffer): number[];
}
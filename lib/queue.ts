///<reference path=".d.ts"/>

import Future = require("fibers/future");

export class Queue<T> implements IQueue<T> {
	private future: IFuture<void>;

	public constructor(private items: T[] = []) {
	}

	public enqueue(item: T): void {
		this.items.unshift(item);

		if (this.future) {
			this.future.return();
		}
	}

	public dequeue(): IFuture<T> {
		return (() => {
			if (!this.items.length) {
				this.future = new Future<void>();
				this.future.wait();
				this.future = null;
			}

			return this.items.pop();
		}).future<T>()();
	}
}
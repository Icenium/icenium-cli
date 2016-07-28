export class DateProvider implements IDateProvider {
	public getCurrentDate(): Date {
		return new Date();
	}
}

$injector.register("dateProvider", DateProvider);

declare module IonicConfigXmlFile {
	interface IResource {
		src: string;
		density?: string;
		width?: string;
		height?: string;
	}

	interface IPlatform {
		name: string;
		icon: IResource | IResource[];
		splash: IResource | IResource[];
	}

	interface IPreference {
		name: string;
		value: string;
	}

	interface IAuthor {
		id: string;
		version: string;
		xmlns: string;
		email: string;
	}

	interface IWidget {
		preference: IPreference | IPreference[];
		platform: IPlatform | IPlatform[]
	}

	interface IConfigXmlFile {
		widget?: IWidget;
	}
}

if (process.platform !== "win32") {
	return;
}

if (process.arch !== "ia32") {
	console.log("Install the 32-bit version of Node.js before installing AppBuilder CLI.");
	process.exit(1);
}

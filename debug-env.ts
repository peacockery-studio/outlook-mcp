#!/usr/bin/env bun

console.error("==== DEBUG INFORMATION ====");
console.error("ARGUMENTS:", process.argv);
console.error("ENVIRONMENT VARIABLES:");
for (const key of Object.keys(process.env)) {
	console.error(`  ${key}: ${process.env[key]}`);
}
console.error("==== END DEBUG INFO ====");

// Load the real application
try {
	await import("./index.js");
} catch (error) {
	console.error("ERROR LOADING INDEX.JS:", error);
}

export {};

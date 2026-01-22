import * as yaml from "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs";

// Fix dates in YAML files - ensure date and read fields are unquoted dates
async function fixDatesInYamlFile(filePath: string) {
	try {
		let content = await Deno.readTextFile(filePath);
		const originalContent = content;

		// First, do a regex replacement to remove quotes from date fields in the raw content
		// This handles cases where dates are quoted in the YAML source
		content = content.replace(/date:\s*"(\d{4}-\d{2}-\d{2})"/g, 'date: $1');
		content = content.replace(/read:\s*"(\d{4}-\d{2}-\d{2})"/g, 'read: $1');
		content = content.replace(/date:\s*'(\d{4}-\d{2}-\d{2})'/g, "date: $1");
		content = content.replace(/read:\s*'(\d{4}-\d{2}-\d{2})'/g, "read: $1");

		// Now parse and fix any date formatting issues
		const data = yaml.load(content) as any;

		if (!data.books || !Array.isArray(data.books)) {
			console.log(`Skipping ${filePath} - no books array found`);
			return;
		}

		// Fix dates in each book to ensure they're in YYYY-MM-DD format
		let modified = content !== originalContent;
		for (const book of data.books) {
			// Fix date field
			if (book.date) {
				const dateStr = typeof book.date === 'string' ? book.date : book.date.toString();
				// Parse and reformat as YYYY-MM-DD
				const date = new Date(dateStr);
				if (!isNaN(date.getTime())) {
					const formatted = date.toISOString().split('T')[0];
					if (book.date !== formatted) {
						book.date = formatted;
						modified = true;
					}
				}
			}

			// Fix read field
			if (book.read) {
				const readStr = typeof book.read === 'string' ? book.read : book.read.toString();
				// Parse and reformat as YYYY-MM-DD
				const date = new Date(readStr);
				if (!isNaN(date.getTime())) {
					const formatted = date.toISOString().split('T')[0];
					if (book.read !== formatted) {
						book.read = formatted;
						modified = true;
					}
				}
			}
		}

		if (modified) {
			// Write back with unquoted dates
			let yamlOutput = yaml.dump(data, {
				quotingType: '"',
				forceQuotes: false
			});

			// Remove quotes from date fields (in case js-yaml adds them)
			yamlOutput = yamlOutput.replace(/date:\s*"(\d{4}-\d{2}-\d{2})"/g, 'date: $1');
			yamlOutput = yamlOutput.replace(/read:\s*"(\d{4}-\d{2}-\d{2})"/g, 'read: $1');

			await Deno.writeTextFile(filePath, yamlOutput);
			console.log(`Fixed dates in ${filePath}`);
		} else {
			console.log(`No changes needed in ${filePath}`);
		}
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error);
	}
}

// Find all YAML files in data/books directory
const yamlFiles: string[] = [];
try {
	for await (const dirEntry of Deno.readDir("data/books")) {
		if (dirEntry.isFile && dirEntry.name.endsWith(".yaml")) {
			yamlFiles.push(`data/books/${dirEntry.name}`);
		}
	}
} catch (error) {
	console.error("Error reading directory:", error);
	Deno.exit(1);
}

console.log(`Found ${yamlFiles.length} YAML files to process`);

// Process each file
for (const file of yamlFiles.sort()) {
	await fixDatesInYamlFile(file);
}

console.log("Done fixing dates in all YAML files");

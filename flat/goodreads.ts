import { readJSON, readImageFromURL, writeImage } from 'https://deno.land/x/flat@0.0.14/mod.ts'
import * as yaml from "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs"
import "https://deno.land/x/lodash@4.17.19/dist/lodash.js";

const _ = (self as any)._;

type Book = {
	title: string
	author: string
	subtitle: string
	date: Date | string
	read: Date | string | null
	rating: number
	pages: number
	isbn: string
	isbn13: string
	cover_url: string
	reading: boolean
	url: string
};

interface BooksByYear {
	[index: number]: Book[];
}

// Parse XML tag content
function parseXmlTag(xml: string, tagName: string): string {
	const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 's');
	const match = xml.match(regex);
	if (match) {
		// Remove CDATA wrapper if present
		return match[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim();
	}
	return '';
}

// Parse Goodreads RSS feed item
function parseGoodreadsItem(itemXml: string): Book | null {
	try {
		// Exclude books that are only on the to-read shelf (not started/read)
		const shelvesText = parseXmlTag(itemXml, 'user_shelves');
		const shelves = shelvesText ? shelvesText.split(',').map((s: string) => s.trim().toLowerCase()) : [];
		if (shelves.includes('to-read')) {
			return null;
		}

		// Extract title (just the title, not "Title by Author")
		const title = parseXmlTag(itemXml, 'title');

		// Extract author from author_name tag
		const author = parseXmlTag(itemXml, 'author_name');

		// Extract rating from user_rating tag
		const ratingText = parseXmlTag(itemXml, 'user_rating');
		const rating = ratingText ? parseInt(ratingText) : 0;

		// Extract date read from user_read_at tag (preferred) or pubDate
		const readAtText = parseXmlTag(itemXml, 'user_read_at');
		const dateRead = readAtText ? new Date(readAtText) : null;

		// Use date_added or date_created as fallback for date
		const dateAddedText = parseXmlTag(itemXml, 'user_date_added');
		const dateCreatedText = parseXmlTag(itemXml, 'user_date_created');
		const dateAdded = dateAddedText ? new Date(dateAddedText) : (dateCreatedText ? new Date(dateCreatedText) : new Date());

		// Extract book link
		const link = parseXmlTag(itemXml, 'link');

		// Extract cover image URL from book_large_image_url (preferred) or book_medium_image_url
		let coverUrl = parseXmlTag(itemXml, 'book_large_image_url');
		if (!coverUrl) {
			coverUrl = parseXmlTag(itemXml, 'book_medium_image_url');
		}
		if (!coverUrl) {
			coverUrl = parseXmlTag(itemXml, 'book_image_url');
		}

		// Extract ISBN from isbn tag
		const isbn = parseXmlTag(itemXml, 'isbn');

		// Convert ISBN-10 to ISBN-13 if we have ISBN-10
		let isbn13 = '';
		if (isbn.length === 10) {
			// Simple conversion: prefix with 978 and calculate check digit
			// This is a simplified conversion - proper conversion needs check digit calculation
			const prefix = '978' + isbn.substring(0, 9);
			// Calculate check digit for ISBN-13
			let sum = 0;
			for (let i = 0; i < 12; i++) {
				const digit = parseInt(prefix[i]);
				sum += digit * (i % 2 === 0 ? 1 : 3);
			}
			const checkDigit = (10 - (sum % 10)) % 10;
			isbn13 = prefix + checkDigit;
		} else if (isbn.length === 13) {
			isbn13 = isbn;
		}

		// Extract page count from book tag with num_pages
		let pages = 0;
		const bookTagMatch = itemXml.match(/<book[^>]*id="(\d+)"[^>]*>(.*?)<\/book>/s);
		if (bookTagMatch) {
			const bookContent = bookTagMatch[2];
			const numPagesText = parseXmlTag(bookContent, 'num_pages');
			if (numPagesText) {
				pages = parseInt(numPagesText);
			}
		}

		// Determine if currently reading (no date read means currently reading)
		const reading = dateRead === null;

		return {
			title: title,
			author: author,
			subtitle: '',
			date: dateRead || dateAdded,
			read: dateRead,
			rating: rating,
			pages: pages,
			isbn: isbn,
			isbn13: isbn13,
			cover_url: coverUrl,
			reading: reading,
			url: link
		};
	} catch (error) {
		console.error('Error parsing item:', error);
		return null;
	}
}

// Get the data filename as the first argument (RSS feed URL or JSON file)
const filename = Deno.args[0];
let books: Book[] = [];

// Check if it's a URL (starts with http) or a local file
if (filename?.startsWith('http')) {
	// Fetch RSS feed from URL
	console.log(`Fetching Goodreads RSS feed from: ${filename}`);
	const response = await fetch(filename);
	if (!response.ok) {
		throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
	}
	const xmlText = await response.text();

	// Keep original file in data/books
	await Deno.writeTextFile('./data/books/goodreads-rss.xml', xmlText);
	console.log('Saved original feed to data/books/goodreads-rss.xml');

	// Parse RSS feed items
	const itemMatches = xmlText.matchAll(/<item>(.*?)<\/item>/gs);
	const items: string[] = [];

	for (const match of itemMatches) {
		items.push(match[1]);
	}

	console.log(`Found ${items.length} books in RSS feed`);

	// Parse each item
	books = items
		.map((itemXml: string) => parseGoodreadsItem(itemXml))
		.filter((book: Book | null) => book !== null) as Book[];
} else {
	// Read from local JSON file
	const rawText = await Deno.readTextFile(filename);
	const data = JSON.parse(rawText);

	// Keep original file in data/books
	await Deno.writeTextFile('./data/books/goodreads.json', rawText);
	console.log('Saved original file to data/books/goodreads.json');

	// Handle different JSON formats
	if (data.reviews) {
		// Goodreads API JSON format
		books = data.reviews.map((review: any) => {
			const book = review.book || review;
			return {
				title: book.title || '',
				author: book.authors?.[0]?.name || book.author || '',
				subtitle: book.subtitle || '',
				date: review.started_at || review.date_added || new Date(),
				read: review.read_at || review.date_read || null,
				rating: review.rating || 0,
				pages: book.num_pages || book.page_count || 0,
				isbn: book.isbn || '',
				isbn13: book.isbn13 || '',
				cover_url: book.image_url || book.cover_url || '',
				reading: !review.read_at && !review.date_read,
				url: book.link || book.url || ''
			};
		});
	} else if (Array.isArray(data)) {
		// Array of books (already in Book format)
		books = data;
	} else if (data.results) {
		// ItalicType format (for compatibility)
		books = data.results.map((b: any) => ({
			title: b.book.title,
			subtitle: b.book.subtitle,
			author: b.book.authors[0],
			date: b.started_reading_at || b.created_at,
			read: b.finished_reading_at,
			rating: Math.ceil(b.user_review?.rating || 0),
			isbn: b.book.isbn_10,
			isbn13: b.book.isbn_13,
			pages: b.book.page_count,
			cover_url: b.book.cover_image_url,
			reading: b.finished_reading_at == null,
			url: b.book.url
		}));
	}
}

// Only include books with a read date in year files; books without go to "currently reading"
const booksWithReadDate = books.filter((b: Book) => b.read != null);
const currentlyReading = books.filter((b: Book) => b.read == null);

// Group by year read (only books that have been read)
const byYear = (b: Book) => {
	const readDate = typeof b.read === 'string' ? new Date(b.read) : b.read;
	return readDate.getFullYear();
};

const booksbyyear = _.groupBy(booksWithReadDate, byYear) as BooksByYear;

// Format date for YAML (ISO 8601 date format)
function formatDateForYaml(date: Date | string | null): any {
	if (!date) return null;
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return null;
	// Format as YYYY-MM-DD (simple date format)
	// Return as a special object that will be serialized as unquoted date
	return d.toISOString().split('T')[0];
}

// Prepare books for YAML output with proper date formatting
function prepareBooksForYaml(books: Book[]): any[] {
	return books.map(book => ({
		...book,
		date: formatDateForYaml(book.date),
		read: formatDateForYaml(book.read)
	}));
}

// Custom replacer to handle date strings without quotes
function yamlReplacer(key: string, value: any): any {
	// Check if value is a date string (YYYY-MM-DD format)
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		// Return a special marker object that we'll handle in post-processing
		return value;
	}
	return value;
}

// Write current.yaml with books that have no read date (currently reading)
const currentForYaml = prepareBooksForYaml(currentlyReading);
let currentYamlOutput = yaml.dump({ current: true, books: currentForYaml }, {
	quotingType: '"',
	forceQuotes: false,
	replacer: yamlReplacer
});
currentYamlOutput = currentYamlOutput.replace(/date: "(\d{4}-\d{2}-\d{2})"/g, 'date: $1');
currentYamlOutput = currentYamlOutput.replace(/read: "(\d{4}-\d{2}-\d{2})"/g, 'read: $1');
currentYamlOutput = currentYamlOutput.replace(/read: null/g, 'read: null');
await Deno.writeTextFile('./data/books/current.yaml', currentYamlOutput);
console.log(`Wrote current.yaml with ${currentlyReading.length} book(s) currently reading`);

// Write books for all years found (only books with a read date)
const years = Object.keys(booksbyyear).map(y => parseInt(y)).sort((a, b) => b - a);
for (const year of years) {
	const booksForYear = prepareBooksForYaml(booksbyyear[year] || []);
	let yamlOutput = yaml.dump({ year: year, books: booksForYear }, {
		quotingType: '"',
		forceQuotes: false,
		replacer: yamlReplacer
	});

	// Post-process to remove quotes from date fields
	// Replace quoted date strings in date: and read: fields
	yamlOutput = yamlOutput.replace(/date: "(\d{4}-\d{2}-\d{2})"/g, 'date: $1');
	yamlOutput = yamlOutput.replace(/read: "(\d{4}-\d{2}-\d{2})"/g, 'read: $1');
	yamlOutput = yamlOutput.replace(/read: null/g, 'read: null');

	await Deno.writeTextFile(
		`./data/books/${year}.yaml`,
		yamlOutput
	);
	console.log(`Wrote ${booksbyyear[year].length} books for year ${year}`);
}

console.log(`New books written down for ${years.length} year(s)`);

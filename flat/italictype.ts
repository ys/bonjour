import { readJSON, readImageFromURL, writeImage } from 'https://deno.land/x/flat@0.0.14/mod.ts'
import * as yaml from "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs"
import "https://deno.land/x/lodash@4.17.19/dist/lodash.js";

const _ = (self as any)._;
type IBook = {
	title: string
	page_count: number
	isbn_10: string
	isbn_13: string
	cover_image_url: string
	authors: string[]
	subtitle: string
	url: string
}
type IReview = {
	rating: number
}

type IResult = {
	book: IBook
	user_review: IReview
	created_at: Date
	started_reading_at: Date
	finished_reading_at: Date
};
type Book = {
	title: string
	author: string
	subtitle: string
	date: Date
	read: Date
	rating: number
	pages: number
	isbn: string
	isbn13: string
	cover_url: string
	reading: boolean
	url: string
};

interface BooksByYear {
	[index: number]: Book;
}
type YearBooks = {
	year: number
	books: Book[]
}
// Get the data filename as the first argument
const filename = Deno.args[0]
const data = await readJSON(filename)
const books = _.map(data.results, (b: IResult) => {
	return {
		title: b.book.title,
		subtitle: b.book.subtitle,
		author: b.book.authors[0],
		date: b.started_reading_at || b.created_at,
		read: b.finished_reading_at,
		rating: Math.ceil(b.user_review?.rating),
		isbn: b.book.isbn_10,
		isbn13: b.book.isbn_13,
		pages: b.book.page_count,
		cover_url: b.book.cover_image_url,
		reading: b.finished_reading_at == null,
		url: b.book.url
	}
}) as Book[]
const byYear = (b: Book) => {
	if (b.read == null) {
		return new Date().getFullYear()
	}
	return new Date(b.read).getFullYear()
}
const booksbyyear = _.groupBy(books, byYear) as BooksByYear
await Deno.writeTextFile("./data/books/2026.yaml", yaml.dump({ year: 2026, books: booksbyyear[2026] || [] }));

console.log("New books written down")

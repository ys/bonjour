import { readJSON } from 'https://deno.land/x/flat/mod.ts'
import { exists } from 'https://deno.land/std/fs/mod.ts'
import * as yaml from "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs"
import "https://deno.land/x/lodash@4.17.19/dist/lodash.js";

const _ = (self as any)._;
function newLetter(publish_date: Date, subject: String, secondary_id: Number, body: String) {
	return `
---
categories:
- lettre
date: ${publish_date}
newsletter: true
tags:
- la lettre
emoji: 💌
title: "${subject}"
color: jazzberry
slug: "${secondary_id}"
---
${body}
`
}
type Letter = {
	secondary_id: number
	body: string
	subject: string
	publish_date: Date
}
const filename = Deno.args[0]
const data = await readJSON(filename)
data.results.forEach((letter: Letter) => {
	let letterName = `./content/bonjour/${letter.secondary_id}/index.md`
	exists(letterName).then((exist) => {
		if (!exist) {
	                Deno.mkdirSync(`./content/bonjour/${letter.secondary_id}`)
			Deno.writeTextFileSync(letterName,
				newLetter(letter.publish_date, letter.subject, letter.secondary_id, letter.body));
		}
	}
	)

});
console.log("New newsletters written down")

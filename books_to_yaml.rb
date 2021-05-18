require "active_support/all"
require "yaml"
require "pp"

YAML_FRONT_MATTER_REGEXP = /\A(---\s*\n.*?\n?)^((---|\.\.\.)\s*$\n?)/m
files = Dir.glob("content/books/*.md")
files.to_a.map do |f|
	next if f == "_index.md"
  c = File.read(f)
	c =~ YAML_FRONT_MATTER_REGEXP
 	YAML.load($1).merge("slug" => File.basename(f, ".md"))
end.group_by { |book| (book["date"].class == String ? Date.parse(book["date"]) : book["date"]).year }.each do |year, books|
  dump="year: #{year}\nbooks:\n"
  books.sort_by { |c| c["date"] }.reverse.each do |book|
  dump += <<-FRONT
- title: "#{book["title"]}"
  author: "#{book["author"]}"
  isbn: "#{book["isbn"]}"
  isbn13: "#{book["isbn13"]}"
  rating: #{book["rating"]}
  pages: #{book["pages"]}
  date: "#{book["date"]}"
  read: "#{book["read"]}"
FRONT
  end
File.open("data/books/#{year}.yaml", "w") { |f| f << dump }
end


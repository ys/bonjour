require "active_support/all"
require "yaml"
require "pp"

books = YAML.load_file "data/books/read.yml"
books.each do |book|
  slug = book["title"].parameterize
  front = <<~FRONT
  ---
  title: "#{book["title"]}"
  author: "#{book["author"]}"
  isbn: "#{book["isbn"]}"
  isbn13: "#{book["isbn13"]}"
  rating: #{book["rating"]}
  pages: #{book["pages"]}
  read: "#{Date.parse(book["read"])}"
  added: "#{Date.parse(book["added"])}"
  ---
  #{book["review"]}
  FRONT
  File.open("content/books/#{slug}.md", "w") do |f|
    f.write(front)
  end
end

#!/usr/bin/env ruby
require "rubygems"
require "bundler/setup"
require "json"
require "yaml"
require "active_support/all"
Bundler.require(:default)
Dotenv.load

class Link
  attr_accessor :url, :tags, :uuid, :image, :description, :title, :created_at, :category, :notes, :image_name, :highlights

  def save
    file = "content/bookmarks/#{created_at.to_datetime.strftime('%Y-%m-%d-%H-%M')}-#{title.parameterize}.md"
    File.write(file, YAML.dump(to_h)+ "---\n#{notes}\n## highlights\n#{highlights.map{|h| '> '+h}.join("\n")}")
  end

  def to_h
    {
      "uuid" => uuid,
      "bookmarkOf" => url,
      "category" => category,
      "headImage" => image,
      "imageName" => image_name,
      "title" => title,
      "description" => description,
      "tags" => tags,
      "date" => created_at
    }
  end
end

yaml = YAML.load(File.read("data/liked.yml"))
puts File.read("data/liked.yml")
yaml.each do |liked|
  l = Link.new
  l.uuid = liked["id"]
  l.title = liked["title"]
  if l.title.empty?
    l.title = liked["generated_title"]
  end
  l.created_at = liked["created_at"]
  l.url = liked.dig("source", "url")
  l.description = liked["description"]
  l.image = liked.dig("image", "display", "url")
  l.image_name = liked.dig("image", "filename")
  l.notes = liked["notes"]
  l.highlights = liked["highlights"].map {|h| h["text"] }

  l.save
end


#!/usr/bin/env ruby
require "rubygems"
require "bundler/setup"
require "json"
require "yaml"
Bundler.require(:default)
Dotenv.load

Arena.configure do |config|
  config.access_token = ENV["ARENA_TOKEN"]
end

class Link
  attr_accessor :source, :title, :description, :image
end

all = []
i = 0 
loop do 
contents = Arena.get("/channels/1977086/contents?page=#{i}")["contents"]
all = all + contents
i += 1
puts contents.size
break unless contents.size > 0
end

all = all.reverse

all.reject! { |c| c.dig("source", "url").nil? }

all.each do |link|
  next if File.exist?("content/bookmarks/images/#{link.dig('image', 'filename')}")
  `wget -O content/bookmarks/images/#{link.dig('image', 'filename')} "#{link.dig('image', 'display', 'url')}"`
end

File.open("data/liked.yml", "w") { |file| file.write(YAML.dump(all)) }


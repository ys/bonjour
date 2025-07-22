#!/usr/bin/env ruby
require "rubygems"
require "bundler/setup"
Bundler.require(:default)
require 'net/http'
require 'json'
require 'uri'
Dotenv.load

# Your Readwise API token

# Define the base URL for the Readwise API
BASE_URL = 'https://readwise.io/api/v3/'

# Function to fetch highlights
def fetch_highlights(tag = nil)
  uri = URI("#{BASE_URL}list/")
  params = { 'page_size' => 100 }

  uri.query = URI.encode_www_form(params)
  
  # Setup the request
  request = Net::HTTP::Get.new(uri)
  puts ENV["READWISE_TOKEN"]
  request['Authorization'] = "Token #{ENV["READWISE_TOKEN"]}"

  # Make the request
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(request)
  end

  # Handle the response
  if response.code.to_i == 200
    data = JSON.parse(response.body)
    all_highlights = data['results']

    # Pagination: Fetch more pages if there are more results
    while data['next']
      uri = URI(data['next'])
      response = Net::HTTP.get(uri)
      data = JSON.parse(response)
      all_highlights += data['results']
    end

    if tag
      all_highlights.reject { |h| h["tags"][tag].nil? }
    else
      all_highlights
    end
  else
    puts "Failed to fetch data: #{response.code}"
    []
  end
end

def to_frontmatter(l)
  pp l
    {
      "uuid" => l["id"],
      "bookmarkOf" => l["source_url"],
      "category" => l["category"],
      "headImage" => l["image_url"],
      "title" => l["title"],
      "domain" => l["source_url"] ? URI.parse(l["source_url"]).host : "",
      "description" => l["summary"],
      "tags" => l["tags"].map{|k, v| k} || [],
      "date" => l["created"],
      "highlights" => l["notes"]
    }
end

# Function to extract 'liked' articles
def extract_liked_articles
  highlights = fetch_highlights('liked')

  liked_articles = highlights.map do |highlight|
      highlight
  end

  liked_articles
end

def to_md(r)
  header = (r["type"] == "video") ? "[#{r["domain"]}](#{r["link"]})" : "![](#{r["_id"]}.webp)"
  domain = (r["type"] == "video") ? r["domain"] : "[#{r["domain"]}](#{r["link"]})"
  ht = r["highlights"]
  file = <<~MD
    ---

    #{ht}
  MD
  YAML.dump(to_frontmatter(r)) + file
end

# Main script execution
liked_articles = extract_liked_articles

# Output the results
liked_articles.each do |article|
  puts to_md(article)
end

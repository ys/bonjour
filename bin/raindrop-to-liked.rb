#!/usr/bin/env ruby

require "rubygems"
require "bundler/setup"
require "json"
require "yaml"
require "active_support/all"
require "fileutils"
Bundler.require(:default)
Dotenv.load

class Preview
  class NoWebPage < StandardError; end
  class NotImplementedError < StandardError; end
  attr_reader :web_content, :to_json
  attr_accessor :url, :image, :description, :title, :content, :tags

  def initialize(url)
    @url = url
  end

end

class MercuryPreview < Preview
  def fetch
    mercury = JSON.parse(`yarn run -s postlight-parser --header.User-Agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36" --format markdown "#{url}"`)
    raise NoWebPage if mercury["error"].present?
    @image = mercury["lead_image_url"]
    @description = mercury["excerpt"]
    @title = mercury["title"]
    @content = mercury["content"]
    true
  end
end

class Raindrop
  attr_accessor :token

  def initialize(token)
    @token = token
  end

  def collections
    get("/collections/all")["items"]
  end

  def parse(url)
    get("/import/url/parse", url: url)["item"]
  end

  def raindrops(search = nil)
    drops = []
    page = 0
    query = { page: page }
    query[:search] = search if search
    loop do
      resp = get("/raindrops/0", query)
      drops = drops.concat(resp["items"])
      break if resp["items"] == []
      page +=1
      query[:page] = page
    end
    drops
  end

  def liked
    raindrops("#💖")
  end

  def get(path, query = nil)
    JSON.parse(client.get(path: base_path + path, query: query).body)
  end

  def base_path
    "/rest/v1"
  end

  def client
    @client ||= Excon.new("https://api.raindrop.io/", headers: { "Authorization" => "Bearer #{token}" })
  end
end

class Downloader
  def download_covers
    path = "#{destination}/images"
    FileUtils.rm_rf(Dir.glob("#{path}/*"))
    Dir.chdir(path) do
      raindrop.raindrops.each do |r|
        `wget -O "#{r["_id"]}" "#{r["cover"]}"`
      end
      `mogrify -resize 1000x1000 -format webp *`
    end
  end

  def download_liked
    liked = raindrop.liked
    liked.each do |l|
      puts "📄 #{l["title"]}"
      e = raindrop.parse(l["link"])
      l["parsed"] = e
    end
    File.write("data/liked.yml", YAML.dump(liked))
  end

  def force?
    ENV["FORCE"]
  end

  def process_liked
    if !File.exist?("data/liked.yml") || force?
      download_liked
    end
    liked = YAML.load(File.read("data/liked.yml"))

    path = "content/bookmarks"
    liked.each do |l|
      puts "📄 #{l["title"]}"
      md = to_md(l)
      filename = l["title"].parameterize
      File.write("#{path}/#{filename[0..50]}-#{l["_id"]}.md", md)

      Dir.chdir(path+ "/images") do
        unless File.exist?("#{l["_id"]}.webp") || File.exist?("#{l["_id"]}")
          system("wget --retry-connrefused  --read-timeout=10 --timeout=10 -O \"#{l["_id"]}\" \"#{l["cover"]}\"")
          if $? != 0
            mp = MercuryPreview.new(l["link"])
            begin
              mp.fetch
              system("wget --retry-connrefused  --read-timeout=10 --timeout=10 -O \"#{l["_id"]}\" \"#{mp.image}\"")
            rescue StandardError => e
              puts e
            end
          end
        end
      end
    end
    Dir.chdir(path+ "/images") do
      `mogrify -resize 1000x1000 -format webp *`
      `find . -type f ! -iname "index.md" ! -iname "*.webp" -delete`
    end
  end

  def to_frontmatter(l)
    {
      "uuid" => l["_id"],
      "bookmarkOf" => l["link"],
      "category" => l["type"],
      "headImage" => l["cover"],
      "title" => l["title"],
      "domain" => l["domain"],
      "description" => l["excerpt"] || l.dig("parsed", "excerpt"),
      "tags" => l.dig("meta", "tags").to_a + l.dig("parsed", "meta", "tags"),
      "date" => l["created"],
      "highlights" => l["highlights"].any? ? l["highlights"].map {|h| h["text"] }.join("\n") : nil
    }
  end

  def download_all
    all = raindrop.collections
    drops = raindrop.raindrops
    drops.each do |d|
    end
    all.each do |c|
      c["raindrops"] = drops.select { |d| d.dig("collection", "$id") == c["_id"] }
    end
    root = all.select { |c| c["parent"].nil? }
    root.each do |p|
      p["children"] = all.select { |c| c.dig("parent", "$id") == p["_id"] }
    end
    root.each do |c|
      path = "#{destination}/#{c["title"]}"
      FileUtils.rm_rf(Dir.glob("#{path}/*"))
      Dir.mkdir path unless File.exist?(path)
      c["raindrops"].each do |r|
        r = r.merge(raindrop.parse(r["link"]))
        md = to_md(r)
        filename = r["title"].parameterize
        File.write("#{path}/#{filename[0..50]}-#{r["_id"]}.md", md)
      end
      c["children"].each do |k|
        path = path + "/" + k["title"]
        Dir.mkdir path unless File.exist?(path)
        k["raindrops"].each do |r|
          r = r.merge(raindrop.parse(r["link"]))
          md = to_md(r)
          filename = r["title"].parameterize
          File.write("#{path}/#{filename[0..50]}-#{r["_id"]}.md", md)
        end
      end
    end
  end

  def to_md(r)
    header = (r["type"] == "video") ? "[#{r["domain"]}](#{r["link"]})" : "![](#{r["_id"]}.webp)"
    domain = (r["type"] == "video") ? r["domain"] : "[#{r["domain"]}](#{r["link"]})"
    ht = ""
    if r["highlights"].any?
      ht = "## Highlights\n" + r["highlights"].map {|h| h["text"] }.join("\n")
    end
    file = <<~MD
    ---

    #{r["ht"]}
    MD
    YAML.dump(to_frontmatter(r)) + file
  end

  def destination
    ENV["DESTINATION"]
  end

  def raindrop
    @raindrop ||= Raindrop.new(ENV["RAINDROP_TOKEN"])
  end
end

# Downloader.new.download_all
Downloader.new.process_liked


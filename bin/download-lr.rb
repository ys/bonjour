require "net/http"
require "json"
require "date"
require "uri"
require "yaml"

class Downloader
  def initialize(space_id, album_id, year)
    @space_id = space_id
    @album_id = album_id
    @year = year
  end

  def run
    resp = Net::HTTP.get(URI(asset_url))
    resp = resp.sub("while (1) {}", "")
    `mkdir -p data/daily`
    File.open("data/daily/#{@year}.json", "w") { |file| file.write(JSON.dump(JSON.parse(resp))) }
    assets = JSON.parse(resp)["resources"]
    `mkdir -p content/daily/#{@year}`
    assets #.sort_by { |a| DateTime.parse(a["payload"]["captureDate"]) }
      .each_with_index do |a,i|
        `wget -O content/daily/#{@year}/#{i.to_s.rjust(3, "0")}.jpg https://photos.adobe.io/v2/spaces/#{@space_id}/#{a["asset"]["links"]["/rels/rendition_type/2048"]["href"]}`
      end
  end

  def asset_url
    "https://lightroom.adobe.com/v2/spaces/#{@space_id}/albums/#{@album_id}/assets?embed=asset%3Buser&order_after=-&exclude=incomplete&subtype=image%3Bvideo%3Blayout_segment&limit=1000"
  end
end

daily = YAML.load(File.read("data/daily.yaml"), symbolize_names: true)

daily[:years].each do |year, info|
  Downloader.new(info[:space_id], info[:album_id], year).run
end

require "net/http"
require "json"
require "date"
require "uri"
require "yaml"

class Downloader
  def initialize(space_id, album_id)
    @space_id = space_id
    @album_id = album_id
  end

  def run
    resp = Net::HTTP.get(URI(asset_url))
    resp = resp.sub("while (1) {}", "")
    File.open("data/daily-album.json", "w") { |file| file.write(JSON.dump(JSON.parse(resp))) }
    assets = JSON.parse(resp)["resources"]
    assets #.sort_by { |a| DateTime.parse(a["payload"]["captureDate"]) }
      .each_with_index do |a,i|
        # capture date first, so sorting by name is chronological: 2026-03-14-lr-007.jpg
        date = (a.dig("asset", "payload", "captureDate") || a.dig("payload", "captureDate") || "0000-00-00")[0, 10]
        `wget -O content/daily/#{date}-lr-#{i.to_s.rjust(3, "0")}.jpg https://lightroom.adobe.com/v2c/spaces/#{@space_id}/#{a["asset"]["links"]["/rels/rendition_type/2048"]["href"]}`
      end
  end

  def asset_url
    "https://lightroom.adobe.com/v2/spaces/#{@space_id}/albums/#{@album_id}/assets?embed=asset%3Buser&order_after=-&exclude=incomplete&subtype=image%3Bvideo%3Blayout_segment&limit=1000"
  end
end

daily = YAML.load(File.read("data/daily.yaml"), symbolize_names: true)
Downloader.new(daily[:space_id], daily[:album_id]).run

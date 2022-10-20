require "net/http"
require "json"
require "date"
require "uri"

class Downloader
  def initialize(space_id, album_id)
    @space_id = space_id
    @album_id = album_id
  end

  def run
    resp = Net::HTTP.get(URI(asset_url))
    resp = resp.sub("while (1) {}", "")
    assets = JSON.parse(resp)["resources"]
    assets #.sort_by { |a| DateTime.parse(a["payload"]["captureDate"]) }
      .each_with_index do |a,i|
        `wget -O content/everyday/#{i.to_s.rjust(3, "0")}.jpg https://photos.adobe.io/v2/spaces/#{@space_id}/#{a["asset"]["links"]["/rels/rendition_type/1280"]["href"]}`
      end
  end

  def asset_url
    "https://lightroom.adobe.com/v2/spaces/#{@space_id}/albums/#{@album_id}/assets?embed=asset%3Buser&order_after=-&exclude=incomplete&subtype=image%3Bvideo%3Blayout_segment&limit=1000"
  end
end

Downloader.new(ARGV[0], ARGV[1]).run

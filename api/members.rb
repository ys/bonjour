require 'active_record'
require 'mysql2'

ActiveRecord::Base.establish_connection(
  adapter:  'mysql2',
  host:     ENV["PLANETSCALE_DB_HOST"],
  username: ENV["PLANETSCALE_DB_USERNAME"],
  password: ENV["PLANETSCALE_DB_PASSWORD"],
  database: ENV["PLANETSCALE_DB"]
)

class Member < ActiveRecord::Base
end

Handler = Proc.new do |req, res|
  res.status = 200
  res['Content-Type'] = 'application/json; charset=utf-8'
  res.body = Member.all.order(name: :asc).pluck(:name).to_json
end

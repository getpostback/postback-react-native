require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
repository = package["repository"]
repository_url = repository.is_a?(Hash) ? repository["url"] : repository
repository_url = repository_url&.sub(/^git\+/, "")

raise "package.json repository.url must be set" if repository_url.nil? || repository_url.empty?

Pod::Spec.new do |s|
  s.name         = "postback-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => repository_url, :tag => "v#{s.version}" }

  s.source_files = "ios/PostbackBridge.{swift,m}"
  s.swift_version = "5.0"

  s.dependency "React-Core"

  s.ios.vendored_frameworks = "ios/PostbackSDK.xcframework"
  s.frameworks = "Foundation", "UIKit", "CryptoKit"
  s.weak_frameworks = "AdServices"
end

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "exceptionless-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/exceptionless/Exceptionless.JavaScript"
  s.license      = { :type => "Apache-2.0", :file => "LICENSE" }
  s.author       = { "Exceptionless" => "https://exceptionless.com" }
  s.source       = { :git => "https://github.com/exceptionless/Exceptionless.JavaScript.git", :tag => "v#{s.version}" }

  s.ios.deployment_target = "14.0"

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.dependency "PLCrashReporter", "~> 1.11"

  s.frameworks = "Foundation", "UIKit"

  s.requires_arc = true

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }
end

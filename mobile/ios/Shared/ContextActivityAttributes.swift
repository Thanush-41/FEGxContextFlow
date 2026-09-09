import Foundation
import ActivityKit

@available(iOS 16.2, *)
struct ContextActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var microphoneMuted:Bool?;var title:String;var score:String;var stage:String;var status:String;var lastAction:String;var selections:Int;var review:String?;var receipt:String?;var updatedAt:Date
    init(_ snapshot:[String:Any]) {
      microphoneMuted=snapshot["microphoneMuted"] as? Bool
      title=snapshot["title"] as? String ?? "ContextFlow"
      score=snapshot["score"] as? String ?? "";stage=snapshot["stage"] as? String ?? ""
      status=snapshot["status"] as? String ?? "idle";lastAction=snapshot["lastAction"] as? String ?? "Start voice control to continue."
      selections=snapshot["selectionCount"] as? Int ?? 0;review=snapshot["review"] as? String;receipt=snapshot["receipt"] as? String
      let iso=ISO8601DateFormatter();iso.formatOptions=[.withInternetDateTime,.withFractionalSeconds]
      let raw=snapshot["updatedAt"] as? String ?? ""
      updatedAt=iso.date(from:raw) ?? ISO8601DateFormatter().date(from:raw) ?? .distantPast
    }
  }
  var title:String="ContextFlow"
}

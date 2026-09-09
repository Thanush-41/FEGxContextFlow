import Foundation

// One response owns a turn. A newer instruction waits only for cancellation,
// never for tools from the abandoned turn. Used by the native audio coordinator.
struct VoiceTurnGate {
  private(set) var turn = 0
  private(set) var responseTurn = 0
  private(set) var responseID: String?
  private(set) var active = false
  private(set) var tools = false
  private(set) var pending = false
  private var handled = Set<String>()
  mutating func interrupt() -> Bool {
    turn += 1; pending = false; tools = false
    return active
  }
  mutating func request() -> Bool {
    pending = true
    return drain()
  }
  mutating func drain() -> Bool {
    guard pending, !active, !tools else { return false }
    pending = false; active = true; responseTurn = turn; responseID = nil
    return true
  }
  mutating func created(_ id: String) -> Bool {
    guard active else { return true }
    responseID = id
    return responseTurn != turn
  }
  // nil = duplicate/stale response, false = cancelled turn, true = current turn.
  mutating func done(_ id: String) -> Bool? {
    guard active, !handled.contains(id), responseID == nil || responseID == id else { return nil }
    handled.insert(id)
    if handled.count > 128 { handled = [id] }
    active = false; responseID = nil
    return responseTurn == turn
  }
  mutating func beginTools() { tools = true }
  mutating func endTools(_ epoch: Int) -> Bool {
    guard epoch == turn else { return false }
    tools = false; return true
  }
  mutating func reset() { self = VoiceTurnGate(turn: turn + 1) }
}

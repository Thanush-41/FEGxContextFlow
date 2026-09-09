package com.contextflow.prototype
import org.junit.Assert.*
import org.junit.Test
class VoiceTurnGateTest {
 @Test fun batchesFinishBeforeOneReply(){val g=VoiceTurnGate();assertTrue(g.request());assertFalse(g.created("a"));assertEquals(true,g.done("a"));g.beginTools();assertFalse(g.request());assertTrue(g.endTools(g.turn));assertTrue(g.drain());assertFalse(g.drain());g.created("b");assertEquals(true,g.done("b"));assertNull(g.done("b"));assertTrue(g.request())}
 @Test fun interruptionCannotReplayOldTools(){val g=VoiceTurnGate();g.request();val old=g.turn;assertTrue(g.interrupt());assertFalse(g.request());assertTrue(g.created("old"));assertEquals(false,g.done("old"));assertTrue(g.drain());assertFalse(g.endTools(old));g.created("new");assertNull(g.done("old"));assertEquals(true,g.done("new"));g.reset();assertTrue(g.request())}
}

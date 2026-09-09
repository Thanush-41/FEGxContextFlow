package com.contextflow.prototype

internal class VoiceTurnGate {
  var turn=0; private set
  var responseTurn=0; private set
  var responseId:String?=null; private set
  var active=false; private set
  var tools=false; private set
  var pending=false; private set
  private val handled=mutableSetOf<String>()
  fun interrupt():Boolean {turn++;pending=false;tools=false;return active}
  fun request():Boolean {pending=true;return drain()}
  fun drain():Boolean {
    if(!pending||active||tools)return false
    pending=false;active=true;responseTurn=turn;responseId=null;return true
  }
  fun created(id:String):Boolean {if(!active)return true;responseId=id;return responseTurn!=turn}
  fun done(id:String):Boolean? {
    if(!active||handled.contains(id)||(responseId!=null&&responseId!=id))return null
    handled.add(id);if(handled.size>128){handled.clear();handled.add(id)}
    active=false;responseId=null;return responseTurn==turn
  }
  fun beginTools(){tools=true}
  fun endTools(epoch:Int):Boolean {if(epoch!=turn)return false;tools=false;return true}
  fun reset(){turn++;active=false;tools=false;pending=false;responseId=null;handled.clear()}
}

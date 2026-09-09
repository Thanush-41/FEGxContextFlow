package com.contextflow.prototype
import android.app.Service
import android.content.Intent
import android.os.IBinder
class VoiceService:Service(){
 override fun onCreate(){super.onCreate();VoiceEngine.init(this)}
 override fun onStartCommand(intent:Intent?,flags:Int,startId:Int):Int {
  when(intent?.action){"stop"->{VoiceEngine.stop();stopSelf()};"mute"->VoiceEngine.mute(!VoiceEngine.muted);else->{startForeground(902,VoiceEngine.notification());VoiceEngine.start()}}
  return START_NOT_STICKY
 }
 override fun onBind(intent:Intent?):IBinder?=null
 override fun onDestroy(){VoiceEngine.serviceDestroyed();super.onDestroy()}
}

package com.contextflow.prototype
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import org.json.JSONObject

class ContextFlowVoiceModule(private val context:ReactApplicationContext):ReactContextBaseJavaModule(context){
 init{VoiceEngine.init(context);VoiceEngine.react=context}
 override fun getName()="ContextFlowVoice"
 override fun getConstants():Map<String,Any> = mapOf("defaultApiUrl" to VoiceCredentials.baseUrl)
 @ReactMethod fun getCredentials(promise:Promise){promise.resolve(Arguments.createMap().apply{putString("baseUrl",VoiceCredentials.baseUrl);putString("token",VoiceCredentials.token)})}
 @ReactMethod fun configure(base:String,token:String,promise:Promise){context.runOnUiQueueThread{VoiceEngine.configure(base,token);promise.resolve(null)}}
 @ReactMethod fun start(promise:Promise){context.runOnUiQueueThread{
   val begin={try{val intent=Intent(context,VoiceService::class.java);if(Build.VERSION.SDK_INT>=26)context.startForegroundService(intent)else context.startService(intent);promise.resolve(null)}catch(e:Exception){promise.reject("voice_start",e.message)}}
   if(context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)begin()
   else{val activity=context.currentActivity as? PermissionAwareActivity;if(activity==null){promise.reject("voice_permission","Open ContextFlow to enable microphone access.");return@runOnUiQueueThread};val permissions=if(Build.VERSION.SDK_INT>=33)arrayOf(Manifest.permission.RECORD_AUDIO,Manifest.permission.POST_NOTIFICATIONS)else arrayOf(Manifest.permission.RECORD_AUDIO);activity.requestPermissions(permissions,940,PermissionListener{_,_,grants->if(grants.firstOrNull()==PackageManager.PERMISSION_GRANTED)begin()else promise.reject("voice_permission","Microphone permission is required.");true})}
 }}
 @ReactMethod fun sendText(text:String,promise:Promise){context.runOnUiQueueThread{try{VoiceEngine.sendText(text);promise.resolve(null)}catch(e:Exception){promise.reject("voice_text",e.message)}}}
 @ReactMethod fun syncState(value:String,promise:Promise){context.runOnUiQueueThread{try{VoiceEngine.accept(JSONObject().put("result",JSONObject(value)));promise.resolve(null)}catch(e:Exception){promise.reject("voice_state",e.message)}}}
 @ReactMethod fun stop(promise:Promise){context.runOnUiQueueThread{VoiceEngine.stop();promise.resolve(null)}}
 @ReactMethod fun setMuted(value:Boolean,promise:Promise){context.runOnUiQueueThread{VoiceEngine.mute(value);promise.resolve(null)}}
 @ReactMethod fun readReview(value:String,promise:Promise){context.runOnUiQueueThread{try{VoiceEngine.readReview(JSONObject(value));promise.resolve(null)}catch(e:Exception){promise.reject("voice_review",e.message)}}}
 @ReactMethod fun addListener(name:String){}
 @ReactMethod fun removeListeners(count:Int){}
}
class ContextFlowVoicePackage:ReactPackage{
 override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(ContextFlowVoiceModule(context))
 override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}

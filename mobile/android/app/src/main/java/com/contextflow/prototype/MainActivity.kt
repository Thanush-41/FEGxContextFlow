package com.contextflow.prototype

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  private val widgetVoicePermissionRequest=941

  override fun onCreate(savedInstanceState: android.os.Bundle?) { super.onCreate(savedInstanceState); VoiceEngine.init(this); handleContextIntent(intent) }
  override fun onNewIntent(intent: android.content.Intent) { super.onNewIntent(intent); setIntent(intent); handleContextIntent(intent) }
  private fun handleContextIntent(incoming: android.content.Intent?) {
    if(incoming?.action == android.content.Intent.ACTION_SEND) incoming.getStringExtra(android.content.Intent.EXTRA_TEXT)?.let { VoiceEngine.share(it) }
    if(incoming?.action == "voice" || incoming?.data?.host == "voice") {
      if(checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
        startVoiceService()
      } else requestPermissions(arrayOf(android.Manifest.permission.RECORD_AUDIO),widgetVoicePermissionRequest)
    }
  }
  private fun startVoiceService(){val service=android.content.Intent(this,VoiceService::class.java);if(android.os.Build.VERSION.SDK_INT>=26)startForegroundService(service)else startService(service)}
  override fun onRequestPermissionsResult(requestCode:Int,permissions:Array<out String>,grantResults:IntArray){super.onRequestPermissionsResult(requestCode,permissions,grantResults);if(requestCode==widgetVoicePermissionRequest&&grantResults.firstOrNull()==android.content.pm.PackageManager.PERMISSION_GRANTED)startVoiceService()}

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ContextFlow"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}

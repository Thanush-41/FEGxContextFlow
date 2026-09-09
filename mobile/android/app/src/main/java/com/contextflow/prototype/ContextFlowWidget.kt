package com.contextflow.prototype
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
class ContextFlowWidget:AppWidgetProvider(){
 override fun onUpdate(context:Context,manager:AppWidgetManager,ids:IntArray){update(context,manager,ids)}
 companion object{
  fun updateAll(context:Context){val manager=AppWidgetManager.getInstance(context);update(context,manager,manager.getAppWidgetIds(ComponentName(context,ContextFlowWidget::class.java)))}
  private fun update(context:Context,manager:AppWidgetManager,ids:IntArray){
   val data=JSONObject(context.getSharedPreferences("contextflow-widget",Context.MODE_PRIVATE).getString("snapshot","{}")?:"{}")
   for(id in ids){val view=RemoteViews(context.packageName,R.layout.contextflow_widget);view.setTextViewText(R.id.widget_title,data.optString("title","ContextFlow"));view.setTextViewText(R.id.widget_status,data.optString("status","Ready").uppercase());view.setTextViewText(R.id.widget_detail,data.optString("lastAction","Continue your task by voice."));val pending=PendingIntent.getActivity(context,7,Intent(context,MainActivity::class.java).setAction("voice").setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT);view.setOnClickPendingIntent(R.id.widget_voice,pending);manager.updateAppWidget(id,view)}
  }
 }
}

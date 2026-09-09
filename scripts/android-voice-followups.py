"""Real Android UI + Azure text turns on one native voice connection."""
import os, time, json
from pathlib import Path
os.environ['CONTEXTFLOW_ANDROID_QA_OUT']='artifacts/android-final-voice'
helper=Path(__file__).with_name('android-smoke.py')
scope={'__file__':str(helper),'__name__':'helpers'}
exec(helper.read_text().split('\ntry:\n')[0],scope)
adb,ui,tap,find,shot,OUT=[scope[x] for x in ['adb','ui','tap','find','shot','OUT']]
passed=[]
try:
 adb('shell','am','force-stop','com.contextflow.prototype')
 adb('shell','am','start','-n','com.contextflow.prototype/.MainActivity');time.sleep(1)
 if find(ui(),'sign-in-button') is not None:tap('sign-in-button')
 for tab in ['today','sports','casino','menu','live']:tap('tab-'+tab)
 passed.append('Five tabs after fresh launch using the hosted backend')
 tap('start-voice-card')
 for _ in range(12):
  labels=[n.get('text') for n in ui().iter('node')]
  if any(x in labels for x in ['Listening','Speaking','Thinking']):break
  time.sleep(1)
 else:raise RuntimeError('Native voice did not connect')
 tap('Mute microphone')
 for command,amount in [('set my stake to five','5.00'),('change that to ten','10.00'),('change that to three','3.00')]:
  tap('Type an instruction',True);adb('shell','input','text',command.replace(' ','%s'));adb('shell','input','keyevent','4');tap('Send instruction',True)
  for _ in range(3):adb('shell','input','swipe','540','650','540','1910','250')
  for _ in range(8):
   if any('Stake set to '+amount in n.get('text','') for n in ui().iter('node')):break
   time.sleep(.5)
  else:raise RuntimeError('Instruction did not produce stake '+amount)
  passed.append('Warm native instruction sets '+amount+' credits')
 shot('consecutive-instructions');tap('End voice session',True);passed.append('Stop remains available');adb('shell','input','keyevent','4')
 report={'at':time.strftime('%Y-%m-%dT%H:%M:%S'),'passed':passed,'input':'Typed through the native Azure WebRTC channel; emulator microphone muted','physicalAndroid':False,'ok':True}
except Exception as e:
 shot('failure');report={'passed':passed,'error':str(e),'ok':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
raise SystemExit(0 if report['ok'] else 1)

"""Observed native UI automation on the connected Android emulator; no audio transcript injection."""
import json, os, re, subprocess, sys, time, xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ADB=os.environ.get('ADB','/opt/homebrew/share/android-commandlinetools/platform-tools/adb')
OUT=ROOT/os.environ.get('CONTEXTFLOW_ANDROID_QA_OUT','artifacts/android-qa');OUT.mkdir(parents=True,exist_ok=True)
resume='--resume' in sys.argv
passed=json.loads((OUT/'report.json').read_text()).get('passed',[]) if resume else []
def adb(*args,timeout=25):return subprocess.check_output([ADB,*args],timeout=timeout,stderr=subprocess.STDOUT)
def ui():
    for _ in range(2):
        try:
            adb('shell','uiautomator','dump','--compressed','/sdcard/contextflow-qa.xml',timeout=16)
            data=adb('exec-out','cat','/sdcard/contextflow-qa.xml');(OUT/'latest.xml').write_bytes(data);return ET.fromstring(data)
        except (subprocess.SubprocessError,ET.ParseError):time.sleep(.5)
    raise RuntimeError('Android accessibility snapshot unavailable')
def find(tree,label):
    parents={c:p for p in tree.iter() for c in p}
    nodes=list(tree.iter('node'))
    chosen=next((n for n in nodes if n.get('resource-id')==label),None)
    if chosen is None: chosen=next((n for n in nodes if n.get('content-desc','').lower()==label.lower() or n.get('text','').lower()==label.lower()),None)
    if chosen is None:return None
    while chosen.get('clickable')!='true' and chosen in parents:chosen=parents[chosen]
    return chosen
def tap(label,scroll=False):
    for _ in range(7 if scroll else 2):
        n=find(ui(),label)
        if n is not None:
            x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds','')))
            if y2>y1 and y1<2330:
                adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.5);return
        if scroll:adb('shell','input','swipe','540','1910','540','650','350')
        else:time.sleep(.5)
    raise RuntimeError('Control unavailable: '+label)
def has(label):return any(n.get('text')==label or n.get('content-desc')==label for n in ui().iter('node'))
def shot(name): (OUT/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
def success(name):passed.append(name);print('PASS '+name,flush=True)
try:
    if not resume:
        adb('shell','am','start','-n','com.contextflow.prototype/.MainActivity');time.sleep(1)
        if find(ui(),'sign-in-button') is not None:tap('sign-in-button')
        for tab in ['today','sports','casino','menu','live']:
            tap('tab-'+tab);shot(tab)
        success('Blank demo sign-in and all five destinations')
        tap('theme-toggle');shot('light');tap('theme-toggle');success('Light/dark switch')
        for game,button,prefix in [('dice','Roll the dice','Rolled'),('cards','Draw a card','Drew'),('rocket','Launch the rocket','Flight')]:
            tap('tab-casino');tap('game-open-'+game,True);time.sleep(1);tap(button,True);time.sleep(1)
            assert any(n.get('text','').startswith(prefix) for n in ui().iter('node')),'Game result missing'
            shot(game)
        success('All three casino games load and complete a demo round')
    if not resume:
        tap('tab-menu');tap('open-arena');tap('Copy Slip',True);tap('I reviewed the current odds',True);tap('copy-add-button',True)
    if len(passed)<4:
        assert any(n.get('text','').startswith('Your bet slip') for n in ui().iter('node')),'Copied slip missing'
        shot('arena-copy');success('Arena preview, odds acceptance and Copy Slip')
        tap('Clear all',True)
    tap('Clear all');tap('tab-live')
    start=time.monotonic();tap('start-voice-card')
    for _ in range(8):
        if has('Listening') or has('Speaking') or has('Thinking'):break
        time.sleep(1)
    else:raise RuntimeError('Azure voice did not connect')
    voice_seconds=round(time.monotonic()-start,2);shot('voice-connected')
    tap('Mute microphone');assert has('Microphone muted');shot('voice-muted')
    adb('shell','input','keyevent','3');time.sleep(2)
    services=adb('shell','dumpsys','activity','services','com.contextflow.prototype').decode()
    assert 'isForeground=true' in services and 'VoiceService' in services
    adb('shell','cmd','statusbar','expand-notifications');time.sleep(.5);shot('ongoing-notification');adb('shell','cmd','statusbar','collapse')
    success('Azure voice, mute and microphone foreground service while Home is visible')
    adb('shell','am','start','-n','com.contextflow.prototype/.MainActivity');time.sleep(1);tap('End voice session')
    success('End voice session')
    report={'passed':passed,'voiceTapToObservedStateSeconds':voice_seconds,'audioRecognition':'Not tested: emulator has no human microphone input','device':'Android emulator only','ok':True}
except Exception as e:
    shot('failure');report={'passed':passed,'error':str(e),'ok':False};print(str(e),flush=True)
(OUT/'report.json').write_text(json.dumps(report,indent=2))
raise SystemExit(0 if report['ok'] else 1)

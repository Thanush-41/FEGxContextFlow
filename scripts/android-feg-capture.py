"""Observed native UI automation on the connected Android emulator; no audio transcript injection."""
import json, os, re, subprocess, sys, time, xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ADB=os.environ.get('ADB','/opt/homebrew/share/android-commandlinetools/platform-tools/adb')
OUT=ROOT/os.environ.get('CONTEXTFLOW_ANDROID_QA_OUT','submission/working/android-capture');OUT.mkdir(parents=True,exist_ok=True)
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
    adb('shell','am','start','-n','com.contextflow.prototype/.MainActivity');time.sleep(2)
    if find(ui(),'sign-in-button') is not None:tap('sign-in-button')
    tap('tab-menu');tap('App settings',True);shot('01-settings-consent')
    tap('Use eligible-adult sample',True);time.sleep(2);shot('02-synthetic-register')
    tap('tab-live');shot('03-home-sample')
    print('Captured the updated Android emulator controls and sample-only home.',flush=True)
except Exception as e:
    shot('failure');print(str(e),flush=True);raise

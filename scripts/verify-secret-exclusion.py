"""Compare private Azure values against distributable artifacts without printing them."""
from pathlib import Path
import json, tarfile, zipfile
root=Path(__file__).resolve().parents[1]
values={}
for line in ((root/'server/.env').read_text()+'\n'+(root/'mobile/.env').read_text()).splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key,value=line.split('=',1)
        if key not in ['CASINO_SUPABASE_URL','SUPABASE_URL'] and value.strip(): values[key]=value.strip().strip('"\'').encode()
hits=[];checked=0
def scan(name,data):
    global checked
    checked+=1
    for key,value in values.items():
        if value in data: hits.append({'file':str(name),'setting':key})
for build in ['ios', 'ios-voice-qa']:
    app=root/f'mobile/build/{build}/Build/Products/Release-iphoneos/ContextFlow.app'
    if app.exists():
        for file in app.rglob('*'):
            if file.is_file(): scan(file.relative_to(root),file.read_bytes())
apk=root/'mobile/android/app/build/outputs/apk/release/app-release.apk'
if apk.exists():
    with zipfile.ZipFile(apk) as bundle:
        for name in bundle.namelist(): scan('APK/'+name,bundle.read(name))
for backup in (root/'backups').glob('*.tar.gz'):
    with tarfile.open(backup) as archive:
        for member in archive:
            if member.isfile(): scan(backup.name+'/'+member.name,archive.extractfile(member).read())
scan('edge-function', (root/'supabase/functions/contextflow-api/index.ts').read_bytes())
report={'settingsCompared':list(values),'filesChecked':checked,'matches':hits,'passed':not hits}
(root/'artifacts').mkdir(exist_ok=True)
(root/'artifacts/secret-exclusion.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
raise SystemExit(1 if hits else 0)

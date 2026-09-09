import React,{useState} from 'react';
import {View,Text,Pressable,StyleSheet,TextInput,Linking,ActivityIndicator,Keyboard,ScrollView} from 'react-native';
import {Icon} from './icons';
import {Palette,brand} from './theme';
import {agent} from './agent';
import {GlassSurface} from './GlassSurface';

type Props={c:Palette;onOpen:()=>void;onError:(s:string)=>void};
const active=()=>!['idle','ended','offline'].includes(agent.voice.status);
export function VoiceEntry({c}:Props){
 const running=active(),session=agent.session,event=agent.events.find(e=>e.id===session?.eventId);
 return <Pressable testID="start-voice-card" accessibilityRole="button" accessibilityLabel={running?'Voice control is active':session?.eventId?'Continue your voice session':'Start voice control'} onPress={()=>{Keyboard.dismiss();if(!running)agent.start().catch(e=>agent.voiceError(e.message));else if(agent.voice.muted)agent.mute().catch(e=>agent.voiceError(e.message));}} style={({pressed})=>[v.entry,{backgroundColor:c.tint,borderColor:c.line,opacity:pressed?0.8:1}]}>
  <View style={[v.orb,{backgroundColor:running?c.panel2:brand}]}><Icon name={running?'live':'mic'} color={running?c.accent:'#fff'} size={24}/></View>
  <View style={v.flex}><Text style={[v.eyebrow,{color:c.accent}]}>CONTEXTFLOW VOICE</Text><Text style={[v.title,{color:c.text}]}>{running?'Keep browsing. Just ask.':session?.eventId?'Continue with this match':'Your matchday, hands-free.'}</Text><Text style={[v.sub,{color:c.muted}]}>{running?'Your mic and responses stay below.':event?`${event.a} · ${event.b}`:'Try “Show me live matches today”'}</Text></View>
 </Pressable>;
}
export function VoiceDock({c,onOpen,onSlip}:{c:Palette;onOpen:()=>void;onError:(s:string)=>void;onSlip:()=>void}){
 const running=active(),voice=agent.voice,session=agent.session,thinking=voice.status==='thinking',connecting=voice.status==='connecting';
 const title=voice.error?'Connection needs attention':connecting?'Connecting…':voice.muted?'Mic paused':voice.recording?'Listening to you…':thinking?(voice.action?'Action received':'Taking action…'):voice.status==='speaking'?'ContextFlow is speaking':voice.status==='review'?'Review, then confirm':running?'Listening':'Talk to ContextFlow';
 const mic=async()=>{Keyboard.dismiss();try{if(running){if(!connecting)await agent.mute();}else await agent.start();}catch(e){agent.voiceError((e as Error).message);}};
 const response=voice.error||session?.review?.dialog||voice.action||voice.reply||(thinking?'Working on your request…':session?.unresolvedQuestion||session?.lastAction);
 return <View testID="voice-dock" style={[v.dock,{borderColor:c.line,shadowColor:'#000'}]}>
  <GlassSurface c={c}/>
  {(running||voice.error)&&<View style={v.transcriptArea}>
   <View style={[v.row,{justifyContent:'space-between',marginBottom:5}]}><Text style={[v.eyebrow,{color:c.accent}]}>{voice.recording?'RECORDING':voice.status==='review'?'EXACT DEMO REVIEW':'AI VOICE CONTROL'}</Text>{voice.recording&&<View accessibilityElementsHidden style={v.wave}>{[6,12,19,10,16,8,14].map((h,i)=><View key={i} style={{width:3,height:h,borderRadius:2,backgroundColor:c.accent}}/>)}</View>}</View>
   <ScrollView testID="voice-transcript-window" style={{maxHeight:154}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
    {!!voice.transcript&&<Text testID="voice-transcript" style={[v.transcript,{color:c.text}]}>{voice.transcript}</Text>}
    {!!response&&<Text testID="voice-result" accessibilityLiveRegion="polite" style={[v.response,{color:voice.error?c.negative:c.muted}]}>{response}</Text>}
   </ScrollView>
  </View>}
  <View style={[v.row,{padding:10,paddingLeft:14,gap:9}]}>
   <Pressable testID="voice-mic" accessibilityRole="button" accessibilityLabel={connecting?'Connecting voice':running?(voice.muted?'Unmute microphone':'Mute microphone'):'Start voice control'} accessibilityState={{selected:running&&!voice.muted,disabled:connecting}} disabled={connecting} onPress={mic} style={({pressed})=>[v.mic,{backgroundColor:running&&!voice.muted?brand:c.panel2,opacity:pressed?0.7:1}]}>{connecting?<ActivityIndicator color={c.accent}/>:<Icon name={voice.muted?'micOff':voice.recording?'live':'mic'} color={running&&!voice.muted?'#fff':c.accent} size={23}/>}</Pressable>
   <View style={v.flex}><Text style={[v.status,{color:c.text}]}>{title}</Text><Text style={[v.small,{color:c.muted}]}>{running?(voice.muted?'Tap the mic to continue':'Speak, act, continue.'): 'Tap the mic to start'}</Text></View>
   {running&&<View testID="voice-speaker" accessibilityRole="image" accessibilityLabel="Speaker output is on" style={[v.control,{backgroundColor:c.panel2}]}><Icon name="speaker" color={c.accent} size={20}/></View>}
   {(session?.slip.selections.length||0)>0&&<Pressable testID="voice-slip" accessibilityRole="button" accessibilityLabel={`Bet slip, ${session?.slip.selections.length} selections`} onPress={onSlip} style={v.control}><Icon name="ticket" color={c.accent} size={19}/><Text style={[v.badge,{color:c.accent}]}>{session?.slip.selections.length}</Text></Pressable>}
   <Pressable testID="voice-options" accessibilityRole="button" accessibilityLabel="Voice options" onPress={onOpen} style={v.control}><Icon name="more" color={c.muted} size={21}/></Pressable>
   {running&&<Pressable testID="voice-stop" accessibilityRole="button" accessibilityLabel="End voice session" onPress={()=>agent.stop().catch(e=>agent.voiceError(e.message))} style={[v.control,{backgroundColor:c.panel2}]}><Icon name="x" color={c.text} size={20}/></Pressable>}
  </View>
 </View>;
}
/** Optional tools only: the main recording controls and transcript stay in the dock. */
export function VoicePanel({c,onError,onClose}:{c:Palette;onError:(s:string)=>void;onClose:()=>void}){
 const [command,setCommand]=useState(''),[typing,setTyping]=useState(false),[summary,setSummary]=useState(''),[instruction,setInstruction]=useState(''),[url,setUrl]=useState(''),[share,setShare]=useState(false),[settings,setSettings]=useState(false),[base,setBase]=useState(agent.baseUrl),[pending,setPending]=useState(0);
 const busy=pending>0;
 const run=async(fn:()=>Promise<unknown>)=>{Keyboard.dismiss();setPending(n=>n+1);try{await fn();}catch(e){onError((e as Error).message);}finally{setPending(n=>Math.max(0,n-1));}};
 const field=(label:string,value:string,fn:(s:string)=>void,multi=false)=><View style={{marginTop:14}}><Text style={[v.small,{color:c.muted,marginBottom:6}]}>{label}</Text><TextInput testID={label} accessibilityLabel={label} value={value} onChangeText={fn} multiline={multi} autoCapitalize="none" placeholderTextColor={c.muted} placeholder={label} style={[v.input,{color:c.text,borderColor:c.line,backgroundColor:c.panel,minHeight:multi?86:48}]}/></View>;
 const button=(label:string,fn:()=>void)=><Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={fn} style={[v.button,{backgroundColor:c.panel2,opacity:busy?0.6:1}]}><Text style={{color:c.text,fontWeight:'600',fontSize:14}}>{label}</Text></Pressable>;
 return <View>
  <Text style={[v.sub,{color:c.muted}]}>Voice keeps your current match and slip in context.</Text>
  <Text style={[v.eyebrow,{color:c.accent,marginTop:10}]}>AI ASSISTANT · SAMPLE DATA</Text>
  {agent.session&&<View testID="action-context-card" style={[v.context,{backgroundColor:c.panel,borderColor:c.line}]}>
    <Text style={[v.eyebrow,{color:c.accent}]}>ACTION CONTEXT</Text>
    <Text style={[v.sub,{color:c.text}]}>Your instruction: {agent.session.lastInstruction || agent.session.context?.instruction || 'No instruction yet.'}</Text>
    <Text style={[v.sub,{color:c.text}]}>Requested action: {agent.session.lastAction}</Text>
    <Text style={[v.small,{color:c.muted,marginTop:8}]}>Confirmation is required for every exact demo bet. Changes invalidate its review.</Text>
    {(agent.session.context?.research.sources||[]).map((source,i)=><Text key={i} style={[v.small,{color:c.muted,marginTop:8}]}>{source.title} · {Math.max(0,Math.floor((Date.now()-Date.parse(source.retrievedAt))/60000))} min old · {new Date(source.retrievedAt).toLocaleString()}</Text>)}
    {!agent.session.context?.research.sources.length&&<Text style={[v.small,{color:c.muted,marginTop:8}]}>No research sources supplied.</Text>}
  </View>}
  {button('Load fictional research example',()=>run(async()=>{await agent.handoff('Fictional match brief. Northbridge FC versus Eastport United, 2–1 at 67 minutes. Sample statistics describe the match; they do not predict an outcome.','Open Northbridge FC and add home win with 10 demo credits',undefined,'Fictional match brief · sample data');onClose();}))}
  {button('Type instead',()=>setTyping(!typing))}
  {typing&&<>{field('Type an instruction',command,setCommand)}{button('Send instruction',()=>{const text=command.trim();if(text){setCommand('');onClose();void run(()=>agent.command(text));}})}</>}
  {button(share?'Hide research handoff':'Add research context',()=>setShare(!share))}
  {share&&<>{field('Research summary',summary,setSummary,true)}{field('Your requested action',instruction,setInstruction,true)}{field('Source URL (optional)',url,setUrl)}{button('Continue with this context',()=>run(async()=>{await agent.handoff(summary,instruction,url||undefined);onClose();await agent.start();}))}</>}
  {agent.session?.pendingContext&&button('Continue with new research',()=>run(async()=>{await agent.action('accept_context');onClose();}))}
  {agent.session?.context&&<View style={[v.context,{backgroundColor:c.panel,borderColor:c.line}]}><Text style={[v.eyebrow,{color:c.accent}]}>RESEARCH CONTEXT</Text><Text style={[v.sub,{color:c.text}]}>{agent.session.context.research.summary}</Text>{agent.session.context.research.sources.map((source,i)=><Pressable key={i} accessibilityRole="link" onPress={()=>source.url&&/^https?:/.test(source.url)&&Linking.openURL(source.url)} style={{minHeight:44,justifyContent:'center'}}><Text style={[v.small,{color:c.accent}]}>{source.title} ↗</Text></Pressable>)}</View>}
  {button(settings?'Hide connection settings':'Connection settings',()=>setSettings(!settings))}
  {settings&&<>{field('Backend URL',base,setBase)}{button('Save and connect',()=>run(()=>agent.setServer(base)))}</>}
  <Text style={[v.small,{color:c.muted,marginTop:20,lineHeight:18}]}>18+ · Demo credits only. Every demo bet needs an exact review and your confirmation. End voice anytime; your task stays saved.</Text>
 </View>;
}
const v=StyleSheet.create({flex:{flex:1,minWidth:0},row:{flexDirection:'row',alignItems:'center'},entry:{borderWidth:1,borderRadius:24,padding:18,flexDirection:'row',alignItems:'center',gap:14,marginBottom:16},orb:{width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center'},eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:1.2},title:{fontSize:18,lineHeight:24,fontWeight:'700',marginTop:5,letterSpacing:-0.4},sub:{fontSize:13,lineHeight:20,marginTop:6},small:{fontSize:11,lineHeight:17},context:{padding:16,borderRadius:18,borderWidth:1,marginTop:12},dock:{marginHorizontal:12,marginBottom:6,borderWidth:1,borderRadius:28,overflow:'hidden',shadowOffset:{width:0,height:4},shadowOpacity:0.13,shadowRadius:16,elevation:8},transcriptArea:{paddingHorizontal:18,paddingTop:15,paddingBottom:4},transcript:{fontSize:16,lineHeight:23,fontWeight:'600',marginBottom:4},response:{fontSize:13,lineHeight:19},wave:{flexDirection:'row',alignItems:'center',gap:3,height:20},control:{minWidth:44,minHeight:44,borderRadius:22,alignItems:'center',justifyContent:'center'},mic:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},status:{fontSize:13,lineHeight:19,fontWeight:'600'},badge:{position:'absolute',right:0,top:0,fontWeight:'700',fontSize:11},input:{padding:14,borderRadius:14,borderWidth:1,fontSize:14},button:{minHeight:48,padding:13,borderRadius:14,alignItems:'center',justifyContent:'center',marginTop:12}});

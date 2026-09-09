import type {Event,Market,PlayerDetail,EventMoment,Sport} from './contracts.js';

const names=['Ari Vale','Mika Rowan','Jules Arden','Noah Soren','Remy Dalen','Kai Marlow','Toni Voss','Alex Kellan','Sam Renzo','Lee Alto','Robin Hale','Casey North','Drew Ellis','Jamie Quinn','Morgan West','Taylor Reed','Cameron Lake','Jordan Pike','Riley Stone','Avery Cole','Skyler Dean','Parker Lane'];
const sizes:Record<Sport,number>={all:0,football:11,cricket:11,basketball:5,tennis:1,esports:5};
const positions:Record<Sport,string[]>={all:[],football:['GK','RB','CB','CB','LB','DM','CM','AM','RW','ST','LW'],cricket:['Captain','Wicketkeeper','Batter','Batter','All-rounder','All-rounder','Bowler','Bowler','Bowler','Bowler','Bowler'],basketball:['PG','SG','SF','PF','C'],tennis:['Singles'],esports:['IGL','Entry','Support','Flex','Anchor']};

function roster(e:Event):PlayerDetail[]{
  const count=sizes[e.sport]||5,pos=positions[e.sport]||[];
  return (['home','away'] as const).flatMap((team,side)=>Array.from({length:count},(_,i)=>({id:`${e.id}-${team}-p${i+1}`,name:names[(i+side*count+(e.id.charCodeAt(e.id.length-1)||0))%names.length],team,number:i+1,position:pos[i]||'Player',starter:true})));
}
function stats(e:Event){
  if(e.sport==='football')return [['Possession','58%','42%'],['Shots','12','7'],['Shots on target','6','3'],['Corners','5','2'],['Fouls','9','11']];
  if(e.sport==='cricket')return [['Run rate','8.94','8.08'],['Boundaries','17','14'],['Wickets','4','6'],['Extras','7','5']];
  if(e.sport==='basketball')return [['Field goals','31','28'],['Three-pointers','9','7'],['Rebounds','34','29'],['Assists','18','15']];
  if(e.sport==='tennis')return [['Aces','7','5'],['First serve','68%','64%'],['Winners','29','24'],['Break points','3/7','2/5']];
  return [['Rounds','14','11'],['Eliminations','62','54'],['Assists','31','28'],['Objectives','5','3']];
}
function moments(e:Event,p:PlayerDetail[]):EventMoment[]{
  const h=p.filter(x=>x.team==='home'),a=p.filter(x=>x.team==='away');
  if(e.sport==='football')return [
    {id:`${e.id}-t1`,type:'goal',clock:'12′',team:'home',player:h[9]?.name,secondary:h[7]?.name,label:'Goal',score:'1–0'},
    {id:`${e.id}-t2`,type:'goal',clock:'39′',team:'away',player:a[8]?.name,secondary:a[6]?.name,label:'Goal',score:'1–1'},
    {id:`${e.id}-t3`,type:'card',clock:'52′',team:'away',player:a[3]?.name,label:'Yellow card'},
    {id:`${e.id}-t4`,type:'goal',clock:'61′',team:'home',player:h[10]?.name,secondary:h[9]?.name,label:'Goal',score:'2–1'}];
  if(e.sport==='cricket')return [
    {id:`${e.id}-t1`,type:'score',clock:'14.2 ov',team:'away',player:a[2]?.name,label:'Four runs'},
    {id:`${e.id}-t2`,type:'wicket',clock:'15.1 ov',team:'home',player:h[8]?.name,secondary:a[4]?.name,label:'Wicket',score:e.score.join('–')},
    {id:`${e.id}-t3`,type:'score',clock:'16.2 ov',team:'away',player:a[5]?.name,label:'Six runs'}];
  if(e.sport==='basketball')return [
    {id:`${e.id}-t1`,type:'score',clock:'Q3 06:12',team:'home',player:h[1]?.name,label:'Three-pointer'},
    {id:`${e.id}-t2`,type:'score',clock:'Q3 05:20',team:'away',player:a[4]?.name,label:'Two points'},
    {id:`${e.id}-t3`,type:'score',clock:'Q3 04:28',team:'home',player:h[0]?.name,label:'Two points',score:e.score.join('–')}];
  if(e.sport==='tennis')return [
    {id:`${e.id}-t1`,type:'set',clock:'Set 1',team:'home',player:h[0]?.name,label:'Won set',score:'1–0'},
    {id:`${e.id}-t2`,type:'set',clock:'Set 2',team:'away',player:a[0]?.name,label:'Won set',score:'1–1'},
    {id:`${e.id}-t3`,type:'score',clock:'Set 3 · 4–3',team:'home',player:h[0]?.name,label:'Ace'}];
  return [
    {id:`${e.id}-t1`,type:'round',clock:'Map 1',team:'home',player:h[0]?.name,label:'Map won',score:'1–0'},
    {id:`${e.id}-t2`,type:'score',clock:'Map 2 · R11',team:'away',player:a[1]?.name,label:'Triple elimination'},
    {id:`${e.id}-t3`,type:'round',clock:'Map 2 · R12',team:'home',player:h[4]?.name,label:'Round won'}];
}
function playerMarkets(e:Event,p:PlayerDetail[]):Market[]{
  const h=p.filter(x=>x.team==='home'),a=p.filter(x=>x.team==='away');
  const rows=e.sport==='football'?[['Anytime goalscorer',[h[9]?.name,h[10]?.name,a[8]?.name],[2.4,3.1,3.4]],['Player shots on target',[`${h[9]?.name} · Over 1.5`,`${a[8]?.name} · Over 0.5`],[1.88,1.76]]]:
    e.sport==='cricket'?[['Player runs',[`${h[2]?.name} · 30+`,`${a[2]?.name} · 30+`],[1.82,1.91]],['Player wickets',[`${h[8]?.name} · 2+`,`${a[8]?.name} · 2+`],[2.2,2.35]]]:
    e.sport==='basketball'?[['Player points',[`${h[0]?.name} · 20+`,`${a[1]?.name} · 20+`],[1.86,1.93]],['Player assists',[`${h[0]?.name} · 6+`,`${a[0]?.name} · 6+`],[2.05,2.1]]]:
    e.sport==='tennis'?[['Player aces',[`${h[0]?.name} · Over 6.5`,`${a[0]?.name} · Over 5.5`],[1.9,1.88]],['Player games won',[`${h[0]?.name} · Over 12.5`,`${a[0]?.name} · Over 11.5`],[1.84,1.96]]]:
    [['Player eliminations',[`${h[0]?.name} · Over 18.5`,`${a[1]?.name} · Over 17.5`],[1.9,1.87]],['Player assists',[`${h[2]?.name} · Over 9.5`,`${a[2]?.name} · Over 8.5`],[1.95,2.0]]];
  return rows.map((row,j)=>{const name=row[0] as string,labels=row[1] as string[],odds=row[2] as number[],id=`${e.id}-player-${j}`;return {id,name,options:labels.filter(Boolean).map((label,i)=>({id:`${id}-${i}`,eventId:e.id,marketId:id,market:name,label,odds:odds[i]}))};});
}

export function enrichDemoEvent(e:Event):Event {
  if(e.source!=='demo'||!e.live)return e;
  const players=e.players?.length?e.players:roster(e);
  e.players=players;e.statistics=e.statistics?.length?e.statistics:stats(e).map(([label,home,away])=>({label,home,away}));e.timeline=e.timeline?.length?e.timeline:moments(e,players);
  const additions=playerMarkets(e,players).filter(m=>!e.markets.some(existing=>existing.name===m.name));
  e.markets=[...e.markets,...additions];
  return e;
}

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Icon } from './src/icons';
import { events as demoEvents, Match, sports, Sport } from './src/data';
import { agent } from './src/agent';
import { VoiceEntry, VoiceDock, VoicePanel } from './src/VoiceUI';
import {visibleEvents} from '../shared/event-navigation';
import type { TaskSession } from '../shared/contracts';
import { brand, makeStyles, Palette, themes } from './src/theme';
import {
  BetMode,
  Selection,
  calculate,
  community,
  credits,
  demoSignIn,
  demoSignUp,
  games,
  markets,
  matchById as demoMatchById,
  validateSlip,
  winners,
} from './src/model';

type Styles = ReturnType<typeof makeStyles>;
const UI = createContext<{ c: Palette; s: Styles }>({
  c: themes.dark,
  s: makeStyles(themes.dark),
});
const useUI = () => useContext(UI);
function Txt({
  children,
  style,
  small = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  small?: boolean;
}) {
  const { s } = useUI();
  return <Text style={[small ? s.muted : s.text, style]}>{children}</Text>;
}
function Row({
  children,
  between = false,
  style,
}: {
  children: React.ReactNode;
  between?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { s } = useUI();
  return <View style={[between ? s.between : s.row, style]}>{children}</View>;
}
function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, s } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        disabled && s.disabled,
        style,
        pressed && s.pressed,
      ]}
    >
      {icon && (
        <Icon name={icon} size={19} color={secondary ? c.accent : '#fff'} />
      )}
      <Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
function IconButton({
  name,
  label,
  onPress,
  active = false,
  style,
  testID,
}: {
  name: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { c, s } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [s.iconButton, style, pressed && s.pressed]}
    >
      <Icon name={name} color={active ? c.accent : c.muted} />
    </Pressable>
  );
}
function Link({
  label,
  onPress,
  style,
  textStyle,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { s } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.link, style, pressed && s.pressed]}
    >
      <Text style={[s.linkText, textStyle]}>{label}</Text>
    </Pressable>
  );
}
function Pill({ label, live = false }: { label: string; live?: boolean }) {
  const { s } = useUI();
  return (
    <View style={[s.pill, live && s.livePill]}>
      <Text style={[s.pillText, live && s.livePillText]}>{label}</Text>
    </View>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  const { c, s } = useUI();
  return (
    <View style={s.notice}>
      <Icon name="shield" size={17} color={c.accent} />
      <Text style={s.noticeText}>{children}</Text>
    </View>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  testID,
  type = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  testID?: string;
  type?: 'default' | 'email-address' | 'decimal-pad' | 'number-pad';
}) {
  const { c, s } = useUI();
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        secureTextEntry={secure}
        keyboardType={type}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
function Heading({ title, right }: { title: string; right?: React.ReactNode }) {
  const { s } = useUI();
  return (
    <View style={s.section}>
      <Text style={s.h2}>{title}</Text>
      {right}
    </View>
  );
}
function Pitch() {
  return (
    <Svg viewBox="0 0 400 240" width="100%" height="100%">
      <Rect
        x="10"
        y="10"
        width="380"
        height="220"
        rx="3"
        stroke="#92BCFF"
        fill="none"
      />
      <Path
        d="M200 10v220M10 57h60v126H10m380-126h-60v126h60M10 90h25v60H10m380-60h-25v60h25"
        stroke="#92BCFF"
        fill="none"
      />
      <Circle cx="200" cy="120" r="42" stroke="#92BCFF" fill="none" />
    </Svg>
  );
}
type Bet = {
  id: string;
  selections: Selection[];
  mode: BetMode;
  totalStake: number;
  estimatedReturn: number;
  totalOdds: number;
};
const authRoutes = ['signin', 'signup', 'forgot', 'otp', 'onboarding'];
const themeKey = 'contextflow.native.theme';

function ContextFlowApp() {
  const [events, setEvents] = useState<Match[]>(demoEvents);
  const [task, setTask] = useState<TaskSession | undefined>(agent.session);
  const [, redrawAgent] = useState(0);
  const applyingRemote = useRef(false);
  const lastRemoteRoute = useRef('');
  const lastListRevision = useRef<number | undefined>(undefined);
  const pendingRoute = useRef<{route:string;signature:string;version:number} | null>(null);
  const navigationVersion = useRef(0);
  const stakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchById = (id: string) => events.find(e => e.id === id) || demoMatchById(id);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const c = themes[theme];
  const s = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [route, setRoute] = useState('signin');
  const [sheet, setSheet] = useState<string | null>(null);
  const history = useRef<string[]>([]);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [sport, setSport] = useState<Sport>('all');
  const [period, setPeriod] = useState('live');
  const [eventId, setEventId] = useState('e1');
  const [marketTab, setMarketTab] = useState('Popular');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [eventAlerts, setEventAlerts] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [day, setDay] = useState(0);
  const [country, setCountry] = useState('All countries');
  const [league, setLeague] = useState('All leagues');
  const [sportTime, setSportTime] = useState('Any time');
  const [sort, setSort] = useState('Popularity');
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [onlyLeagues, setOnlyLeagues] = useState(false);
  const [slip, setSlip] = useState<Selection[]>([]);
  const [stake, setStake] = useState('10');
  const [mode, setMode] = useState<BetMode>('accumulator');
  const [balance, setBalance] = useState(1250);
  const [bets, setBets] = useState<Bet[]>([]);
  const [pending, setPending] = useState<Bet | null>(null);
  const [oddsOverrides, setOddsOverrides] = useState<Record<string, number>>(
    {},
  );
  const [suspended, setSuspended] = useState(['e5']);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [onboard, setOnboard] = useState(0);
  const [copyIndex, setCopyIndex] = useState(0);
  const [copySelections, setCopySelections] = useState<Selection[]>([]);
  const [copyAccepted, setCopyAccepted] = useState(false);
  const [gameId, setGameId] = useState('dice');
  const [gameLoading, setGameLoading] = useState(false);
  const [gameBusy, setGameBusy] = useState(false);
  const [gameStake, setGameStake] = useState('10');
  const [gamePoints, setGamePoints] = useState(500);
  const [gameResult, setGameResult] = useState('Choose a stake to begin.');
  const [gameSymbol, setGameSymbol] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [casinoQuery, setCasinoQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [limitInput, setLimitInput] = useState('100');
  const [spent, setSpent] = useState(0);
  const [reminder, setReminder] = useState(0);
  const [paused, setPaused] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const started = useRef(Date.now());
  const [clock, setClock] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const gameRun = useRef(0);
  const auth = authRoutes.includes(route),
    event = matchById(eventId),
    totals = calculate(slip, stake, mode),
    slipError = validateSlip(
      slip,
      stake,
      mode,
      balance,
      spent,
      limit,
      paused,
      suspended,
    );
  useEffect(() => agent.subscribe(() => {
    const remote = agent.session;
    redrawAgent(n => n + 1);
    if (agent.events.length) setEvents([...agent.events]);
    if (!remote) return;
    applyingRemote.current = true;
    setTask({...remote}); setSlip(remote.slip.selections); setMode(remote.slip.mode);
    if (!stakeTimer.current) setStake(String(remote.slip.stakeMinor / 100));
    setBalance(remote.walletMinor / 100); setSpent(remote.spentMinor / 100);
    setGamePoints((remote.gamePointsMinor ?? 50000) / 100);
    started.current = Date.parse(remote.reminderStartedAt);
    setLimit(remote.limitMinor / 100); setPaused(remote.paused);
    setNotifications(remote.notificationPreferences?.optionalConsent === true);
    setFavorites(remote.favorites); setReminder(remote.reminderMinutes); setEventAlerts(remote.watchEvents || []);
    setSuspended(agent.events.filter(e => e.suspended).map(e => e.id));
    const signature=remote.route==='event'?`event:${remote.eventId||''}`:remote.route;
    const canApplyNavigation=!pendingRoute.current||pendingRoute.current.signature===signature;
    if (canApplyNavigation && remote.eventId) setEventId(remote.eventId);
    if (canApplyNavigation && remote.eventView) setMarketTab(remote.eventView);
    setSport(remote.sport); setPeriod(remote.period);
    if(remote.listRevision!==undefined&&remote.listRevision!==lastListRevision.current){
      lastListRevision.current=remote.listRevision;setOnlyFavorites(false);setQuery(remote.eventQuery||'');setDay(0);setSheet(null);scroll.current?.scrollTo({y:0,animated:false});
    }
    if (canApplyNavigation && signature !== lastRemoteRoute.current && (!authRoutes.includes(route) || !['idle','ended','offline'].includes(agent.voice.status))) {
      setRoute(remote.route); lastRemoteRoute.current = signature;
      if (['live','today','sports','event','success'].includes(remote.route)) {setSheet(null);scroll.current?.scrollTo({y:0,animated:false});}
    }
    setBets(remote.tickets);
    if (remote.tickets[0] && remote.route === 'success') setPending(remote.tickets[0]);
    applyingRemote.current = false;
  }), [route]);
  async function perform(type: string, payload: Record<string, unknown> = {}) {
    try { return await agent.action(type, payload); } catch (e) { notify((e as Error).message); return undefined; }
  }
  function editStake(value: string) {
    setStake(value);
    if (stakeTimer.current) clearTimeout(stakeTimer.current);
    if (!agent.session) return;
    stakeTimer.current = setTimeout(() => {
      stakeTimer.current = null;
      const n = Number(value);
      if (Number.isFinite(n) && n > 0 && n <= 10000 && Math.abs(n*100-Math.round(n*100))<0.00001) void perform('set_stake',{stakeMinor:Math.round(n*100)});
    }, 300);
  }
  async function commitStake() {
    if (stakeTimer.current) { clearTimeout(stakeTimer.current); stakeTimer.current = null; }
    if (agent.session && Number(stake) * 100 !== agent.session.slip.stakeMinor) await agent.action('set_stake',{stakeMinor:Math.round(Number(stake)*100)});
  }
  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }
  useEffect(() => {
    AsyncStorage.getItem(themeKey)
      .then(v => {
        if (v === 'light' || v === 'dark') setTheme(v);
      })
      .catch(() => {});
    const timer = setInterval(() => setClock(v => v + 1), 15000);
    return () => {
      clearInterval(timer);
      timers.current.forEach(clearTimeout);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [route]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) {
        setSheet(null);
        return true;
      }
      if (history.current.length) {
        setRoute(history.current.pop()!);
        return true;
      }
      if (route !== 'live' && !auth) {
        setRoute('live');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sheet, route, auth]);
  useEffect(() => {
    if (!reminder) return;
    const timer = setInterval(() => setSheet('reminder'), reminder * 60000);
    return () => clearInterval(timer);
  }, [reminder]);
  function notify(text: string) {
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(''), 3500);
  }
  function navigate(next: string, payload:Record<string,unknown> = {}) {
    Keyboard.dismiss();
    setSheet(null);
    if (next !== route) history.current.push(route);
    setRoute(next);
    const signature=next==='event'?`event:${payload.eventId||eventId||''}`:next;
    lastRemoteRoute.current = signature;
    if (!authRoutes.includes(next) && !applyingRemote.current) { const version=++navigationVersion.current; pendingRoute.current={route:next,signature,version}; void perform('navigate', {...payload,route:next}).finally(() => { if(pendingRoute.current?.version === version) pendingRoute.current = null; }); }
  }
  function goBack() {
    Keyboard.dismiss();
    setSheet(null);
    navigate(history.current.pop() || 'live');
  }
  function selectTab(next: string) {
    history.current = [];
    if (next === 'live') {
      setPeriod('live');
      setSport('all');
      setOnlyFavorites(false);
    }
    navigate(next);
  }
  function changeTheme(value?: 'light' | 'dark') {
    const next = value || (theme === 'dark' ? 'light' : 'dark');
    setTheme(next);
    AsyncStorage.setItem(themeKey, next).catch(() => {});
    AccessibilityInfo.announceForAccessibility(`${next} theme enabled`);
  }
  function toggleFavorite(id: string) {
    if (agent.session) { void perform('favorite', {eventId: id}); return; }
    setFavorites(v => (v.includes(id) ? v.filter(x => x !== id) : [...v, id]));
    notify(
      favorites.includes(id)
        ? 'Removed from favorites.'
        : 'Saved to favorites.',
    );
  }
  const priced = (pick: Selection) => ({
    ...pick,
    odds: oddsOverrides[pick.id] ?? pick.odds,
  });
  function addPick(pick: Selection) {
    if (agent.session) {
      const remove = slip.some(x => x.id === pick.id);
      void perform(remove ? 'remove_selection' : 'select_outcome', remove ? {selectionId:pick.id} : {eventId:pick.eventId,selectionId:pick.id}).then(r => {if(r && !remove) setSheet('slip');}); return;
    }
    if (suspended.includes(pick.eventId))
      return notify('This market is suspended.');
    if (slip.some(x => x.id === pick.id)) {
      setSlip(v => v.filter(x => x.id !== pick.id));
      return notify('Selection removed.');
    }
    if (slip.some(x => x.eventId === pick.eventId))
      return notify(
        'One selection per event. Remove your existing pick first.',
      );
    setSlip(v => [...v, priced(pick)]);
    setSheet('slip');
  }
  function openEvent(id: string) {
    setEventId(id);
    setMarketTab('Popular');
    navigate('event',{eventId:id,view:'Popular'}); if(agent.session)void agent.details(id).catch(() => {});
  }
  function resetFilters() {
    setCountry('All countries');
    setLeague('All leagues');
    setSportTime('Any time');
    setSport('all');
    setOnlyFavorites(false);
    setOnlyLeagues(false);
    setDay(0);
  }
  function refresh() {
    if (agent.session) { setRefreshing(true); void agent.refresh().then(() => notify(agent.feed.message)).catch(e => notify(e.message)).finally(() => setRefreshing(false)); return; }
    setRefreshing(true);
    later(() => {
      setRefreshing(false);
      notify('Fictional demo scores refreshed.');
    }, 750);
  }
  function authenticate(signup: boolean) {
    if (busy) return;
    setBusy(true);
    void agent.connect().catch(() => notify('Offline preview. Connect the backend for live data, voice and saved demo bets.'));
    signup ? demoSignUp(name, email, password) : demoSignIn(email, password);
    later(() => {
      setBusy(false);
      setName('');
      setEmail('');
      setPassword('');
      setAccepted(false);
      navigate('live');
      notify(
        signup
          ? 'Demo account ready. Welcome, Jamie.'
          : 'Welcome back, Jamie Demo.',
      );
    }, 500);
  }
  async function reviewBet() {
    if (agent.session) {
      try { await commitStake(); const r = await agent.review(); setPending({id:r.session.review!.id,mode:r.session.slip.mode,selections:r.session.slip.selections,totalStake:r.session.slip.totals.totalStake,estimatedReturn:r.session.slip.totals.estimatedReturn,totalOdds:r.session.slip.totals.totalOdds}); Keyboard.dismiss(); setSheet('confirm'); } catch(e) {notify((e as Error).message);} return;
    }
    notify('Connect the demo backend before reviewing a bet. Your preview selections are unchanged.');
  }
  async function confirmBet() {
    if (agent.session) {
      if (busy) return; setBusy(true);
      try { const review = agent.session.review; if (!review) throw new Error('Please review the current slip again.'); const r = await agent.action('confirm_bet', {reviewId:review.id}); setPending(r.session.tickets[0]); setSheet(null); setRoute('success'); } catch(e) {notify((e as Error).message);} finally {setBusy(false);} return;
    }
    notify('A backend receipt is required. Reconnect to place this demo bet.');
  }
  function changeOdds() {
    if (agent.session) return notify('Live prices update from the provider. Demo price changes are covered in backend tests.');
    if (!slip.length) return;
    const first = slip[0],
      updated = Number((first.odds + 0.1).toFixed(2));
    setOddsOverrides(v => ({ ...v, [first.id]: updated }));
    setSlip(v =>
      v.map((x, i) =>
        i ? x : { ...x, previous: x.odds, odds: updated, changed: true },
      ),
    );
    notify('Demo odds changed. Review and accept the new price.');
  }
  function clearSlip() {
    Alert.alert('Clear your slip?', `Remove all ${slip.length} selections?`, [
      { text: 'Keep selections', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          if (agent.session) void perform('clear_slip').then(r=>{if(r)notify('Your slip is cleared.');}); else {setSlip([]);notify('Your slip is cleared.');}
          setSheet(null);
        },
      },
    ]);
  }
  function previewCopy(index: number) {
    setCopyIndex(index);
    setCopyAccepted(false);
    setCopySelections(
      community[index].eventIds.map(id => priced(winners(matchById(id))[0])),
    );
    setSheet('copy');
  }
  function addCopied() {
    if (!copyAccepted) return;
    const existing = new Set(slip.map(x => x.eventId));
    const valid = copySelections.filter(
      x => !existing.has(x.eventId) && !suspended.includes(x.eventId),
    );
    if (!valid.length)
      return notify('These events are already in your slip or suspended.');
    if (agent.session) { void perform('copy_selections',{selectionIds:valid.map(x=>x.id)}).then(r=>{if(r)setSheet('slip');}); return; }
    setSlip(v => [...v, ...valid]);
    setSheet('slip');
    notify(`${valid.length} selections added. No bet has been placed.`);
  }
  function startGame(id: string) {
    if (gameBusy)
      return notify('Let this round finish before opening another game.');
    setGameId(id);
    setGameLoading(true);
    setGameSymbol('');
    setGameResult('Getting the game ready…');
    setRecent(v => [id, ...v.filter(x => x !== id)]);
    const run = ++gameRun.current;
    navigate('game');
    later(() => {
      if (run === gameRun.current) {
        setGameLoading(false);
        setGameResult('Choose a stake to begin.');
      }
    }, 650);
  }
  function playGame() {
    if (gameBusy || gameLoading) return;
    const amount = Number(gameStake);
    if (paused) return notify('Demo play is paused for this session.');
    if (!Number.isInteger(amount) || amount < 1 || amount > 50)
      return notify('Choose a whole-number stake from 1 to 50 GP.');
    if (amount > gamePoints) return notify('Not enough fictional game points.');
    if (spent + amount > limit)
      return notify('This exceeds your session spending limit.');
    if (agent.session) {
      setGameBusy(true);setGameResult('A moment of suspense…');
      void perform('play_game',{gameId,stakeMinor:amount*100}).then(r=>{later(()=>{if(r?.session.lastGame){setGameSymbol(r.session.lastGame.symbol);setGameResult(r.session.lastGame.message);}else setGameResult('Round not completed. Please retry.');setGameBusy(false);},650);});return;
    }
    setGameBusy(true);
    setGamePoints(v => v - amount);
    setSpent(v => v + amount);
    setGameResult('A moment of suspense…');
    later(() => {
      let multiplier = 0,
        symbol = '',
        prefix = '';
      if (gameId === 'dice') {
        const n = Math.floor(Math.random() * 6) + 1;
        symbol = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n - 1];
        multiplier = n >= 4 ? 1.8 : 0;
        prefix = `Rolled ${n}. `;
      } else if (gameId === 'cards') {
        const n = Math.floor(Math.random() * 13) + 1;
        symbol =
          ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][
            n - 1
          ] + ' ♧';
        multiplier = n >= 8 ? 2 : 0;
        prefix = `Drew ${symbol}. `;
      } else {
        const n = [1, 1.2, 1.5, 2, 3][Math.floor(Math.random() * 5)];
        symbol = n.toFixed(2) + '×';
        multiplier = n === 1 ? 0 : n;
        prefix = n === 1 ? 'Flight ended at launch. ' : 'Flight complete. ';
      }
      const payout = Math.round(amount * multiplier * 100) / 100;
      setGamePoints(v => v + payout);
      setGameSymbol(symbol);
      setGameResult(
        prefix +
          (payout
            ? `${credits(payout)} GP returned · ${credits(
                payout - amount,
              )} GP net.`
            : `No return. ${amount} GP used.`),
      );
      setGameBusy(false);
    }, 1100);
  }
  function pausePlay() {
    Alert.alert(
      'Pause demo play?',
      'This blocks new demo bets and casino plays for this app session. You can still browse scores.',
      [
        { text: 'Keep exploring', style: 'cancel' },
        {
          text: 'Pause play',
          style: 'destructive',
          onPress: () => {
            if(agent.session) void perform('settings',{paused:true}).then(r=>{if(r)notify('Demo play is paused.');}); else {setPaused(true);notify('Demo play is paused.');}
          },
        },
      ],
    );
  }
  function saveLimits() {
    const n = Number(limitInput);
    if (!Number.isInteger(n) || n < 1 || n > 10000)
      return notify('Choose a whole-number limit from 1 to 10,000.');
    if(agent.session) void perform('settings',{limitMinor:n*100}).then(r=>{if(r)notify('Your session limits are saved.');}); else {setLimit(n);notify('Your session limits are saved.');}
    Keyboard.dismiss();
  }

  const themeButton = () => (
    <IconButton
      name={theme === 'dark' ? 'sun' : 'moon'}
      label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      onPress={() => changeTheme()}
      style={s.themeButton}
      testID="theme-toggle"
    />
  );
  const footer = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="18 plus. Demo only. Open responsible gaming"
      onPress={() => navigate('responsible')}
      style={s.footer}
    >
      <View style={s.age}>
        <Text style={s.ageText}>18+</Text>
      </View>
      <Text style={s.footerText}>
        Demo Prototype · Live & fictional events · Demo credits
      </Text>
    </Pressable>
  );
  const pageHead = (title: string) => (
    <View style={s.pageHead}>
      <IconButton name="back" label="Go back" onPress={goBack} />
      <Text style={s.pageHeadTitle}>{title}</Text>
    </View>
  );
  const empty = (title: string, copy: string, reset = resetFilters) => (
    <View style={s.empty}>
      <Icon name="search" size={38} color={c.muted} />
      <Text style={s.h3}>{title}</Text>
      <Txt small style={{ textAlign: 'center' }}>
        {copy}
      </Txt>
      <Button secondary label="Explore matches" onPress={reset} />
    </View>
  );
  const sportsStrip = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.sportList}
    >
      {sports.map(x => (
        <Pressable
          key={x.id}
          accessibilityRole="button"
          accessibilityLabel={`${x.label} filter`}
          accessibilityState={{ selected: sport === x.id }}
          onPress={() => {setSport(x.id); if(agent.session) void perform('navigate',{route,sport:x.id});}}
          style={s.sportItem}
        >
          <View style={[s.sportCircle, sport === x.id && s.selectedCircle]}>
            <Icon name={x.icon} color={sport === x.id ? '#fff' : c.muted} />
          </View>
          <Text
            numberOfLines={1}
            style={[s.sportLabel, sport === x.id && s.accent]}
          >
            {x.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
  const chip = (
    label: string,
    active: boolean,
    onPress: () => void,
    key = label,
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        active && s.activeChip,
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.chipText, active && s.white]}>{label}</Text>
    </Pressable>
  );
  function oddsRow(options: Selection[], feature = false, short = false) {
    return (
      <View style={s.oddsRow}>
        {options.map((raw, i) => {
          const o = priced(raw),
            selected = slip.some(x => x.id === o.id),
            locked = suspended.includes(o.eventId);
          return (
            <Pressable
              key={o.id}
              testID={`odd-${o.id}`}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel={`${o.label}, ${
                o.market
              }, odds ${o.odds.toFixed(2)}`}
              accessibilityState={{ selected, disabled: locked }}
              onPress={() => addPick(o)}
              style={({ pressed }) => [
                s.odd,
                feature && s.featureOdd,
                selected && s.oddSelected,
                locked && s.disabled,
                pressed && s.pressed,
              ]}
            >
              {locked ? (
                <Icon name="lock" size={12} color={c.muted} />
              ) : (
                <Text
                  style={[
                    s.oddLabel,
                    feature && { color: '#B8C9DF' },
                    selected && s.white,
                  ]}
                >
                  {short
                    ? options.length === 3
                      ? ['1', 'X', '2'][i]
                      : ['1', '2'][i]
                    : o.label}
                </Text>
              )}
              <Text
                style={[s.oddNumber, feature && s.white, selected && s.white]}
              >
                {o.odds.toFixed(2)}
              </Text>
              {o.eventId === 'e1' && !locked && (
                <Text
                  style={[
                    s.movement,
                    i === 1 && { color: c.negative },
                    selected && s.white,
                  ]}
                >
                  {i === 1 ? '▾' : '▴'}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }
  function scoreboard(e: Match) {
    const cricket = e.sport === 'cricket';
    return (
      <View style={s.scoreboard}>
        {[0, 1, 2].map(i =>
          i === 1 ? (
            <View key="score" style={[s.scoreCenter, cricket && { width: 74 }]}>
              <Text
                style={[
                  s.score,
                  e.sport === 'basketball' && { fontSize: 29 },
                  cricket && {
                    fontSize: 13,
                    fontWeight: '400',
                    color: '#B8C9DF',
                  },
                ]}
              >
                {cricket ? 'vs' : `${e.score[0]} : ${e.score[1]}`}
              </Text>
              <Text style={s.scoreStage}>
                {e.id === 'e1'
                  ? `${67 + Math.floor(clock / 60)}:${String(
                      clock % 60,
                    ).padStart(2, '0')} · 2nd half`
                  : e.stage}
              </Text>
            </View>
          ) : (
            <View key={i} style={s.teamBlock}>
              <View
                style={[
                  s.crest,
                  { backgroundColor: e.colors[i === 0 ? 0 : 1] },
                ]}
              >
                <Icon
                  name={i === 0 ? 'trophy' : 'shield'}
                  color="#203451"
                  size={26}
                />
              </View>
              <Text style={s.teamName}>{i === 0 ? e.a : e.b}</Text>
              {cricket && (
                <Text style={[s.score, { fontSize: 23, marginTop: 8 }]}>
                  {e.score[i === 0 ? 0 : 1]}
                </Text>
              )}
            </View>
          ),
        )}
      </View>
    );
  }
  function favoriteButton(e: Match) {
    return (
      <IconButton
        name="star"
        label={`Favorite ${e.a}`}
        active={favorites.includes(e.id)}
        onPress={() => toggleFavorite(e.id)}
      />
    );
  }
  function featured(e: Match) {
    return (
      <View style={s.feature}>
        <View style={s.pitch} pointerEvents="none">
          <Pitch />
        </View>
        <Row between>
          <Pill label="● LIVE" live />
          <Text style={s.featureText}>{e.league}</Text>
          {favoriteButton(e)}
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${e.a} versus ${e.b}`}
          onPress={() => openEvent(e.id)}
        >
          {scoreboard(e)}
        </Pressable>
        {oddsRow(winners(e), true, true)}
        <View style={s.featureFoot}>
          <Row>
            <Icon name="stats" size={17} color="#B8C9DF" />
            <Text style={s.featureText}>{e.source === 'live' ? 'Live provider event · Demo credits' : 'Fictional live event'}</Text>
          </Row>
          <Link
            label="Explore markets →"
            textStyle={{ color: '#A1C5FF' }}
            onPress={() => openEvent(e.id)}
          />
        </View>
      </View>
    );
  }
  function matchCard(e: Match) {
    return (
      <View key={e.id} style={s.match}>
        <View style={s.matchMeta}>
          <Text style={s.matchMetaText}>
            {e.live ? '● ' : ''}
            {e.stage}
          </Text>
          {favoriteButton(e)}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${e.a} versus ${e.b}`}
          onPress={() => openEvent(e.id)}
        >
          {[0, 1].map(i => (
            <View key={i} style={s.matchTeam}>
              <View style={[s.teamDot, { backgroundColor: e.colors[i] }]}>
                <Text style={s.teamInitial}>{e.short[i]}</Text>
              </View>
              <Text style={s.teamRowName}>{i === 0 ? e.a : e.b}</Text>
              <Text style={s.teamScore}>{e.score[i]}</Text>
            </View>
          ))}
        </Pressable>
        {oddsRow(winners(e), false, true)}
        <View style={s.matchFooter}>
          <Row>
            <Icon
              name={suspended.includes(e.id) ? 'lock' : 'stats'}
              size={16}
              color={c.muted}
            />
            <Text style={s.matchMarket}>
              {suspended.includes(e.id)
                ? 'Markets paused'
                : 'Match winner · Demo odds'}
            </Text>
          </Row>
          <Link
            label={expanded.includes(e.id) ? '− Markets' : '+ Markets'}
            onPress={() =>
              setExpanded(v =>
                v.includes(e.id) ? v.filter(x => x !== e.id) : [...v, e.id],
              )
            }
          />
        </View>
        {expanded.includes(e.id) && (
          <View style={s.mt}>
            <Txt style={s.h3}>{markets(e)[1].name}</Txt>
            {oddsRow(markets(e)[1].options)}
            <Link label="All event markets →" onPress={() => openEvent(e.id)} />
          </View>
        )}
      </View>
    );
  }
  function grouped(list: Match[]) {
    return list.map((e, i) => (
      <View key={e.id}>
        {(!i || list[i - 1].league !== e.league) && (
          <View style={s.league}>
            <Icon name={e.sport} size={14} color={c.muted} />
            <Text style={s.leagueText}>
              {sports.find(x => x.id === e.sport)?.label} · {e.league}
            </Text>
          </View>
        )}
        {matchCard(e)}
      </View>
    ));
  }
  function menuItem(
    icon: string,
    label: string,
    next: string,
    trailing?: string,
  ) {
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        onPress={() => navigate(next)}
        style={({ pressed }) => [s.menuItem, pressed && s.pressed]}
      >
        <Icon name={icon} size={19} color={c.muted} />
        <Text style={s.menuText}>{label}</Text>
        {trailing && <Txt small>{trailing}</Txt>}
        <Icon name="chevron" size={15} color={c.muted} />
      </Pressable>
    );
  }
  function toggleRow(
    label: string,
    description: string,
    value: boolean,
    onChange: (v: boolean) => void,
  ) {
    return (
      <View style={s.settingRow}>
        <View style={s.grow}>
          <Text style={s.h3}>{label}</Text>
          <Txt small style={{ marginTop: 5 }}>
            {description}
          </Txt>
        </View>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.line, true: brand }}
          thumbColor="#fff"
        />
      </View>
    );
  }

  function renderFeed() {
    const list=visibleEvents(events,{sport,period,query:task?.eventQuery}).filter(e=>!onlyFavorites||favorites.includes(e.id));
    const showFeature = sport === 'all' && period === 'live' && !onlyFavorites && list.length > 0;
    return (
      <>
        <View style={s.greeting}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>YOUR FRONT ROW SEAT</Text>
            <Text style={[s.greetingTitle, width < 365 && { fontSize: 23 }]}>
              The game is on<Text style={s.accent}>.</Text>
            </Text>
          </View>
          <View style={s.homeActions}>
            {themeButton()}

          </View>
        </View>
        <VoiceEntry c={c} onOpen={() => setSheet('voice')} onError={notify} />
        <Text style={[s.tiny,{marginBottom:12}]}>{agent.feed.message}</Text>
        {sportsStrip()}
        <View style={s.segments}>
          {[
            ['live', `Live  ${events.filter(e=>e.live).length}`],
            ['today', 'Today'],
            ['3h', 'Next 3 hours'],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: period === id }}
              onPress={() => {setPeriod(id); if(agent.session) void perform('navigate',{route:'live',period:id});}}
              style={[s.segment, period === id && s.segmentActive]}
            >
              <Text
                style={[s.segmentText, period === id && s.segmentTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {refreshing ? (
          <>
            <View style={[s.panel, { height: 210, justifyContent: 'center' }]}>
              <ActivityIndicator color={c.accent} />
              <Txt small style={{ textAlign: 'center', marginTop: 12 }}>
                Refreshing the demo feed…
              </Txt>
            </View>
            <View style={[s.panel, { height: 135, marginTop: 14 }]} />
          </>
        ) : (
          <>
            {showFeature && (
              <>
                {featured(list[0])}
                <Row style={{ justifyContent: 'center', marginTop: 13 }}>
                  <View
                    style={{
                      height: 4,
                      width: 18,
                      borderRadius: 3,
                      backgroundColor: brand,
                    }}
                  />
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 3,
                      backgroundColor: c.line,
                    }}
                  />
                  <View
                    style={{
                      height: 4,
                      width: 4,
                      borderRadius: 3,
                      backgroundColor: c.line,
                    }}
                  />
                </Row>
              </>
            )}
            <Heading
              title={`${
                period === 'live'
                  ? 'Live now'
                  : period === 'today'
                  ? 'Today’s action'
                  : 'Up next'
              }  ${list.length}`}
              right={
                <Row>
                  <IconButton
                    name="star"
                    label="Show favorite matches"
                    active={onlyFavorites}
                    onPress={() => setOnlyFavorites(v => !v)}
                  />
                  <IconButton
                    name="refresh"
                    label="Refresh scores"
                    onPress={refresh}
                  />
                </Row>
              }
            />
            {list.length
              ? grouped(showFeature ? list.filter(e => e.id !== list[0]?.id) : list)
              : empty(
                  'A little quiet here',
                  'Try another sport or save a favorite.',
                )}
          </>
        )}
        <Pressable onPress={() => navigate('arena')} style={s.arenaBanner}>
          <View style={s.arenaEmblem}>
            <Icon name="trophy" color={c.accent} />
          </View>
          <View style={s.grow}>
            <Text style={s.h3}>A different perspective.</Text>
            <Txt small style={{ marginTop: 4 }}>
              Explore picks in ContextFlow Arena
            </Txt>
          </View>
          <Icon name="arrow" color={c.muted} />
        </Pressable>
        {footer()}
      </>
    );
  }
  function renderToday() {
    let list = events.filter(
      e =>
        !e.live &&
        (day === 0 ? e.hours < 3 : day === 1 ? e.id === 'e9' : false) &&
        (sport === 'all' || sport === e.sport) &&
        (!onlyLeagues || favoriteLeagues.includes(e.league)),
    );
    return (
      <>
        <Text style={s.eyebrow}>THE SCHEDULE</Text>
        <Row between style={s.mt}>
          <Text style={s.title}>
            Today’s lineup<Text style={s.accent}>.</Text>
          </Text>
          <IconButton
            name="calendar"
            label="Choose date"
            onPress={() => setSheet('calendar')}
          />
        </Row>
        <Txt small style={{ marginTop: 9 }}>
          Match schedule · {new Date().toLocaleDateString()}
        </Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          {['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'].map((d, i) => (
            <Pressable
              key={d}
              onPress={() => setDay(i)}
              accessibilityRole="button"
              accessibilityLabel={`${d}, September ${i + 9}`}
              style={[
                s.calendar,
                day === i && { borderColor: brand, backgroundColor: c.tint },
              ]}
            >
              <Txt small style={day === i ? s.accent : undefined}>
                {d}
              </Txt>
              <Txt
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: day === i ? c.accent : c.text,
                }}
              >
                {9 + i}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
        {sportsStrip()}
        <Row between>
          {chip('★ Favorite leagues', onlyLeagues, () =>
            setOnlyLeagues(v => !v),
          )}
          <Link label="Manage leagues" onPress={() => setSheet('leagues')} />
        </Row>
        <Heading
          title="Coming up"
          right={<Link label="Refresh" onPress={refresh} />}
        />
        {refreshing ? (
          <ActivityIndicator color={c.accent} />
        ) : list.length ? (
          grouped(
            list.sort(
              (a, b) => a.sport.localeCompare(b.sport) || a.hours - b.hours,
            ),
          )
        ) : (
          empty(
            'No events scheduled',
            'Try another day, sport or league filter.',
          )
        )}
        {footer()}
      </>
    );
  }
  function renderSports() {
    return (
      <>
        <Text style={s.eyebrow}>FIND YOUR GAME</Text>
        <Text style={[s.title, s.mt]}>
          A world of sport<Text style={s.accent}>.</Text>
        </Text>
        <Pressable
          style={[s.search, s.mt]}
          onPress={() => navigate('search')}
          accessibilityLabel="Search teams, players and leagues"
        >
          <Icon name="search" size={18} color={c.muted} />
          <Txt small>Teams, players, leagues…</Txt>
        </Pressable>
        <Heading title="Explore sports" right={<Txt small>5 sports</Txt>} />
        <View style={s.grid}>
          {sports.slice(1).map(x => (
            <Pressable
              key={x.id}
              onPress={() => {
                resetFilters();
                setSport(x.id);
                navigate('sport');
                if(agent.session) void perform('navigate',{route:'sport',sport:x.id});
              }}
              style={s.directoryCard}
            >
              <Icon name={x.icon} size={27} color={c.accent} />
              <Text style={[s.h3, { marginTop: 10 }]}>{x.label}</Text>
              <Txt small>
                {events.filter(e => e.sport === x.id).length} events · {events.filter(e => e.sport === x.id && e.live).length} live
              </Txt>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              resetFilters();
              setOnlyFavorites(true);
              navigate('sport');
            }}
            style={s.directoryCard}
          >
            <Icon name="star" size={27} color={c.accent} />
            <Text style={[s.h3, { marginTop: 10 }]}>Your favorites</Text>
            <Txt small>{favorites.length} saved matches</Txt>
          </Pressable>
        </View>
        <Heading title="Popular leagues" />
        <View style={s.menuGroup}>
          {[
            'Albion Premier League',
            'Coastal T20 League',
            'National Hoops League',
          ].map((l, i) => (
            <Pressable
              key={l}
              onPress={() => {
                resetFilters();
                setLeague(l);
                navigate('sport');
              }}
              style={s.menuItem}
            >
              <Icon
                name={['football', 'cricket', 'basketball'][i]}
                color={c.accent}
              />
              <Text style={s.menuText}>{l}</Text>
              <Icon name="chevron" color={c.muted} size={16} />
            </Pressable>
          ))}
        </View>
        {footer()}
      </>
    );
  }
  function renderSport() {
    let list = events.filter(
      e =>
        (sport === 'all' || e.sport === sport) &&
        (country === 'All countries' || e.country === country) &&
        (league === 'All leagues' || e.league === league) &&
        (sportTime === 'Any time' ||
          (sportTime === 'Live now' && e.live) ||
          (sportTime === 'Today' && e.hours < 3) ||
          (sportTime === 'Next 3 hours' && !e.live && e.hours <= 3) ||
          (sportTime === 'Next 5 hours' && !e.live && e.hours <= 5)) &&
        (!onlyFavorites || favorites.includes(e.id)),
    );
    list.sort((a, b) =>
      sort === 'Start time'
        ? a.hours - b.hours
        : sort === 'League'
        ? a.league.localeCompare(b.league)
        : b.popularity - a.popularity,
    );
    return (
      <>
        {pageHead(
          onlyFavorites
            ? 'Your favorites'
            : sports.find(x => x.id === sport)?.label || 'Sports',
        )}
        <Pressable style={s.search} onPress={() => navigate('search')}>
          <Icon name="search" color={c.muted} size={18} />
          <Txt small>Find a team, player or league</Txt>
        </Pressable>
        <View style={[s.grid, s.mt]}>
          {[
            ['Country', country, 'country'],
            ['League', league, 'league'],
            ['Time', sportTime, 'time'],
            ['Sort', sort, 'sort'],
          ].map(([label, value, key]) => (
            <View key={key} style={{ width: '48%' }}>
              <Text style={[s.tiny, { marginBottom: 5 }]}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSheet(key)}
                style={[s.search, { paddingHorizontal: 10 }]}
              >
                <Txt small style={{ flex: 1 }}>
                  {value}
                </Txt>
                <Icon name="down" size={15} color={c.muted} />
              </Pressable>
            </View>
          ))}
        </View>
        <Heading
          title="Matches"
          right={<Txt small>{list.length} events</Txt>}
        />
        {list.length
          ? grouped(list)
          : empty(
              'No matching events',
              'Change your filters to find more fictional events.',
            )}
        {footer()}
      </>
    );
  }
  function renderSearch() {
    const q = query.toLowerCase(),
      list = events.filter(e =>
        `${e.a} ${e.b} ${e.league} ${e.sport} ${(e.players||[]).map(p=>p.name).join(' ')}`.toLowerCase().includes(q),
      );
    return (
      <>
        {pageHead('Find your next match')}
        <View style={s.search}>
          <Icon name="search" color={c.muted} />
          <TextInput
            accessibilityLabel="Search matches"
            value={query}
            onChangeText={setQuery}
            placeholder="Team, player, league…"
            placeholderTextColor={c.muted}
            style={s.searchInput}
            autoCorrect={false}
          />
        </View>
        <Txt small style={s.mt}>
          Search fictional teams and competitions.
        </Txt>
        <View style={s.mt}>
          {list.length
            ? grouped(list)
            : empty(
                'No matches found',
                'Try Northbridge, Azure or Cricket.',
                () => setQuery(''),
              )}
        </View>
      </>
    );
  }
  function renderEvent() {
    const all = markets(event),
      shown = all.filter(
        m =>
          marketTab === 'All markets' ||
          (marketTab === 'Popular' &&
            (event.source === 'live' || [
              'Match winner',
              'Double chance',
              'Total goals',
              'Total points',
              'Both teams to score',
            ].includes(m.name))) ||
          (marketTab === 'Goals & points' &&
            /Total|Both|Correct|Next/.test(m.name)) ||
          (marketTab === 'Players' && /Player/.test(m.name)) ||
          (marketTab === 'Combos' && /Custom|Double|Handicap/.test(m.name)),
      );
    return (
      <>
        {pageHead('Match centre')}
        <View style={s.feature}>
          <Row between>
            <Pill
              label={event.live ? '● LIVE' : 'UPCOMING'}
              live={event.live}
            />
            <Text style={[s.featureText, { flex: 1, textAlign: 'center' }]}>
              {event.league}
            </Text>
            <IconButton
              name="bell"
              label="Toggle match alerts"
              active={eventAlerts.includes(event.id)}
              onPress={() => {
                if(agent.session) {void perform('watch_event',{eventId:event.id,enabled:!eventAlerts.includes(event.id)});return;}
                setEventAlerts(v =>
                  v.includes(event.id)
                    ? v.filter(x => x !== event.id)
                    : [...v, event.id],
                );
                notify('Demo match alert preference updated.');
              }}
            />
          </Row>
          {scoreboard(event)}
          <Row between>
            <Text style={s.featureText}>{event.source === 'live' ? 'Live provider data · Demo credits' : 'Fictional event · Demo odds'}</Text>
            {favoriteButton(event)}
          </Row>
        </View>
        <Txt small style={s.mt}>
          {event.a} face {event.b} in the {event.league}. {event.source === 'live' ? `Provider updated ${new Date(event.fetchedAt || '').toLocaleTimeString()}. Demo credits only.` : 'Fictional demo action. Explore the markets below.'}
        </Txt>
        {suspended.includes(event.id) && (
          <View style={s.mt}>
            <Notice>
              Markets are temporarily suspended during a tactical pause.
            </Notice>
          </View>
        )}
        {event.source !== 'live' && <>
        <Row between style={s.mt}>
          <Txt small>Match momentum</Txt>
          <Text style={s.tiny}>Illustrative · not live data</Text>
        </Row>
        <View
          accessible
          accessibilityLabel="Illustrative match momentum chart"
          style={s.momentum}
        >
          {Array.from({ length: 38 }, (_, i) => (
            <View
              key={i}
              style={[
                s.momentBar,
                {
                  height: 8 + ((i * 17 + 13) % 34),
                  backgroundColor: i % 3 === 0 ? '#869BB9' : brand,
                },
              ]}
            />
          ))}
        </View>
        <Row between style={{ marginTop: 6 }}>
          <Text style={s.tiny}>Start</Text>
          <Text style={s.tiny}>Halfway</Text>
          <Text style={s.tiny}>Now</Text>
        </Row></>}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          {[
            'Popular',
            'All markets',
            'Goals & points',
            'Players',
            'Combos',
            'Stats',
            'Line-ups',
          ].map(x => chip(x, x === marketTab, () => {setMarketTab(x);if(agent.session)void perform('navigate',{route:'event',view:x});}))}
        </ScrollView>
        {marketTab === 'Stats'
          ? renderStats()
          : marketTab === 'Line-ups'
          ? renderLineups()
          : shown.map(m => (
              <View key={m.name} style={s.market}>
                <Pressable
                  style={s.marketHeader}
                  onPress={() =>
                    setExpanded(v =>
                      v.includes(m.name)
                        ? v.filter(x => x !== m.name)
                        : [...v, m.name],
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${m.name}, expand or collapse`}
                >
                  <Text style={s.h3}>{m.name}</Text>
                  <Icon
                    name={expanded.includes(m.name) ? 'plus' : 'down'}
                    size={17}
                    color={c.muted}
                  />
                </Pressable>
                {!expanded.includes(m.name) &&
                  oddsRow(m.options, false, m.name === 'Match winner')}
              </View>
            ))}
        {marketTab === 'Combos' && (
          <Notice>
            Each custom combination is one selection. Separate selections from
            the same event cannot be combined.
          </Notice>
        )}
        {footer()}
      </>
    );
  }
  function renderStats() {
    if (event.source === 'live'&&!event.statistics?.length) return <Notice>Detailed statistics are not supplied by this feed. Research remains available in your voice session, with its source and time.</Notice>;
    const rows:(string|number)[][] = event.statistics?.length
      ? event.statistics.map(row=>{const home=parseFloat(row.home),away=parseFloat(row.away),total=home+away;return [row.label,row.home,row.away,total>0?Math.round(home/total*100):50];})
      : event.sport === 'football'
        ? [
            ['Possession', '58%', '42%', 58],
            ['Shots', '12', '7', 63],
            ['Shots on target', '6', '3', 67],
            ['Corners', '5', '2', 71],
          ]
        : event.sport === 'cricket'
        ? [
            ['Run rate', '8.94', '8.08', 53],
            ['Boundaries', '17', '14', 55],
            ['Wickets', '4', '6', 40],
          ]
        : [
            ['Possession', '54%', '46%', 54],
            ['Attempts', '21', '19', 53],
            ['Efficiency', '61%', '56%', 52],
          ];
    return (
      <View style={s.panel}>
        <Text style={s.h3}>Match statistics</Text>
        {rows.map(([label, a, b, p]) => (
          <View key={String(label)}>
            <View style={s.stat}>
              <Txt style={s.accent}>{String(a)}</Txt>
              <Txt small>{String(label)}</Txt>
              <Txt>{String(b)}</Txt>
            </View>
            <View style={s.statBars}>
              <View
                style={{
                  flex: Number(p),
                  borderRadius: 4,
                  backgroundColor: brand,
                }}
              />
              <View
                style={{
                  flex: 100 - Number(p),
                  borderRadius: 4,
                  backgroundColor: '#869BB9',
                }}
              />
            </View>
          </View>
        ))}
        <Text style={[s.tiny, s.mt]}>
          Illustrative statistics for a fictional event.
        </Text>
        {!!event.timeline?.length&&<><Text style={[s.h3,s.mt]}>Scoring and match timeline</Text>{event.timeline.map(moment=><View key={moment.id} style={s.settingRow}><Txt small>{moment.clock}</Txt><Txt style={{flex:1,marginLeft:10}}>{moment.player ? `${moment.player} · `:''}{moment.label}{moment.secondary?` (${moment.secondary})`:''}</Txt>{moment.score&&<Txt style={s.accent}>{moment.score}</Txt>}</View>)}</>}
      </View>
    );
  }
  function renderLineups() {
    if (event.source === 'live'&&!event.players?.length) return <Notice>Official line-ups are not supplied by this feed.</Notice>;
    const players=event.players||[];
    return (
      <View style={s.panel}>
        <Text style={s.h3}>Player information</Text>
        <Txt small style={s.mt}>
          Fictional line-up preview · not an official team sheet
        </Txt>
        {(players.length?players:['J. Vale', 'A. Marlow', 'K. Soren', 'R. Dalen', 'T. Arden']).map(
          (p, i) => (
            <View key={typeof p==='string'?p:p.id} style={s.settingRow}>
              <Txt>
                {typeof p==='string'?`${i+7} · ${p}`:`${p.number} · ${p.name}`}
              </Txt>
              <Txt small style={{ flex: 1, textAlign: 'right' }}>
                {typeof p==='string'?(i%2?event.b:event.a):`${p.team==='home'?event.a:event.b} · ${p.position}`}
              </Txt>
            </View>
          ),
        )}
      </View>
    );
  }

  function slipItem(pick: Selection, preview = false) {
    const e = matchById(pick.eventId);
    return (
      <View key={pick.id} style={s.slipItem}>
        <Row>
          <View style={s.selectionCheck}>
            <Icon name="check" size={16} color={c.accent} />
          </View>
          <Text style={[s.h3, s.grow]}>{pick.label}</Text>
          <Text style={s.h3}>{pick.odds.toFixed(2)}</Text>
          <IconButton
            name="x"
            label={`Remove ${pick.label}`}
            onPress={() =>
              preview
                ? setCopySelections(v => v.filter(x => x.id !== pick.id))
                : agent.session ? void perform('remove_selection',{selectionId:pick.id}) : setSlip(v => v.filter(x => x.id !== pick.id))
            }
          />
        </Row>
        <Txt small style={{ marginTop: 7 }}>
          {e.a} vs {e.b}
        </Txt>
        <Row between style={{ marginTop: 4 }}>
          <Text style={s.tiny}>{pick.market}</Text>
          {pick.changed ? (
            <Text style={[s.tiny, s.accent]}>
              {pick.previous?.toFixed(2)} → {pick.odds.toFixed(2)} · changed
            </Text>
          ) : suspended.includes(pick.eventId) ? (
            <Text style={[s.tiny, s.negative]}>Suspended</Text>
          ) : null}
        </Row>
      </View>
    );
  }
  function renderSlip() {
    if (!slip.length)
      return empty(
        'Your next move starts here',
        'Tap any match odd to build your demo slip.',
        () => navigate('live'),
      );
    return (
      <>
        <View style={s.slipTabs}>
          {(['single', 'accumulator'] as BetMode[]).map(x => (
            <Pressable
              key={x}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === x }}
              onPress={() => agent.session ? void perform('set_mode',{mode:x}) : setMode(x)}
              style={[s.slipTab, mode === x && s.slipTabActive]}
            >
              <Text style={[s.muted, mode === x && s.accent]}>
                {x === 'single' ? 'Singles' : `Accumulator (${slip.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
        {slip.map(x => slipItem(x))}
        {slip.some(x => x.changed) && (
          <View style={s.mt}>
            <Notice>
              Odds have changed. These estimates use the updated prices.
            </Notice>
            <Button
              secondary
              label="Accept updated odds"
              onPress={() =>
                agent.session ? void perform('accept_odds') : setSlip(v => v.map(x => ({ ...x, changed: false })))
              }
              style={s.mt}
            />
          </View>
        )}
        <Text style={s.label}>
          {mode === 'single' ? 'Stake per selection' : 'Your stake'} · fictional
          credits
        </Text>
        <Row style={[s.input, { paddingVertical: 0 }]}>
          <TextInput
            testID="stake-input"
            accessibilityLabel="Demo stake"
            value={stake}
            onChangeText={editStake}
            keyboardType="decimal-pad"
            style={[s.searchInput, s.stakeInput]}
            placeholder="10"
            placeholderTextColor={c.muted}
          />
          <Txt small>DC</Txt>
        </Row>
        <View style={s.quickStakes}>
          {[5, 10, 25, 50].map(n => (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => editStake(String(n))}
              style={s.quickStake}
            >
              <Txt small>{n} DC</Txt>
            </Pressable>
          ))}
        </View>
        {[
          [
            'Total stake' +
              (mode === 'single' ? ` (${slip.length} singles)` : ''),
            `${credits(totals.totalStake)} DC`,
          ],
          [
            mode === 'single'
              ? 'Individual decimal odds'
              : 'Total decimal odds',
            mode === 'single'
              ? slip.map(x => x.odds.toFixed(2)).join(' / ')
              : totals.totalOdds.toFixed(3),
          ],
          ['Potential profit', `${credits(totals.profit)} DC`],
          ['Bonus estimate · none applied', '0.00 DC'],
        ].map(([label, value]) => (
          <View key={label} style={s.calcLine}>
            <Txt small style={{ flex: 1 }}>
              {label}
            </Txt>
            <Txt
              style={{
                fontSize: 12,
                fontWeight: '600',
                flexShrink: 1,
                textAlign: 'right',
              }}
            >
              {value}
            </Txt>
          </View>
        ))}
        <View style={s.calcReturn}>
          <View style={{ flex: 1 }}>
            <Txt>Estimated return</Txt>
            <Text style={s.tiny}>Includes stake · not guaranteed</Text>
          </View>
          <Text style={s.returnNumber}>
            {credits(totals.estimatedReturn)}
            <Text style={{ fontSize: 10 }}> DC</Text>
          </Text>
        </View>
        <View style={[s.panel, { padding: 11 }]}>
          <Text style={s.tiny}>
            {mode === 'single'
              ? slip
                  .map(
                    x =>
                      `${credits(totals.stake)} × ${x.odds.toFixed(
                        2,
                      )} = ${credits(totals.stake * x.odds)} DC`,
                  )
                  .join('\n')
              : `${credits(totals.stake)} × (${slip
                  .map(x => x.odds.toFixed(2))
                  .join(' × ')}) = ${credits(totals.estimatedReturn)} DC`}
            {'\n'}Potential profit = return − total stake.
          </Text>
        </View>
        {!!slipError && (
          <Text accessibilityRole="alert" style={s.error}>
            {slipError}
          </Text>
        )}
        <Button
          testID="place-demo-bet"
          label="Place Demo Bet"
          icon="ticket"
          onPress={reviewBet}
          disabled={!!slipError}
          style={s.mt}
        />
        <Row between style={s.mt}>
          <Txt small>Demo wallet</Txt>
          <Txt small>{credits(balance)} DC</Txt>
        </Row>
        <Row between>
          <Link label="Clear all" onPress={clearSlip} />
          <Link label="Preview odds change" onPress={changeOdds} />
        </Row>
        <Txt small style={{ textAlign: 'center' }}>
          No money is placed or paid out.
        </Txt>
      </>
    );
  }
  function renderAuth() {
    const signup = route === 'signup';
    if (route === 'forgot')
      return (
        <>
          {pageHead('Reset demo access')}
          <Notice>
            No email is sent. Continue with the empty field to try the demo.
          </Notice>
          <Field
            label="Email · optional"
            value={email}
            onChange={setEmail}
            placeholder="demo@contextflow.example"
            type="email-address"
          />
          <Button
            label="Send demo code"
            onPress={() => navigate('otp')}
            style={s.mt}
          />
          {footer()}
        </>
      );
    if (route === 'otp')
      return (
        <>
          {pageHead('Check your demo code')}
          <Notice>
            This is a demo. Enter 123456, or leave the field empty and continue.
          </Notice>
          <Field
            label="Verification code · optional"
            value={otp}
            onChange={setOtp}
            placeholder="123456"
            type="number-pad"
          />
          <Button
            label="Continue to demo"
            onPress={() => {
              setOtp('');
              navigate('live');
              notify('Demo access opened. This does not verify age. Choose a synthetic record in Settings.');
            }}
            style={s.mt}
          />
          {footer()}
        </>
      );
    return (
      <>
        <Row between style={{ marginBottom: 20 }}>
          <Pill label="YOUR MATCHDAY STARTS HERE" />
          {themeButton()}
        </Row>
        <View
          style={[
            s.welcomeArt,
            { height: 125, width: 125, alignSelf: 'center', marginBottom: 24 },
          ]}
        >
          <Icon
            name={signup ? 'user' : 'football'}
            size={58}
            color={c.accent}
          />
        </View>
        <Text style={[s.title, { fontSize: 32 }]}>
          {signup ? 'Let’s get you started.' : 'Good to see you.'}
        </Text>
        <Txt small style={{ marginTop: 12, marginBottom: 17 }}>
          Your sports. Your instincts. One place to follow the action.
        </Txt>
        <Notice>
          Demo access: all fields are optional. You can sign in or sign up with
          everything left empty.
        </Notice>
        {signup && (
          <Field
            label="Name · optional"
            value={name}
            onChange={setName}
            placeholder="Jamie Demo"
            testID="signup-name"
          />
        )}
        <Field
          label="Email or mobile · optional"
          value={email}
          onChange={setEmail}
          placeholder="demo@contextflow.example"
          type="email-address"
          testID="auth-email"
        />
        <Text style={s.label}>Password · optional</Text>
        <View style={s.passwordWrap}>
          <TextInput
            testID="auth-password"
            accessibilityLabel="Password, optional"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a demo password"
            placeholderTextColor={c.muted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={[s.input, s.passwordInput]}
          />
          <IconButton
            name="eye"
            label={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword(v => !v)}
            style={s.passwordEye}
          />
        </View>
        {signup ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            accessibilityLabel="Age and terms preview, optional in demo"
            style={[s.checkRow, { marginTop: 8 }]}
            onPress={() => setAccepted(v => !v)}
          >
            <View
              style={[
                s.check,
                accepted && { backgroundColor: brand, borderColor: brand },
              ]}
            >
              {accepted && <Icon name="check" size={13} color="#fff" />}
            </View>
            <Text style={[s.muted, { flex: 1, fontSize: 11 }]}>
              18+ and demo terms · optional preview
            </Text>
          </Pressable>
        ) : (
          <Link label="Forgot password?" onPress={() => navigate('forgot')} />
        )}
        <Button
          testID={signup ? 'sign-up-button' : 'sign-in-button'}
          label={
            busy
              ? 'Opening your demo…'
              : signup
              ? 'Create demo account'
              : 'Sign in'
          }
          onPress={() => authenticate(signup)}
          disabled={busy}
          style={s.mt}
        />
        {busy && (
          <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} />
        )}
        <Txt
          small
          style={{ textAlign: 'center', marginTop: 19, marginBottom: 12 }}
        >
          OR EXPLORE WITH
        </Txt>
        <Row>
          <Button
            secondary
            label="Apple · Demo"
            onPress={() =>
              notify('Social sign-in placeholder. Use the demo button above.')
            }
            style={s.grow}
          />
          <Button
            secondary
            label="Google · Demo"
            onPress={() =>
              notify('Social sign-in placeholder. Use the demo button above.')
            }
            style={s.grow}
          />
        </Row>
        <Link
          label={
            signup
              ? 'Already exploring? Sign in'
              : 'New to ContextFlow? Sign up'
          }
          onPress={() => {
            setEmail('');
            setPassword('');
            navigate(signup ? 'signin' : 'signup');
          }}
          style={{ alignItems: 'center', marginTop: 10 }}
        />
        <Link
          label="Take the welcome tour"
          onPress={() => {
            setOnboard(0);
            navigate('onboarding');
          }}
          style={{ alignItems: 'center' }}
        />
        {footer()}
      </>
    );
  }
  function renderOnboarding() {
    const panels = [
        {
          title: 'Right in the\nheart of the game.',
          copy: 'Follow every turn. Find your sports. Keep the moments that matter close.',
          icon: 'football',
        },
        {
          title: 'A clear view.\nEvery selection.',
          copy: 'Explore demo odds, build your slip, and see the estimates before you decide.',
          icon: 'ticket',
        },
        {
          title: 'Play on\nyour own terms.',
          copy: 'Set your time and spending limits. Take a break whenever you need.',
          icon: 'shield',
        },
      ],
      p = panels[onboard];
    return (
      <>
        <Row between>
          <Pill label="DEMO PROTOTYPE" />
          <Link label="Explore demo →" onPress={() => navigate('live')} />
        </Row>
        <View style={s.welcome}>
          <View style={s.welcomeArt}>
            <Icon name={p.icon} size={86} color={c.accent} />
          </View>
          <View style={s.welcomeDots}>
            {panels.map((_, i) => (
              <View
                key={i}
                style={[s.welcomeDot, i === onboard && s.welcomeDotActive]}
              />
            ))}
          </View>
          <Text style={s.welcomeTitle}>{p.title}</Text>
          <Text style={s.welcomeCopy}>{p.copy}</Text>
        </View>
        <Button
          label={onboard === 2 ? 'Get started' : 'Continue'}
          onPress={() =>
            onboard < 2 ? setOnboard(v => v + 1) : navigate('signup')
          }
          icon="arrow"
        />
        <Link
          label="Already exploring? Sign in"
          onPress={() => navigate('signin')}
          style={{ alignItems: 'center', marginTop: 9 }}
        />
        {footer()}
      </>
    );
  }

  // The remaining native destinations share the same primitives and state.
  function gameCard(id: string) {
    const g = games.find(x => x.id === id)!;
    return (
      <Pressable
        key={id}
        testID={`game-open-${id}`}
        onPress={() => startGame(id)}
        accessibilityRole="button"
        accessibilityLabel={`Demo play ${g.name}`}
        style={s.gameCard}
      >
        <View
          style={[
            s.gameThumb,
            {
              backgroundColor:
                id === 'cards'
                  ? '#34304B'
                  : id === 'rocket'
                  ? '#173D3A'
                  : '#263E61',
            },
          ]}
        >
          <Icon
            name={g.icon}
            size={37}
            color={
              id === 'cards'
                ? '#CBB7FF'
                : id === 'rocket'
                ? '#89E7D6'
                : '#A8CAFF'
            }
          />
        </View>
        <View style={s.grow}>
          <Text style={s.h3}>{g.name}</Text>
          <Txt small style={{ fontSize: 11, marginTop: 5, marginBottom: 8 }}>
            {g.description}
          </Txt>
          <Pill label="DEMO PLAY" />
        </View>
        <Icon name="chevron" size={18} color={c.muted} />
      </Pressable>
    );
  }
  function renderCasino() {
    const ids = games
      .filter(g => g.name.toLowerCase().includes(casinoQuery.toLowerCase()))
      .map(g => g.id);
    return (
      <>
        <Text style={s.eyebrow}>A CHANGE OF PACE</Text>
        <Text style={[s.title, { marginTop: 8, marginBottom: 19 }]}>
          Just for the play<Text style={s.accent}>.</Text>
        </Text>
        <View style={s.casinoFeature}>
          <View style={[s.pill, { backgroundColor: '#483454' }]}>
            <Text style={[s.pillText, { color: '#E9DFF1', fontSize: 8 }]}>
              CONTEXTFLOW ORIGINAL · DEMO PLAY
            </Text>
          </View>
          <View style={s.diceArt}>
            <Icon name="dice" color="#203E6B" size={61} />
          </View>
          <Text style={s.casinoTitle}>
            Let the good{String.fromCharCode(10)}times roll.
          </Text>
          <Text style={s.casinoCopy}>
            Meet Neon Dice.{String.fromCharCode(10)}Simple play, a little
            suspense.
          </Text>
          <Button
            label="Try Neon Dice"
            icon="arrow"
            onPress={() => startGame('dice')}
            style={{ alignSelf: 'flex-start', marginTop: 21 }}
          />
        </View>
        <View style={[s.search, s.mt]}>
          <Icon name="search" color={c.muted} size={18} />
          <TextInput
            value={casinoQuery}
            onChangeText={setCasinoQuery}
            placeholder="Find your game"
            accessibilityLabel="Search demo games"
            placeholderTextColor={c.muted}
            style={s.searchInput}
          />
        </View>
        <Heading title="Three originals. All yours." />
        {ids.length
          ? ids.map(gameCard)
          : empty(
              'No games found',
              'Try Neon Dice, Lucky Cards or Rocket Rise.',
              () => setCasinoQuery(''),
            )}
        {!!recent.length && (
          <>
            <Heading title="Recently played" />
            {recent.map(gameCard)}
          </>
        )}
        <Notice>
          Take a break whenever you need. These simulations use fictional game
          points only.
        </Notice>
        <Link
          label="Set time & spending reminders →"
          onPress={() => navigate('responsible')}
          style={{ alignItems: 'center' }}
        />
        {footer()}
      </>
    );
  }
  function renderGame() {
    const g = games.find(x => x.id === gameId)!;
    return (
      <>
        {pageHead(g.name)}
        <Row between>
          <Pill label="DEMO PLAY · ORIGINAL GAME" />
          <Txt small>{credits(gamePoints)} GP</Txt>
        </Row>
        <View style={s.gameStage}>
          {gameLoading || gameBusy ? (
            <>
              <ActivityIndicator size="large" color={c.accent} />
              <Txt small>
                {gameLoading
                  ? 'Getting the game ready…'
                  : 'A moment of suspense…'}
              </Txt>
            </>
          ) : gameId === 'cards' ? (
            <View style={s.playingCard}>
              <Text style={s.playingCardText}>{gameSymbol || '♧'}</Text>
            </View>
          ) : gameId === 'rocket' ? (
            <>
              <Icon name="rocket" size={77} color={c.accent} />
              <Text style={s.multiplier}>{gameSymbol || 'Ready?'}</Text>
            </>
          ) : (
            <Text style={s.gameSymbol}>{gameSymbol || '⚄'}</Text>
          )}
        </View>
        <Txt style={{ textAlign: 'center', minHeight: 42 }}>{gameResult}</Txt>
        <Field
          label="Stake · fictional game points"
          value={gameStake}
          onChange={setGameStake}
          type="number-pad"
        />
        <Button
          label={
            gameId === 'dice'
              ? 'Roll the dice'
              : gameId === 'cards'
              ? 'Draw a card'
              : 'Launch the rocket'
          }
          onPress={playGame}
          disabled={gameBusy || gameLoading || paused}
          icon={g.icon}
          style={s.mt}
        />
        <View style={[s.panel, s.mt]}>
          <Text style={s.h3}>How to play</Text>
          <Txt small style={{ marginTop: 10 }}>
            {g.rules}
          </Txt>
        </View>
        <View style={s.mt}>
          <Notice>
            Game points have no cash value. Random simulated results do not
            predict any real outcome.
          </Notice>
        </View>
        <Text style={[s.tiny, s.mt]}>
          1 GP counts as 1 point toward your session limit. Maximum stake: 50
          GP.
        </Text>
        {footer()}
      </>
    );
  }
  function renderArena() {
    return (
      <>
        {pageHead('ContextFlow Arena')}
        <View style={s.panel}>
          <Pill label="THE COMMUNITY CORNER" live />
          <Text style={[s.title, { marginTop: 14, fontSize: 27 }]}>
            Different minds.{String.fromCharCode(10)}One love of the game.
          </Text>
          <Txt small style={{ marginTop: 11 }}>
            Explore fictional picks. Find a new perspective. Your next move is
            always yours.
          </Txt>
        </View>
        <Heading
          title="From the community"
          right={<Text style={s.tiny}>Fictional profiles</Text>}
        />
        {community.map((p, i) => (
          <View key={p.name} style={s.communityCard}>
            <Row>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{p.initials}</Text>
              </View>
              <View style={s.grow}>
                <Text style={s.h3}>{p.name}</Text>
                <Text style={[s.tiny, { marginTop: 4 }]}>
                  {p.minutes} min ago · The evening edit
                </Text>
              </View>
            </Row>
            <Row between style={s.mt}>
              <Text style={s.tiny}>{p.rate} demo win rate · 50 picks</Text>
              <Row style={{ gap: 3 }}>
                {p.form.split('').map((x, j) => (
                  <View
                    key={j}
                    style={[
                      s.formCell,
                      x === 'L' && { backgroundColor: '#ff919115' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        color: x === 'W' ? c.positive : c.negative,
                      }}
                    >
                      {x}
                    </Text>
                  </View>
                ))}
              </Row>
            </Row>
            {p.eventIds.map(id => {
              const e = matchById(id);
              return (
                <View key={id} style={s.communitySelection}>
                  <Text style={s.accent}>•</Text>
                  <View style={s.grow}>
                    <Text style={s.h3}>{e.a}</Text>
                    <Text style={[s.tiny, { marginTop: 4 }]}>
                      {e.a} vs {e.b}
                      {String.fromCharCode(10)}Match winner
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={s.communityStats}>
              {[
                [
                  `${p.eventIds.length} picks · posted odds`,
                  p.posted.toFixed(2),
                ],
                ['Fictional stake', `${p.stake} DC`],
                ['Possible return', `${credits(p.stake * p.posted)} DC`],
              ].map(([label, value], j) => (
                <View key={label} style={s.grow}>
                  <Text style={s.tiny}>{label}</Text>
                  <Text
                    style={[
                      s.h3,
                      { marginTop: 5, fontSize: 12 },
                      j === 2 && s.accent,
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
            <Button
              secondary
              label="Copy Slip"
              icon="copy"
              onPress={() => previewCopy(i)}
            />
          </View>
        ))}
        <Notice>
          Community activity is not financial advice. Copying a slip does not
          guarantee a win. All profiles and records are fictional.
        </Notice>
        {footer()}
      </>
    );
  }
  function renderMenu() {
    return (
      <>
        <Row between>
          <Text style={s.title}>
            Your corner<Text style={s.accent}>.</Text>
          </Text>
          {themeButton()}
        </Row>
        <Pressable
          onPress={() => navigate('profile')}
          style={[s.panel, s.mt, s.row]}
        >
          <View style={[s.avatar, { width: 49, height: 49, borderRadius: 25 }]}>
            <Text style={[s.avatarText, { fontSize: 17 }]}>JD</Text>
          </View>
          <View style={s.grow}>
            <Text style={s.h3}>Jamie Demo</Text>
            <Txt small style={{ marginTop: 5 }}>
              A love of the game.
            </Txt>
          </View>
          <Icon name="chevron" color={c.muted} />
        </Pressable>
        <Pressable testID="open-arena" accessibilityRole="button" accessibilityLabel="Open ContextFlow Arena" style={s.arenaBanner} onPress={() => navigate('arena')}>
          <View style={s.arenaEmblem}>
            <Icon name="trophy" color={c.accent} />
          </View>
          <View style={s.grow}>
            <Text style={s.h3}>ContextFlow Arena</Text>
            <Txt small style={{ marginTop: 4 }}>
              Discover a different perspective
            </Txt>
          </View>
          <Icon name="chevron" color={c.muted} />
        </Pressable>
        <Text style={[s.eyebrow, { marginTop: 23 }]}>YOUR ACTIVITY</Text>
        <View style={s.menuGroup}>
          {menuItem(
            'wallet',
            'Demo wallet',
            'wallet',
            `${credits(balance)} DC`,
          )}
          {menuItem('ticket', 'Open demo bets', 'open', String(bets.length))}
          {menuItem('clock', 'Bet history', 'history')}
          {menuItem('gift', 'Promotions', 'promotions')}
          {menuItem('bell', 'Notifications', 'notifications')}
        </View>
        <Text style={s.eyebrow}>MAKE IT YOURS</Text>
        <View style={s.menuGroup}>
          {menuItem('settings', 'App settings', 'settings')}
          {menuItem('stats', 'Odds format', 'odds', 'Decimal')}
          {menuItem(
            theme === 'dark' ? 'moon' : 'sun',
            'Appearance',
            'appearance',
            theme === 'dark' ? 'Dark' : 'Light',
          )}
          {menuItem('headphones', 'Help & support', 'support')}
        </View>
        <Text style={s.eyebrow}>STAY IN CONTROL</Text>
        <View style={s.menuGroup}>
          {menuItem('shield', 'Responsible gaming', 'responsible')}
          {menuItem(
            'clock',
            'Session reminder',
            'reminders',
            reminder ? `${reminder} min` : 'Off',
          )}
          {menuItem('lock', 'Self-exclusion information', 'exclusion')}
          {menuItem('spark', 'Welcome tour', 'onboarding')}
        </View>
        <Button
          secondary
          label="Sign out of demo"
          icon="logout"
          onPress={() =>
            Alert.alert(
              'Leave the demo account?',
              'Your current slip will be cleared.',
              [
                { text: 'Stay here', style: 'cancel' },
                {
                  text: 'Sign out',
                  onPress: () => {
                    void agent.stop().catch(() => {});
                    if(agent.session) void perform('clear_slip');
                    setSlip([]);
                    setName('');
                    setEmail('');
                    setPassword('');
                    navigate('signin');
                  },
                },
              ],
            )
          }
        />
        {footer()}
      </>
    );
  }
  function renderWallet() {
    return (
      <>
        {pageHead('Demo wallet')}
        <View style={s.walletCard}>
          <Row between>
            <Text style={s.featureText}>AVAILABLE DEMO CREDITS</Text>
            <Icon name="wallet" color="#A2C6FF" />
          </Row>
          <Text style={s.walletBalance}>
            {credits(balance)} <Text style={{ fontSize: 15 }}>DC</Text>
          </Text>
          <Button
            label="Deposit · Demo only"
            icon="plus"
            onPress={() => setSheet('deposit')}
          />
        </View>
        <Notice>
          Demo credits have no monetary value. Deposits and withdrawals are
          unavailable.
        </Notice>
        <Heading title="Activity" />
        <View style={[s.panel, s.mb]}>
          <Row between>
            <View>
              <Text style={s.h3}>Welcome demo credits</Text>
              <Txt small>Fictional opening balance</Txt>
            </View>
            <Txt style={s.positive}>+1,250 DC</Txt>
          </Row>
        </View>
        {bets.map(b => (
          <View key={b.id} style={[s.panel, s.mb]}>
            <Row between>
              <View>
                <Text style={s.h3}>Demo bet placed</Text>
                <Txt small>{b.id}</Txt>
              </View>
              <Txt>−{credits(b.totalStake)} DC</Txt>
            </Row>
          </View>
        ))}
      </>
    );
  }
  function renderHistory() {
    return (
      <>
        {pageHead(route === 'open' ? 'Open demo bets' : 'Bet history')}
        <Txt small style={s.mb}>
          Your demo activity, all in one place. Real settlements are not
          simulated.
        </Txt>
        {bets.length
          ? bets.map(b => (
              <View key={b.id} style={[s.panel, s.mb]}>
                <Row between>
                  <Text style={s.h3}>
                    {b.mode === 'single' ? 'Singles' : 'Accumulator'} ·{' '}
                    {b.selections.length} picks
                  </Text>
                  <Pill label="OPEN · DEMO" live />
                </Row>
                <Text style={[s.tiny, { marginTop: 8 }]}>
                  {b.id} · Just now
                </Text>
                {b.selections.map(p => (
                  <View key={p.id} style={{ marginTop: 12 }}>
                    <Txt style={{ fontWeight: '600', fontSize: 13 }}>
                      {p.label} · {p.odds.toFixed(2)}
                    </Txt>
                    <Txt small>{p.market}</Txt>
                  </View>
                ))}
                <View style={s.rule} />
                <Row between>
                  <Txt small>Stake</Txt>
                  <Txt>{credits(b.totalStake)} DC</Txt>
                </Row>
                <Row between style={s.mt}>
                  <Txt small>Estimated return</Txt>
                  <Txt style={s.accent}>{credits(b.estimatedReturn)} DC</Txt>
                </Row>
              </View>
            ))
          : empty(
              'A fresh start',
              'Your bets appear here after you review and confirm a demo slip.',
              () => navigate('live'),
            )}
        {footer()}
      </>
    );
  }
  function renderSuccess() {
    const b = bets[0];
    return (
      <>
        {pageHead('Confirmation')}
        <View style={s.center}>
          <View style={s.successIcon}>
            <Icon name="check" color={c.accent} size={36} />
          </View>
          <Pill label="DEMO BET CONFIRMED" live />
          <Text style={[s.title, s.mt, { textAlign: 'center' }]}>
            You’re in the moment.
          </Text>
          <Txt small style={[s.mt, { textAlign: 'center' }]}>
            Your demo slip has been recorded.{String.fromCharCode(10)}No real
            money has been used.
          </Txt>
        </View>
        {b && (
          <View style={[s.panel, s.mt]}>
            <Row between>
              <Text style={s.tiny}>REFERENCE</Text>
              <Text style={s.tiny}>{b.id}</Text>
            </Row>
            <View style={s.rule} />
            <Row between>
              <Txt small>Total stake</Txt>
              <Txt>{credits(b.totalStake)} DC</Txt>
            </Row>
            <Row between style={s.mt}>
              <Txt small>Estimated return</Txt>
              <Txt style={s.accent}>{credits(b.estimatedReturn)} DC</Txt>
            </Row>
          </View>
        )}
        <Button
          label="View open demo bets"
          onPress={() => navigate('open')}
          style={s.mt}
        />
        <Button
          secondary
          label="Back to the action"
          onPress={() => navigate('live')}
          style={s.mt}
        />
        {footer()}
      </>
    );
  }
  function renderResponsible() {
    return (
      <>
        {pageHead(
          route === 'reminders'
            ? 'Session reminders'
            : route === 'exclusion'
            ? 'Self-exclusion'
            : 'Stay in control',
        )}
        <View style={s.panel}>
          <Pill label="YOUR WELLBEING COMES FIRST" live />
          <Text style={[s.title, s.mt]}>
            Keep play{String.fromCharCode(10)}in perspective.
          </Text>
          <Txt small style={s.mt}>
            Set your own boundaries. Take a break. The game can wait.
          </Txt>
        </View>
        <View style={s.mt}>
          <Notice>
            18+ only. Demo credits and game points have no cash value.
          </Notice>
        </View>
        <Heading
          title="Your session"
          right={
            <Txt small>
              {Math.floor((Date.now() - started.current) / 60000)} min elapsed
            </Txt>
          }
        />
        <View style={s.panel}>
          <Text style={s.h3}>Time reminder</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipRow}
          >
            {[0, 5, 15, 30, 60].map(n =>
              chip(
                n ? `${n} min` : 'Off',
                reminder === n,
                () => agent.session ? void perform('settings',{reminderMinutes:n}) : setReminder(n),
                String(n),
              ),
            )}
          </ScrollView>
          <Field
            label="Session spending limit · demo points"
            value={limitInput}
            onChange={setLimitInput}
            type="number-pad"
          />
          <Txt small style={s.mt}>
            {credits(spent)} of {credits(limit)} used across sports and casino.
          </Txt>
          <Button label="Save my limits" onPress={saveLimits} style={s.mt} />
        </View>
        <Heading title="Make space for a break" />
        <View style={s.panel}>
          <Text style={s.h3}>
            {paused ? 'Play is currently paused' : 'Self-exclusion demo'}
          </Text>
          <Txt small style={s.mt}>
            Pause all demo bets and games for this app session. You can still
            browse scores. Real self-exclusion needs identity verification and a
            binding exclusion period.
          </Txt>
          <Button
            secondary
            label={paused ? 'Demo play paused' : 'Pause all demo play'}
            disabled={paused}
            onPress={pausePlay}
            style={s.mt}
          />
        </View>
        <View style={s.mt}>
          <Notice>
            Play should never take priority over your time, finances or
            wellbeing. Contact a trusted local gambling-support service if you
            need support.
          </Notice>
        </View>
        {footer()}
      </>
    );
  }
  function renderSettings() {
    return (
      <>
        {pageHead('App settings')}
        <View style={s.panel}>
          {toggleRow(
            'Dark mode',
            'Switch between light and dark',
            theme === 'dark',
            () => changeTheme(),
          )}
          {toggleRow(
            'Optional match alerts',
            'Off by default. Only for matches you follow.',
            notifications,
            value => void perform('notification_preferences',{optionalConsent:value,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}),
          )}
          <View style={s.settingRow}>
            <View style={s.grow}>
              <Text style={s.h3}>Reduced motion</Text>
              <Txt small>
                Follows device preference; no continuous UI animation
              </Txt>
            </View>
            <Txt small>Automatic</Txt>
          </View>
        </View>
        <View style={s.panel} testID="notification-policy">
          <Text style={s.h3}>Your notification limits</Text>
          <Txt small>22:00–08:00 device-local quiet hours · at most 3 optional alerts daily · at least 60 minutes apart. Proposed demo defaults.</Txt>
          <Txt small style={s.mt}>Requested break reminders and microphone controls remain available.</Txt>
          <Button secondary label="Test optional match alert" onPress={() => void perform('preview_alert',{eventId:'e1'})} style={s.mt}/>
          <Txt small style={s.mt}>{task?.deliveryDecisions?.at(-1) ? `Last decision: ${task.deliveryDecisions.at(-1)!.reason.replaceAll('_',' ')}` : 'No delivery attempts yet.'}</Txt>
        </View>
        <Heading title="Synthetic eligibility register" />
        <Txt small style={s.mb}>Sample records only. No personal data or real identity verification. Voice cannot change these records.</Txt>
        <View style={s.panel} testID="eligibility-profiles">
          <Text style={s.h3}>Current: {task?.eligibility?.profileId || 'unknown'}</Text>
          {['eligible-adult','unverified','underage','at-risk','self-excluded'].map(profileId => <Button key={profileId} secondary label={`Use ${profileId} sample`} onPress={() => void perform('demo_profile',{profileId})} style={s.mt}/>)}
        </View>
        <Heading title="Prototype states" />
        <Txt small style={s.mb}>
          Explore the recovery states of this native demo.
        </Txt>
        <View style={s.panel}>
          {toggleRow(
            'Fail next demo bet',
            'Simulate a connection failure',
            failNext,
            setFailNext,
          )}
          <Link
            label="Toggle first slip market suspension"
            onPress={() => {
              if (!slip.length) return notify('Add a selection first.');
              const id = slip[0].eventId;
              setSuspended(v =>
                v.includes(id) ? v.filter(x => x !== id) : [...v, id],
              );
              notify('Market suspension updated.');
            }}
          />
          <Link
            label="Preview feed loading"
            onPress={() => {
              navigate('live');
              refresh();
            }}
          />
          <Link
            label="Preview no events"
            onPress={() => {
              resetFilters();
              setCountry('Solara');
              navigate('sport');
            }}
          />
          <Link
            label="Preview session reminder"
            onPress={() => setSheet('reminder')}
          />
        </View>
        <View style={s.mt}>
          <Notice>
            Your theme is saved on this device. Demo activity resets when the
            app restarts. No personal information is stored.
          </Notice>
        </View>
      </>
    );
  }
  function renderInfo() {
    if (route === 'appearance')
      return (
        <>
          {pageHead('Appearance')}
          <Txt small style={s.mb}>
            Choose the look that feels right. Your choice is remembered on this
            device.
          </Txt>
          {(['dark', 'light'] as const).map(t => (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: theme === t }}
              onPress={() => changeTheme(t)}
              style={[s.panel, s.row, s.mb]}
            >
              <Icon name={t === 'dark' ? 'moon' : 'sun'} color={c.accent} />
              <Text style={[s.h3, s.grow]}>
                {t === 'dark' ? 'Midnight · Dark' : 'Daylight · Light'}
              </Text>
              {theme === t && <Icon name="check" color={c.accent} />}
            </Pressable>
          ))}
        </>
      );
    if (route === 'profile')
      return (
        <>
          {pageHead('Demo profile')}
          <View style={[s.panel, s.row, s.mb]}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>JD</Text>
            </View>
            <View>
              <Text style={s.h2}>Jamie Demo</Text>
              <Txt small>demo@contextflow.example</Txt>
            </View>
          </View>
          <Notice>
            This is a fictional profile. Personal information is never collected
            or saved.
          </Notice>
          <View style={[s.panel, s.mt]}>
            {[
              ['Account', 'Demo participant'],
              ['Age status', '18+ demo preview'],
              ['Currency', 'DC · fictional credits'],
            ].map(([l, v]) => (
              <View key={l} style={s.settingRow}>
                <Txt>{l}</Txt>
                <Txt small>{v}</Txt>
              </View>
            ))}
          </View>
          <Button
            secondary
            label="Preview sign-up"
            onPress={() => navigate('signup')}
            style={s.mt}
          />
        </>
      );
    if (route === 'notifications')
      return (
        <>
          {pageHead('Notifications')}
          <View style={[s.panel, s.mb]}>
            <Text style={s.h3}>Your matchday, at a glance</Text>
            <Text style={[s.tiny, { marginTop: 5 }]}>
              Demo feed · a moment ago
            </Text>
            <Txt small style={s.mt}>
              Northbridge FC lead Eastport United 2–1. All scores are fictional.
            </Txt>
            <Link label="Open match centre →" onPress={() => openEvent('e1')} />
          </View>
          <View style={s.panel}>
            <Text style={s.h3}>A reminder to make it yours</Text>
            <Txt small style={s.mt}>
              Set time and spending reminders before you explore.
            </Txt>
            <Link
              label="Set my limits →"
              onPress={() => navigate('responsible')}
            />
          </View>
          {footer()}
        </>
      );
    if (route === 'odds')
      return (
        <>
          {pageHead('Odds format')}
          <View style={s.panel}>
            <Row between>
              <Text style={s.h3}>Decimal</Text>
              <Pill label="SELECTED" live />
            </Row>
            <Txt small style={s.mt}>
              10 DC at 1.85 estimates a return of 18.50 DC, including your
              stake. Potential profit: 8.50 DC.
            </Txt>
          </View>
          <Txt small style={s.mt}>
            Decimal is the supported odds format in this prototype.
          </Txt>
        </>
      );
    if (route === 'promotions')
      return (
        <>
          {pageHead('Promotions')}
          <View style={s.casinoFeature}>
            <Pill label="DEMO PREVIEW" />
            <Text style={s.casinoTitle}>
              Here for{String.fromCharCode(10)}the experience.
            </Text>
            <Text style={s.casinoCopy}>
              Explore all three ContextFlow Originals with fictional points.
            </Text>
            <Button
              label="Explore games"
              onPress={() => navigate('casino')}
              style={s.mt}
            />
          </View>
          <View style={s.mt}>
            <Notice>
              No cash offers or promotional bonuses apply. Bonus estimates are 0
              DC.
            </Notice>
          </View>
        </>
      );
    return (
      <>
        {pageHead('Help & support')}
        <View style={s.panel}>
          <Text style={s.h3}>A few things worth knowing</Text>
          {[
            [
              'How do I sign in?',
              'All sign-in and sign-up fields are optional. Press the main button with blank fields to enter the demo. No account is created.',
            ],
            [
              'How do demo bets work?',
              'Choose an odd, enter a fictional stake, review your estimates, then confirm. No money is involved.',
            ],
            [
              'What is an accumulator?',
              'Its decimal odds are multiplied together. Estimated return equals stake × total odds. Every pick would need to win for a real payout.',
            ],
            [
              'Can I copy a community slip?',
              'Open Menu → ContextFlow Arena → Copy Slip. Review and accept current odds before adding picks. Copying never places a bet.',
            ],
            [
              'Does the voice agent listen?',
              'Voice control uses your microphone only after you start it. Stop or mute anytime. Research and actions share your saved task.',
            ],
            [
              'What is saved?',
              'Your theme stays on this device. The demo backend saves your task, latest instruction, research, slip, receipts, sample eligibility and notification controls. The full conversation is not saved by the app. Use fictional inputs only.',
            ],
          ].map(([q, a]) => (
            <View key={q} style={{ marginTop: 18 }}>
              <Text style={s.h3}>{q}</Text>
              <Txt small style={{ marginTop: 8 }}>
                {a}
              </Txt>
            </View>
          ))}
        </View>
        {footer()}
      </>
    );
  }
  function renderScreen() {
    if (route === 'live') return renderFeed();
    if (route === 'today') return renderToday();
    if (route === 'sports') return renderSports();
    if (route === 'sport') return renderSport();
    if (route === 'search') return renderSearch();
    if (route === 'event') return renderEvent();
    if (route === 'slip')
      return (
        <>
          {pageHead('Your bet slip')}
          {renderSlip()}
          {footer()}
        </>
      );
    if (route === 'casino') return renderCasino();
    if (route === 'game') return renderGame();
    if (route === 'arena') return renderArena();
    if (route === 'menu') return renderMenu();
    if (route === 'wallet') return renderWallet();
    if (route === 'open' || route === 'history') return renderHistory();
    if (route === 'success') return renderSuccess();
    if (route === 'onboarding') return renderOnboarding();
    if (auth) return renderAuth();
    if (['responsible', 'reminders', 'exclusion'].includes(route))
      return renderResponsible();
    if (route === 'settings') return renderSettings();
    return renderInfo();
  }
  function sheetTitle() {
    return (
      (
        {
          slip: `Your bet slip · ${slip.length}`,
          confirm: 'One final look',
          failed: 'Couldn’t record this demo bet',
          voice: 'Voice options',
          copy: 'Make this slip yours',
          deposit: 'A wallet for exploring',
          reminder: 'Time for a little check-in',
          country: 'Choose country',
          league: 'Choose league',
          time: 'Choose time',
          sort: 'Sort matches',
          calendar: 'Choose a demo matchday',
          leagues: 'Your favorite leagues',
        } as Record<string, string>
      )[sheet || ''] || 'ContextFlow'
    );
  }
  function renderSheet() {
    if (sheet === 'slip') return renderSlip();
    if (sheet === 'copy') {
      const p = community[copyIndex];
      return (
        <>
          <Txt small>{p.name} · review each selection before adding.</Txt>
          {copySelections.map(x => slipItem(x, true))}
          <View style={s.mt}>
            <Notice>
              Posted combined odds: {p.posted.toFixed(2)}. Current combined
              odds: {copySelections.reduce((a, x) => a * x.odds, 1).toFixed(3)}.
              Estimates use current prices.
            </Notice>
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="I reviewed the current odds"
            accessibilityState={{ checked: copyAccepted }}
            onPress={() => setCopyAccepted(v => !v)}
            style={[s.checkRow, s.mt]}
          >
            <View style={[s.check, copyAccepted && { backgroundColor: brand }]}>
              {copyAccepted && <Icon name="check" size={13} color="#fff" />}
            </View>
            <Txt small>I have reviewed the current odds.</Txt>
          </Pressable>
          <Button
            testID="copy-add-button"
            label={`Add ${copySelections.length} selections to my slip`}
            onPress={addCopied}
            disabled={!copyAccepted || !copySelections.length}
            style={s.mt}
          />
          <Txt small style={s.mt}>
            Copying never places a bet. Community activity is not financial
            advice and does not guarantee a win.
          </Txt>
        </>
      );
    }
    if (sheet === 'confirm' && pending)
      return (
        <>
          <Txt small>Confirm your fictional stake and selections.</Txt>
          <View style={[s.panel, s.mt]}>
            {pending.selections.map(x => (
              <Row key={x.id} between style={{ marginVertical: 6 }}>
                <Txt small style={s.grow}>
                  {x.label}
                </Txt>
                <Txt>{x.odds.toFixed(2)}</Txt>
              </Row>
            ))}
            <View style={s.rule} />
            <Row between>
              <Txt small>Total stake</Txt>
              <Txt>{credits(pending.totalStake)} DC</Txt>
            </Row>
            <Row between style={s.mt}>
              <Txt small>Estimated return</Txt>
              <Txt style={s.accent}>{credits(pending.estimatedReturn)} DC</Txt>
            </Row>
          </View>
          <Txt small style={s.mt}>
            Returns are estimates. No real money is used.
            {pending.mode === 'accumulator' && pending.selections.length > 1
              ? ' Every selection must win in a real accumulator.'
              : ''}
          </Txt>
          <Button
            testID="confirm-demo-bet"
            label={busy ? 'Recording demo bet…' : 'Confirm Demo Bet'}
            disabled={busy}
            onPress={confirmBet}
            style={s.mt}
          />
          <Button
            secondary
            label="Back to my slip"
            onPress={() => setSheet('slip')}
            style={s.mt}
          />
        </>
      );
    if (sheet === 'failed')
      return (
        <>
          <View style={s.center}>
            <View style={s.successIcon}>
              <Icon name="info" size={36} color={c.negative} />
            </View>
          </View>
          <Txt small>
            Your balance is unchanged and your selections remain in the slip.
            This was a simulated connection failure.
          </Txt>
          <Button
            label="Return to slip & retry"
            onPress={() => setSheet('slip')}
            style={s.mt}
          />
        </>
      );
    if (sheet === 'voice') return <VoicePanel c={c} onError={notify} onClose={() => setSheet(null)} />;
    if (sheet === 'deposit')
      return (
        <>
          <View style={s.center}>
            <View style={s.successIcon}>
              <Icon name="wallet" size={35} color={c.accent} />
            </View>
          </View>
          <Txt small>
            This deposit control is demo-only. No payment information is
            collected and no transaction can be made.
          </Txt>
          <Button label="Got it" onPress={() => setSheet(null)} style={s.mt} />
        </>
      );
    if (sheet === 'reminder')
      return (
        <>
          <View style={s.center}>
            <View style={s.successIcon}>
              <Icon name="clock" size={35} color={c.accent} />
            </View>
          </View>
          <Txt small style={{ textAlign: 'center' }}>
            You’ve been exploring for{' '}
            {Math.max(1, Math.floor((Date.now() - started.current) / 60000))}{' '}
            minutes.{String.fromCharCode(10)}Session spending: {credits(spent)}{' '}
            demo points.
          </Txt>
          <Button
            label="Take a break"
            onPress={() => {
              setOnboard(2);
              navigate('onboarding');
            }}
            style={s.mt}
          />
          <Button
            secondary
            label="Continue exploring"
            onPress={() => setSheet(null)}
            style={s.mt}
          />
        </>
      );
    if (sheet === 'calendar')
      return (
        <>
          <Txt small>Fixed fictional schedule · September 2026</Txt>
          <View style={[s.wrap, s.mt]}>
            {['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'].map((d, i) =>
              chip(`${d} ${i + 9}`, day === i, () => {
                setDay(i);
                setSheet(null);
              }),
            )}
          </View>
        </>
      );
    if (sheet === 'leagues')
      return (
        <>
          {[...new Set(events.map(x => x.league))].map(l => (
            <Pressable
              key={l}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: favoriteLeagues.includes(l) }}
              onPress={() =>
                setFavoriteLeagues(v =>
                  v.includes(l) ? v.filter(x => x !== l) : [...v, l],
                )
              }
              style={s.menuItem}
            >
              <Icon
                name="star"
                color={favoriteLeagues.includes(l) ? c.accent : c.muted}
              />
              <Text style={s.menuText}>{l}</Text>
              <Txt small>{favoriteLeagues.includes(l) ? 'Saved' : 'Save'}</Txt>
            </Pressable>
          ))}
        </>
      );
    const options =
      sheet === 'country'
        ? ['All countries', 'Albion', 'Coastland', 'Virtual', 'Solara']
        : sheet === 'league'
        ? [
            'All leagues',
            ...new Set(
              events
                .filter(e => sport === 'all' || e.sport === sport)
                .map(e => e.league),
            ),
          ]
        : sheet === 'time'
        ? ['Any time', 'Live now', 'Today', 'Next 3 hours', 'Next 5 hours']
        : ['Popularity', 'Start time', 'League'];
    return (
      <>
        {options.map(x => (
          <Pressable
            key={x}
            accessibilityRole="button"
            style={s.menuItem}
            onPress={() => {
              if (sheet === 'country') setCountry(x);
              else if (sheet === 'league') setLeague(x);
              else if (sheet === 'time') setSportTime(x);
              else setSort(x);
              setSheet(null);
            }}
          >
            <Text style={s.menuText}>{x}</Text>
            <Icon name="chevron" color={c.muted} />
          </Pressable>
        ))}
      </>
    );
  }
  const activeTab = ['live', 'today', 'sports', 'casino', 'menu'].includes(
    route,
  )
    ? route
    : ['event', 'search', 'slip', 'success'].includes(route)
    ? 'live'
    : route === 'sport'
    ? 'sports'
    : route === 'game'
    ? 'casino'
    : 'menu';
  const toast = message ? (
    <View pointerEvents="none" accessibilityLiveRegion="polite" style={s.toast}>
      <Icon name="check" size={17} color={c.accent} />
      <Text style={s.toastText}>{message}</Text>
    </View>
  ) : null;
  return (
    <UI.Provider value={{ c, s }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={s.root}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        />
        <View style={{flex:1}} accessibilityElementsHidden={sheet !== null} importantForAccessibility={sheet !== null ? 'no-hide-descendants' : 'auto'}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ContextFlow home"
            onPress={() => navigate('live')}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={[s.wordmark, width < 365 && { fontSize: 18 }]}>
              ContextFlow<Text style={s.brandSlash}>/</Text>
            </Text>
            <Text style={s.brandSub}>DEMO PROTOTYPE</Text>
          </Pressable>
          <View style={s.grow} />
          {auth ? (
            <Pill label="18+ · DEMO ACCESS" />
          ) : (
            <>
              <IconButton
                name="search"
                label="Search matches"
                onPress={() => navigate('search')}
              />
              <IconButton
                name="bell"
                label="Notifications"
                onPress={() => navigate('notifications')}
              />
              <Pressable
                accessibilityLabel="Demo wallet"
                accessibilityRole="button"
                onPress={() => navigate('wallet')}
                style={s.walletMini}
              >
                <Text style={[s.walletText, width < 365 && { fontSize: 9 }]}>
                  {credits(balance)}
                  <Text style={{ fontSize: 7, color: c.muted }}> DC</Text>
                </Text>
                <View style={s.plus}>
                  <Icon name="plus" size={15} color="#fff" />
                </View>
              </Pressable>
            </>
          )}
        </View>
        <KeyboardAvoidingView
          style={s.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scroll}
            testID="screen-scroll"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.content,
              auth && { paddingBottom: insets.bottom + 25 },
            ]}
            refreshControl={
              ['live', 'today'].includes(route) ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={c.accent}
                  colors={[brand]}
                />
              ) : undefined
            }
          >
            {renderScreen()}
          </ScrollView>
        </KeyboardAvoidingView>
        {!auth && (
          <>
            {sheet !== 'voice' && <VoiceDock c={c} onOpen={() => setSheet('voice')} onError={notify} onSlip={() => setSheet('slip')} />}
            {slip.length > 0 && route !== 'slip' && ['idle','ended','offline'].includes(agent.voice.status) && (
              <View style={s.dock}>
                <Pressable
                  testID="open-bet-slip"
                  accessibilityRole="button"
                  accessibilityLabel={`Open bet slip, ${slip.length} selections`}
                  onPress={() => setSheet('slip')}
                  style={s.dockButton}
                >
                  <View style={s.dockCount}>
                    <Text
                      style={{ color: brand, fontWeight: '700', fontSize: 12 }}
                    >
                      {slip.length}
                    </Text>
                  </View>
                  <Text style={[s.dockText, s.grow]}>Your bet slip</Text>
                  <Text style={[s.dockText, { fontSize: 12 }]}>
                    {totals.totalOdds.toFixed(2)} odds
                  </Text>
                  <Icon name="chevron" size={19} color="#fff" />
                </Pressable>
              </View>
            )}
            <View
              style={[s.nav, { paddingBottom: Math.max(insets.bottom, 12) }]}
            >
              {[
                ['live', 'Live', 'live'],
                ['today', 'Today', 'calendar'],
                ['sports', 'Sports', 'football'],
                ['casino', 'Casino', 'cards'],
                ['menu', 'Menu', 'menu'],
              ].map(([id, label, ic]) => (
                <Pressable
                  testID={`tab-${id}`}
                  key={id}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: activeTab === id }}
                  onPress={() => selectTab(id)}
                  style={({ pressed }) => [s.navItem, pressed && s.pressed]}
                >
                  {activeTab === id && <View style={s.navIndicator} />}
                  <Icon
                    name={ic}
                    size={22}
                    color={activeTab === id ? c.accent : c.muted}
                  />
                  <Text style={[s.navLabel, activeTab === id && s.accent]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
        {!sheet && toast}
        </View>
        <Modal
          visible={sheet !== null}
          transparent
          animationType="none"
          onRequestClose={() => setSheet(null)}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={s.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable
              style={s.modalShade}
              onPress={() => {
                Keyboard.dismiss();
                setSheet(null);
              }}
              accessibilityLabel="Close dialog"
            />
            <View accessibilityViewIsModal style={s.sheet}>
              <View style={s.handle} />
              <View style={s.sheetHeader}>
                <Text accessibilityRole="header" style={s.sheetTitle}>
                  {sheetTitle()}
                </Text>
                {sheet === 'slip' && (
                  <IconButton
                    name="expand"
                    label="Open full bet slip"
                    onPress={() => navigate('slip')}
                  />
                )}
                <IconButton
                  name="x"
                  label="Close dialog"
                  onPress={() => setSheet(null)}
                />
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  s.sheetScroll,
                  { paddingBottom: Math.max(insets.bottom, 15) + 20 },
                ]}
              >
                {sheet && renderSheet()}
              </ScrollView>
            </View>
            {toast}
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </UI.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ContextFlowApp />
    </SafeAreaProvider>
  );
}

import React from 'react';
import Renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import {agent} from '../src/agent';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const ReactNative = require('react-native');
  return {
    SafeAreaProvider: ReactNative.View,
    SafeAreaView: ReactNative.View,
    useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
  };
});
jest.mock('../src/agent', () => {const listeners=new Set<()=>void>();return { agent: {
  session: undefined, events: [], baseUrl: 'http://127.0.0.1:3001',
  voice: {status:'idle',muted:false,transcript:''},
  feed: {status:'offline',message:'Offline preview'},
  subscribe: (fn:()=>void) => {listeners.add(fn);return ()=>listeners.delete(fn);}, __publish:()=>listeners.forEach(fn=>fn()), action:jest.fn(async()=>undefined), connect: jest.fn(async () => {throw new Error('Offline preview');}),
  details:jest.fn(async()=>{}), start: jest.fn(async () => {}), stop: jest.fn(async () => {}),
} };});

jest.mock('../src/icons', () => ({ Icon: () => null }));
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

let app: ReactTestRenderer;
const byId = (id: string) =>
  app.root.findAll(
    n => n.props.testID === id && typeof n.props.onPress === 'function',
  )[0];
async function press(id: string) {
  await act(async () => {byId(id).props.onPress();await Promise.resolve();});
}
async function textButton(label: string) {
  const button = app.root.findAll(
    n => n.props.label === label && typeof n.props.onPress === 'function',
  )[0];
  expect(button).toBeDefined();
  await act(async () => {button.props.onPress();await Promise.resolve();});
}
beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  agent.session=undefined;agent.voice={status:"idle",muted:false,transcript:""};
  await act(() => {
    app = Renderer.create(<App />);
  });
});
afterEach(async () => {
  await act(() => app.unmount());
  jest.useRealTimers();
});

it('opens the live screen from sign-in with both fields empty', async () => {
  expect(app.root.findAllByProps({ testID: 'auth-email' })[0].props.value).toBe(
    '',
  );
  expect(
    app.root.findAllByProps({ testID: 'auth-password' })[0].props.value,
  ).toBe('');
  await press('sign-in-button');
  await act(() => jest.advanceTimersByTime(500));
  expect(byId('tab-live').props.accessibilityState.selected).toBe(true);
});

it('opens the live screen from sign-up with every field empty and the demo checkbox unchecked', async () => {
  await textButton('New to ContextFlow? Sign up');
  expect(
    app.root.findAllByProps({ testID: 'signup-name' })[0].props.value,
  ).toBe('');
  await press('sign-up-button');
  await act(() => jest.advanceTimersByTime(500));
  expect(byId('tab-live').props.accessibilityState.selected).toBe(true);
});

it('switches all five native destinations and persists the theme', async () => {
  await press('sign-in-button');
  await act(() => jest.advanceTimersByTime(500));
  for (const tab of ['today', 'sports', 'casino', 'menu', 'live']) {
    await press(`tab-${tab}`);
    expect(byId(`tab-${tab}`).props.accessibilityState.selected).toBe(true);
  }
  await press('theme-toggle');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    'contextflow.native.theme',
    'light',
  );
});

it('adds an odd to the slip and shows the native review controls', async () => {
  await press('sign-in-button');
  await act(() => jest.advanceTimersByTime(500));
  await press('odd-e1-winner-0');
  expect(byId('open-bet-slip').props.accessibilityLabel).toContain(
    '1 selections',
  );
  expect(byId('place-demo-bet').props.disabled).toBe(false);
});

it('exposes the native voice entry and accessible session controls', async () => {
  await press('sign-in-button');
  await act(() => jest.advanceTimersByTime(500));
  expect(byId('start-voice-card')).toBeDefined();
  await press('start-voice-card');
  expect(agent.start).toHaveBeenCalled();
  expect(app.root.findAllByProps({accessibilityLabel:'Type an instruction'}).length).toBe(0);
  expect(byId('voice-mic')).toBeDefined();
  await press('voice-options');
  expect(app.root.findAllByProps({accessibilityLabel:'Add research context'}).length).toBeGreaterThan(0);
});

it('keeps the chosen game visible when a delayed bootstrap returns the saved home route',async()=>{
  const client=agent as any;
  client.action.mockImplementation(()=>new Promise(()=>{}));
  await press('sign-in-button');await act(()=>jest.advanceTimersByTime(500));
  await press('tab-casino');await press('game-open-dice');await act(()=>jest.advanceTimersByTime(650));
  await act(()=>{client.session={id:'demo',revision:1,route:'live',eventId:'e1',sport:'all',period:'live',slip:{selections:[],mode:'accumulator',stakeMinor:1000},walletMinor:125000,spentMinor:0,limitMinor:10000,reminderStartedAt:new Date().toISOString(),paused:false,favorites:[],reminderMinutes:0,tickets:[]};client.__publish();});
  expect(app.root.findAll(n=>n.props.label==='Roll the dice'&&typeof n.props.onPress==='function').length).toBeGreaterThan(0);
});

it('shows the transcript in exactly one bottom panel without a keyboard or top voice sheet',async()=>{
 await press('sign-in-button');await act(()=>jest.advanceTimersByTime(500));
 await act(()=>{agent.voice={status:'thinking',muted:false,transcript:'Show me live matches today',recording:false};(agent as any).__publish();});
 expect(app.root.findAll(n=>String(n.type)==='View'&&n.props.testID==='voice-dock')).toHaveLength(1);
 expect(app.root.findAll(n=>String(n.type)==='View'&&n.props.testID==='voice-speaker')).toHaveLength(1);
 expect(app.root.findAll(n=>String(n.type)==='View'&&n.props.accessibilityLabel==='Speaker output is on')).toHaveLength(1);
 expect(app.root.findAll(n=>String(n.type)==='Text'&&n.props.testID==='voice-transcript')).toHaveLength(1);
 expect(app.root.findAllByProps({accessibilityLabel:'Type an instruction'})).toHaveLength(0);
 expect(byId('tab-live')).toBeDefined();
});
it('a touchscreen event acknowledgement does not close voice options opened immediately afterward',async()=>{
 const client=agent as any;client.action.mockResolvedValue(undefined);
 await press('sign-in-button');await act(()=>jest.advanceTimersByTime(500));
 const state={id:'demo',revision:1,route:'live',eventId:'e1',sport:'all',period:'live',slip:{selections:[],mode:'accumulator',stakeMinor:1000},walletMinor:125000,spentMinor:0,limitMinor:10000,reminderStartedAt:new Date().toISOString(),paused:false,favorites:[],reminderMinutes:0,tickets:[]};
 await act(()=>{client.session=state;client.__publish();});
 const card=app.root.findAll(n=>n.props.accessibilityLabel==='Open Metro Falcons versus Harbor Wolves'&&typeof n.props.onPress==='function')[0];
 await act(()=>{card.props.onPress();});await press('voice-options');
 await act(()=>{client.session={...state,revision:2,route:'event',eventId:'e3'};client.__publish();});
 expect(app.root.findAllByProps({accessibilityLabel:'Type instead'}).length).toBeGreaterThan(0);
});

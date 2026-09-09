import React from 'react';
import {Platform,requireNativeComponent,StyleSheet,UIManager,View,ViewProps} from 'react-native';
import {Palette} from './theme';
const NativeGlass=Platform.OS==='ios'&&UIManager.getViewManagerConfig?.('ContextFlowGlass')
 ?requireNativeComponent<ViewProps&{darkMode:boolean}>('ContextFlowGlass'):null;
export function GlassSurface({c}:{c:Palette}){
 return NativeGlass?<NativeGlass pointerEvents="none" darkMode={c.bg==='#10151E'} style={StyleSheet.absoluteFill}/>
 :<View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:c.bg==='#10151E'?'#1A2941':'#F7FAFF'}]}/>;
}

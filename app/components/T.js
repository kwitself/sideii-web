'use client';
import {useLocaleCurrency} from './LocaleCurrencyProvider';

export default function T({k,children}){
 const {t}=useLocaleCurrency();
 return <>{t(k||String(children||''))}</>;
}

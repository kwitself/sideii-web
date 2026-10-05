'use client';
import {useLocaleCurrency} from './LocaleCurrencyProvider';
export default function Money({value,className='',maximumFractionDigits}){
 const {money}=useLocaleCurrency();
 return <span className={className}>{money(value,{maximumFractionDigits})}</span>;
}

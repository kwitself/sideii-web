'use client';
import {createContext,useContext} from 'react';
import {usePathname} from 'next/navigation';
import {defaultSiteSettings,customFontCss,siteDesignCss} from '../../lib/builder-design';
import './site-design.css';
import './builder-fonts.css';
const Context=createContext(defaultSiteSettings());
export const useSiteDesign=()=>useContext(Context);
export default function SiteDesignProvider({settings,preview=false,children}) {const pathname=usePathname(),site=settings||defaultSiteSettings();const publicPage=preview||!pathname?.startsWith('/admin');return <Context.Provider value={site}><style>{customFontCss(site)+(publicPage?siteDesignCss(site):'')}</style>{children}</Context.Provider>;}

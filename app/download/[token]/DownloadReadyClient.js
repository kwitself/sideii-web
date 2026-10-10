'use client';

import {useRef,useState} from 'react';

export default function DownloadReadyClient({token,title,formats,specs,remaining}){
  const frameRef=useRef(null);
  const [started,setStarted]=useState(false);

  function startDownload(){
    if(started||!token)return;
    setStarted(true);
    const url='/api/download/'+encodeURIComponent(token);
    if(frameRef.current)frameRef.current.src=url;
    try{
      const channel=new BroadcastChannel('sideii-secure-download');
      setTimeout(()=>{
        channel.postMessage({type:'download-consumed'});
        channel.close();
      },500);
    }catch{}
  }

  return <main className="secureDownloadPage">
    <section className="secureDownloadShell">
      <header className="secureDownloadBrand">
        <span>SIDE:II</span>
        <small>SECURE DIGITAL DELIVERY</small>
      </header>

      <div className="secureDownloadStatus">
        <span className="secureDownloadDot"/>
        <b>{started?'DOWNLOAD REQUESTED':'FILE READY'}</b>
      </div>

      <div className="secureDownloadHero">
        <p>YOUR DIGITAL EDITION</p>
        <h1>{title}</h1>
        <div className="secureDownloadSpecs">
          <span>{formats}</span>
          {specs&&<span>{specs}</span>}
        </div>
      </div>

      <div className="secureDownloadInfoGrid">
        <div><small>SECURITY</small><b>SINGLE-USE TOKEN</b></div>
        <div><small>DOWNLOADS LEFT</small><b>{started?Math.max(0,remaining-1):remaining} / 5</b></div>
        <div><small>DELIVERY</small><b>ENCRYPTED SESSION</b></div>
      </div>

      <button className="secureDownloadButton" type="button" onClick={startDownload} disabled={started}>
        <span>{started?'DOWNLOAD STARTED':'DOWNLOAD FILE'}</span>
        <span>{started?'✓':'↓'}</span>
      </button>

      <p className="secureDownloadNote">
        {started
          ? 'Your browser should begin the download now. This secure token cannot be used again.'
          : 'The file will not download until you press the button above. This secure link is single-use and expires shortly.'}
      </p>

      <footer className="secureDownloadFooter">
        <span>SIDE:II / MMXXVI</span>
        <span>PRIVATE DIGITAL DELIVERY</span>
      </footer>
    </section>
    <iframe ref={frameRef} title="secure-download" className="secureDownloadFrame"/>
  </main>;
}

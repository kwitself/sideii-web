import DownloadReadyClient from './DownloadReadyClient';

export default async function SecureDownloadPage({params,searchParams}){
  const {token}=await params;
  const query=await searchParams;
  return <DownloadReadyClient
    token={String(token||'')}
    title={String(query?.title||'Digital Edition')}
    formats={String(query?.formats||'DIGITAL FILES')}
    specs={String(query?.specs||'')}
    remaining={Math.max(0,Number(query?.remaining||0))}
  />;
}

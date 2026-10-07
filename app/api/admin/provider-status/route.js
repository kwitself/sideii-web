import {createClient} from '@supabase/supabase-js';

export async function GET(request){
  try{
    const auth=request.headers.get('authorization')||'';
    if(!auth.startsWith('Bearer '))return Response.json({ok:false,error:'Unauthorized'},{status:401});

    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key)return Response.json({ok:false,error:'Supabase environment unavailable'},{status:503});

    const sb=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
    const {data:userData,error:userError}=await sb.auth.getUser();
    const user=userData?.user;
    if(userError||!user||user.app_metadata?.role!=='admin'){
      return Response.json({ok:false,error:'Admin access required'},{status:403});
    }

    const siteUrl=String(process.env.NEXT_PUBLIC_SITE_URL||'').trim();
    const domainReady=!!siteUrl&&!/\.vercel\.app\/?$/i.test(siteUrl);
    const applicationTo=String(process.env.SIDEII_APPLICATION_TO||'').trim();
    const emailReady=!!process.env.RESEND_API_KEY&&!!process.env.SIDEII_ORDER_FROM&&!!process.env.SIDEII_APPLICATION_FROM;
    const paymentProvider=String(process.env.PAYMENT_PROVIDER||'').trim();
    const paymentReady=!!paymentProvider&&!!process.env.PAYMENT_SECRET_KEY&&!!process.env.PAYMENT_WEBHOOK_SECRET&&!!process.env.SUPABASE_SECRET_KEY;
    const carrierReady=!!process.env.CARRIER_API_KEY;
    const fxReady=!!process.env.FX_API_KEY;

    return Response.json({
      ok:true,
      checks:{
        supabase:{ready:true,label:'Supabase',detail:'Production URL + publishable key configured.'},
        domain:{ready:domainReady,label:'Canonical domain',detail:domainReady?siteUrl:'Set NEXT_PUBLIC_SITE_URL to the real production domain.'},
        email:{ready:emailReady,label:'Transactional email',detail:emailReady?'Resend and sender identities configured.':'Configure RESEND_API_KEY and verified sender addresses.'},
        applicationInbox:{ready:!!applicationTo,label:'Application inbox',detail:applicationTo?'Server-only recipient configured.':'Set SIDEII_APPLICATION_TO in the server environment.'},
        payment:{ready:paymentReady,label:'Payment provider',detail:paymentReady?'Provider + signed webhook + server Supabase secret configured.':'Set PAYMENT_PROVIDER, PAYMENT_SECRET_KEY, PAYMENT_WEBHOOK_SECRET and SUPABASE_SECRET_KEY.'},
        carrier:{ready:carrierReady,label:'Carrier integration',detail:carrierReady?'Carrier credentials detected.':'Live carrier API not configured; fixed-rate shipping remains available.'},
        fx:{ready:fxReady,label:'Live FX',detail:fxReady?'Live FX credentials detected.':'Current non-TRY rates remain manual / QA display rates.'}
      }
    });
  }catch(error){
    return Response.json({ok:false,error:String(error?.message||error)},{status:400});
  }
}

import {createClient} from '@supabase/supabase-js';

export async function POST(request){
 try{
  const body=await request.json();
  const applicationId=body.application_id;
  if(!applicationId)return Response.json({ok:false,error:'Application id is required'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let recipient='';
  let application=null;

  if(url&&anon){
   const client=createClient(url,anon,{auth:{persistSession:false}});
   const [{data:settings},{data:claimed,error:claimError}]=await Promise.all([
    client.from('application_settings').select('notification_email,sender_name').eq('id',1).maybeSingle(),
    client.rpc('claim_production_application_notification',{p_id:applicationId})
   ]);
   if(claimError)return Response.json({ok:false,error:claimError.message},{status:400});
   recipient=settings?.notification_email||'';
   application=claimed||null;
  }

  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.SIDEII_APPLICATION_FROM||'SIDE:II Applications <onboarding@resend.dev>';

  if(!application){
   return Response.json({ok:true,email_sent:false,reason:'already_claimed_or_not_found'});
  }
  if(!recipient||!apiKey){
   return Response.json({ok:true,email_sent:false,reason:!recipient?'notification_email_not_configured':'email_provider_not_configured'});
  }

  const lines=[
   'NEW SIDE:II PRODUCTION APPLICATION',
   '',
   'Name: '+(application.applicant_name||'—'),
   'Email: '+(application.applicant_email||'—'),
   'Phone: '+(application.applicant_phone||'—'),
   '',
   'Artist / Project: '+(application.artist_name||'—'),
   'Album / Release: '+(application.project_title||'—'),
   'Services: '+((application.services||[]).join(', ')||'—'),
   'Quantity: '+(application.quantity||'—'),
   'Merch items: '+(application.merch_items||'—'),
   '',
   'PRINT / PRODUCTION DETAILS',
   application.print_details||'—',
   '',
   'PROJECT DESCRIPTION',
   application.description||'—',
   '',
   'REFERENCE LINKS',
   application.reference_links||'—',
   '',
   'BUDGET / DEADLINE',
   application.budget_note||'—'
  ];

  const res=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({
    from,
    to:[recipient],
    reply_to:application.applicant_email,
    subject:'Production Application · '+(application.artist_name||'Artist')+' · '+(application.project_title||'Project'),
    text:lines.join('\n')
   })
  });

  if(!res.ok){
   const detail=await res.text();
   return Response.json({ok:false,email_sent:false,detail},{status:502});
  }
  return Response.json({ok:true,email_sent:true});
 }catch(error){
  return Response.json({ok:false,error:String(error?.message||error)},{status:400});
 }
}

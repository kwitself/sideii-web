export async function POST(request){
 try{
  const body=await request.json();
  const recipient=process.env.SIDEII_APPLICATION_EMAIL;
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.SIDEII_APPLICATION_FROM||'SIDE:II Applications <onboarding@resend.dev>';

  if(!recipient||!apiKey){
   return Response.json({ok:true,email_sent:false,reason:'email_not_configured'});
  }

  const lines=[
   'NEW SIDE:II PRODUCTION APPLICATION',
   '',
   'Application ID: '+(body.id||'—'),
   'Name: '+(body.applicant_name||'—'),
   'Email: '+(body.applicant_email||'—'),
   'Phone: '+(body.applicant_phone||'—'),
   '',
   'Artist / Project: '+(body.artist_name||'—'),
   'Album / Release: '+(body.project_title||'—'),
   'Services: '+((body.services||[]).join(', ')||'—'),
   'Quantity: '+(body.quantity||'—'),
   'Merch items: '+(body.merch_items||'—'),
   '',
   'PRINT / PRODUCTION DETAILS',
   body.print_details||'—',
   '',
   'PROJECT DESCRIPTION',
   body.description||'—',
   '',
   'REFERENCE LINKS',
   body.reference_links||'—',
   '',
   'BUDGET / DEADLINE',
   body.budget_note||'—'
  ];

  const res=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({
    from,
    to:[recipient],
    reply_to:body.applicant_email,
    subject:'Production Application · '+(body.artist_name||'Artist')+' · '+(body.project_title||'Project'),
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

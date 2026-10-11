export function notificationReviewState(summary){
 if(!summary)return 'unknown';
 const delivery=summary.delivery_status;
 if(['email.bounced','email.complained','email.failed'].includes(delivery))return 'attention_required';
 if(delivery==='email.delivered')return 'delivered';
 if(delivery==='email.delivery_delayed')return 'delayed';
 if(summary.outcome==='sent')return 'awaiting_confirmation';
 if(summary.error_code==='network_error')return 'unknown_outcome_review';
 if(summary.attempts>=5)return 'retry_limit_review';
 if(summary.outcome==='failed')return 'send_failed';
 return 'unknown';
}

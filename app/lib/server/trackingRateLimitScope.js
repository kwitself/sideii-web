export function trackingRateLimitScope({development=false,ip='unknown',email=''}) {
 return development?'local:'+String(email).trim().toLowerCase():'ip:'+ip;
}

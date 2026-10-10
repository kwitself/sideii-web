export const runtime='nodejs';

export async function GET(request){
  const internal=request.headers.get('x-sideii-secure-download');
  if(internal!==process.env.SIDEII_SECURE_DOWNLOAD_INTERNAL_TOKEN){
    return new Response('Not found',{status:404});
  }

  const body=[
    'SIDE:II — DIGITAL DOWNLOAD DEMO',
    '',
    'Secure digital delivery test.',
    'This file can only be reached through the protected download grant flow.',
    '',
    'Formats: WAV · FLAC · MP3',
    'Master: 24-bit / 96 kHz',
    '',
    'SIDE:II / MMXXVI'
  ].join('\n');

  return new Response(body,{
    status:200,
    headers:{
      'Content-Type':'text/plain; charset=utf-8',
      'Content-Disposition':'attachment; filename="SIDEII-Digital-Demo.txt"',
      'Cache-Control':'no-store, private',
      'X-Content-Type-Options':'nosniff'
    }
  });
}

export const runtime='nodejs';

export async function GET(){
  const body=[
    'SIDE:II — DIGITAL DOWNLOAD DEMO',
    '',
    'Secure digital delivery test.',
    'If this file was downloaded after pressing DOWNLOAD DIGITAL EDITION',
    'inside Account > Order, the protected grant flow is working correctly.',
    '',
    'Formats: WAV · FLAC',
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

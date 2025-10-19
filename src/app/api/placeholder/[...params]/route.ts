import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    const { params: paramArray } = await params;
    const [width, height] = paramArray;
    const w = parseInt(width) || 400;
    const h = parseInt(height) || 300;

    // Create a simple SVG placeholder with subtle, playful colors
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#e2e8f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)"/>
        <circle cx="${w/2}" cy="${h/2 - 20}" r="30" fill="#a78bfa" opacity="0.3"/>
        <circle cx="${w/2 - 40}" cy="${h/2 + 20}" r="20" fill="#60a5fa" opacity="0.4"/>
        <circle cx="${w/2 + 40}" cy="${h/2 + 20}" r="25" fill="#34d399" opacity="0.3"/>
        <text x="${w/2}" y="${h/2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b" opacity="0.6">
          ${w} × ${h}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return new NextResponse('Error generating placeholder', { status: 500 });
  }
}

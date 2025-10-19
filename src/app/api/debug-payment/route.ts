import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to see what Razorpay is sending
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Razorpay Payment Data Received');
    console.log('=====================================');
    
    const body = await request.json();
    console.log('📋 Raw Request Body:', JSON.stringify(body, null, 2));
    
    // Log all headers
    console.log('📋 Request Headers:');
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Log URL and method
    console.log('📋 Request Method:', request.method);
    console.log('📋 Request URL:', request.url);
    
    return NextResponse.json({
      success: true,
      message: 'Debug data logged to server console',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

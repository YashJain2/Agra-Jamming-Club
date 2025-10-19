const Razorpay = require('razorpay');

// Get Razorpay keys from environment or use live keys
const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_RVI8vZGmoMul4P';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'm6D1WwnpTGAe6GOxxtFtzcBW';

console.log('Razorpay configuration:', { keyId, hasKeySecret: !!keySecret });

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log('Razorpay instance created:', !!razorpay);
console.log('Razorpay orders method:', typeof razorpay.orders);
console.log('Razorpay orders create method:', typeof razorpay.orders?.create);

// Razorpay configuration
export const razorpayConfig = {
  key_id: keyId,
  key_secret: keySecret,
  currency: 'INR',
  name: 'Agra Jamming Club',
  description: 'Musical Community Events',
  image: '/logo.png', // You can add your logo here
  theme: {
    color: '#ec4899', // Pink color matching your theme
  },
};

// Payment validation helper
export const validatePayment = async (paymentId: string, orderId: string, signature: string) => {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', razorpayConfig.key_secret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('Payment validation error:', error);
    return false;
  }
};

// Create Razorpay order using REST API
export const createRazorpayOrder = async (amount: number, currency: string = 'INR', receipt?: string) => {
  try {
    console.log('Creating Razorpay order with:', {
      amount: amount * 100,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      keyId: razorpayConfig.key_id,
    });

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    // Use REST API instead of SDK
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${razorpayConfig.key_id}:${razorpayConfig.key_secret}`).toString('base64')}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error response:', errorText);
      throw new Error(`Razorpay API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const order = await response.json();
    console.log('Razorpay order created successfully:', order);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      keyId: razorpayConfig.key_id,
      hasKeySecret: !!razorpayConfig.key_secret,
    });
    throw error;
  }
};

// Verify payment signature
export const verifyPaymentSignature = async (orderId: string, paymentId: string, signature: string) => {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', razorpayConfig.key_secret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('Payment signature verification error:', error);
    return false;
  }
};
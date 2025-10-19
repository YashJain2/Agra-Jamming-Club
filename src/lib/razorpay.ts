import Razorpay from 'razorpay';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RVI8vZGmoMul4P',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'm6D1WwnpTGAe6GOxxtFtzcBW',
});

// Razorpay configuration
export const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RVI8vZGmoMul4P',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'm6D1WwnpTGAe6GOxxtFtzcBW',
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

// Create Razorpay order
export const createRazorpayOrder = async (amount: number, currency: string = 'INR', receipt?: string) => {
  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
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

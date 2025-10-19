import crypto from 'crypto';

export interface PaytmConfig {
  merchantId: string;
  merchantKey: string;
  website: string;
  industryType: string;
  channelId: string;
  callbackUrl: string;
}

export class PaytmService {
  private config: PaytmConfig;

  constructor(config: PaytmConfig) {
    this.config = config;
  }

  generateChecksum(params: Record<string, string | number>): string {
    const sortedKeys = Object.keys(params).sort();
    const checksumString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.config.merchantKey)
      .update(checksumString)
      .digest('hex');
  }

  verifyChecksum(params: Record<string, string | number>, checksum: string): boolean {
    const generatedChecksum = this.generateChecksum(params);
    return generatedChecksum === checksum;
  }

  createPaymentRequest(orderId: string, amount: number, customerId: string) {
    const params = {
      MID: this.config.merchantId,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      TXN_AMOUNT: amount.toString(),
      CHANNEL_ID: this.config.channelId,
      WEBSITE: this.config.website,
      INDUSTRY_TYPE_ID: this.config.industryType,
      CALLBACK_URL: this.config.callbackUrl,
    };

    const checksum = this.generateChecksum(params);
    
    return {
      ...params,
      CHECKSUMHASH: checksum,
    };
  }

  getPaytmUrl(): string {
    return process.env.NODE_ENV === 'production' 
      ? 'https://securegw.paytm.in/theia/processTransaction'
      : 'https://securegw-stage.paytm.in/theia/processTransaction';
  }
}
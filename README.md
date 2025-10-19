# Agra Jamming Club - Event Management System

A comprehensive event management and subscription platform for Agra Jamming Club, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎵 Event Management
- Create and manage monthly events
- Event listing with beautiful UI
- Ticket booking with 1-10 ticket limit per person
- Guest list verification system
- Event photos and descriptions

### 💳 Payment Integration
- Paytm payment gateway integration
- Secure payment processing
- Payment verification and callbacks
- Transaction history

### 📅 Subscription System
- Monthly subscription management
- Member benefits and discounts
- Priority booking for subscribers
- Subscription renewal tracking

### 👥 Admin Dashboard
- Event management interface
- Subscription monitoring
- Guest verification system
- Revenue and analytics tracking
- User management

### 📱 Responsive Design
- Mobile-first responsive design
- Modern UI with Tailwind CSS
- Beautiful event cards with photos
- Intuitive navigation

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Paytm Payment Gateway
- **Deployment**: Vercel
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Paytm merchant account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd agra-jamming-club
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/agra_jamming_club"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
PAYTM_MERCHANT_ID="your-paytm-merchant-id"
PAYTM_MERCHANT_KEY="your-paytm-merchant-key"
PAYTM_WEBSITE="WEBSTAGING"
PAYTM_INDUSTRY_TYPE="Retail"
PAYTM_CHANNEL_ID="WEB"
PAYTM_CALLBACK_URL="http://localhost:3000/api/payment/callback"
```

5. Set up the database
```bash
npx prisma generate
npx prisma db push
```

6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Paytm Integration Setup

To integrate Paytm payments, you'll need:

1. **Paytm Merchant Account**: Sign up at [Paytm for Business](https://business.paytm.com/)
2. **Merchant ID**: Get from your Paytm dashboard
3. **Merchant Key**: Generate from your Paytm dashboard
4. **Website**: Use "WEBSTAGING" for testing, "WEB" for production
5. **Industry Type**: Use "Retail" for most businesses
6. **Channel ID**: Use "WEB" for web transactions

### Testing Payments

For testing, use Paytm's test credentials:
- Use staging environment (`WEBSTAGING`)
- Test with Paytm's test card numbers
- Verify callbacks are working

## Database Schema

The application uses the following main entities:

- **Users**: Customer information and authentication
- **Events**: Event details, pricing, and availability
- **Subscriptions**: Monthly subscription management
- **Tickets**: Individual ticket bookings
- **Payments**: Payment transactions and history

## API Endpoints

- `POST /api/payment/initiate` - Initiate Paytm payment
- `POST /api/payment/callback` - Handle Paytm payment callbacks
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event (admin)
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription

## Admin Features

Access the admin dashboard at `/admin` to:

- Create and manage events
- View subscription analytics
- Verify guest lists on event day
- Monitor payment transactions
- Manage user accounts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@agrajammingclub.com or create an issue in the repository.
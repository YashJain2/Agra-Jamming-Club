import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin (Co-founder)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@agrajammingclub.com' },
    update: {},
    create: {
      email: 'admin@agrajammingclub.com',
      name: 'Agra Jamming Club Admin',
      password: await bcrypt.hash('password123', 10),
      role: 'SUPER_ADMIN',
      phone: '+91-9876543210',
      isActive: true,
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'manager@agrajammingclub.com' },
    update: {},
    create: {
      email: 'manager@agrajammingclub.com',
      name: 'Event Manager',
      password: await bcrypt.hash('password123', 10),
      role: 'ADMIN',
      phone: '+91-9876543211',
      isActive: true,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Create Moderator user
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@agrajammingclub.com' },
    update: {},
    create: {
      email: 'moderator@agrajammingclub.com',
      name: 'Event Moderator',
      password: await bcrypt.hash('password123', 10),
      role: 'MODERATOR',
      phone: '+91-9876543212',
      isActive: true,
    },
  });

  console.log('✅ Moderator created:', moderator.email);

  // Create subscription plans
  const monthlyPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'monthly-plan' },
    update: {},
    create: {
      id: 'monthly-plan',
      name: 'Monthly Membership',
      description: 'Access to all monthly events with member benefits',
      price: 999,
      duration: 1, // 1 month
      maxEvents: null, // unlimited
      benefits: [
        'Access to all monthly events',
        'Priority booking for tickets',
        'Member-only discounts',
        'Exclusive member events',
        'Free guest passes (2 per month)',
        'Early access to event announcements'
      ],
      isActive: true,
    },
  });

  console.log('✅ Monthly subscription plan created');

  const quarterlyPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'quarterly-plan' },
    update: {},
    create: {
      id: 'quarterly-plan',
      name: 'Quarterly Membership',
      description: '3-month membership with additional benefits',
      price: 2499,
      duration: 3, // 3 months
      maxEvents: null, // unlimited
      benefits: [
        'Access to all events for 3 months',
        'Priority booking for tickets',
        'Member-only discounts',
        'Exclusive member events',
        'Free guest passes (6 per quarter)',
        'Early access to event announcements',
        '10% discount on merchandise'
      ],
      isActive: true,
    },
  });

  console.log('✅ Quarterly subscription plan created');

  // Create sample events
  const event1 = await prisma.event.upsert({
    where: { id: 'sample-event-1' },
    update: {},
    create: {
      id: 'sample-event-1',
      title: 'Acoustic Evening',
      description: 'Join us for an intimate acoustic session featuring local artists and open mic performances. A perfect evening for music lovers.',
      date: new Date('2024-12-15T19:00:00Z'),
      time: '7:00 PM',
      venue: 'Community Center',
      address: '123 Main Street, Agra',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      price: 299,
      maxTickets: 50,
      soldTickets: 0,
      imageUrl: '/api/placeholder/400/300',
      gallery: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      category: 'MUSIC',
      status: 'PUBLISHED',
      tags: ['acoustic', 'local artists', 'open mic'],
      requirements: 'Bring your own instruments if participating in open mic',
      cancellationPolicy: 'Cancellations allowed up to 24 hours before the event',
      refundPolicy: 'Full refund for cancellations made 24+ hours in advance',
      organizerId: superAdmin.id,
      isActive: true,
    },
  });

  console.log('✅ Sample event 1 created:', event1.title);

  const event2 = await prisma.event.upsert({
    where: { id: 'sample-event-2' },
    update: {},
    create: {
      id: 'sample-event-2',
      title: 'Jazz Night',
      description: 'Experience the smooth sounds of jazz with our featured artists and special guest performers. An evening of sophisticated music.',
      date: new Date('2025-01-20T20:00:00Z'),
      time: '8:00 PM',
      venue: 'Music Hall',
      address: '456 Cultural Street, Agra',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      price: 399,
      maxTickets: 40,
      soldTickets: 0,
      imageUrl: '/api/placeholder/400/300',
      gallery: ['/api/placeholder/400/300'],
      category: 'MUSIC',
      status: 'PUBLISHED',
      tags: ['jazz', 'live music', 'sophisticated'],
      requirements: 'Smart casual dress code',
      cancellationPolicy: 'Cancellations allowed up to 48 hours before the event',
      refundPolicy: 'Full refund for cancellations made 48+ hours in advance',
      organizerId: superAdmin.id,
      isActive: true,
    },
  });

  console.log('✅ Sample event 2 created:', event2.title);

  // Create more sample events
  const event3 = await prisma.event.upsert({
    where: { id: 'sample-event-3' },
    update: {},
    create: {
      id: 'sample-event-3',
      title: 'Rock & Roll Night',
      description: 'Get ready for an electrifying night of rock music with local bands and high-energy performances.',
      date: new Date('2025-02-14T21:00:00Z'),
      time: '9:00 PM',
      venue: 'Rock Arena',
      address: '789 Music Lane, Agra',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      price: 499,
      maxTickets: 80,
      soldTickets: 15,
      imageUrl: '/api/placeholder/400/300',
      gallery: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
      category: 'MUSIC',
      status: 'PUBLISHED',
      tags: ['rock', 'live bands', 'high energy'],
      requirements: 'Age 18+, Valid ID required',
      cancellationPolicy: 'Cancellations allowed up to 48 hours before the event',
      refundPolicy: 'Full refund for cancellations made 48+ hours in advance',
      organizerId: superAdmin.id,
      isActive: true,
    },
  });

  console.log('✅ Sample event 3 created:', event3.title);

  const event4 = await prisma.event.upsert({
    where: { id: 'sample-event-4' },
    update: {},
    create: {
      id: 'sample-event-4',
      title: 'Classical Music Evening',
      description: 'An elegant evening featuring classical Indian and Western music performances.',
      date: new Date('2025-03-10T19:30:00Z'),
      time: '7:30 PM',
      venue: 'Cultural Center',
      address: '321 Heritage Road, Agra',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      price: 599,
      maxTickets: 60,
      soldTickets: 8,
      imageUrl: '/api/placeholder/400/300',
      gallery: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      category: 'MUSIC',
      status: 'PUBLISHED',
      tags: ['classical', 'elegant', 'traditional'],
      requirements: 'Formal attire recommended',
      cancellationPolicy: 'Cancellations allowed up to 72 hours before the event',
      refundPolicy: 'Full refund for cancellations made 72+ hours in advance',
      organizerId: admin.id,
      isActive: true,
    },
  });

  console.log('✅ Sample event 4 created:', event4.title);

  // Create regular users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: await bcrypt.hash('password123', 10),
      role: 'USER',
      phone: '+91-9876543213',
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password: await bcrypt.hash('password123', 10),
      role: 'USER',
      phone: '+91-9876543214',
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mike.wilson@example.com' },
    update: {},
    create: {
      email: 'mike.wilson@example.com',
      name: 'Mike Wilson',
      password: await bcrypt.hash('password123', 10),
      role: 'USER',
      phone: '+91-9876543215',
      isActive: true,
    },
  });

  console.log('✅ Regular users created');

  // Create subscriptions for users
  const subscription1 = await prisma.subscription.create({
    data: {
      userId: user1.id,
      planId: monthlyPlan.id,
      status: 'ACTIVE',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-12-01'),
      price: monthlyPlan.price,
    },
  });

  const subscription2 = await prisma.subscription.create({
    data: {
      userId: user2.id,
      planId: quarterlyPlan.id,
      status: 'ACTIVE',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-01-01'),
      price: quarterlyPlan.price,
    },
  });

  console.log('✅ User subscriptions created');

  // Create tickets for events
  const tickets = [
    // Event 1 tickets
    { eventId: event1.id, userId: user1.id, quantity: 2, status: 'CONFIRMED' },
    { eventId: event1.id, userId: user2.id, quantity: 1, status: 'CONFIRMED' },
    { eventId: event1.id, userId: user3.id, quantity: 3, status: 'CONFIRMED' },
    
    // Event 2 tickets
    { eventId: event2.id, userId: user1.id, quantity: 1, status: 'CONFIRMED' },
    { eventId: event2.id, userId: user2.id, quantity: 2, status: 'CONFIRMED' },
    
    // Event 3 tickets
    { eventId: event3.id, userId: user1.id, quantity: 4, status: 'CONFIRMED' },
    { eventId: event3.id, userId: user2.id, quantity: 2, status: 'CONFIRMED' },
    { eventId: event3.id, userId: user3.id, quantity: 1, status: 'CONFIRMED' },
    
    // Event 4 tickets
    { eventId: event4.id, userId: user1.id, quantity: 2, status: 'CONFIRMED' },
    { eventId: event4.id, userId: user2.id, quantity: 1, status: 'CONFIRMED' },
  ];

  for (const ticketData of tickets) {
    await prisma.ticket.create({
      data: {
        eventId: ticketData.eventId,
        userId: ticketData.userId,
        quantity: ticketData.quantity,
        status: ticketData.status,
        totalPrice: ticketData.quantity * (await prisma.event.findUnique({ where: { id: ticketData.eventId } }))?.price || 0,
      },
    });
  }

  console.log('✅ Event tickets created');

  // Update event sold tickets count
  await prisma.event.update({
    where: { id: event1.id },
    data: { soldTickets: 6 },
  });

  await prisma.event.update({
    where: { id: event2.id },
    data: { soldTickets: 3 },
  });

  await prisma.event.update({
    where: { id: event3.id },
    data: { soldTickets: 7 },
  });

  await prisma.event.update({
    where: { id: event4.id },
    data: { soldTickets: 3 },
  });

  console.log('✅ Event ticket counts updated');

  // Create system settings
  const settings = [
    { key: 'site_name', value: 'Agra Jamming Club', category: 'general', isPublic: true },
    { key: 'site_description', value: 'Join the vibrant musical community in Agra', category: 'general', isPublic: true },
    { key: 'contact_email', value: 'contact@agrajammingclub.com', category: 'contact', isPublic: true },
    { key: 'contact_phone', value: '+91-9876543210', category: 'contact', isPublic: true },
    { key: 'max_tickets_per_person', value: '10', category: 'events', isPublic: false },
    { key: 'default_event_capacity', value: '100', category: 'events', isPublic: false },
    { key: 'payment_gateway', value: 'paytm', category: 'payment', isPublic: false },
    { key: 'currency', value: 'INR', category: 'payment', isPublic: true },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ System settings created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

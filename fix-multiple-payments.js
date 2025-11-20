const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from env file
const envPath = path.join(__dirname, 'env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^DATABASE_URL=(.+)$/);
    if (match) {
      process.env.DATABASE_URL = match[1].trim();
      break;
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Fixing multiple payments and duplicates...\n');

    // Find the event
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { title: { contains: 'Sip and Jam', mode: 'insensitive' } },
          { price: 199 }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!event) {
      console.error('❌ Event not found');
      return;
    }

    console.log(`✅ Event: ${event.title} (₹${event.price})\n`);

    // 1. Fix suyash.verma017@gmail.com - should have 3 separate tickets
    console.log('1. Fixing suyash.verma017@gmail.com...');
    const suyashUser = await prisma.user.findFirst({
      where: { email: 'suyash.verma017@gmail.com' }
    });

    if (suyashUser) {
      const suyashTickets = await prisma.ticket.findMany({
        where: {
          userId: suyashUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Found ${suyashTickets.length} ticket(s)`);

      // Expected payments for suyash
      const suyashPayments = [
        { paymentId: 'pay_RcMEaGH3oH7oTb', amount: 1194, quantity: 6 },
        { paymentId: 'pay_RcMIdUHpNtUUNy', amount: 398, quantity: 2 },
        { paymentId: 'pay_RcMKtZumV7deUs', amount: 398, quantity: 2 },
      ];

      // Check existing payments
      const existingPaymentIds = new Set();
      for (const ticket of suyashTickets) {
        for (const payment of ticket.payments) {
          if (payment.gatewayTxnId) {
            existingPaymentIds.add(payment.gatewayTxnId);
          }
        }
      }

      // Create missing tickets/payments
      for (const paymentData of suyashPayments) {
        if (existingPaymentIds.has(paymentData.paymentId)) {
          console.log(`   ✅ Payment ${paymentData.paymentId} already exists`);
          continue;
        }

        // Check if payment exists without ticket
        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: paymentData.paymentId
          }
        });

        if (existingPayment) {
          console.log(`   ⚠️  Payment ${paymentData.paymentId} exists but not linked to ticket`);
          continue;
        }

        // Create ticket and payment
        const result = await prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.create({
            data: {
              userId: suyashUser.id,
              eventId: event.id,
              quantity: paymentData.quantity,
              totalPrice: paymentData.amount,
              status: 'CONFIRMED',
            },
          });

          const payment = await tx.payment.create({
            data: {
              userId: suyashUser.id,
              ticketId: ticket.id,
              amount: paymentData.amount,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: 'UPI',
              gateway: 'RAZORPAY',
              gatewayOrderId: `order_${paymentData.paymentId.slice(4)}`,
              gatewayTxnId: paymentData.paymentId,
              gatewayResponse: {
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
              },
            },
          });

          await tx.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                increment: paymentData.quantity
              }
            }
          });

          return { ticket, payment };
        });

        console.log(`   ✅ Created ticket ${result.ticket.id} with payment ${paymentData.paymentId} (${paymentData.quantity} tickets)`);
      }
    }

    // 2. Fix matlanichehek@gmail.com - should have 3 separate tickets
    console.log('\n2. Fixing matlanichehek@gmail.com...');
    const chehekUser = await prisma.user.findFirst({
      where: { email: 'matlanichehek@gmail.com' }
    });

    if (chehekUser) {
      const chehekTickets = await prisma.ticket.findMany({
        where: {
          userId: chehekUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`   Found ${chehekTickets.length} ticket(s)`);

      const chehekPayments = [
        { paymentId: 'pay_RbisYjnuuHFxrC', amount: 597, quantity: 3 },
        { paymentId: 'pay_RbkmJsmX2D2grE', amount: 199, quantity: 1 },
        { paymentId: 'pay_Rc6jjtxt3mtzoh', amount: 597, quantity: 3 },
      ];

      const existingPaymentIds = new Set();
      for (const ticket of chehekTickets) {
        for (const payment of ticket.payments) {
          if (payment.gatewayTxnId) {
            existingPaymentIds.add(payment.gatewayTxnId);
          }
        }
      }

      for (const paymentData of chehekPayments) {
        if (existingPaymentIds.has(paymentData.paymentId)) {
          console.log(`   ✅ Payment ${paymentData.paymentId} already exists`);
          continue;
        }

        const existingPayment = await prisma.payment.findFirst({
          where: {
            gatewayTxnId: paymentData.paymentId
          }
        });

        if (existingPayment) {
          console.log(`   ⚠️  Payment ${paymentData.paymentId} exists but not linked to ticket`);
          continue;
        }

        const result = await prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.create({
            data: {
              userId: chehekUser.id,
              eventId: event.id,
              quantity: paymentData.quantity,
              totalPrice: paymentData.amount,
              status: 'CONFIRMED',
            },
          });

          const payment = await tx.payment.create({
            data: {
              userId: chehekUser.id,
              ticketId: ticket.id,
              amount: paymentData.amount,
              currency: 'INR',
              status: 'COMPLETED',
              paymentMethod: 'UPI',
              gateway: 'RAZORPAY',
              gatewayOrderId: `order_${paymentData.paymentId.slice(4)}`,
              gatewayTxnId: paymentData.paymentId,
              gatewayResponse: {
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
              },
            },
          });

          await tx.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                increment: paymentData.quantity
              }
            }
          });

          return { ticket, payment };
        });

        console.log(`   ✅ Created ticket ${result.ticket.id} with payment ${paymentData.paymentId} (${paymentData.quantity} tickets)`);
      }
    }

    // 3. Fix Saurav Dayal - remove duplicate ticket, keep one with payment
    console.log('\n3. Fixing saurav.dayal.39@gmail.com (duplicate)...');
    const sauravUser = await prisma.user.findFirst({
      where: { email: 'saurav.dayal.39@gmail.com' }
    });

    if (sauravUser) {
      const sauravTickets = await prisma.ticket.findMany({
        where: {
          userId: sauravUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (sauravTickets.length > 1) {
        console.log(`   Found ${sauravTickets.length} tickets, keeping the one with payment`);
        
        // Find ticket with payment
        const ticketWithPayment = sauravTickets.find(t => t.payments.length > 0);
        const ticketsToDelete = sauravTickets.filter(t => t.id !== ticketWithPayment?.id);

        for (const ticketToDelete of ticketsToDelete) {
          // Delete payments first
          if (ticketToDelete.payments.length > 0) {
            await prisma.payment.deleteMany({
              where: {
                ticketId: ticketToDelete.id
              }
            });
          }

          // Delete ticket
          await prisma.ticket.delete({
            where: {
              id: ticketToDelete.id
            }
          });

          // Update event
          await prisma.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                decrement: ticketToDelete.quantity
              }
            }
          });

          console.log(`   ✅ Deleted duplicate ticket ${ticketToDelete.id}`);
        }
      }
    }

    // 4. Fix Rishab Jain - remove duplicate ticket, keep one with payment
    console.log('\n4. Fixing rishab1065@gmail.com (duplicate)...');
    const rishabUser = await prisma.user.findFirst({
      where: { email: 'rishab1065@gmail.com' }
    });

    if (rishabUser) {
      const rishabTickets = await prisma.ticket.findMany({
        where: {
          userId: rishabUser.id,
          eventId: event.id
        },
        include: {
          payments: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (rishabTickets.length > 1) {
        console.log(`   Found ${rishabTickets.length} tickets, keeping the one with payment`);
        
        // Find ticket with payment
        const ticketWithPayment = rishabTickets.find(t => t.payments.length > 0);
        const ticketsToDelete = rishabTickets.filter(t => t.id !== ticketWithPayment?.id);

        for (const ticketToDelete of ticketsToDelete) {
          // Delete payments first
          if (ticketToDelete.payments.length > 0) {
            await prisma.payment.deleteMany({
              where: {
                ticketId: ticketToDelete.id
              }
            });
          }

          // Delete ticket
          await prisma.ticket.delete({
            where: {
              id: ticketToDelete.id
            }
          });

          // Update event
          await prisma.event.update({
            where: { id: event.id },
            data: {
              soldTickets: {
                decrement: ticketToDelete.quantity
              }
            }
          });

          console.log(`   ✅ Deleted duplicate ticket ${ticketToDelete.id}`);
        }
      }
    }

    console.log('\n✅ Fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();




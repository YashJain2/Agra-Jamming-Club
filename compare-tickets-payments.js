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

// List of all 59 payments from Razorpay dashboard (excluding ₹299 subscriptions)
const razorpayTicketPayments = [
  { paymentId: 'pay_RcO3VWcVJCLhR4', amount: 199, email: 'hasanrazza@yahoo.co.in', phone: '9634110747', name: 'Hasan Razza', date: 'Thu Nov 6, 1:52pm' },
  { paymentId: 'pay_RcMgFJ7GlpwDOx', amount: 1592, email: 'priyyasija0@gmail.com', phone: '7409331250', name: 'Priyya Sija', date: 'Thu Nov 6, 12:32pm' },
  { paymentId: 'pay_RcMfY95hjfsghq', amount: 398, email: 'kinjalarora663@gmail.com', phone: '7830177007', name: 'Kinjal Nanda', date: 'Thu Nov 6, 12:31pm' },
  { paymentId: 'pay_RcMLI5jxQrWLvM', amount: 199, email: 'khushiagarwal132006@gmail.com', phone: '8433173185', name: 'Khushi agarwal', date: 'Thu Nov 6, 12:12pm' },
  { paymentId: 'pay_RcMKtZumV7deUs', amount: 398, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA', date: 'Thu Nov 6, 12:12pm' },
  { paymentId: 'pay_RcMJJMx3GvHo2j', amount: 199, email: 'aroramanya110@gmail.com', phone: '9528761161', name: 'Manya arora', date: 'Thu Nov 6, 12:10pm' },
  { paymentId: 'pay_RcMIdUHpNtUUNy', amount: 398, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA', date: 'Thu Nov 6, 12:09pm' },
  { paymentId: 'pay_RcMEaGH3oH7oTb', amount: 1194, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA', date: 'Thu Nov 6, 12:06pm' },
  { paymentId: 'pay_RcBo74E0k2O4lG', amount: 199, email: 'karanmadnani06@gmail.com', phone: '8171083883', name: 'Karan Madnani', date: 'Thu Nov 6, 1:54am' },
  { paymentId: 'pay_RcBPWE4wRX8Voq', amount: 796, email: 'harshasinghsmc@gmail.com', phone: '9599742014', name: 'Harsha Singh', date: 'Thu Nov 6, 1:30am' },
  { paymentId: 'pay_Rc9Ee8ICYRwV4B', amount: 199, email: 'agarwalriya.work@gmail.com', phone: '7983301442', name: 'Riya', date: 'Wed Nov 5, 11:23pm' },
  { paymentId: 'pay_Rc99pR2y64R6qV', amount: 398, email: 'naishasweety@gmail.com', phone: '9997191101', name: 'Nehal agarwal', date: 'Wed Nov 5, 11:18pm' },
  { paymentId: 'pay_Rc8YTl8k7HwyJB', amount: 597, email: 'ayushi.234gupta@gmail.com', phone: '9650719630', name: 'Ayushi Gupta', date: 'Wed Nov 5, 10:43pm' },
  { paymentId: 'pay_Rc6jjtxt3mtzoh', amount: 597, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani', date: 'Wed Nov 5, 8:56pm' },
  { paymentId: 'pay_Rc6gA6pF73yPcJ', amount: 199, email: 'nishitamadan17@gmail.com', phone: '8431560830', name: 'Nishita Madan', date: 'Wed Nov 5, 8:53pm' },
  { paymentId: 'pay_Rc6MOwsLGVsWio', amount: 398, email: 'mishra.sarthak.5@gmail.com', phone: '9660393265', name: 'Sarthak Mishra', date: 'Wed Nov 5, 8:34pm' },
  { paymentId: 'pay_Rc5DxaydVtwsUt', amount: 796, email: 'rishab1065@gmail.com', phone: '7895482908', name: 'Rishab Jain', date: 'Wed Nov 5, 7:27pm' },
  { paymentId: 'pay_Rc3XWmDcU89KfS', amount: 199, email: 'singhavi0805@gmail.com', phone: '7302537043', name: 'Avinash Singh', date: 'Wed Nov 5, 5:48pm' },
  { paymentId: 'pay_Rc0a8sP0N5NC3E', amount: 398, email: 'neeraj22ti@gmail.com', phone: '9815665270', name: 'Niraj yadav', date: 'Wed Nov 5, 2:55pm' },
  { paymentId: 'pay_Rc0OK9I4gRB5xF', amount: 398, email: 'saurav.dayal.39@gmail.com', phone: '9084738399', name: 'Saurav Dayal', date: 'Wed Nov 5, 2:44pm' },
  { paymentId: 'pay_RbzidauJmTMOOX', amount: 398, email: 'prateekgoyal91@gmail.com', phone: '8979253850', name: 'Prateek Goyal', date: 'Wed Nov 5, 2:04pm' },
  { paymentId: 'pay_Rbz4wTowrCl4nF', amount: 398, email: 'aniketgautam48@gmail.com', phone: '7060011136', name: 'Aniket gautam', date: 'Wed Nov 5, 1:26pm' },
  { paymentId: 'pay_RbxDKJFtQ39Uld', amount: 398, email: 'surbhigoyal234@gmail.com', phone: '9536967961', name: 'Surbhi goyal', date: 'Wed Nov 5, 11:37am' },
  { paymentId: 'pay_Rbx7zCmbxNx8I4', amount: 398, email: 'gk949215@gmail.com', phone: '9149011643', name: 'Gurpreet kaur', date: 'Wed Nov 5, 11:32am' },
  { paymentId: 'pay_RbwJvA1fMt38f8', amount: 398, email: 'tushar.9834.sharma@gmail.com', phone: '8171688713', name: 'Tushar Sharma', date: 'Wed Nov 5, 10:45am' },
  { paymentId: 'pay_Rbw6CP6NzKje79', amount: 398, email: 'tarun.vidhata@gmail.com', phone: '9837005782', name: 'TARUN GARG', date: 'Wed Nov 5, 10:32am' },
  { paymentId: 'pay_Rbw4Fo7aGlYXUo', amount: 199, email: 'jkscale@gmail.com', phone: '9897077744', name: 'JK Scale', date: 'Wed Nov 5, 10:30am' },
  { paymentId: 'pay_RbvX0hDz4DLgbh', amount: 398, email: 'rohit1601@gmail.com', phone: '9897077555', name: 'Rohit A Agarwal', date: 'Wed Nov 5, 9:58am' },
  { paymentId: 'pay_RbmOe5MgUKH6Dy', amount: 398, email: 'rajatguptarg_ece18@its.edu.in', phone: '9634628935', name: 'Rajat Gupta ( KAASH )', date: 'Wed Nov 5, 1:02am' },
  { paymentId: 'pay_RblHB8llX3GOKO', amount: 796, email: 'harshit.kalra1717@gmail.com', phone: '9837781939', name: 'Harshit Kalra', date: 'Tue Nov 4, 11:56pm' },
  { paymentId: 'pay_RbktX1reOzDsSZ', amount: 398, email: 'jitendra@sanskrati.in', phone: '9930122691', name: 'Roopali sharma', date: 'Tue Nov 4, 11:34pm' },
  { paymentId: 'pay_RbkmJsmX2D2grE', amount: 199, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani', date: 'Tue Nov 4, 11:27pm' },
  { paymentId: 'pay_RbkA9GO9zgVNE9', amount: 199, email: 'chikki00007@gmail.com', phone: '9537889322', name: 'Aarchish', date: 'Tue Nov 4, 10:51pm' },
  { paymentId: 'pay_Rbk8C5MyxHx5Ld', amount: 597, email: 'sandeepchauhan23@gmail.com', phone: '8126562999', name: 'Sandeep Chauhan', date: 'Tue Nov 4, 10:49pm' },
  { paymentId: 'pay_Rbk3wpDjOtsGnn', amount: 398, email: 'agarwalsanidhay@gmail.com', phone: '8755694572', name: 'Sanidhay Agarwal', date: 'Tue Nov 4, 10:45pm' },
  { paymentId: 'pay_RbjvzvvloLxyx1', amount: 199, email: 'coolnupz.khandelwal@gmail.com', phone: '9761376305', name: 'Nupur Khandelwal', date: 'Tue Nov 4, 10:38pm' },
  { paymentId: 'pay_RbjpiOhUV9vYMp', amount: 199, email: 'roopikadixit2@gmail.com', phone: '9917130900', name: 'Roopika Sharma', date: 'Tue Nov 4, 10:32pm' },
  { paymentId: 'pay_RbjWVr7j8Giq3L', amount: 199, email: 'highspirit.designs@gmail.com', phone: '7830803007', name: 'adarsh garg', date: 'Tue Nov 4, 10:14pm' },
  { paymentId: 'pay_RbjWT0zbPTm0yq', amount: 199, email: 'krishramani59@gmail.com', phone: '7037522727', name: 'Krish Ramani', date: 'Tue Nov 4, 10:13pm' },
  { paymentId: 'pay_Rbj6bLPe6enWk5', amount: 398, email: 'mittalayush368@gmail.com', phone: '9058659119', name: 'Ayush Mittal', date: 'Tue Nov 4, 9:49pm' },
  { paymentId: 'pay_Rbj3HCrMDx6CYn', amount: 199, email: 'esharajput075@gmail.com', phone: '8299115128', name: 'Esha', date: 'Tue Nov 4, 9:46pm' },
  { paymentId: 'pay_Rbiy3aioYVn83u', amount: 1791, email: 'prerna12343@gmail.com', phone: '9557399718', name: 'Prerna Agarwal', date: 'Tue Nov 4, 9:41pm' },
  { paymentId: 'pay_RbiuxO3yu93WEx', amount: 199, email: 'yashgupta0725aug@gmail.com', phone: '7455837622', name: 'Yash Gupta', date: 'Tue Nov 4, 9:38pm' },
  { paymentId: 'pay_RbisYjnuuHFxrC', amount: 597, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani', date: 'Tue Nov 4, 9:36pm' },
  { paymentId: 'pay_RbisI8Uy1W9NAM', amount: 199, email: 'sanchit.chawla@tothenew.com', phone: '6398700648', name: 'Sanchit chawla', date: 'Tue Nov 4, 9:35pm' },
  { paymentId: 'pay_RbincMUwFngr05', amount: 398, email: 'niyati.jain1101@gmail.com', phone: '9548400000', name: 'Niyati agarwal', date: 'Tue Nov 4, 9:31pm' },
  { paymentId: 'pay_RbimQLM1RwE0EE', amount: 398, email: 'kamranwarsi790@gmail.com', phone: '9634973148', name: 'Kamran warsi', date: 'Tue Nov 4, 9:30pm' },
  { paymentId: 'pay_RbieaL24zAIWbB', amount: 199, email: 'aarpit2702@gmail.com', phone: '7700001038', name: 'Arpit Agrawal', date: 'Tue Nov 4, 9:22pm' },
  { paymentId: 'pay_RbicSKqN4BrgO8', amount: 796, email: 'esha19agr@gmail.com', phone: '9654118223', name: 'Esha', date: 'Tue Nov 4, 9:20pm' },
  { paymentId: 'pay_RbiafTUz062ZHJ', amount: 199, email: 'mehrakhushi839@gmail.com', phone: '8755118411', name: 'Khushi Mehra', date: 'Tue Nov 4, 9:19pm' },
];

async function main() {
  try {
    console.log('🔍 Comparing Database Tickets with Razorpay Payments...\n');
    console.log('=' .repeat(80));

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

    // Get all tickets for this event
    const allTickets = await prisma.ticket.findMany({
      where: {
        eventId: event.id
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            phone: true
          }
        },
        payments: {
          select: {
            gatewayTxnId: true,
            amount: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`\n📊 Database Tickets: ${allTickets.length}`);
    console.log(`📊 Razorpay Payments: ${razorpayTicketPayments.length}\n`);

    // Group Razorpay payments by email
    const razorpayByEmail = new Map();
    for (const payment of razorpayTicketPayments) {
      const email = payment.email.toLowerCase();
      if (!razorpayByEmail.has(email)) {
        razorpayByEmail.set(email, []);
      }
      razorpayByEmail.get(email).push(payment);
    }

    // Group database tickets by email
    const dbTicketsByEmail = new Map();
    for (const ticket of allTickets) {
      const email = ticket.user.email.toLowerCase();
      if (!dbTicketsByEmail.has(email)) {
        dbTicketsByEmail.set(email, []);
      }
      dbTicketsByEmail.get(email).push(ticket);
    }

    console.log('🔍 Checking for discrepancies...\n');

    const issues = [];

    // Check each email in database
    for (const [email, tickets] of dbTicketsByEmail.entries()) {
      const razorpayPayments = razorpayByEmail.get(email) || [];
      
      // Calculate expected quantities
      const expectedQuantity = razorpayPayments.reduce((sum, p) => {
        return sum + Math.round(p.amount / event.price);
      }, 0);

      // Calculate actual quantities
      const actualQuantity = tickets.reduce((sum, t) => sum + t.quantity, 0);

      // Check for free tickets (subscribers)
      const freeTickets = tickets.filter(t => t.totalPrice === 0);
      const paidTickets = tickets.filter(t => t.totalPrice > 0);

      // Get payment IDs from database
      const dbPaymentIds = new Set();
      tickets.forEach(t => {
        t.payments.forEach(p => {
          if (p.gatewayTxnId) {
            dbPaymentIds.add(p.gatewayTxnId);
          }
        });
      });

      const expectedPaymentIds = razorpayPayments.map(p => p.paymentId);
      const missingPayments = expectedPaymentIds.filter(id => !dbPaymentIds.has(id));
      const extraPayments = Array.from(dbPaymentIds).filter(id => !expectedPaymentIds.includes(id));

      // Check for issues
      if (missingPayments.length > 0 || extraPayments.length > 0 || actualQuantity !== expectedQuantity) {
        issues.push({
          email,
          name: tickets[0].user.name,
          phone: tickets[0].user.phone,
          tickets: tickets.map(t => ({
            id: t.id,
            quantity: t.quantity,
            price: t.totalPrice,
            status: t.status,
            paymentIds: t.payments.map(p => p.gatewayTxnId).filter(Boolean)
          })),
          expectedPayments: razorpayPayments,
          expectedQuantity,
          actualQuantity,
          missingPayments,
          extraPayments
        });
      }
    }

    // Check for emails in Razorpay but not in database
    for (const [email, payments] of razorpayByEmail.entries()) {
      if (!dbTicketsByEmail.has(email)) {
        issues.push({
          email,
          name: payments[0].name,
          phone: payments[0].phone,
          tickets: [],
          expectedPayments: payments,
          expectedQuantity: payments.reduce((sum, p) => sum + Math.round(p.amount / event.price), 0),
          actualQuantity: 0,
          missingPayments: payments.map(p => p.paymentId),
          extraPayments: [],
          missingFromDB: true
        });
      }
    }

    console.log(`\n⚠️  Found ${issues.length} issue(s):\n`);

    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.name} (${issue.email})`);
      console.log(`   Phone: ${issue.phone || 'N/A'}`);
      
      if (issue.missingFromDB) {
        console.log(`   ❌ MISSING FROM DATABASE`);
        console.log(`   Expected: ${issue.expectedQuantity} ticket(s) from ${issue.expectedPayments.length} payment(s)`);
        issue.expectedPayments.forEach(p => {
          console.log(`      - ${p.paymentId}: ₹${p.amount} (${Math.round(p.amount / event.price)} tickets)`);
        });
      } else {
        console.log(`   Database Tickets: ${issue.tickets.length}`);
        issue.tickets.forEach((t, idx) => {
          console.log(`      ${idx + 1}. Ticket ${t.id}: ${t.quantity} ticket(s), ₹${t.price}, Status: ${t.status}`);
          console.log(`         Payments: ${t.paymentIds.join(', ') || 'None'}`);
        });
        console.log(`   Expected: ${issue.expectedQuantity} ticket(s) from ${issue.expectedPayments.length} payment(s)`);
        issue.expectedPayments.forEach(p => {
          console.log(`      - ${p.paymentId}: ₹${p.amount} (${Math.round(p.amount / event.price)} tickets)`);
        });
        console.log(`   Actual: ${issue.actualQuantity} ticket(s)`);
        
        if (issue.missingPayments.length > 0) {
          console.log(`   ⚠️  Missing Payment IDs: ${issue.missingPayments.join(', ')}`);
        }
        if (issue.extraPayments.length > 0) {
          console.log(`   ⚠️  Extra Payment IDs: ${issue.extraPayments.join(', ')}`);
        }
        if (issue.actualQuantity !== issue.expectedQuantity) {
          console.log(`   ⚠️  Quantity Mismatch: Expected ${issue.expectedQuantity}, Got ${issue.actualQuantity}`);
        }
      }
      console.log('');
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();




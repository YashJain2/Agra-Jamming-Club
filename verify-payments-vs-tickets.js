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

// Razorpay payments list
const razorpayPayments = [
  { paymentId: 'pay_RdIC8LWgIrw33e', amount: 199, email: 'saurav.dayal.39@gmail.com', phone: '9084738399', name: 'Saurav Dayal' },
  { paymentId: 'pay_RdEfC9i1jEJEzJ', amount: 199, email: 'aikansh.aj@gmail.com', phone: '8126969819', name: 'Aikansh' },
  { paymentId: 'pay_RdDTADUMNbcOYS', amount: 199, email: 'ksshoesagra@gmail.com', phone: '8077308316', name: 'Rahul Khatri' },
  { paymentId: 'pay_RdDPDHNjzlUumi', amount: 199, email: 'ksshoesagra@gmail.com', phone: '8077308316', name: 'Rahul Khatri' },
  { paymentId: 'pay_RdCLyUGG3uqTmX', amount: 199, email: 'aishibansal2812@gmail.com', phone: '7078174879', name: 'Aishi Bansal' },
  { paymentId: 'pay_RdBe0ErHQjP0on', amount: 199, email: 'kamakshisingh97@gmail.com', phone: '8106412451', name: 'Kamakshi Singh' },
  { paymentId: 'pay_RcwVhR1lojYtAA', amount: 199, email: 'sanchitchawla7399@gmail.com', phone: '7060302301', name: 'Priyanshi Agarwal' },
  { paymentId: 'pay_RctqlKjVpAn0Cu', amount: 398, email: 'dinky28447@gmail.com', phone: '8954887460', name: 'Dinky' },
  { paymentId: 'pay_Rctboh6KXADvfM', amount: 398, email: 'bk185659@gmail.com', phone: '9027266069', name: 'Mohammad Bilal' },
  { paymentId: 'pay_RctUeZEHf3Z7Yr', amount: 1194, email: 'agarwalvasu82@gmail.com', phone: '9560814990', name: 'Vasu' },
  { paymentId: 'pay_RcqJFlnfLhsZUs', amount: 199, email: 'shriyagupta8@gmail.com', phone: '7053410470', name: 'Himani Gupta' },
  { paymentId: 'pay_RcniaJj8Z90Tqj', amount: 199, email: 'ruchi121290@gmail.com', phone: '9893100002', name: 'Ruchi Gupta' },
  { paymentId: 'pay_RcUQMrJk4Jf97B', amount: 299, email: 'yamini.gupta78@gmail.com', phone: '9012981888', name: 'Yamini Gupta' },
  { paymentId: 'pay_RcUQ5xFKJkmAFl', amount: 796, email: 'skm.7377@gmail.com', phone: '7055501443', name: 'Shailendra Mudgal' },
  { paymentId: 'pay_RcTBLPmsJ1B4lH', amount: 995, email: 'sparshmittalagra@gmail.com', phone: '9758099989', name: 'Sparsh Mittal' },
  { paymentId: 'pay_RcR0rPJRb0RC9I', amount: 199, email: 'saurav.dayal.6488@gmail.com', phone: '9149114646', name: 'Saurav Pandey' },
  { paymentId: 'pay_RcQMIZwJGZinWc', amount: 199, email: 'sisodiyapriyanshu224@gmail.com', phone: '7668071039', name: 'Priyanshu Sisodiya' },
  { paymentId: 'pay_RcO3VWcVJCLhR4', amount: 199, email: 'hasanrazza@yahoo.co.in', phone: '9634110747', name: 'Hasan Razza' },
  { paymentId: 'pay_RcMgFJ7GlpwDOx', amount: 1592, email: 'priyyasija0@gmail.com', phone: '7409331250', name: 'Priyya Sija' },
  { paymentId: 'pay_RcMfY95hjfsghq', amount: 398, email: 'kinjalarora663@gmail.com', phone: '7830177007', name: 'Kinjal Nanda' },
  { paymentId: 'pay_RcMLI5jxQrWLvM', amount: 199, email: 'khushiagarwal132006@gmail.com', phone: '8433173185', name: 'Khushi agarwal' },
  { paymentId: 'pay_RcMKtZumV7deUs', amount: 398, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA' },
  { paymentId: 'pay_RcMJJMx3GvHo2j', amount: 199, email: 'aroramanya110@gmail.com', phone: '9528761161', name: 'Manya arora' },
  { paymentId: 'pay_RcMIdUHpNtUUNy', amount: 398, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA' },
  { paymentId: 'pay_RcMEaGH3oH7oTb', amount: 1194, email: 'suyash.verma017@gmail.com', phone: '9634893379', name: 'SUYASH VERMA' },
  { paymentId: 'pay_RcBo74E0k2O4lG', amount: 199, email: 'karanmadnani06@gmail.com', phone: '8171083883', name: 'Karan Madnani' },
  { paymentId: 'pay_RcBPWE4wRX8Voq', amount: 796, email: 'harshasinghsmc@gmail.com', phone: '9599742014', name: 'Harsha Singh' },
  { paymentId: 'pay_Rc9Ee8ICYRwV4B', amount: 199, email: 'agarwalriya.work@gmail.com', phone: '7983301442', name: 'Riya' },
  { paymentId: 'pay_Rc99pR2y64R6qV', amount: 398, email: 'naishasweety@gmail.com', phone: '9997191101', name: 'Nehal agarwal' },
  { paymentId: 'pay_Rc8YTl8k7HwyJB', amount: 597, email: 'ayushi.234gupta@gmail.com', phone: '9650719630', name: 'Ayushi Gupta' },
  { paymentId: 'pay_Rc6jjtxt3mtzoh', amount: 597, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani' },
  { paymentId: 'pay_Rc6gA6pF73yPcJ', amount: 199, email: 'nishitamadan17@gmail.com', phone: '8431560830', name: 'Nishita Madan' },
  { paymentId: 'pay_Rc6MOwsLGVsWio', amount: 398, email: 'mishra.sarthak.5@gmail.com', phone: '9660393265', name: 'Sarthak Mishra' },
  { paymentId: 'pay_Rc5DxaydVtwsUt', amount: 796, email: 'rishab1065@gmail.com', phone: '7895482908', name: 'Rishab Jain' },
  { paymentId: 'pay_Rc3XWmDcU89KfS', amount: 199, email: 'singhavi0805@gmail.com', phone: '7302537043', name: 'Avinash Singh' },
  { paymentId: 'pay_Rc0a8sP0N5NC3E', amount: 398, email: 'neeraj22ti@gmail.com', phone: '9815665270', name: 'Niraj yadav' },
  { paymentId: 'pay_Rc0OK9I4gRB5xF', amount: 398, email: 'saurav.dayal.39@gmail.com', phone: '9084738399', name: 'Saurav Dayal' },
  { paymentId: 'pay_Rc01OFTxgLly9A', amount: 299, email: 'rj9926@gmail.com', phone: '8989645432', name: 'Rahul Jain' },
  { paymentId: 'pay_RbzidauJmTMOOX', amount: 398, email: 'prateekgoyal91@gmail.com', phone: '8979253850', name: 'Prateek Goyal' },
  { paymentId: 'pay_Rbz4wTowrCl4nF', amount: 398, email: 'aniketgautam48@gmail.com', phone: '7060011136', name: 'Aniket gautam' },
  { paymentId: 'pay_RbxTo6OC0Rt4jJ', amount: 299, email: 'priyaseth205@gmail.com', phone: '8979911919', name: 'Priya Kapoor' },
  { paymentId: 'pay_RbxDKJFtQ39Uld', amount: 398, email: 'surbhigoyal234@gmail.com', phone: '9536967961', name: 'Surbhi goyal' },
  { paymentId: 'pay_Rbx7zCmbxNx8I4', amount: 398, email: 'gk949215@gmail.com', phone: '9149011643', name: 'Gurpreet kaur' },
  { paymentId: 'pay_RbwJvA1fMt38f8', amount: 398, email: 'tushar.9834.sharma@gmail.com', phone: '8171688713', name: 'Tushar Sharma' },
  { paymentId: 'pay_Rbw6CP6NzKje79', amount: 398, email: 'tarun.vidhata@gmail.com', phone: '9837005782', name: 'TARUN GARG' },
  { paymentId: 'pay_Rbw4Fo7aGlYXUo', amount: 199, email: 'jkscale@gmail.com', phone: '9897077744', name: 'JK Scale' },
  { paymentId: 'pay_RbvsOsLO5LTi5x', amount: 299, email: 'ksshoesagra@gmail.com', phone: '8077308316', name: 'Rahul Khatri' },
  { paymentId: 'pay_RbvX0hDz4DLgbh', amount: 398, email: 'rohit1601@gmail.com', phone: '9897077555', name: 'Rohit A Agarwal' },
  { paymentId: 'pay_RbmOe5MgUKH6Dy', amount: 398, email: 'rajatguptarg_ece18@its.edu.in', phone: '9634628935', name: 'Rajat Gupta ( KAASH )' },
  { paymentId: 'pay_Rblwa4DC6E0zqs', amount: 299, email: 'mohitmoolchandani92@gmail.com', phone: '7310914979', name: 'Manav' },
  { paymentId: 'pay_RblHB8llX3GOKO', amount: 796, email: 'harshit.kalra1717@gmail.com', phone: '9837781939', name: 'Harshit Kalra' },
  { paymentId: 'pay_RbktX1reOzDsSZ', amount: 398, email: 'jitendra@sanskrati.in', phone: '9930122691', name: 'Roopali sharma' },
  { paymentId: 'pay_RbkmJsmX2D2grE', amount: 199, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani' },
  { paymentId: 'pay_RbkA9GO9zgVNE9', amount: 199, email: 'chikki00007@gmail.com', phone: '9537889322', name: 'Aarchish' },
  { paymentId: 'pay_Rbk8C5MyxHx5Ld', amount: 597, email: 'sandeepchauhan23@gmail.com', phone: '8126562999', name: 'Sandeep Chauhan' },
  { paymentId: 'pay_Rbk3wpDjOtsGnn', amount: 398, email: 'agarwalsanidhay@gmail.com', phone: '8755694572', name: 'Sanidhay Agarwal' },
  { paymentId: 'pay_RbjvzvvloLxyx1', amount: 199, email: 'coolnupz.khandelwal@gmail.com', phone: '9761376305', name: 'Nupur Khandelwal' },
  { paymentId: 'pay_RbjpiOhUV9vYMp', amount: 199, email: 'roopikadixit2@gmail.com', phone: '9917130900', name: 'Roopika Sharma' },
  { paymentId: 'pay_RbjhnrDftXcSCM', amount: 299, email: 'pratibhamotog@gmail.com', phone: '9457277033', name: 'Pratibha Parashar' },
  { paymentId: 'pay_RbjWVr7j8Giq3L', amount: 199, email: 'highspirit.designs@gmail.com', phone: '7830803007', name: 'adarsh garg' },
  { paymentId: 'pay_RbjWT0zbPTm0yq', amount: 199, email: 'krishramani59@gmail.com', phone: '7037522727', name: 'Krish Ramani' },
  { paymentId: 'pay_Rbj6bLPe6enWk5', amount: 398, email: 'mittalayush368@gmail.com', phone: '9058659119', name: 'Ayush Mittal' },
  { paymentId: 'pay_Rbj3HCrMDx6CYn', amount: 199, email: 'esharajput075@gmail.com', phone: '8299115128', name: 'Esha' },
  { paymentId: 'pay_Rbiy3aioYVn83u', amount: 1791, email: 'prerna12343@gmail.com', phone: '9557399718', name: 'Prerna Agarwal' },
  { paymentId: 'pay_RbiuxO3yu93WEx', amount: 199, email: 'yashgupta0725aug@gmail.com', phone: '7455837622', name: 'Yash Gupta' },
  { paymentId: 'pay_RbismsuyRTPi6I', amount: 299, email: 'reemaarav2010@gmail.com', phone: '9927943986', name: 'Reema Agarwal' },
  { paymentId: 'pay_RbisYjnuuHFxrC', amount: 597, email: 'matlanichehek@gmail.com', phone: '7818043548', name: 'Chehek Matlani' },
  { paymentId: 'pay_RbisI8Uy1W9NAM', amount: 199, email: 'sanchit.chawla@tothenew.com', phone: '6398700648', name: 'Sanchit chawla' },
  { paymentId: 'pay_RbincMUwFngr05', amount: 398, email: 'niyati.jain1101@gmail.com', phone: '9548400000', name: 'Niyati agarwal' },
  { paymentId: 'pay_RbimQLM1RwE0EE', amount: 398, email: 'kamranwarsi790@gmail.com', phone: '9634973148', name: 'Kamran warsi' },
  { paymentId: 'pay_Rbiiolyf8TZ5QF', amount: 299, email: 'sakshi.nk23@gmail.com', phone: '9897562631', name: 'Sakshi Nijhawan' },
  { paymentId: 'pay_RbigE14jysKsFn', amount: 299, email: 'rover.rapper@gmail.com', phone: '9761465546', name: 'Rohan Verma' },
  { paymentId: 'pay_RbieaL24zAIWbB', amount: 199, email: 'aarpit2702@gmail.com', phone: '7700001038', name: 'Arpit Agrawal' },
  { paymentId: 'pay_RbicSKqN4BrgO8', amount: 796, email: 'esha19agr@gmail.com', phone: '9654118223', name: 'Esha' },
  { paymentId: 'pay_RbiafTUz062ZHJ', amount: 199, email: 'mehrakhushi839@gmail.com', phone: '8755118411', name: 'Khushi Mehra' },
  { paymentId: 'pay_RbZanviXu9trG7', amount: 299, email: 'prasukh123@gmail.com', phone: '7983301442', name: 'Prasukh Jain' },
];

// Website tickets list (from user's message)
const websiteTickets = [
  { email: 'bk185659@gmail.com', name: 'Mohammad Bilal', phone: '9027266069', quantity: 2, amount: 398 },
  { email: 'dinky28447@gmail.com', name: 'Dinky', phone: '8954887460', quantity: 2, amount: 398 },
  { email: 'kamakshisingh97@gmail.com', name: 'Kamakshi Singh', phone: '8106412451', quantity: 1, amount: 199 },
  { email: 'aishibansal2812@gmail.com', name: 'Aishi Bansal', phone: '7078174879', quantity: 1, amount: 199 },
  { email: 'ksshoesagra@gmail.com', name: 'Rahul Khatri', phone: '8077308316', quantity: 1, amount: 199 },
  { email: 'ksshoesagra@gmail.com', name: 'Rahul Khatri', phone: '8077308316', quantity: 1, amount: 199 },
  { email: 'aikansh.aj@gmail.com', name: 'Aikansh', phone: '8126969819', quantity: 1, amount: 199 },
  { email: 'saurav.dayal.39@gmail.com', name: 'Saurav Dayal', phone: '9084738399', quantity: 1, amount: 199 },
  { email: 'sanchitchawla7399@gmail.com', name: 'Priyanshi Agarwal', phone: '7060302301', quantity: 1, amount: 199 },
  { email: 'agarwalvasu82@gmail.com', name: 'Vasu', phone: '9560814990', quantity: 6, amount: 1194 },
  { email: 'shriyagupta8@gmail.com', name: 'Himani Gupta', phone: '7053410470', quantity: 1, amount: 199 },
  { email: 'ruchi121290@gmail.com', name: 'Ruchi Gupta', phone: '9893100002', quantity: 1, amount: 199 },
  { email: 'yamini.gupta78@gmail.com', name: 'Yamini Gupta', phone: '9012981888', quantity: 1, amount: 0 }, // Free ticket
  { email: 'skm.7377@gmail.com', name: 'Shailendra Mudgal', phone: '7055501443', quantity: 4, amount: 796 },
  { email: 'sparshmittalagra@gmail.com', name: 'Sparsh Mittal', phone: '9758099989', quantity: 5, amount: 995 },
  { email: 'saurav.dayal.6488@gmail.com', name: 'Saurav Pandey', phone: '9149114646', quantity: 1, amount: 199 },
  { email: 'sisodiyapriyanshu224@gmail.com', name: 'Priyanshu Sisodiya', phone: '7668071039', quantity: 1, amount: 199 },
  { email: 'pratibhamotog@gmail.com', name: 'Pratibha Parashar', phone: '9457277033', quantity: 1, amount: 0 }, // Free ticket
  { email: 'matlanichehek@gmail.com', name: 'Chehek Matlani', phone: '7818043548', quantity: 3, amount: 597 },
  { email: 'matlanichehek@gmail.com', name: 'Chehek Matlani', phone: '7818043548', quantity: 1, amount: 199 },
  { email: 'matlanichehek@gmail.com', name: 'Chehek Matlani', phone: '7818043548', quantity: 3, amount: 597 },
  { email: 'suyash.verma017@gmail.com', name: 'SUYASH VERMA', phone: '9634893379', quantity: 2, amount: 398 },
  { email: 'suyash.verma017@gmail.com', name: 'SUYASH VERMA', phone: '9634893379', quantity: 2, amount: 398 },
  { email: 'suyash.verma017@gmail.com', name: 'SUYASH VERMA', phone: '9634893379', quantity: 6, amount: 1194 },
  { email: 'krishramani59@gmail.com', name: 'Krish Ramani', phone: '7037522727', quantity: 1, amount: 199 },
  { email: 'jkscale@gmail.com', name: 'JK Scale', phone: '9897077744', quantity: 1, amount: 199 },
  { email: 'tushar.9834.sharma@gmail.com', name: 'Tushar Sharma', phone: '8171688713', quantity: 2, amount: 398 },
  { email: 'saurav.dayal.39@gmail.com', name: 'Saurav Dayal', phone: '9084738399', quantity: 2, amount: 398 },
  { email: 'rishab1065@gmail.com', name: 'Rishab Jain', phone: '7895482908', quantity: 4, amount: 796 },
  { email: 'karanmadnani06@gmail.com', name: 'Karan Madnani', phone: '8171083883', quantity: 1, amount: 199 },
  { email: 'hasanrazza@yahoo.co.in', name: 'Hasan Razza', phone: '9634110747', quantity: 1, amount: 199 },
  { email: 'priyyasija0@gmail.com', name: 'Priyya Sija', phone: '7409331250', quantity: 8, amount: 1592 },
  { email: 'ayushi.234gupta@gmail.com', name: 'Ayushi Gupta', phone: '9650719630', quantity: 3, amount: 597 },
  { email: 'kinjalarora663@gmail.com', name: 'Kinjal Nanda', phone: '7830177007', quantity: 2, amount: 398 },
  { email: 'khushiagarwal132006@gmail.com', name: 'Khushi agarwal', phone: '8433173185', quantity: 1, amount: 199 },
  { email: 'aroramanya110@gmail.com', name: 'Manya arora', phone: '9528761161', quantity: 1, amount: 199 },
  { email: 'harshasinghsmc@gmail.com', name: 'Harsha Singh', phone: '9599742014', quantity: 4, amount: 796 },
  { email: 'agarwalriya.work@gmail.com', name: 'Riya', phone: '7983301442', quantity: 1, amount: 199 },
  { email: 'naishasweety@gmail.com', name: 'Nehal agarwal', phone: '9997191101', quantity: 2, amount: 398 },
  { email: 'nishitamadan17@gmail.com', name: 'Nishita Madan', phone: '8431560830', quantity: 1, amount: 199 },
  { email: 'mishra.sarthak.5@gmail.com', name: 'Sarthak Mishra', phone: '9660393265', quantity: 2, amount: 398 },
  { email: 'singhavi0805@gmail.com', name: 'Avinash Singh', phone: '7302537043', quantity: 1, amount: 199 },
  { email: 'neeraj22ti@gmail.com', name: 'Niraj yadav', phone: '9815665270', quantity: 2, amount: 398 },
  { email: 'rj9926@gmail.com', name: 'Rahul Jain', phone: '8989645432', quantity: 1, amount: 0 }, // Free ticket
  { email: 'prateekgoyal91@gmail.com', name: 'Prateek Goyal', phone: '8979253850', quantity: 2, amount: 398 },
  { email: 'aniketgautam48@gmail.com', name: 'Aniket gautam', phone: '7060011136', quantity: 2, amount: 398 },
  { email: 'surbhigoyal234@gmail.com', name: 'Surbhi goyal', phone: '9536967961', quantity: 2, amount: 398 },
  { email: 'gk949215@gmail.com', name: 'Gurpreet kaur', phone: '9149011643', quantity: 2, amount: 398 },
  { email: 'tarun.vidhata@gmail.com', name: 'TARUN GARG', phone: '9837005782', quantity: 2, amount: 398 },
  { email: 'ksshoesagra@gmail.com', name: 'Rahul Khatri', phone: '8077308316', quantity: 1, amount: 0 }, // Free ticket
  { email: 'rohit1601@gmail.com', name: 'Rohit A Agarwal', phone: '9897077555', quantity: 2, amount: 398 },
  { email: 'rajatguptarg_ece18@its.edu.in', name: 'Rajat Gupta ( KAASH )', phone: '9634628935', quantity: 2, amount: 398 },
  { email: 'mohitmoolchandani92@gmail.com', name: 'Manav', phone: '7310914979', quantity: 1, amount: 0 }, // Free ticket
  { email: 'harshit.kalra1717@gmail.com', name: 'Harshit Kalra', phone: '9837781939', quantity: 4, amount: 796 },
  { email: 'jitendra@sanskrati.in', name: 'Roopali sharma', phone: '9930122691', quantity: 2, amount: 398 },
  { email: 'chikki00007@gmail.com', name: 'Aarchish', phone: '9537889322', quantity: 1, amount: 199 },
  { email: 'prasukh123@gmail.com', name: 'Prasukh Jain', phone: '8077037849', quantity: 1, amount: 0 }, // Free ticket (verified)
  { email: 'sandeepchauhan23@gmail.com', name: 'Sandeep Chauhan', phone: '8126562999', quantity: 3, amount: 597 },
  { email: 'agarwalsanidhay@gmail.com', name: 'Sanidhay Agarwal', phone: '8755694572', quantity: 2, amount: 398 },
  { email: 'coolnupz.khandelwal@gmail.com', name: 'Nupur Khandelwal', phone: '9761376305', quantity: 1, amount: 199 },
  { email: 'roopikadixit2@gmail.com', name: 'Roopika Sharma', phone: '9917130900', quantity: 1, amount: 199 },
  { email: 'highspirit.designs@gmail.com', name: 'adarsh garg', phone: '7830803007', quantity: 1, amount: 199 },
  { email: 'mittalayush368@gmail.com', name: 'Ayush Mittal', phone: '9058659119', quantity: 2, amount: 398 },
  { email: 'esharajput075@gmail.com', name: 'Esha', phone: '8299115128', quantity: 1, amount: 199 },
  { email: 'prerna12343@gmail.com', name: 'Prerna Agarwal', phone: '9557399718', quantity: 9, amount: 1791 },
  { email: 'yashgupta0725aug@gmail.com', name: 'Yash Gupta', phone: '7455837622', quantity: 1, amount: 199 },
  { email: 'reemaarav2010@gmail.com', name: 'Reema Agarwal', phone: '9927943986', quantity: 1, amount: 0 }, // Free ticket
  { email: 'sanchit.chawla@tothenew.com', name: 'Sanchit chawla', phone: '6398700648', quantity: 1, amount: 199 },
  { email: 'niyati.jain1101@gmail.com', name: 'Niyati agarwal', phone: '9548400000', quantity: 2, amount: 398 },
  { email: 'kamranwarsi790@gmail.com', name: 'Kamran warsi', phone: '9634973148', quantity: 2, amount: 398 },
  { email: 'sakshi.nk23@gmail.com', name: 'Sakshi Nijhawan', phone: '9897562631', quantity: 1, amount: 0 }, // Free ticket
  { email: 'rover.rapper@gmail.com', name: 'Rohan Verma', phone: '9761465546', quantity: 1, amount: 0 }, // Free ticket
  { email: 'aarpit2702@gmail.com', name: 'Arpit Agrawal', phone: '7700001038', quantity: 1, amount: 199 },
  { email: 'esha19agr@gmail.com', name: 'Esha', phone: '9654118223', quantity: 4, amount: 796 },
  { email: 'mehrakhushi839@gmail.com', name: 'Khushi Mehra', phone: '8755118411', quantity: 1, amount: 199 },
];

async function main() {
  try {
    console.log('🔍 Cross-verifying Razorpay payments with website tickets...\n');

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

    // Get all tickets from database
    const dbTickets = await prisma.ticket.findMany({
      where: { eventId: event.id },
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
            amount: true
          }
        }
      }
    });

    console.log(`📊 Database tickets: ${dbTickets.length}`);
    console.log(`📊 Razorpay payments: ${razorpayPayments.length}`);
    console.log(`📊 Website tickets: ${websiteTickets.length}\n`);

    // Build maps for easier lookup
    const razorpayMap = new Map();
    razorpayPayments.forEach(p => {
      const key = p.email.toLowerCase();
      if (!razorpayMap.has(key)) {
        razorpayMap.set(key, []);
      }
      razorpayMap.get(key).push(p);
    });

    const websiteMap = new Map();
    websiteTickets.forEach(t => {
      const key = t.email.toLowerCase();
      if (!websiteMap.has(key)) {
        websiteMap.set(key, []);
      }
      websiteMap.get(key).push(t);
    });

    const dbMap = new Map();
    dbTickets.forEach(t => {
      const key = t.user.email.toLowerCase();
      if (!dbMap.has(key)) {
        dbMap.set(key, []);
      }
      dbMap.get(key).push(t);
    });

    // DISCREPANCIES
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DISCREPANCIES REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Payments in Razorpay but NOT in database
    console.log('1️⃣  PAYMENTS IN RAZORPAY BUT NOT IN DATABASE:');
    console.log('─────────────────────────────────────────────────────────');
    let missingInDb = 0;
    for (const payment of razorpayPayments) {
      const found = dbTickets.some(t => 
        t.payments.some(p => p.gatewayTxnId === payment.paymentId)
      );
      if (!found) {
        missingInDb++;
        console.log(`   ❌ ${payment.paymentId} - ${payment.email} - ₹${payment.amount}`);
      }
    }
    if (missingInDb === 0) {
      console.log('   ✅ All Razorpay payments are in database');
    }
    console.log(`\n   Total missing: ${missingInDb}\n`);

    // 2. Payments in database but NOT in Razorpay
    console.log('2️⃣  PAYMENTS IN DATABASE BUT NOT IN RAZORPAY:');
    console.log('─────────────────────────────────────────────────────────');
    let extraInDb = 0;
    for (const ticket of dbTickets) {
      for (const payment of ticket.payments) {
        const found = razorpayPayments.some(p => p.paymentId === payment.gatewayTxnId);
        if (!found) {
          extraInDb++;
          console.log(`   ⚠️  ${payment.gatewayTxnId} - ${ticket.user.email} - ₹${payment.amount}`);
        }
      }
    }
    if (extraInDb === 0) {
      console.log('   ✅ All database payments are in Razorpay');
    }
    console.log(`\n   Total extra: ${extraInDb}\n`);

    // 3. Amount mismatches
    console.log('3️⃣  AMOUNT MISMATCHES (Razorpay vs Database):');
    console.log('─────────────────────────────────────────────────────────');
    let amountMismatches = 0;
    for (const payment of razorpayPayments) {
      const dbTicket = dbTickets.find(t => 
        t.payments.some(p => p.gatewayTxnId === payment.paymentId)
      );
      if (dbTicket) {
        const dbPayment = dbTicket.payments.find(p => p.gatewayTxnId === payment.paymentId);
        if (dbPayment && dbPayment.amount !== payment.amount) {
          amountMismatches++;
          console.log(`   ⚠️  ${payment.paymentId} - ${payment.email}`);
          console.log(`      Razorpay: ₹${payment.amount} | Database: ₹${dbPayment.amount}`);
        }
      }
    }
    if (amountMismatches === 0) {
      console.log('   ✅ All amounts match');
    }
    console.log(`\n   Total mismatches: ${amountMismatches}\n`);

    // 4. Tickets in website but NOT in database
    console.log('4️⃣  TICKETS IN WEBSITE BUT NOT IN DATABASE:');
    console.log('─────────────────────────────────────────────────────────');
    let missingTickets = 0;
    for (const websiteTicket of websiteTickets) {
      const dbTicketsForUser = dbMap.get(websiteTicket.email.toLowerCase()) || [];
      const matchingTicket = dbTicketsForUser.find(t => 
        t.quantity === websiteTicket.quantity && 
        t.totalPrice === websiteTicket.amount
      );
      if (!matchingTicket) {
        missingTickets++;
        console.log(`   ❌ ${websiteTicket.email} - ${websiteTicket.name}`);
        console.log(`      Website: ${websiteTicket.quantity} ticket(s) ₹${websiteTicket.amount}`);
        const dbTotal = dbTicketsForUser.reduce((sum, t) => sum + t.quantity, 0);
        const dbAmount = dbTicketsForUser.reduce((sum, t) => sum + t.totalPrice, 0);
        console.log(`      Database: ${dbTotal} ticket(s) ₹${dbAmount}`);
      }
    }
    if (missingTickets === 0) {
      console.log('   ✅ All website tickets are in database');
    }
    console.log(`\n   Total missing: ${missingTickets}\n`);

    // 5. Tickets in database but NOT in website
    console.log('5️⃣  TICKETS IN DATABASE BUT NOT IN WEBSITE:');
    console.log('─────────────────────────────────────────────────────────');
    let extraTickets = 0;
    for (const ticket of dbTickets) {
      const websiteTicketsForUser = websiteMap.get(ticket.user.email.toLowerCase()) || [];
      const matchingTicket = websiteTicketsForUser.find(t => 
        t.quantity === ticket.quantity && 
        t.amount === ticket.totalPrice
      );
      if (!matchingTicket) {
        extraTickets++;
        console.log(`   ⚠️  ${ticket.user.email} - ${ticket.user.name}`);
        console.log(`      Database: ${ticket.quantity} ticket(s) ₹${ticket.totalPrice}`);
        const websiteTotal = websiteTicketsForUser.reduce((sum, t) => sum + t.quantity, 0);
        const websiteAmount = websiteTicketsForUser.reduce((sum, t) => sum + t.amount, 0);
        console.log(`      Website: ${websiteTotal} ticket(s) ₹${websiteAmount}`);
      }
    }
    if (extraTickets === 0) {
      console.log('   ✅ All database tickets are in website');
    }
    console.log(`\n   Total extra: ${extraTickets}\n`);

    // 6. Quantity/Amount mismatches between website and database
    console.log('6️⃣  QUANTITY/AMOUNT MISMATCHES (Website vs Database):');
    console.log('─────────────────────────────────────────────────────────');
    let qtyMismatches = 0;
    const processedEmails = new Set();
    for (const websiteTicket of websiteTickets) {
      const email = websiteTicket.email.toLowerCase();
      if (processedEmails.has(email)) continue;
      processedEmails.add(email);

      const dbTicketsForUser = dbMap.get(email) || [];
      const websiteTicketsForUser = websiteMap.get(email) || [];

      const websiteTotalQty = websiteTicketsForUser.reduce((sum, t) => sum + t.quantity, 0);
      const websiteTotalAmount = websiteTicketsForUser.reduce((sum, t) => sum + t.amount, 0);
      const dbTotalQty = dbTicketsForUser.reduce((sum, t) => sum + t.quantity, 0);
      const dbTotalAmount = dbTicketsForUser.reduce((sum, t) => sum + t.totalPrice, 0);

      if (websiteTotalQty !== dbTotalQty || websiteTotalAmount !== dbTotalAmount) {
        qtyMismatches++;
        console.log(`   ⚠️  ${websiteTicket.email} - ${websiteTicket.name}`);
        console.log(`      Website: ${websiteTotalQty} ticket(s) ₹${websiteTotalAmount}`);
        console.log(`      Database: ${dbTotalQty} ticket(s) ₹${dbTotalAmount}`);
      }
    }
    if (qtyMismatches === 0) {
      console.log('   ✅ All quantities and amounts match');
    }
    console.log(`\n   Total mismatches: ${qtyMismatches}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Razorpay payments missing in DB: ${missingInDb}`);
    console.log(`Database payments not in Razorpay: ${extraInDb}`);
    console.log(`Amount mismatches: ${amountMismatches}`);
    console.log(`Website tickets missing in DB: ${missingTickets}`);
    console.log(`Database tickets not in website: ${extraTickets}`);
    console.log(`Quantity/Amount mismatches: ${qtyMismatches}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();



// Compare Razorpay payments with website tickets without database access

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

// Website tickets list
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

console.log('═══════════════════════════════════════════════════════════');
console.log('DISCREPANCIES REPORT: Razorpay Payments vs Website Tickets');
console.log('═══════════════════════════════════════════════════════════\n');

// Group by email
const razorpayByEmail = new Map();
razorpayPayments.forEach(p => {
  const email = p.email.toLowerCase();
  if (!razorpayByEmail.has(email)) {
    razorpayByEmail.set(email, []);
  }
  razorpayByEmail.get(email).push(p);
});

const websiteByEmail = new Map();
websiteTickets.forEach(t => {
  const email = t.email.toLowerCase();
  if (!websiteByEmail.has(email)) {
    websiteByEmail.set(email, []);
  }
  websiteByEmail.get(email).push(t);
});

// Calculate totals per user
const razorpayTotals = new Map();
razorpayByEmail.forEach((payments, email) => {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalQty = Math.floor(totalAmount / 199); // Assuming ₹199 per ticket
  razorpayTotals.set(email, { totalAmount, totalQty, payments: payments.length });
});

const websiteTotals = new Map();
websiteByEmail.forEach((tickets, email) => {
  const totalAmount = tickets.reduce((sum, t) => sum + t.amount, 0);
  const totalQty = tickets.reduce((sum, t) => sum + t.quantity, 0);
  websiteTotals.set(email, { totalAmount, totalQty, tickets: tickets.length });
});

// Find all unique emails
const allEmails = new Set([...razorpayByEmail.keys(), ...websiteByEmail.keys()]);

console.log('1️⃣  PAYMENT AMOUNT MISMATCHES (Razorpay vs Website):');
console.log('─────────────────────────────────────────────────────────');
let amountMismatches = 0;
for (const email of allEmails) {
  const razorpayTotal = razorpayTotals.get(email) || { totalAmount: 0, totalQty: 0, payments: 0 };
  const websiteTotal = websiteTotals.get(email) || { totalAmount: 0, totalQty: 0, tickets: 0 };
  
  // Skip free tickets (₹0) - these are subscription-based
  if (websiteTotal.totalAmount === 0 && razorpayTotal.totalAmount > 0) {
    // This is expected - free ticket but subscription payment
    continue;
  }
  
  if (razorpayTotal.totalAmount !== websiteTotal.totalAmount && websiteTotal.totalAmount > 0) {
    amountMismatches++;
    const name = websiteByEmail.get(email)?.[0]?.name || razorpayByEmail.get(email)?.[0]?.name || email;
    console.log(`   ⚠️  ${name} (${email})`);
    console.log(`      Razorpay: ₹${razorpayTotal.totalAmount} (${razorpayTotal.payments} payment(s))`);
    console.log(`      Website: ₹${websiteTotal.totalAmount} (${websiteTotal.tickets} ticket(s))`);
    console.log(`      Difference: ₹${Math.abs(razorpayTotal.totalAmount - websiteTotal.totalAmount)}`);
  }
}
if (amountMismatches === 0) {
  console.log('   ✅ All payment amounts match');
}
console.log(`\n   Total mismatches: ${amountMismatches}\n`);

console.log('2️⃣  QUANTITY MISMATCHES (Razorpay vs Website):');
console.log('─────────────────────────────────────────────────────────');
let qtyMismatches = 0;
for (const email of allEmails) {
  const razorpayTotal = razorpayTotals.get(email) || { totalAmount: 0, totalQty: 0, payments: 0 };
  const websiteTotal = websiteTotals.get(email) || { totalAmount: 0, totalQty: 0, tickets: 0 };
  
  // Calculate expected quantity from Razorpay amount
  const expectedQty = Math.floor(razorpayTotal.totalAmount / 199);
  
  if (expectedQty !== websiteTotal.totalQty && websiteTotal.totalAmount > 0) {
    qtyMismatches++;
    const name = websiteByEmail.get(email)?.[0]?.name || razorpayByEmail.get(email)?.[0]?.name || email;
    console.log(`   ⚠️  ${name} (${email})`);
    console.log(`      Razorpay: ₹${razorpayTotal.totalAmount} → Expected: ${expectedQty} ticket(s)`);
    console.log(`      Website: ${websiteTotal.totalQty} ticket(s) ₹${websiteTotal.totalAmount}`);
    console.log(`      Difference: ${Math.abs(expectedQty - websiteTotal.totalQty)} ticket(s)`);
  }
}
if (qtyMismatches === 0) {
  console.log('   ✅ All quantities match');
}
console.log(`\n   Total mismatches: ${qtyMismatches}\n`);

console.log('3️⃣  RAZORPAY PAYMENTS NOT MATCHING WEBSITE TICKETS:');
console.log('─────────────────────────────────────────────────────────');
let missingInWebsite = 0;
for (const email of allEmails) {
  const razorpayTotal = razorpayTotals.get(email);
  const websiteTotal = websiteTotals.get(email);
  
  if (razorpayTotal && !websiteTotal) {
    missingInWebsite++;
    const name = razorpayByEmail.get(email)?.[0]?.name || email;
    console.log(`   ❌ ${name} (${email})`);
    console.log(`      Razorpay: ₹${razorpayTotal.totalAmount} (${razorpayTotal.payments} payment(s))`);
    console.log(`      Website: NOT FOUND`);
  }
}
if (missingInWebsite === 0) {
  console.log('   ✅ All Razorpay payments have corresponding website tickets');
}
console.log(`\n   Total missing: ${missingInWebsite}\n`);

console.log('4️⃣  WEBSITE TICKETS NOT MATCHING RAZORPAY PAYMENTS:');
console.log('─────────────────────────────────────────────────────────');
let missingInRazorpay = 0;
for (const email of allEmails) {
  const razorpayTotal = razorpayTotals.get(email);
  const websiteTotal = websiteTotals.get(email);
  
  if (websiteTotal && !razorpayTotal && websiteTotal.totalAmount > 0) {
    missingInRazorpay++;
    const name = websiteByEmail.get(email)?.[0]?.name || email;
    console.log(`   ⚠️  ${name} (${email})`);
    console.log(`      Website: ${websiteTotal.totalQty} ticket(s) ₹${websiteTotal.totalAmount}`);
    console.log(`      Razorpay: NOT FOUND`);
  }
}
if (missingInRazorpay === 0) {
  console.log('   ✅ All website tickets have corresponding Razorpay payments');
}
console.log(`\n   Total missing: ${missingInRazorpay}\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total Razorpay payments: ${razorpayPayments.length}`);
console.log(`Total Website tickets: ${websiteTickets.length}`);
console.log(`Payment amount mismatches: ${amountMismatches}`);
console.log(`Quantity mismatches: ${qtyMismatches}`);
console.log(`Razorpay payments missing in website: ${missingInWebsite}`);
console.log(`Website tickets missing in Razorpay: ${missingInRazorpay}`);
console.log('═══════════════════════════════════════════════════════════\n');



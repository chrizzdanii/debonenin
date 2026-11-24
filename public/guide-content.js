/* DEBONE Digital Hub: user guide text for everyone (start, why we are better, customers, agents).
   The admin chapters are NOT in this public file: they are sent only to the admin after sign-in (see guide-admin.js).
   Block types: ['p',text] ['h',text] ['steps',[...]] ['list',[...]] ['tip',text] ['warn',text] ['good',text]
                ['table',head[],rows[][]] ['dyn','services'|'savings'|'myprice'].  **text** makes text bold. */
var GUIDE_PARTS = {

start: { title: 'Start here', sections: [
{ id: 's-welcome', title: 'Welcome to DEBONE Digital Hub', blocks: [
  ['p', 'DEBONE Digital Hub is a website where you can check and get official records quickly: NIN, BVN, CAC (company), TIN (tax), voter’s card, driver’s licence, passport, vehicle, bank account and electricity meter checks. It also handles agency services such as IPE clearance, NIN validation and NIN personalisation.'],
  ['p', 'You do not need to be good with computers. This guide explains every page, every button and every message in plain words. Read it, download it as a PDF, or press **Listen** and let the website read it to you.'],
  ['h', 'Three kinds of people use the site'],
  ['table', ['Who', 'What they do', 'What they pay'], [
    ['Individual (customer)', 'Creates an account, funds a wallet and uses any service straight away. No verification is needed.', 'The individual price.'],
    ['Verified agent', 'A business owner or cyber-café who applied under Agent Verification and was approved by the owner of the site.', 'The lower agent price on every service.'],
    ['Admin (the owner)', 'Sets prices, approves bank transfers, approves agents, manages users and refunds. Only the owner has this.', 'Pays the provider price with no markup.']]],
  ['tip', 'Everyone can use every service. The only difference between an individual and a verified agent is the price: agents pay less. See the chapter “Your agent price”.'],
]},
{ id: 's-words', title: 'Simple words used on the site', blocks: [
  ['table', ['Word', 'What it means'], [
    ['Wallet', 'Your prepaid balance on the site. You put money in first, and each service takes its fee from it. Like airtime.'],
    ['Verification or check', 'Asking the official records whether a number or detail is real, and getting the answer.'],
    ['Slip', 'A PDF printout of the result that you can download, save or print.'],
    ['Service fee', 'The price of one check. It is shown before you press the button and is taken only when you press it.'],
    ['Agent price / Individual price', 'Two prices for the same service. Verified agents pay the agent price. Everyone else pays the individual price.'],
    ['Reference', 'A code like DT-1A2B3C4D that identifies one bank-transfer order. You write it in the transfer description.'],
    ['Receipt', 'The proof your bank app gives after a transfer. You upload a photo or PDF of it.'],
    ['Request', 'An agency service (IPE, validation, personalisation). It is processed over time. You track it under My Requests.'],
    ['Provider', 'The company that supplies the official records to us. If it is busy, you see “temporarily unavailable” and you are not charged.'],
    ['NIN / VNIN', 'National Identification Number (11 digits) / the Virtual NIN.'],
    ['BVN', 'Bank Verification Number (11 digits).'],
    ['CAC, RC, BN', 'Corporate Affairs Commission. RC is a registered company number. BN is a business name number.'],
    ['TIN, TCC', 'Tax Identification Number, Tax Clearance Certificate.'],
    ['SCUML', 'Special Control Unit against Money Laundering registration.'],
    ['IPE', 'The clearance used when a NIN record is flagged and needs to be released.'],
    ['Validation', 'Correcting a NIN record that shows an error, such as No Record Found or SIM validation.'],
    ['Personalisation', 'Getting the NIN slip after enrolment, using your enrolment tracking ID.'],
    ['PVC / VIN', 'Permanent Voter’s Card and the voter number printed on it. (Chassis number is the vehicle one.)'],
    ['LGA', 'Local Government Area.'],
    ['Two-step login', 'An extra 6-digit code from a phone app when signing in. Used for the admin account.']]],
]},
{ id: 's-layout', title: 'Finding your way around', blocks: [
  ['p', 'Every page has the same layout, so once you learn it you can use the whole site.'],
  ['h', 'The left menu (sidebar)'],
  ['list', [
    '**Main Portal:** the Dashboard, your home page.',
    '**Finance and Wallet:** My Wallet, Deposit / Fund, and Transactions.',
    '**Identity and Verifications:** NIN Verification, NIN via Phone, NIN Demographic, BVN Verification and More Verifications (CAC, tax, ID documents, vehicle, bank and meter).',
    '**NIN Services:** IPE Clearance, NIN Personalisation, NIN Validation and My Requests.',
    '**Results and Help:** My Results (your saved results) and Guide and Tour (this guide).',
    '**Account and Support:** Agent Verification, Profile Settings, Direct WhatsApp (chat with support) and Log Out.',
    '**Admin:** only the owner sees this group.']],
  ['p', 'On a phone, the menu is hidden. Tap the square button at the top left to open it, and tap it again to close it. On a computer, the same button shrinks the menu to icons only.'],
  ['h', 'The top bar'],
  ['list', [
    '**Search box:** type part of a service name (for example “bvn”) and tap the result. On a computer press Ctrl and K to jump to it.',
    '**Moon button:** switches between light and dark colours. The site remembers your choice.',
    '**Bell:** opens My Requests. A red dot means you have requests still processing.',
    '**Your name:** tap it to open Profile Settings or Log Out. It also shows whether you are an Individual (“Personal”), a Verified agent or the Admin.']],
  ['h', 'Your balance'],
  ['p', 'At the top of the Dashboard is a purple card with your balance. For your privacy, the balance shows dots until you tap the eye. Tap again to hide it. Use **Fund Wallet** to add money and **Wallet Hub** to see your totals.'],
]},
{ id: 's-quick', title: 'Five-minute quick start', blocks: [
  ['steps', [
    'Create your account (name, mobile number, email, password) and sign in.',
    'Open **Deposit / Fund**, choose bank transfer or Paystack, and add money to your wallet.',
    'Open a service, for example **NIN Verification**. Type the number and check the fee shown.',
    'Press **Verify Now**. Your result appears on the right. Press **Download slip (PDF)** to save it.',
    'Closed the page by mistake? Open **My Results**. Your result is kept there for 30 days and opening it again is free.']],
  ['good', 'Want to be shown around the real screens? Press **Take a Tour** at the top of the Guide page. It walks you through the site one step at a time.'],
]},
]},

why: { title: 'Why DEBONE is better', sections: [
{ id: 'w-better', title: 'Why DEBONE is better than other websites', blocks: [
  ['p', 'Many websites that sell verification slips are built carelessly, and customers lose money to simple problems. We built DEBONE to remove those problems. Here is how the common problems on some websites compare with how DEBONE works.'],
  ['table', ['Problem on some other websites', 'How DEBONE handles it'], [
    ['You click “Download PDF” more than once and are charged each time.', '**You pay once per check.** Downloading a slip never touches your wallet. Download it as many times as you like, on any day, for free.'],
    ['You close the page by mistake and the result is gone. You must pay again.', '**Your result is saved for 30 days in My Results.** Open it, view it or download it again. It costs nothing.'],
    ['The service fails but your money is gone.', '**Automatic refund.** If the provider is down or the check fails, the fee is returned to your wallet and you see the message “You were not charged”. Both the charge and the refund appear in Transactions.'],
    ['You tap the button twice and are charged twice.', '**Double-click protection.** The same request cannot run twice at the same time. The second tap is blocked.'],
    ['You mistype a number and the money is wasted.', '**Checks before charging.** The site checks the format first (for example a NIN must be exactly 11 digits) and takes no money if the entry is wrong.'],
    ['You pay but your wallet is not funded.', '**Funding is tracked.** Paystack payments are credited automatically, once, and you can press “Check now”. Bank transfers have a reference, a progress bar and a clear status, and are credited when the owner confirms the money.'],
    ['Long requests vanish and nobody tells you.', '**My Requests.** IPE, validation and personalisation are tracked. If one fails, the money is returned automatically.'],
    ['Prices are hidden until after you pay.', '**You see the fee first.** The price is shown on the page before you press the button, and you also see how much a verified agent would pay.'],
    ['Weak accounts and shared logins.', '**Protected accounts.** Passwords are stored scrambled, repeated wrong guesses are blocked, other devices are signed out when you change your password, and the owner’s login needs a second code.'],
    ['Your documents and results stay online forever.', '**Short retention.** Results are kept for 30 days and then deleted. Agent ID documents are seen only by the owner.'],
    ['No one to talk to.', '**Direct WhatsApp support** from inside the site.']]],
  ['h', 'Our honest rules'],
  ['list', [
    'For NIN and BVN slips, if nothing is found you are not charged.',
    'For business and ID look-ups (CAC, TIN, bank account and similar), the provider charges for the search even when the answer is “No record found”. The site tells you clearly: “No record found for these details. The fee applies.”',
    'We never ask for your password, your bank PIN or your card PIN. Anyone who does is not from us.']],
  ['good', 'In short: pay once, download as many times as you want, find your result again for 30 days, and get your money back automatically when something fails.'],
]},
]},

customer: { title: 'For customers', sections: [
{ id: 'c-account', title: 'Creating your account and signing in', blocks: [
  ['h', 'Create an account'],
  ['steps', [
    'Open the website. On the sign-in page tap **Create one now**.',
    'Type your **full name**, your **mobile number** (for example 08012345678, or +234 format), your **email address** and a **password** of at least 8 characters.',
    'If the site is in “invite only” mode, also type the **invite code** the owner gave you (it looks like DV-ABCD1234). A code works only once and it expires.',
    'Tick the box to accept the Terms and Privacy. Read them first by tapping the link.',
    'Tap **Create account**. You are signed in and taken to your Dashboard.']],
  ['list', [
    'One email address and one phone number can have only one account.',
    'If you see “New registrations are closed right now”, the owner has paused sign-ups. Contact support on WhatsApp.',
    'Use a real phone number. It is used to keep accounts unique and to help support find you.']],
  ['h', 'Sign in and sign out'],
  ['steps', ['Type your email and password and tap **Sign in to account**.', 'Tap the little eye in the password box if you want to see what you typed.', 'To leave, open the menu and tap **Log Out**. Always log out on a shared phone or computer.']],
  ['list', [
    'You stay signed in on your own device for up to 30 days.',
    'After 10 wrong passwords in 15 minutes the site makes you wait 15 minutes. This protects your account from guessers.',
    '“This account has been suspended” means the owner switched your account off. Contact support.']],
  ['h', 'Forgot your password?'],
  ['p', 'On the sign-in page tap **Forgot password? Contact support**. Chat with support on WhatsApp. They set a temporary password for you. Sign in with it, then change it at once in Profile Settings.'],
]},
{ id: 'c-dashboard', title: 'The Dashboard', blocks: [
  ['p', 'The Dashboard is your home page. It shows your balance and a tile for every service.'],
  ['list', [
    '**Balance card:** tap the eye to show or hide your balance. **Fund Wallet** adds money. **Wallet Hub** opens your wallet page.',
    '**Agent banner:** if you are not a verified agent yet, a banner invites you to apply for the lower agent prices.',
    '**Tabs:** All Services, Identity, NIN Agency and Business and ID. Tap a tab to show only that group.',
    '**Search service:** the box on the right of the tabs filters the tiles as you type.',
    '**Tiles:** tap a tile to open that service. A **HOT** label marks popular services. Two extra tiles, **Fund Wallet** and **History**, take you to funding and to your transactions.',
    'A tile marked **AGENTS** is a service the owner has restricted to verified agents. If you do not see it marked, you can use it.']],
]},
{ id: 'c-fund-bank', title: 'Adding money by bank transfer (step by step)', blocks: [
  ['p', 'Bank transfer has no extra fee. You send money from your own bank app to the account shown on the site. The owner confirms it and your wallet is credited.'],
  ['steps', [
    'Open **Deposit / Fund**. Choose **Bank transfer**.',
    'Type the amount, or tap one of the quick amounts (₦1,000, ₦2,000, ₦5,000, ₦10,000, ₦20,000). The smallest amount is ₦100 and the largest single deposit is ₦500,000. It must be a whole number.',
    'Tap **Continue to bank transfer**. A page opens with an **amount to send**, your **reference** (like DT-1A2B3C4D) and the account details. Use the **Copy** buttons.',
    'In your bank app, send **exactly** that amount to one of the accounts. Put your reference in the transfer description (also called narration) so we can find it fast.',
    'Back on the site, press **I have made the transfer**. Only press it after the money has left your account.',
    'Upload your **receipt**: a clear photo or PDF (JPG, PNG, WebP or PDF, up to 2.5 MB). Tap **Send receipt**.',
    'Wait while it is **Under review**. The page updates by itself every 15 seconds. When the owner confirms the money, the status becomes **Credited** and your balance goes up.']],
  ['p', 'The progress bar at the top shows four stages: Transfer, Receipt, Review, Credited.'],
  ['h', 'Statuses you may see'],
  ['table', ['Status', 'What it means and what to do'], [
    ['Awaiting your transfer', 'Order created. Send the money, then press “I have made the transfer”.'],
    ['Upload your receipt', 'Now upload the proof of payment.'],
    ['Under review', 'We have your receipt and are checking our bank. Nothing more to do.'],
    ['Credited', 'Done. The money is in your wallet.'],
    ['Receipt rejected', 'Read the reason shown in red, then upload a clearer receipt. You can try again.'],
    ['Cancelled', 'The order was cancelled. You can start a new one.']]],
  ['warn', 'Never cancel an order after you have already sent the money. If something goes wrong, tap “Chat on WhatsApp” on the transfer page. It sends your reference to support. You can have at most 3 unfinished transfer orders at a time.'],
  ['tip', 'Your older orders are listed under “Your bank transfers” at the bottom of the Deposit page. Tap Continue or View to open one.'],
]},
{ id: 'c-fund-paystack', title: 'Adding money with Paystack (card, bank or USSD)', blocks: [
  ['p', 'Paystack is a secure payment company. It lets you pay with a bank card, a bank transfer or USSD, and your wallet is credited automatically.'],
  ['steps', [
    'Open **Deposit / Fund** and choose **Paystack**.',
    'Type the amount. The page shows the **Paystack fee** and the **total you pay**. Your wallet receives the amount you typed.',
    'Tap **Pay with Paystack**. You are taken to the Paystack page. Choose how to pay and finish.',
    'You return to the site and your wallet is credited. You see “Payment received. Your wallet has been credited.”']],
  ['list', [
    'If Paystack shows **Temporarily unavailable**, the owner has switched it off for now. Use bank transfer instead.',
    'The minimum is ₦100 and the maximum single deposit is ₦500,000.']],
  ['h', 'Paid but the balance did not change?'],
  ['steps', ['Open **Deposit / Fund** and scroll to **Your recent payments**.', 'Find the payment. If its status is **waiting**, press **Check now**.', 'If it still does not change, send the date and amount to support on WhatsApp.']],
  ['table', ['Payment status', 'Meaning'], [
    ['credited', 'Paystack confirmed it and your wallet was credited, once.'],
    ['waiting', 'Paystack has not confirmed it yet, or you did not finish paying.'],
    ['needs review', 'The amount did not match. The owner will look at it. Contact support.']]],
]},
{ id: 'c-wallet', title: 'Your wallet page', blocks: [
  ['p', 'Open **My Wallet** from the menu or from the Wallet Hub button.'],
  ['list', [
    '**Wallet card:** your balance (tap the eye), the funding method and your name.',
    '**Total funded:** all the money you have added.',
    '**Total spent:** what you have spent on services (refunds are taken off).',
    '**Wallet status and limits:** the minimum deposit (₦100), the maximum single deposit (₦500,000) and how many requests are still pending.',
    'Your wallet can never go below zero. If your balance is too low the site says “Not enough balance. Fund your wallet first.” and takes nothing.']],
]},
{ id: 'c-run', title: 'Running a verification, step by step', blocks: [
  ['p', 'All instant services work the same way, whether it is NIN, BVN, CAC, TIN, voter’s card, driver’s licence, passport, vehicle, bank or meter.'],
  ['steps', [
    'Open the service from the Dashboard or the menu. The page has a form on the left and a result area on the right.',
    'If the service has several slip types (for example NIN slip Premium, Standard, Regular, VNIN and Basic), pick one from **Slip type**. The price of each type is shown beside its name.',
    'Fill in the boxes. A red star means the box is required. Some boxes are lists: choose from them, or start typing a bank name and pick it.',
    'Look at the **Service Fee** line. It shows what you will pay. If you are not a verified agent, a note shows what an agent would pay.',
    'Check your **Wallet Balance** just below it.',
    'Press **Verify Now**. The fee is taken, the check runs, and the answer appears on the right within seconds.']],
  ['h', 'What can happen'],
  ['table', ['What you see', 'What it means for your money'], [
    ['Record found, with details, photo and a Download button', 'Fee paid once. The result is saved in My Results for 30 days.'],
    ['“You were not charged”', 'The provider was busy, the check failed, or nothing was found on a NIN or BVN slip. The fee was returned automatically.'],
    ['“No record found for these details. The fee applies.”', 'A business or ID look-up found nothing. The provider charges for the search. Check your digits before trying again.'],
    ['“Not enough balance”', 'Nothing was taken. Fund your wallet.'],
    ['“This request is already being processed”', 'The same check is already running (maybe you tapped twice). Wait a moment, then look in Transactions and My Results before trying again.'],
    ['“Temporarily unavailable. You were not charged”', 'The provider is down or busy. Try again later.'],
    ['An error message about a field', 'You typed something in the wrong format (for example a NIN with 10 digits). No money was taken. Correct it and press the button again.']]],
  ['tip', 'Always check the number before pressing Verify Now. The site takes the fee at that moment. If the number is wrong, a “No record” answer on business look-ups still costs the fee.'],
  ['warn', 'Use these services only for yourself or with the owner’s permission. Checking someone’s details without consent is against our Terms and can lead to suspension.'],
]},
{ id: 'c-slip', title: 'Downloading your slip: once paid, free forever (30 days)', blocks: [
  ['p', 'After a successful check, the result card shows the details and a button **Download slip (PDF)**.'],
  ['steps', ['Press **Download slip (PDF)**. The PDF is saved on your phone or computer.', 'Open it with any PDF reader or with your browser.', 'Need it again? Press the button again, or open My Results and download it from there.']],
  ['good', 'Downloading a slip is always free. It never takes money from your wallet, no matter how many times you press it.'],
  ['warn', 'If you see “Your payment went through and the slip was generated, but the file did not reach us”, do not pay again. Support has been alerted. Open My Results, or message support on WhatsApp.'],
]},
{ id: 'c-results', title: 'My Results: find any result again', blocks: [
  ['p', 'Every successful result is saved for you for **30 days**. This protects you if the page closes, your phone dies or you forget to download.'],
  ['steps', [
    'Open **My Results** from the menu.',
    'Find your result in the list. It shows the date, the service, the last digits of the number you checked and how many days are left.',
    'Press **View** to see the full result on screen, or **Download** to get the PDF.',
    'Press **Delete** if you want it removed from our system now. This cannot be undone.']],
  ['list', [
    'Opening, viewing and downloading from My Results is **free**. It does not contact the provider and does not touch your wallet.',
    'After 30 days a result is deleted automatically for your privacy. Download what you need to keep.',
    'Only you (and the site owner, for support) can see your results. Other customers cannot.']],
]},
{ id: 'c-services', title: 'Every service and what you need', blocks: [
  ['p', 'This table is live. It shows every service that is switched on right now, what you must type, and both prices. The prices are always up to date.'],
  ['dyn', 'services'],
  ['h', 'In plain words'],
  ['list', [
    '**NIN slips and NIN by phone:** get the NIN record and slip from the 11-digit NIN or from the phone number linked to it.',
    '**NIN by demographics:** find a NIN using first name, last name, date of birth (DD-MM-YYYY) and, if you want, gender.',
    '**BVN slips:** get a BVN record from an 11-digit BVN.',
    '**Tax and TIN:** check a TIN, get a TIN with a NIN, phone or RC number, check a Tax Clearance Certificate or a business tax number.',
    '**CAC:** search a company or business name by RC or BN number. Choose the registration type: RC, BN, IT, LP or LLP. “With directors” and “Premium” give more detail. SCUML checks a SCUML number.',
    '**ID documents:** voter’s card (PVC), driver’s licence and international passport. You type the number and the other details asked.',
    '**Vehicle:** plate number (basic or advanced) and chassis number.',
    '**Bank and meter:** account name from an account number and bank, account name match, BVN with bank account match, and address from an electricity meter number (choose the electricity company).']],
]},
{ id: 'c-agency', title: 'IPE, NIN validation and NIN personalisation', blocks: [
  ['p', 'These are agency services. They are not instant. You submit the request, we process it with the provider, and you check progress under **My Requests**.'],
  ['table', ['Service', 'What you type'], [
    ['IPE clearance', 'The tracking ID.'],
    ['NIN validation', 'The NIN and the error type: No Record Found, SIM Validation, V.NIN Validation, Update Records Validation, Bank Validation, Modification Validation or Photographic Error.'],
    ['NIN personalisation', 'The enrolment tracking ID.']]],
  ['steps', [
    'Open the service and type the details.',
    'Press **Submit Request**. The fee is taken and you see “Request submitted. Track it under My Requests.”',
    'Open **My Requests** (or tap the bell). Find your request. The status is **pending**, **completed** or **failed**.',
    'Press **Check status**. If it is completed, the result and slip appear. You can download the slip.',
    'If it failed, your money is returned to your wallet automatically.']],
  ['list', [
    'You can press Check status about once every 2 minutes for each request. Results rarely change faster than that.',
    'If the provider is busy, the site says so. Your request is safe.',
    'We also check pending requests for you in the background.',
    '“Under review” means our team is looking at it and will update it.',
    'A finished request keeps its result in My Requests for 7 days, and a copy stays in My Results for 30 days. Download the slip before then.',
    'If a request has been pending for more than 3 days, message support on WhatsApp.']],
]},
{ id: 'c-history', title: 'Transactions: reading your history', blocks: [
  ['p', 'Open **Transactions** to see every movement in your wallet, newest first. Green means money in. Red means money out.'],
  ['table', ['Status', 'Meaning'], [
    ['credited', 'You added money.'],
    ['success', 'A check worked and the fee was taken.'],
    ['no record', 'A look-up found nothing and the fee applied.'],
    ['charged then refunded', 'A check failed. You see the charge and the refund, so your total is zero.'],
    ['submitted', 'An agency request was submitted and its fee taken.'],
    ['refunded', 'Money returned to your wallet.']]],
]},
{ id: 'c-profile', title: 'Profile settings and password', blocks: [
  ['p', 'Open **Profile Settings** from the menu or from your name at the top.'],
  ['list', [
    '**Full name:** change it and press **Save changes**.',
    '**Email:** shown for reference. It cannot be changed here.',
    '**Current password and New password:** to change your password, type the current one and a new one of at least 8 characters, then press Save changes. Other devices are signed out for your safety.']],
]},
{ id: 'c-safety', title: 'Keeping your account safe', blocks: [
  ['list', [
    'Use a long password you do not use anywhere else.',
    'Never share your password or let someone else use your account.',
    'We will never ask you for your password, card PIN or bank PIN.',
    'Log out on shared devices.',
    'Only check details you are allowed to check. Get the owner’s consent.',
    'Keep your own copy of important slips and delete results you no longer need from My Results.',
    'If you notice a charge you do not recognise, check Transactions and tell support at once.']],
]},
{ id: 'c-faq', title: 'Problems and quick fixes', blocks: [
  ['table', ['Problem', 'What to do'], [
    ['“Not enough balance”', 'Fund your wallet, then try again. Nothing was taken.'],
    ['“Temporarily unavailable. You were not charged.”', 'The provider is busy. Wait a few minutes and try again.'],
    ['“This request is already being processed”', 'Do not tap again. Wait a moment, then check My Results and Transactions.'],
    ['“No record found”', 'Check the digits. NIN and BVN slips do not charge you when nothing is found. Business look-ups do.'],
    ['I paid with Paystack but my balance is the same', 'Deposit / Fund, then Your recent payments, then press Check now.'],
    ['I sent a bank transfer but it is not credited', 'Open the order from Your bank transfers. Make sure you pressed “I have made the transfer” and uploaded your receipt. The owner credits it after seeing the money.'],
    ['My receipt was rejected', 'Read the reason, then upload a clearer photo or PDF.'],
    ['I closed the page before downloading my slip', 'Open My Results. It is saved for 30 days and is free to open.'],
    ['The slip will not open', 'Open it with Chrome or a PDF app, or download it again from My Results.'],
    ['I forgot my password', 'On the sign-in page tap “Forgot password? Contact support”.'],
    ['I cannot create an account', 'The email or phone may already be used, an invite code may be needed, or sign-ups may be closed. Ask support.'],
    ['“Too many attempts”', 'Wait 15 minutes, then try again with the right password.'],
    ['My request has been pending for days', 'Press Check status. Failed requests are refunded automatically. After 3 days, message support.'],
    ['Paystack says unavailable', 'Use bank transfer instead.']]],
]},
{ id: 'c-support', title: 'Getting help', blocks: [
  ['steps', ['Tap **Direct WhatsApp** in the menu. It opens a chat with support.', 'Say what you were doing, the service name and the time. Do not send your password.', 'For payments, include your reference (for example DT-1A2B3C4D) or the amount and time.']],
]},
]},

agent: { title: 'For agents', sections: [
{ id: 'a-what', title: 'What is a verified agent?', blocks: [
  ['p', 'A verified agent is a business owner, cyber-café, POS operator or digital centre that has applied to the owner of the site and been approved. Verified agents pay the **lower agent price** on every service. Individuals pay the higher individual price.'],
  ['good', 'Everything in the Customer guide applies to you too: funding, running checks, My Results, My Requests and so on. This chapter covers what is different for agents.'],
  ['dyn', 'myprice'],
]},
{ id: 'a-apply', title: 'How to become a verified agent', blocks: [
  ['steps', [
    'Open **Agent Verification** from the menu, or tap the purple agent banner on the Dashboard.',
    'Fill in your **business or shop name**, your **mobile number**, your **business address** and your **state**.',
    'If you have one, add your **agent licence or CAC number**. This is optional.',
    'Upload a clear photo or PDF of a valid **ID document**: NIN slip, voter’s card, driver’s licence, international passport or agent licence. It must be JPG, PNG, WebP or PDF, up to 2.5 MB, and readable.',
    'Press **Submit application**. The owner reviews every application by hand.']],
  ['list', [
    'Your ID is seen only by the site owner. It is kept while your account is active. For rejected applications, the document is deleted after 90 days.',
    'Send a clear picture. Blurry or cropped IDs are rejected.',
    'Do not upload the same ID that another account used. It is flagged.']],
]},
{ id: 'a-status', title: 'After you apply: waiting, approved, rejected', blocks: [
  ['table', ['Status', 'What it means'], [
    ['Under review (pending)', 'The owner has not decided yet. You can keep using every service at the individual price. You cannot apply twice.'],
    ['Approved', 'You are a verified agent. Agent prices apply automatically on every service. The banner disappears and your name shows “Verified agent”.'],
    ['Rejected', 'The reason is shown on the Agent Verification page. Fix the problem and apply again.']]],
  ['p', 'The owner can also remove agent status from an account at any time, for example when the rules are broken. Prices then return to the individual price.'],
]},
{ id: 'a-prices', title: 'Your agent price', blocks: [
  ['p', 'This table compares the two prices for the main services. The difference is your saving on every single check.'],
  ['dyn', 'savings'],
  ['tip', 'The service page shows “Agent price” next to the fee when you are verified. Individuals see a note telling them how much an agent would pay.'],
]},
{ id: 'a-business', title: 'Running your agent business well', blocks: [
  ['list', [
    'Keep your wallet funded so you can serve customers quickly. Bank transfer has no fee.',
    'Always confirm the number with your customer before pressing Verify Now. A wrong number on a business look-up still costs the fee.',
    'After each job, download the slip and give it to your customer. You can fetch it again later from My Results for 30 days.',
    'Use Transactions to match each job to your records and to see refunds.',
    'Use My Requests to follow IPE, validation and personalisation jobs and tell your customers when they are ready.',
    'Check your wallet balance with the eye icon before a busy day.']],
]},
{ id: 'a-rules', title: 'Rules for agents', blocks: [
  ['list', [
    'Verify only with the consent of the person whose details you are checking.',
    'Do not share your login with staff. Each person should have their own account.',
    'Do not store customers’ slips longer than you need. Delete what you do not need from My Results.',
    'Misuse can lead to removal of agent status, suspension and a report to the authorities.']],
]},
]}

};

/* DEBONE Digital Hub: admin chapters of the user guide.
   This file lives OUTSIDE public/ on purpose. It is sent only to the signed-in admin (POST /api/guide/admin), never to customers.
   Same block format as public/guide-content.js. */
module.exports = {
title: 'For the admin (owner)', sections: [
{ id: 'ad-role', title: 'What the admin can do', blocks: [
  ['p', 'The admin is the owner of the site. Only the account whose email matches the ADMIN_EMAIL setting is an admin. The admin sees an extra **Admin** group in the menu and an **Admin** tab on the Dashboard.'],
  ['table', ['Admin page', 'What it is for'], [
    ['Admin Overview', 'Totals, warnings that need your attention, provider connection check and recent activity.'],
    ['Set Prices', 'Provider price, agent price, individual price, on/off and “agents only” for every service.'],
    ['Bank Transfers', 'Your bank details, the Paystack on/off switch, and approving or rejecting customer transfers.'],
    ['Paystack Payments', 'Every Paystack payment attempt and a re-check button.'],
    ['Agency Requests', 'IPE, validation and personalisation requests: check them or refund them.'],
    ['Saved Results', 'Every slip the provider returned, kept 30 days, even ones the customer never saw.'],
    ['Agents & Invites', 'Who can register, agent applications and invite codes.'],
    ['Users', 'Search users, suspend, reset password, make or remove agents.'],
    ['Support Settings', 'WhatsApp number, Paystack webhook and your two-step login.']]],
  ['tip', 'The admin also uses all customer features (wallet, checks, My Results). The admin pays the provider price with no markup. See the customer chapters for those.'],
]},
{ id: 'ad-login', title: 'Admin sign-in and two-step login', blocks: [
  ['p', 'Two-step login adds a 6-digit code from a phone app to the admin sign-in. Even if someone learns your password they cannot get in. It is strongly recommended.'],
  ['steps', [
    'Open **Support Settings** and find **Two-step login**. Press **Set up two-step login**.',
    'Install Google Authenticator, Microsoft Authenticator or Authy on your phone.',
    'In the app choose to add an account with a **setup key**. Type the key shown on the site (spaces do not matter), or tap “open in authenticator app” on your phone.',
    'Type the 6-digit code the app shows and press **Turn on**.',
    '**Write the setup key on paper and keep it safe.** If you lose your phone and the key, you cannot sign in.']],
  ['list', [
    'At sign-in, a box for the **Authenticator code** appears after you type the right password. A code can be used only once.',
    'Admin sessions end after 12 hours. Customers stay signed in for 30 days.',
    'To turn it off, you need your password and a current code.',
    'The admin email can always register an account, even when registration is closed.']],
]},
{ id: 'ad-overview', title: 'Admin Overview', blocks: [
  ['table', ['Tile', 'Meaning'], [
    ['Registered users', 'How many accounts exist.'],
    ['Wallet balances held', 'All customer wallet balances added together. This is money you owe to customers as service.'],
    ['Total funded', 'All money customers have added by bank transfer and Paystack.'],
    ['Customer spending', 'What customers spent on services, after refunds.'],
    ['Pending requests', 'Agency requests still processing.'],
    ['Paid actions today', 'Number of paid checks and requests today.']]],
  ['h', 'Needs attention'],
  ['p', 'A yellow box lists anything you must do. Each line tells you where to go:'],
  ['list', [
    'No payment method set up: open Bank Transfers and add your bank details.',
    'Bank transfers waiting for approval: open Bank Transfers.',
    'Services with no provider price: open Set Prices.',
    'Agent applications waiting: open Agents and Invites.',
    'Paystack payments waiting for confirmation: open Paystack Payments and press Re-check.',
    'Payments that need review because the amount did not match: check Paystack and refund if needed.',
    'Agency requests needing review or stuck for over 3 days: open Agency Requests.',
    'Wallet records do not add up: do not edit the database by hand. Contact your developer.']],
  ['h', 'Provider connection'],
  ['p', 'Press **Check provider connection**. If it says the provider replied, the link works and it may show your provider wallet balance. If there is no reply, check the VP_API_KEY setting and the provider’s status. When the provider wallet is low, customers see “temporarily unavailable” and are not charged, so keep it funded.'],
  ['p', 'The list at the bottom, **Recent admin activity and alerts**, shows what you and the system did, such as approving a transfer, changing a price, or provider problems.'],
]},
{ id: 'ad-prices', title: 'Set Prices: provider, agent and individual price', blocks: [
  ['p', 'Open **Set Prices**. Each service is one row with these columns:'],
  ['table', ['Column', 'Meaning'], [
    ['Provider price', 'What the provider charges you for this service. The admin account pays this price.'],
    ['Agent price', 'What a verified agent pays. It can never be below the provider price.'],
    ['Individual price', 'What a normal customer (not verified) pays. It can never be below the agent price. Leave it at 0 to use the automatic price (below).'],
    ['Margin (agent / individual)', 'Your profit per check at each price. Green is good, red means a problem such as an individual price below the agent price.'],
    ['Active', 'Switch a service off and customers see “switched off right now”.'],
    ['Agents only', 'Switch on to lock one service completely so only verified agents can use it. Normally leave it off, so everyone can use everything.']]],
  ['steps', ['Change the numbers in the row.', 'Press **Save** at the end of the row. A message “saved” appears.', 'Customers see the new price at once.']],
  ['h', 'The automatic individual price'],
  ['p', 'If the Individual price is 0, the site works it out from the agent price. Cheap services get the biggest gap, because that is where a small gap would not encourage anyone to become an agent:'],
  ['table', ['Agent price', 'Individual price is about', 'Example'], [
    ['Up to ₦300', '3.5 times', '₦300 becomes ₦1,050'],
    ['₦301 to ₦600', '2.7 times', '₦450 becomes ₦1,250'],
    ['₦601 to ₦1,500', '1.8 times', '₦1,100 becomes ₦2,000'],
    ['Above ₦1,500', '1.4 times', '₦1,800 becomes ₦3,000']]],
  ['p', 'All results are rounded up to the next ₦50. You can type your own individual price for any service at any time. Your own prices are never overwritten.'],
  ['good', 'Why individuals must pay clearly more: if an individual pays almost the same as an agent, nobody has a reason to become a verified agent and your agents have nobody to out-price. Keep the gap wide on cheap, popular services.'],
  ['h', 'Sync provider prices'],
  ['p', 'Press **Sync provider prices** to copy the provider’s current prices for the look-up services (CAC, TIN, ID, vehicle, bank, meter). Slip and agency services have no price list from the provider, so type their provider prices by hand. A badge shows how many services still have no provider price.'],
  ['h', 'Checking prices against the market'],
  ['p', 'When these defaults were set, public information showed: NIMC lists the official NIN slip at ₦600 at an enrolment centre and ₦1,000 on its self-service portal (schedule effective May 2025; confirm the current amounts with NIMC). One public verification vendor lists a NIN or BVN look-up at ₦350, a slip print at ₦150, and verify-and-print together at ₦500, and a CAC status search at ₦500. No public list of agent prices for IPE, validation or personalisation was found, so those stay on your own provider cost plus margin.'],
  ['tip', 'Use these as anchors, not rules. Keep individual slip prices under what NIMC charges and close to what other sites charge, keep agent prices clearly lower, and check **Margin** in Set Prices so nothing sells near your provider price. Compare again every few months, because prices move.'],
  ['warn', 'If the provider raises its price above your agent price, set a higher agent price at once. The site never charges below the provider price, but your margin disappears.'],
]},
{ id: 'ad-transfers', title: 'Bank Transfers: approving customer deposits', blocks: [
  ['h', 'Step 1: tell customers where to send money'],
  ['steps', ['Open **Bank Transfers**. In **Where customers send money**, fill Account 1 (bank, account name, account number). Account 2 is optional.', 'Press **Save bank details**. Customers see these on every transfer page.']],
  ['h', 'Step 2: Paystack for customers'],
  ['p', 'Below the bank details, the **Paystack for customers** line has a **Turn on** or **Turn off** button. When it is off, customers who choose Paystack are told it is temporarily unavailable and are pointed to bank transfer. You can only turn it on after the Paystack key is set in the server settings.'],
  ['h', 'Step 3: approve or reject'],
  ['steps', [
    'Open the list. **Needs action** shows transfers with receipts uploaded. **All** shows everything.',
    'Press **View** to see the customer’s receipt.',
    'Check your **own bank app or alert**. Do not approve from the receipt alone: receipts can be faked.',
    'Press **Approve**. Check or correct **Amount you actually received**, then press **Approve and credit wallet**. A second box asks “Are you sure?”. Press **Yes, approve**.',
    'The customer’s wallet is credited once and the status becomes Credited. This cannot be undone.']],
  ['list', [
    'A red note “Same receipt as DT-…” means the same receipt image was already used. Look carefully. The site asks you to confirm if you still want to approve.',
    'To **Reject**, write a reason. The customer sees it and can upload a new receipt.',
    'If the customer paid but never uploaded a receipt, you can still approve it once you see the money.',
    'Cancelled orders cannot be approved.']],
  ['warn', 'Only approve money you can see in your bank account. Approving credits the wallet immediately.'],
]},
{ id: 'ad-paystack', title: 'Paystack Payments', blocks: [
  ['p', 'This page lists every Paystack payment attempt: date, customer, wallet credit, amount the customer paid, and status.'],
  ['table', ['Status', 'Meaning'], [
    ['credited', 'Confirmed by Paystack. The wallet was credited once.'],
    ['waiting', 'Paystack has not confirmed it. The customer may have abandoned it.'],
    ['needs review', 'The amount paid did not match. Check your Paystack dashboard and refund there if needed.']]],
  ['steps', ['Press **Re-check all waiting payments** to ask Paystack again about every waiting payment.', 'In your Paystack dashboard set the **webhook URL** shown in Support Settings, so confirmed payments reach the site by themselves.']],
]},
{ id: 'ad-requests', title: 'Agency Requests: IPE, validation, personalisation', blocks: [
  ['p', 'This page lists every agency request with the date, customer, service, fee and status.'],
  ['list', [
    '**Check** asks the provider about the request. If it is completed or failed, the page updates. A failed request is refunded automatically.',
    '**Refund customer** returns the fee and closes the request. Use it for stuck requests or after the provider tells you it cannot be done.',
    'Status **review** means the provider accepted the request but gave no request number. The money is kept safe. Check with the provider, then complete or refund.',
    'A request pending for more than 3 days shows in the Overview warnings.']],
]},
{ id: 'ad-results', title: 'Saved Results', blocks: [
  ['p', 'Every result the provider returned is kept here for **30 days**, even if the customer never saw it or the check was marked failed. Customers can open their own successful results in My Results.'],
  ['list', [
    '**View** shows the result. **Download** saves the PDF. **Delete** removes it now.',
    '**Copy reply for provider support** copies the raw provider reply so you can send it to the provider in a dispute.',
    'Outcome **success** or **completed** is normal. **Needs review** means the provider replied with success but the site did not count it as one. Customers cannot see these; you can send the slip to the customer if it is right.',
    'Opening a result is recorded in the admin activity log.']],
]},
{ id: 'ad-agents', title: 'Agents and Invites', blocks: [
  ['h', 'Who can register'],
  ['table', ['Mode', 'Effect'], [
    ['Open', 'Anyone can create an account and use every service at the individual price.'],
    ['Invite only', 'A person needs a one-time invite code from you.'],
    ['Closed', 'Nobody new can register. The admin email still can.']]],
  ['h', 'Agent applications'],
  ['steps', [
    'The page lists applications, pending ones first. Each shows the person, the business, address, state and the ID document.',
    'Press **View ID** to open the document. A red “repeat image” label means the same file was used in another application. Check carefully.',
    'Press **Approve** to make the person a verified agent at once, or **Reject** and write a reason the applicant will see.',
    'Rejected applicants can apply again.']],
  ['list', [
    'Documents are visible only to you. For rejected applications they are deleted after 90 days.',
    'You can also make or remove an agent directly in **Users**.']],
  ['h', 'Invite codes'],
  ['steps', ['Type who it is for (optional) and how many days it stays valid (1 to 90).', 'Press **Create code**, copy it, and send it privately.', 'The list shows each code as unused, used (and by whom) or expired. You can delete unused codes.']],
]},
{ id: 'ad-users', title: 'Users', blocks: [
  ['p', 'Search by name or email. Each row shows name, email, phone, balance, status and agent status, with three buttons:'],
  ['list', [
    '**Suspend / Activate:** a suspended user cannot sign in and is signed out everywhere. You cannot suspend your own admin account.',
    '**Reset password:** the site makes a temporary password and shows it once. Give it to the user privately. They should change it in Profile Settings.',
    '**Make agent / Remove agent:** switches the lower agent price on or off for that user.']],
]},
{ id: 'ad-settings', title: 'Support Settings', blocks: [
  ['list', [
    '**Support WhatsApp number:** type it with the country code and no plus sign, for example 2348012345678. It powers the Direct WhatsApp button and the “forgot password” link.',
    '**Paystack:** shows whether the key is set and gives you the webhook URL to copy into your Paystack dashboard.',
    '**Two-step login:** set it up or turn it off. See “Admin sign-in and two-step login”.']],
]},
{ id: 'ad-routine', title: 'Your daily routine', blocks: [
  ['steps', [
    'Open **Admin Overview** and read the yellow “Needs attention” box.',
    'Open **Bank Transfers**. Approve or reject waiting transfers after checking your bank.',
    'Open **Agents and Invites**. Decide any waiting agent applications.',
    'Open **Agency Requests**. Check stuck requests and refund if needed.',
    'Press **Check provider connection** and make sure the provider wallet has enough money.',
    'Once a week, look at **Set Prices** and compare with the provider’s prices.']],
]},
{ id: 'ad-safety', title: 'Money safety rules', blocks: [
  ['list', [
    'Every charge is refunded automatically when a check fails. You do not need to refund those.',
    'Wallets can never go below zero, and a Paystack payment is credited only once.',
    'Approving a bank transfer is final. Always see the money in your bank first.',
    'Never edit the database by hand. If “Wallet records do not add up” appears, stop and contact your developer.',
    'Keep two-step login on and keep the setup key safe.',
    'Do not share the admin password. Staff who help with approvals should be given advice, not the admin login.',
    'Old data is cleaned up automatically: results after 30 days, old receipts after 90 days, expired request results after 7 days.']],
]},
{ id: 'ad-faq', title: 'Admin problems and quick fixes', blocks: [
  ['table', ['Problem', 'What to do'], [
    ['Customers say “temporarily unavailable”', 'Press Check provider connection. Fund the provider wallet if it is low, or wait if the provider is down. Customers are not charged.'],
    ['A customer says Paystack paid but wallet is empty', 'Open Paystack Payments and press Re-check. If it still waits, check the Paystack dashboard.'],
    ['A transfer is “Needs review” or has a repeat receipt', 'Look at your bank. Approve only if the money is there.'],
    ['A request is stuck', 'Open Agency Requests, press Check, then Refund customer if needed.'],
    ['A customer lost a slip', 'They can open My Results for 30 days. After that, check Saved Results.'],
    ['An agent was approved by mistake', 'Open Users and press Remove agent.'],
    ['A customer forgot the password', 'Open Users, press Reset password, and send the temporary password privately.'],
    ['I lost my phone for two-step login', 'Use the setup key you wrote down on a new phone. Without it you need your developer.']]],
]}
],
/* ready answers for the assistant (admin only, same shape as public/guide-qa.js) */
qa: [
['How do I set prices?', 'Open **Set Prices**. Each service has a provider price (what you pay), an agent price (never below provider) and an individual price (never below agent; 0 = automatic). Change the numbers and press **Save** at the end of the row. Customers see the new price at once.', 'ad-prices', 'change update edit price set margin profit'],
['How is the automatic individual price worked out?', 'If the individual price is 0 the site multiplies the agent price: up to ₦300 about 3.5 times, ₦301 to ₦600 about 2.7 times, ₦601 to ₦1,500 about 1.8 times, above ₦1,500 about 1.4 times, rounded up to the next ₦50 and at least ₦150 more. Prices you type yourself are never overwritten.', 'ad-prices', 'automatic auto individual price formula tier multiplier'],
['Why must individuals pay more than agents?', 'If an individual pays almost the same as an agent, nobody has a reason to become a verified agent. Keep the gap wide on cheap, popular services.', 'ad-prices', 'gap why higher individual price agents incentive'],
['What is Sync provider prices?', 'It copies the provider’s current prices for the look-up services (CAC, TIN, ID, vehicle, bank, meter). Slip and agency services have no price list from the provider, so type their provider prices by hand.', 'ad-prices', 'sync provider prices cost update copy'],
['What are other sites and NIMC charging? Are my prices right?', 'At the time the defaults were set: NIMC lists the NIN slip at ₦600 at a centre and ₦1,000 on its portal (May 2025 schedule). One public vendor lists a look-up at ₦350, a slip print at ₦150, verify and print together at ₦500, and a CAC search at ₦500. The default individual prices (about ₦300 to ₦550 for NIN slips) sit under NIMC and near the other vendors; agent prices are lower. Compare again every few months and edit any price in Set Prices.', 'ad-prices', 'market competitors compare prices nimc cheaper right correct price research benchmark'],
['What if the provider raises its price?', 'Set a higher agent price at once. The site never charges below the provider price, but your margin disappears if you do not.', 'ad-prices', 'provider increase price margin loss cost raised'],
['How do I turn a service off?', 'In **Set Prices** switch **Active** off for that service. Customers then see “switched off right now”. Use **Agents only** to lock a service to verified agents instead.', 'ad-prices', 'disable switch off service active hide lock agents only'],
['How do I approve a bank transfer?', 'Open **Bank Transfers**, press **View** to see the receipt, check your own bank app, then press **Approve**, confirm the amount you actually received and press **Approve and credit wallet**, then **Yes, approve**. The wallet is credited once and this cannot be undone.', 'ad-transfers', 'approve transfer credit deposit confirm receipt customer money'],
['How do I reject a bank transfer?', 'Press **Reject** and write a reason. The customer sees it and can upload a new receipt.', 'ad-transfers', 'reject decline transfer receipt reason'],
['What does “Same receipt as DT-…” mean?', 'The same receipt image was already used on another transfer. Look carefully; the site asks you to confirm if you still want to approve.', 'ad-transfers', 'same receipt duplicate repeat fake fraud'],
['Where do I put my bank account details for customers?', 'In **Bank Transfers**, under “Where customers send money”: fill Account 1 (bank, account name, number), Account 2 is optional, then press **Save bank details**.', 'ad-transfers', 'bank details account number customers send money set up'],
['How do I turn Paystack on or off?', 'In **Bank Transfers**, use the **Turn on / Turn off** button on the Paystack line. You can only turn it on after the Paystack key is set in the server settings.', 'ad-transfers', 'paystack on off enable disable switch'],
['A customer says Paystack paid but the wallet is empty.', 'Open **Paystack Payments** and press **Re-check all waiting payments**. If it still waits, check your Paystack dashboard. Also make sure the webhook URL from Support Settings is set in Paystack.', 'ad-paystack', 'paystack paid not credited webhook recheck waiting'],
['What is the Paystack webhook?', 'A link in Support Settings that you paste into your Paystack dashboard so confirmed payments reach the site by themselves.', 'ad-paystack', 'webhook url paystack dashboard'],
['How do I handle a stuck IPE, validation or personalisation request?', 'Open **Agency Requests**, press **Check** to ask the provider, and press **Refund customer** if it cannot be done. A failed request is refunded automatically.', 'ad-requests', 'stuck request refund check agency ipe validation'],
['What does request status “review” mean?', 'The provider accepted the request but gave no request number. The money is kept safe. Check with the provider, then complete or refund it.', 'ad-requests', 'review status request no number'],
['What are Saved Results for?', 'Every result the provider returned is kept 30 days, even ones the customer never saw. You can view, download, delete, or copy the raw reply for provider support in a dispute.', 'ad-results', 'saved results provider reply dispute copy raw'],
['What does outcome “needs review” mean?', 'The provider replied with success but the site did not count it as one. Customers cannot see these. If the slip is right you can send it to the customer.', 'ad-results', 'needs review outcome success saved result'],
['How do I approve an agent?', 'Open **Agents and Invites**, press **View ID** and check the document (a red “repeat image” label means the same file was used before), then press **Approve** or **Reject** with a reason. You can also use **Make agent** in Users.', 'ad-agents', 'approve agent application id verify make agent'],
['How do I make or remove an agent directly?', 'Open **Users**, search the person and press **Make agent** or **Remove agent**. Removing sends their prices back to the individual price.', 'ad-users', 'make agent remove agent user manual'],
['How do I create an invite code?', 'In **Agents and Invites** type who it is for (optional) and how many days it is valid (1 to 90), press **Create code**, copy it and send it privately. You can delete unused codes.', 'ad-agents', 'invite code create generate'],
['How do I stop new people from registering?', 'In **Agents and Invites** choose the register mode: Open (anyone), Invite only (needs a code) or Closed (nobody new; your admin email still can).', 'ad-agents', 'registration mode closed invite open sign up control'],
['How do I suspend a user?', 'Open **Users**, search the person and press **Suspend**. They cannot sign in and are signed out everywhere. You cannot suspend your own admin account. Press **Activate** to restore.', 'ad-users', 'suspend ban block disable user'],
['How do I reset a user’s password?', 'Open **Users** and press **Reset password**. The site shows a temporary password once. Give it to the user privately and tell them to change it in Profile Settings.', 'ad-users', 'reset password user forgot temporary'],
['How do I set the support WhatsApp number?', 'In **Support Settings** type it with the country code and no plus sign, for example 2348012345678, and save. It powers the Direct WhatsApp button and the forgot-password link.', 'ad-settings', 'whatsapp support number set change'],
['How do I set up two-step login?', 'In **Support Settings** press **Set up two-step login**, add the setup key to Google Authenticator, Microsoft Authenticator or Authy, type the 6-digit code and press **Turn on**. Write the setup key on paper and keep it safe.', 'ad-login', 'two step 2fa authenticator setup key admin login secure'],
['I lost my phone for two-step login.', 'Use the setup key you wrote down on a new phone. Without it you need your developer.', 'ad-faq', 'lost phone authenticator 2fa locked out'],
['What is on the Admin Overview?', 'Registered users, wallet balances held, total funded, customer spending, pending requests and paid actions today, a yellow “Needs attention” box, the provider connection check and recent admin activity.', 'ad-overview', 'overview dashboard admin numbers attention provider check'],
['How do I check the provider connection?', 'On **Admin Overview** press **Check provider connection**. If it says the provider replied, the link works and it may show your provider wallet balance. Keep that wallet funded; when it is low, customers see “temporarily unavailable” and are not charged.', 'ad-overview', 'provider connection check api wallet balance temporarily unavailable'],
['What should I do every day?', 'Read Admin Overview’s Needs attention box, approve or reject bank transfers after checking your bank, decide agent applications, check stuck agency requests, check the provider connection and wallet, and once a week compare Set Prices with the provider’s prices.', 'ad-routine', 'daily routine checklist every day tasks'],
['What are the money safety rules?', 'Charges are refunded automatically when checks fail, wallets cannot go below zero, a Paystack payment is credited once, approving a transfer is final (see the money in your bank first), never edit the database by hand, keep two-step login on, and do not share the admin login.', 'ad-safety', 'money safety rules security admin careful'],
['A customer lost a slip.', 'They can open My Results for 30 days. After that, look in **Saved Results** (also 30 days).', 'ad-faq', 'customer lost slip result recover'],
['Customers say temporarily unavailable.', 'Press **Check provider connection**. Fund the provider wallet if it is low, or wait if the provider is down. Customers are not charged.', 'ad-faq', 'temporarily unavailable provider down customers complain'],
['“Wallet records do not add up” appears.', 'Stop and do not edit the database by hand. Contact your developer.', 'ad-overview', 'wallet records do not add up mismatch warning']
]};

# Lead capture from Instagram & Facebook: options

Research done 2026-11-21. Goal: get brokers' social media enquiries into Brokers OS **without making customers fill in forms and without extra work for brokers.**

## How enquiries actually happen
A customer sees a post or reel, then comments ("price pls"), sends a DM, or taps a WhatsApp number. Almost every conversation ends up on **WhatsApp**. Links in Instagram captions can't be clicked. Only the bio, Story link stickers and links inside DMs are clickable. Links in Facebook captions are clickable.

## Options

| # | Option | What it catches | Meta approval needed? | Cost | Broker effort |
|---|---|---|---|---|---|
| A | **ManyChat** (already Meta-approved). Caption says "Comment PRICE". ManyChat auto-DMs the customer the details plus a WhatsApp button, and sends the lead to Brokers OS through its "External Request" feature (Pro plan). | Comments and keyword DMs, which covers the leads stuck in comments | **No** (ManyChat has it) | ManyChat Pro per broker account, roughly $15–39/month (pricing changed March 2026; the free plan only allows 25 contacts) | One-time setup (we do it), then use the keyword in captions |
| B | **WhatsApp capture ("coexistence")**: the broker keeps using the normal WhatsApp Business app, and every message is also copied to Brokers OS with the customer's number. | Most leads, because everything ends on WhatsApp | **Yes**: Brokers OS must become a Meta Tech Provider (business verification + App Review) | Low | One-time connect. Must use the WhatsApp **Business** app. |
| C | **Our own comment/DM capture** (code already partly built) | Comments and DMs | **Yes**: Advanced Access (App Review + business verification). It works without review only for accounts listed as testers on our app. | Free | One-time connect |
| D | **Brokers OS link with a WhatsApp button** (bio, Facebook posts, Stories) | Only customers who tap the link. It records listing, source and time, **but not the customer's phone number.** | No | Free | Put the link in the bio |

Open-source "ManyChat alternatives" on GitHub (OpenReply, InstaAuto, Pilot) **do not avoid Meta review**. They run on your own Meta app keys, so the same review applies. They are also young projects (under ~7 months old). They're only useful as code reference.

## Recommendation (updated 2026-11-21, after owner feedback)
- **D is dropped as a lead channel.** Customers stay on Instagram/Facebook and won't visit a Brokers OS page. Capture has to happen in comments, DMs and WhatsApp.
- **Pilot: C, with the pilot brokers added as testers on our Meta app.** This needs no review and is free. Comment *notifications* need full approval, so new comments are checked every few minutes instead. Fall back to A (ManyChat) only if the tester route doesn't work.
- **Start now:** Meta Business Verification (the business is fully registered), then App Review for the comment/message permissions and Tech Provider status for WhatsApp (B). The pilot gives us the working demo Meta asks for in review.
- After about 2 weeks of the pilot, measure roughly what share of each broker's enquiries were captured.

## WhatsApp without our own Meta review (researched 2026-11-21)
| Option | How | Hurdle | Risk / cost |
|---|---|---|---|
| **W1. Unofficial "WhatsApp Web" link** (Baileys, whatsapp-web.js) | Broker scans a QR code, like WhatsApp Web. Brokers OS reads every chat. | None | **Breaks WhatsApp's terms. The broker's number can be banned, even if we only read messages.** Fake copies of these libraries have stolen accounts. **Rejected.** |
| **W2. Go through 360dialog** (already Meta-approved) with coexistence | Broker keeps the WhatsApp Business app, and messages are copied to Brokers OS automatically | Their onboarding, not ours. **Still to confirm with 360dialog whether we also need Tech Provider status.** | About €25–49 per number per month (figures vary), plus Meta fees. Messages sent from the app stay free. |
| **W3. "Forward to Brokers OS" number** | Brokers OS has **its own** WhatsApp number on the Cloud API. The broker forwards a customer's message or shares the contact card to it, and the lead is created with name and number. | **None.** Our own number only needs our own app (the existing `whatsapp-webhook` fits this). | Free to receive. The broker taps "forward" per lead, which takes about 3 seconds. |

**Plan:** W3 for the pilot (safe, works now). Ask 360dialog about W2 for fully automatic capture. Keep our own Tech Provider application as the long-term route.

## Sources
- 360dialog coexistence: https://docs.360dialog.com/docs/hub/embedded-signup/whatsapp-coexistence
- 360dialog pricing: https://docs.360dialog.com/partner/get-started/pricing-and-plans
- Unofficial library ban risk: https://whatsapp.checkleaked.cc/blog/best-open-source-whatsapp-libraries
- Instagram App Review / Advanced Access: https://developers.facebook.com/docs/instagram-platform/app-review
- Instagram comment moderation & webhooks: https://developers.facebook.com/docs/instagram-platform/comment-moderation
- WhatsApp Tech Provider onboarding: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-tech-provider
- WhatsApp coexistence (Business app + Cloud API): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- ManyChat External Request: https://support.manychat.com/support/solutions/articles/36000018457
- ManyChat pricing (verify current): https://manychat.com/pricing
- Open-source alternatives: https://github.com/diwenne/openreply, https://github.com/ayuuxh2/insta-p8, https://github.com/getpilot/app

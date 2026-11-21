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

## Recommendation
- **Pilot:** A + D (no approval needed). Use C for the pilot brokers as app testers if useful.
- **Start now, in parallel:** Meta Business Verification for Brokers OS, since B needs it. B is the long-term answer.
- After about 2 weeks of the pilot, measure roughly what share of each broker's enquiries were captured.

## Sources
- Instagram App Review / Advanced Access: https://developers.facebook.com/docs/instagram-platform/app-review
- Instagram comment moderation & webhooks: https://developers.facebook.com/docs/instagram-platform/comment-moderation
- WhatsApp Tech Provider onboarding: https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-tech-provider
- WhatsApp coexistence (Business app + Cloud API): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- ManyChat External Request: https://support.manychat.com/support/solutions/articles/36000018457
- ManyChat pricing (verify current): https://manychat.com/pricing
- Open-source alternatives: https://github.com/diwenne/openreply, https://github.com/ayuuxh2/insta-p8, https://github.com/getpilot/app

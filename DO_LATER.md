# Do Later

A running list of deferred tasks, known inconsistencies, and things to revisit.

---

## Phone Number — Registration Promise vs. Actual Usage

During registration, we tell users their phone number will be used to send them updates (e.g., order status, promotions). However, we are **not currently using phone numbers for anything** — no SMS notifications, no OTPs, nothing.

**What needs to be done:**
- Either implement phone-based notifications/updates (SMS or WhatsApp) so the promise holds true, or
- Update the registration copy to remove or soften the claim (e.g., "for future use" or simply don't mention updates).

**Priority:** Medium — it's a trust/UX issue but not breaking anything right now.

---

## Wishlist ↔ Cart — Mutual Removal on Move

Currently, moving an item from the wishlist to the cart (or vice versa) does **not** remove it from the source list. Both lists end up holding the same item simultaneously, which is redundant and confusing.

**Expected behaviour:**
- Moving an item from **wishlist → cart**: remove it from the wishlist automatically.
- Moving an item from **cart → wishlist**: remove it from the cart automatically.

**What needs to be done:**
- Update the "move to cart" action to also delete the item from the wishlist.
- Update the "move to wishlist" action to also delete the item from the cart.
- Ensure this is handled atomically (both operations succeed or neither does).

**Priority:** High — this is a clear UX bug that affects day-to-day shopping flow.

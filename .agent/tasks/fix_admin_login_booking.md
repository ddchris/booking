# Task: Resolve Login Instability & Enable Admin Bookings

## Status
- [ ] Fix BookingService client-side checks for Admins
- [ ] Stabilize Firebase Login (Resolve "Pending promise" error)
- [ ] Fix Admin Link Visibility (Reactivity/Timing)

## context
The user is experiencing two main issues:
1. **Admin Booking Failure**: Even after updating Firestore rules, Admins cannot book. This is likely because the `BookingService` (client-side) throws errors for "Active Booking" or "Blocked" before sending the request to Firestore.
2. **Login Error**: `INTERNAL ASSERTION FAILED: Pending promise was never set`. This is a Firebase Auth SDK issue often related to Popup handling or component unmounting during the auth flow.

## Implementation Plan

### 1. Fix BookingService (`services/booking.service.ts`)
- Update `createBooking` to check for `user.role === 'admin'`.
- Bypass `isBlocked` and `activeBookingTimeSlot` checks if the user is an admin.

### 2. Stabilize Login (`stores/auth.store.ts`)
- Wrap `signInWithPopup` in a robust error handler.
- Verify `unsubscribe` logic to ensure we aren't killing listeners prematurely.
- Ensure `initAuth` awaits the initial user resolution correctly.

### 3. Verify Admin Link Visibility (`layouts/default.vue`)
- Ensure the `auth.isAdmin` check is reactive and the component re-renders when the profile loads.
- The use of `markRaw` on the user object is good, but we need to ensure `profile` (which contains the role) is still fully reactive. (It is `ref`, so it should be fine).

## Verification
- **Admin Booking**: Login as Admin -> Click a slot -> Confirm booking succeeds (bypassing the "1 active booking" limit).
- **Login**: Logout -> Login. Verify no Console Error.

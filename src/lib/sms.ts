/**
 * Phone (SMS) login codes stay off until MSG91 (DLT sender ID + template) is live.
 * While false, the customer login and vendor sign-up show "Phone" greyed out with "Coming soon"
 * and use email codes instead. Set true once docs/sms-otp-setup.md step 5 works.
 */
export const SMS_READY = false;

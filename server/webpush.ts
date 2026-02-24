import webpush from 'web-push';

const vapidPublicKey = "BOj6Y6bKtB_UfsWUFu_AulWALKFH3w1MR_C1iOy1LsF0hhCwW1iZIvlzp2X62c7QoxNK0F_FFgaT9ygZFYuO8mM";
const vapidPrivateKey = "FMU83M6eGxXbQEqJKnMSUPweqVBFjZLcQYpHUJ377qo";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export { webpush, vapidPublicKey };
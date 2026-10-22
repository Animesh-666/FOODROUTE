export function friendlyAuthError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists. Please sign in.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Choose a stronger password (at least 8 characters).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Email or password is incorrect.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed': return 'Network unavailable. Check your connection and try again.';
    case 'auth/user-disabled': return 'This account is unavailable. Please contact support.';
    case 'permission-denied':
    case 'firestore/permission-denied': return 'This operation was blocked by database permissions.';
    case 'auth/operation-not-allowed': return 'Email/password sign-in must be enabled in Firebase Authentication.';
    default: return 'Something went wrong. Please try again, or check your Firebase configuration.';
  }
}

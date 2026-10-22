import {test,expect} from '@playwright/test';
const domains={customer:'/customer/dashboard',admin:'/admin/dashboard',restaurant:'/restaurant/dashboard',rider:'/rider/dashboard'} as const;
test('Landing page displays correctly',async({page})=>{
 await page.goto('/');await expect(page.locator('body')).toBeVisible();
 await expect(page.locator('body')).not.toContainText('Internal Server Error');
});
test('Sign-in form is keyboard-accessible',async({page})=>{
 await page.goto('/login');await expect(page.locator('#signInEmail')).toBeVisible();
 await expect(page.locator('#signInPassword')).toBeVisible();
});
test('Unauthenticated protected pages do not display account-private data',async({page})=>{
 await page.goto('/admin/dashboard');
 await expect(page.locator('.frd-sidebar')).toHaveCount(0);
});
for(const [role,destination] of Object.entries(domains)){
 test(`${role}: sign-in goes to correct role dashboard`,async({page})=>{
  // Run only against emulator/staging with disposable role accounts, never real customer accounts.
  const e=process.env[`FOODROUTE_TEST_${role.toUpperCase()}_EMAIL`];
  const p=process.env[`FOODROUTE_TEST_${role.toUpperCase()}_PASSWORD`];
  test.skip(!e||!p,'No disposable staging credentials configured for this role.');
  await page.goto('/login');await page.locator('#signInEmail').fill(e!);
  await page.locator('#signInPassword').fill(p!);
  await page.getByRole('button',{name:/Sign in/i}).click();
  await expect(page).toHaveURL(new RegExp(destination.replaceAll('/','\\/')+'$'),{timeout:12000});
  if(role!=='customer'){
   await page.goto('/account');
   await expect(page.getByRole('link',{name:/Back to Dashboard/i})).toBeVisible();
  }
 });
}

const { execSync } = require('child_process');

const components = [
  'core/layout/navbar',
  'core/layout/footer',
  'features/home',
  'features/auth/login',
  'features/auth/register',
  'features/wiki',
  'features/shop',
  'features/community/forum',
  'features/community/blog',
  'features/dashboard/user-dashboard',
  'features/dashboard/admin-dashboard',
  'features/dashboard/specialist-dashboard',
  'features/dashboard/premium-dashboard',
];

console.log('Generating components...');
for (const comp of components) {
  try {
    console.log(`Generating ${comp}...`);
    execSync(`npx ng generate component ${comp} --skip-tests`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to generate ${comp}`);
  }
}
console.log('Done!');

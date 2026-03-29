const fs = require('fs');
const path = require('path');

const uiDir = 'C:\\Users\\ENG Ahmed Fetooh\\Desktop\\Nti_final_project\\UI';
const destDir = 'C:\\Users\\ENG Ahmed Fetooh\\Desktop\\Nti_final_project\\gheras\\frontend\\src\\app';

const mappings = [
  { file: 'index.html', dest: 'features/home/home.html' },
  { file: 'login.html', dest: 'features/auth/login/login.html' },
  // Since we don't have separate register.html we will map login.html for now or skip register
  { file: 'wiki.html', dest: 'features/wiki/wiki.html' },
  { file: 'shop.html', dest: 'features/shop/shop.html' },
  { file: 'forum.html', dest: 'features/community/forum/forum.html' },
  { file: 'blog.html', dest: 'features/community/blog/blog.html' },
  { file: 'dashboard-user.html', dest: 'features/dashboard/user-dashboard/user-dashboard.html' },
  { file: 'dashboard-admin.html', dest: 'features/dashboard/admin-dashboard/admin-dashboard.html' },
  { file: 'dashboard-specialist.html', dest: 'features/dashboard/specialist-dashboard/specialist-dashboard.html' },
  { file: 'dashboard-premium.html', dest: 'features/dashboard/premium-dashboard/premium-dashboard.html' }
];

for (const map of mappings) {
  const srcPath = path.join(uiDir, map.file);
  if (!fs.existsSync(srcPath)) {
    console.warn('File not found:', srcPath);
    continue;
  }
  
  let content = fs.readFileSync(srcPath, 'utf-8');
  
  // Extract body content between nav and footer (or script)
  // Logic: find <nav class="navbar">...</nav>
  // Find <footer class="footer">...</footer>
  // OR <script>
  let bodyStart = 0;
  const navEndMatch = content.match(/<\/nav>/);
  if (navEndMatch) {
    bodyStart = navEndMatch.index + navEndMatch[0].length;
  } else {
    const bodyMatch = content.match(/<body>/);
    if (bodyMatch) bodyStart = bodyMatch.index + bodyMatch[0].length;
  }
  
  let bodyEnd = content.length;
  const footerMatch = content.match(/<footer class="footer">/);
  if (footerMatch) {
    bodyEnd = footerMatch.index;
  } else {
    const scriptMatch = content.match(/<script>/);
    if (scriptMatch) {
      bodyEnd = scriptMatch.index;
    } else {
      const endBodyMatch = content.match(/<\/body>/);
      if (endBodyMatch) bodyEnd = endBodyMatch.index;
    }
  }
  
  // Extract just the html segment
  let extracted = content.substring(bodyStart, bodyEnd).trim();
  
  // Special handling for auth-page which might not have nav/footer
  if (map.file === 'login.html' && extracted.includes('<div class="auth-page">')) {
    const startIdx = extracted.indexOf('<div class="auth-page">');
    extracted = extracted.substring(startIdx);
  }

  // Replace href="xxxx.html" with routerLink="xxxx"
  // e.g. href="index.html" -> routerLink="/"
  // href="wiki.html" -> routerLink="/wiki"
  extracted = extracted.replace(/href="([^"]+)\.html"/g, (match, p1) => {
    if (p1 === 'index') return 'routerLink="/"';
    if (p1 === 'login' || p1 === 'register' || p1 === 'wiki' || p1 === 'shop' || p1 === 'forum' || p1 === 'blog') return `routerLink="/${p1}"`;
    if (p1 === 'dashboard-user') return 'routerLink="/dashboard"';
    if (p1 === 'dashboard-admin') return 'routerLink="/dashboard/admin"';
    if (p1 === 'dashboard-premium') return 'routerLink="/dashboard/premium"';
    if (p1 === 'dashboard-specialist') return 'routerLink="/dashboard/specialist"';
    return match; // fallback
  });
  
  // Convert style="..." to [style]="..." where necessary or just leave inline styles.
  // Angular usually accepts standard style attributes.

  const destPath = path.join(destDir, map.dest);
  fs.writeFileSync(destPath, extracted);
  console.log('Migrated', map.file, 'to', map.dest);
}

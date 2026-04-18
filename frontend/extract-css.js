const fs = require('fs');
const html1 = fs.readFileSync('C:\\Users\\ENG Ahmed Fetooh\\Desktop\\Nti_final_project\\UI\\index.html', 'utf-8');
const html2 = fs.readFileSync('C:\\Users\\ENG Ahmed Fetooh\\Desktop\\Nti_final_project\\UI\\login.html', 'utf-8');

const regex = /<style>([\s\S]*?)<\/style>/gm;
let result = '';

let m;
while ((m = regex.exec(html1)) !== null) {
  if (m.index === regex.lastIndex) regex.lastIndex++;
  result += m[1] + '\n';
}
while ((m = regex.exec(html2)) !== null) {
  if (m.index === regex.lastIndex) regex.lastIndex++;
  result += m[1] + '\n';
}

// deduplicate some parts if needed, but since CSS cascades, it's fine.
fs.writeFileSync('C:\\Users\\ENG Ahmed Fetooh\\Desktop\\Nti_final_project\\gheras\\frontend\\src\\styles.css', result);
console.log('CSS extracted!');

// Run from mobile: node scripts/build-lessons.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../docs/aprende');
const clean = text => text.replace(/\*\*/g, '').replace(/^>\s*/gm, '').trim();
const lessons = fs.readdirSync(root).filter(name => /^\d+.*\.md$/.test(name)).map(name => {
  const text = fs.readFileSync(path.join(root, name), 'utf8').replace(/\r/g, '');
  const section = prefix => text.split('\n## ').find(part => part.startsWith(prefix))?.split('\n').slice(1).join('\n').trim() || '';
  const keys = section('Clave editorial').split('\n').filter(row => /^\| P\d/.test(row)).map(row => row.split('|').slice(1, -1).map(x => x.trim()));
  const questions = section('Quiz').split(/^### /m).slice(1).map((part, i) => {
    const lines = part.trim().split('\n');
    const options = lines.filter(line => /^- [ABC]\./.test(line)).map(line => line.slice(5));
    const prompt = clean(lines.slice(1).filter(line => line && !line.startsWith('- ')).join('\n')) || lines[0].split(' · ')[1];
    const key = keys[i];
    if (!key || options.length !== 3) throw new Error(`Invalid quiz ${name} ${i}`);
    return { id: key[0], title: lines[0].split(' · ')[1], prompt, options, correct: 'ABC'.indexOf(key[1]), explanation: key[2], mistakes: key[3] };
  });
  const cards = text.split('\n## ').filter(part => part.startsWith('Tarjeta ')).map(part => ({ title: part.split('\n')[0].split(' · ')[1], text: clean(part.split('\n').slice(1).join('\n')) }));
  if (questions.length !== 3 || !cards.length) throw new Error(`Incomplete lesson ${name}`);
  return { id: text.match(/\*\*ID:\*\* (\S+)/)[1], version: 1, title: text.split('\n')[0].slice(2), minutes: Number(text.match(/estimada:\*\* (\d+)/)[1]), objective: clean(text.match(/\*\*Objetivo:\*\* (.*)/)[1]), intro: clean(section('Bienvenida')), cards, questions, takeaway: clean(section('Cierre').match(/\*\*Idea para llevarte:\*\* (.*)/)?.[1] || ''), challenge: clean(section('Cierre').match(/\*\*Reto opcional:\*\* (.*)/)?.[1] || '') };
});
fs.mkdirSync(path.resolve(__dirname, '../src/components/learn'), { recursive: true });
fs.writeFileSync(path.resolve(__dirname, '../src/components/learn/lessons.json'), JSON.stringify(lessons, null, 2) + '\n');
console.log(`Generated ${lessons.length} lessons and ${lessons.reduce((n, l) => n + l.questions.length, 0)} questions.`);

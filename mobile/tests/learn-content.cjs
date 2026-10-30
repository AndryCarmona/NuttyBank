const assert = require('node:assert/strict');
const lessons = require('../src/components/learn/lessons.json');
assert.equal(lessons.length, 8);
assert.equal(new Set(lessons.map(l => l.id)).size, 8);
for (const lesson of lessons) {
  assert.equal(lesson.questions.length, 3);
  for (const q of lesson.questions) {
    assert(q.correct >= 0 && q.correct < 3);
    assert(q.explanation.length > 0);
    assert(q.options.every(option => option.length > 0));
    assert(!q.prompt.includes('Clave editorial'));
  }
  assert(lesson.cards.every(card => !card.text.includes('## Quiz')));
}
assert.deepEqual(lessons[0].questions.map(q => q.correct), [1, 2, 0]);
assert.equal(lessons[6].questions[1].options[lessons[6].questions[1].correct], '$1,210.');
console.log('8 lessons and 24 questions validated; answer keys isolated from reading content.');

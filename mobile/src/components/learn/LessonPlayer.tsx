
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import ScreenSurface from '../home/ScreenSurface';
import { Navigation, useNavigationClearance } from '../home/components';
import { colors as c } from '../home/data';
import lessons from './lessons.json';
import { Action, Choice, styles as shared } from './ui';
import { quizHistory, quizOrder, type Attempt } from './progress';

// Paginar sin eliminar texto: conserva palabras y separa primero los párrafos.
export function dialoguePages(text: string, limit: number) {
  const pages: string[] = [];
  let page = '';
  for (const paragraph of text.split('\n\n')) {
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (page && page.length + word.length + 1 > limit) { pages.push(page); page = ''; }
      page += (page ? ' ' : '') + word;
    }
    if (page) { pages.push(page); page = ''; }
  }
  return pages.length ? pages : [''];
}
type Props = { lesson: typeof lessons[number]; index: number; mode: string; attempt: Attempt; question: number; onQuestion: (n: number) => void; save: (patch: Partial<Attempt>) => void; go: (mode: string) => void; back: () => void };
export default function LessonPlayer(props: Props) {
  const { lesson, index, mode, attempt, question, onQuestion, save, go, back } = props;
  const { height, fontScale } = useWindowDimensions();
  const clearance = useNavigationClearance();
  const compact = height < 720 || fontScale > 1.15;
  const quiz = mode === 'quiz';
  const step = Math.min(attempt.step, lesson.cards.length - 1);
  const card = lesson.cards[step];
  const pages = dialoguePages(card.text, compact ? 180 : 280);
  // La página se asocia al paso, de modo que al cambiar de tarjeta empieza en cero.

  const page = Math.min(attempt.page ?? 0, pages.length - 1);
  const dialogueIndex = lesson.cards.slice(0, step).reduce((n, item) => n + dialoguePages(item.text, compact ? 180 : 280).length, 0) + page;
  const teacher = dialogueIndex % 2 === 1;
  const number = quizHistory(lesson.id, attempt).length + (attempt.completed ? 0 : 1);
  const order = quizOrder(number);
  const questionIndex = order[question];
  const q = lesson.questions[questionIndex];
  const previous = () => {
    if (quiz) { if (question > 0) onQuestion(question - 1); else back(); }
    else if (page > 0) save({ page: page - 1 });
    else if (step > 0) { save({ step: step - 1, page: 0 }); }
    else back();
  };
  const next = () => {
    if (quiz) {
      if (question < 2) onQuestion(question + 1);
      else { save({ completed: true }); go('result'); }
    } else if (page < pages.length - 1) save({ page: page + 1 });
    else if (step < lesson.cards.length - 1) save({ step: step + 1, page: 0 });
    else go('activity');
  };
  const final = !quiz && step === lesson.cards.length - 1 && page === pages.length - 1;
  return <ScreenSurface green>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={previous} style={s.back}><Text style={shared.heading}>←</Text></Pressable>
      <View style={{ flex: 1, gap: 4 }}><Text style={shared.eyebrow}>{quiz ? `QUIZ ${number} DE 3` : `LECCIÓN ${index + 1} · NUTTY TE CUENTA`}</Text>{!quiz && <Text style={s.lessonTitle}>{lesson.title}</Text>}</View>
    </View>
    <View style={s.progress}><View style={[s.progressFill, { width: `${quiz ? (question + 1) / 3 * 100 : (step + (page + 1) / pages.length) / lesson.cards.length * 100}%` }]} /></View>
    <View style={[s.content, { padding: compact ? 16 : 22, paddingBottom: clearance }]}>
      <Text style={shared.eyebrow}>{quiz ? `PREGUNTA ${question + 1} DE 3` : `IDEA ${step + 1} DE ${lesson.cards.length} · DIÁLOGO ${page + 1} DE ${pages.length}`}</Text>
      <ScrollView key={`${mode}-${step}-${page}-${question}`} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: quiz ? 'flex-start' : 'center', gap: compact ? 10 : 16 }} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
        <View style={[s.speech, quiz && s.quizSpeech]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={s.speaker}>Nutty {quiz ? 'te pregunta…' : 'dice…'}</Text></View>
          {!quiz && <Text style={s.cardTitle}>{card.title}</Text>}
          <Text style={[s.dialogue, (compact || quiz) && { fontSize: 15, lineHeight: 22 }]}>{quiz ? q.prompt : pages[page]}</Text>
          <View style={[s.tail, quiz && { backgroundColor: '#E6EDDF' }]} />
        </View>
        {quiz ? <>
          <View accessibilityRole="radiogroup" style={{ gap: compact ? 7 : 10 }}>{order.map((optionIndex, i) => <Choice compact key={optionIndex} label={`${'ABC'[i]}. ${q.options[optionIndex]}`} selected={attempt.answers[questionIndex] === optionIndex} onPress={() => { const answers = [...attempt.answers]; answers[questionIndex] = optionIndex; save({ answers, completed: false }); }} />)}</View>
        </> : <View style={{ alignItems: 'flex-start', marginTop: 8 }}><View style={{ width: compact ? 110 : 160, height: compact ? 116 : 170, overflow: 'hidden' }}><Image accessible accessibilityLabel={teacher ? "Nutty con lentes explicando" : "Nutty explicando"} source={teacher ? require('@/assets/images/nutty-teacher.png') : require('@/assets/images/nutty-mascot.png')} resizeMode="contain" style={{ position: 'absolute', width: compact ? 220 : 320, height: compact ? 119 : 173, left: compact ? -54 : -78 }} /></View></View>}
      </ScrollView>
      {quiz && <Image accessible accessibilityLabel="Nutty pensando contigo" source={require('@/assets/images/nutty-quiz.png')} resizeMode="contain" style={{ width: compact ? 241 : 312, maxWidth: '100%', height: compact ? 165 : 215, borderRadius: 22, alignSelf: "center" }} />}
      <View style={s.controls}><View style={{ flex: 1 }}><Action label="← Anterior" onPress={previous} /></View><View style={{ flex: 1 }}><Action label={quiz ? question === 2 ? 'Ver resumen' : 'Siguiente →' : final ? 'Practicar →' : 'Continuar →'} disabled={quiz && (attempt.answers[questionIndex] < 0 || question === 2 && attempt.answers.some(n => n < 0))} onPress={next} /></View></View>
    </View>
    <Navigation />
  </ScreenSurface>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.green }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 }, back: { padding: 8 }, lessonTitle: { color: c.ink, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  progress: { height: 6, backgroundColor: '#C9DCC5', marginHorizontal: 24, marginBottom: 14, borderRadius: 8, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#35583E', borderRadius: 8 },
  content: { flex: 1, backgroundColor: c.paper, borderTopLeftRadius: 36, borderTopRightRadius: 36, gap: 12 }, speech: { backgroundColor: '#D6E6CF', borderRadius: 26, borderBottomLeftRadius: 8, padding: 20, gap: 9, marginBottom: 12 }, quizSpeech: { padding: 14, backgroundColor: '#E6EDDF', borderBottomLeftRadius: 26, borderBottomRightRadius: 8 }, speaker: { fontSize: 12, fontWeight: '700', color: '#45684B' }, cardTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700', color: c.ink }, dialogue: { color: c.ink, fontSize: 17, lineHeight: 26 }, tail: { position: 'absolute', width: 22, height: 22, backgroundColor: '#D6E6CF', bottom: -8, left: 32, transform: [{ rotate: '35deg' }] }, controls: { flexDirection: 'row', gap: 10, paddingTop: 8 },
});

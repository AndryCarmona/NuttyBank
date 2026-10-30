import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import lessons from './lessons.json';
import { NavigationIcon } from '../home/NavigationIcon';
import { learningStats, isLessonUnlocked, quizHistory, type Attempt } from './progress';
import { Action, styles as shared } from './ui';
import { colors as c } from '../home/data';

const symbols = ['↔', '▤', '◈', '◎', '☂', '▱', '↗', '⌕'];
type DashboardProps = { data: Record<string, Attempt>; open: (id: string, resume?: boolean) => void };
function recommendation(data: Record<string, Attempt>) {
  const ongoing = lessons.filter(l => isLessonUnlocked(l.id, data) && data[l.id] && !data[l.id].completed).sort((a, b) => (data[b.id].updatedAt ?? 0) - (data[a.id].updatedAt ?? 0))[0];
  const next = ongoing ?? lessons.find(l => isLessonUnlocked(l.id, data) && !data[l.id]?.finishedBefore && !data[l.id]?.completed);
  return { ongoing, next };
}
export function ContinueLesson({ data, open }: DashboardProps) {
  const { ongoing, next } = recommendation(data);
  const newUser = !lessons.some(l => data[l.id]);
  return <View style={s.continueCard}>
    <View style={s.mascotCrop}><Image accessible accessibilityLabel="Nutty te invita a aprender" source={require('@/assets/images/nutty-mascot.png')} resizeMode="contain" style={s.mascot} /></View>
    <View style={{ flex: 1, minWidth: 130, gap: 9 }}>
      <Text style={shared.eyebrow}>{newUser ? '¡HOLA! SOY NUTTY' : ongoing ? 'AQUÍ TE QUEDASTE' : next ? 'SIGAMOS APRENDIENDO' : '¡RECORRIDO COMPLETO!'}</Text>
      <Text style={s.continueTitle}>{newUser ? 'Comienza tu primera lección' : ongoing ? 'Continuar lección con Nutty' : next ? 'Vamos por la siguiente lección' : 'Siempre hay algo que repasar'}</Text>
      <Text style={shared.muted}>{newUser ? 'Descubre cómo cuidar tu dinero con pequeñas lecciones, actividades y quizzes. ¡Demos el primer paso juntos!' : next ? next.title : 'Ya exploraste las ocho lecciones. Vuelve a tus temas favoritos.'}</Text>
      <Action label={newUser ? 'Comenzar →' : ongoing ? 'Continuar →' : next ? 'Siguiente lección →' : 'Repasar →'} onPress={() => open((next ?? lessons[0]).id, !!ongoing)} />
    </View>
  </View>;
}
export default function LessonDashboard({ data, open }: DashboardProps) {
  const stats = learningStats(data);
  const { ongoing } = recommendation(data);
  return <>
    <View style={s.scoreCard}>
      <Text style={shared.eyebrow}>TU COLECCIÓN DE CONOCIMIENTO</Text>
      <View style={shared.row}><NavigationIcon name="Puntaje" size={28} /><Text style={s.score}>{stats.points}</Text><Text style={shared.muted}>de {stats.maximum} puntos</Text></View>
      <View style={shared.track}><View style={[shared.fill, { width: `${stats.points / stats.maximum * 100}%` }]} /></View>
      <View style={s.metrics}><Text style={shared.text}>✓ {stats.completed}/8 lecciones</Text><Text style={shared.text}>◎ {stats.correct}/24 aciertos</Text></View>
      <Text style={shared.muted}>20 puntos por completar una lección + 10 por cada acierto de tu mejor quiz. Repetir te ayuda a mejorar; los puntos no se duplican.</Text>
    </View>
    <Text style={shared.heading}>Tu ruta de aprendizaje</Text>
    <Text style={shared.muted}>Explora libremente las primeras 4 lecciones. Desde la lección 5, completa la anterior para desbloquear la siguiente.</Text>
    {lessons.map((lesson, i) => {
      const item = data[lesson.id];
      const locked = !isLessonUnlocked(lesson.id, data);
      const attempts = quizHistory(lesson.id, item).length;
      const done = !!(item?.finishedBefore || item?.completed);
      const current = ongoing?.id === lesson.id;
      const best = item?.bestCorrect ?? (item?.completed ? lesson.questions.filter((q, j) => q.correct === item.answers[j]).length : 0);
      return <Pressable accessibilityRole="button" accessibilityState={{ disabled: locked }} disabled={locked} key={lesson.id} onPress={() => open(lesson.id, !!item && !item.completed)} style={({ pressed }) => [s.lesson, { borderColor: current ? c.green : '#E0E7DC', backgroundColor: locked ? '#EDF0EB' : '#FFFFFF', opacity: pressed ? .7 : 1 }]}>
        <View style={s.lessonTop}><View style={[s.symbol, { backgroundColor: i % 2 === 0 ? '#DCE9D5' : '#F0E7D5' }]}><Text style={s.symbolText}>{locked ? '🔒' : symbols[i]}</Text></View><View style={{ flex: 1 }}><Text style={shared.eyebrow}>LECCIÓN {String(i + 1).padStart(2, '0')} · {lesson.minutes} MIN</Text><Text style={s.lessonTitle}>{lesson.title}</Text></View><Text style={shared.text}>{locked ? '' : done ? '✓' : '→'}</Text></View>
        <Text style={shared.muted}>{lesson.objective}</Text>
        <View style={s.lessonFooter}><Text style={s.status}>{locked ? `Completa la lección ${i} para desbloquear` : current ? '● Aquí te quedaste' : done ? '✓ Completada' : item ? 'En curso' : 'Por descubrir'}</Text>{done && <Text style={shared.muted}>Mejor quiz: {best}/3 · {20 + best * 10} pts</Text>}</View>
        <Text style={shared.muted}>Intentos del quiz: {attempts}/3{item?.view === 'quiz' && !item.completed && !locked ? ` · Quiz ${attempts + 1} en curso` : ''}</Text>
      </Pressable>;
    })}
  </>;
}
const s = StyleSheet.create({
  scoreCard: { padding: 22, borderRadius: 28, backgroundColor: '#E6EEDC', gap: 13 }, score: { color: '#35583E', fontSize: 36, fontWeight: '700' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  continueCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 18, gap: 12, backgroundColor: '#F2EBDC', borderRadius: 28 }, continueTitle: { fontSize: 20, fontWeight: '700', lineHeight: 27, color: c.ink }, mascotCrop: { width: 100, height: 138, overflow: 'hidden' }, mascot: { width: 245, height: 138, position: 'absolute', left: -63 },
  lesson: { backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 2, padding: 18, gap: 12 }, lessonTop: { flexDirection: 'row', gap: 12, alignItems: 'center' }, symbol: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, symbolText: { fontSize: 25, color: '#35583E' }, lessonTitle: { fontSize: 17, fontWeight: '600', lineHeight: 24, color: c.ink, marginTop: 5 }, lessonFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, status: { fontSize: 12, fontWeight: '600', color: '#45684B' },
});

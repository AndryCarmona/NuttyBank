import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenSurface from '../home/ScreenSurface';
import { Navigation } from '../home/components';
import { NavigationIcon } from '../home/NavigationIcon';
import { colors as c } from '../home/data';
import lessons from './lessons.json';
import Activity from './Activity';
import LessonPlayer from './LessonPlayer';
import LessonDashboard, { ContinueLesson } from './LessonDashboard';
import { useLearningProgress, quizHistory, MAX_QUIZZES, answerFeedback, isLessonUnlocked, type Attempt } from './progress';
import { Action, Choice, styles as s } from './ui';

const fresh = (): Attempt => ({ version: 1, answers: [-1, -1, -1], step: 0, completed: false });
const examples = [
  'Imagina dos bolsillos. Pasar $50 de uno al otro no aumenta lo que tienes. Si tienes $200 y reservas $140 para un pago, solo quedan $60 sin asignar. Un préstamo añade dinero al bolsillo y también una obligación de devolverlo.',
  'Tienes $800 y necesitas reservar $650: quedan $150 para repartir. Si recibes $100 más después, puedes actualizar el plan. No necesitas gastar hoy contando con ese ingreso incierto.',
  'Una compra de $15 repetida cuatro veces cuesta $60. Durante tres semanas suma $180. No significa que sea mala: conocer ese total te ayuda a decidir si vale la pena para ti.',
  'Quieres reunir $600 y ya tienes $150: faltan $450. Llevas una de cuatro partes, es decir, 25%. Con nueve aportaciones de $50 puedes completar lo que falta, sin contar rendimientos.',
  'Un pago anual conocido se puede preparar con anticipación. Una avería urgente inesperada tiene otra función en tu plan. El fondo te respalda cuando lo necesitas: usarlo para eso no borra el valor de haberlo preparado.',
  'Piensa en el corte como cerrar una lista de compras, y en la fecha límite como el plazo para pagar esa lista. Si el estado de cuenta señala mínimo $100 y pago para no generar intereses $800, entregar $100 no equivale a cubrir los $800.',
  'En otra simulación, $200 al 10% anual constante pasan a $220 el primer año. Reinvertidos, generan $22 el segundo año y llegan a $242, sin costos ni impuestos. Es matemática hipotética. La liquidez habla de acceso; el riesgo, de lo que podría salir distinto a lo esperado.',
  'Si alguien usa el nombre de una institución real, imagina que viste una credencial fotocopiada: el nombre por sí solo no verifica a la persona. Busca el canal oficial por tu cuenta. La prisa y los códigos privados son razones para detenerte.',
];
export default function LearnScreen() {
  const { lesson } = useLocalSearchParams<{ lesson?: string }>();
  return <LearnContent key={lesson ?? 'list'} />;
}
function LearnContent() {
  const params = useLocalSearchParams<{ lesson?: string; view?: string; question?: string }>();
  const lessonId = typeof params.lesson === 'string' ? params.lesson : '';
  const lesson = lessons.find(item => item.id === lessonId);
  const index = lessons.findIndex(item => item.id === lessonId);
  const progress = useLearningProgress(lessonId);
  const requestedMode = ['read', 'activity', 'quiz', 'result', 'nutty'].includes(params.view ?? '') ? params.view! : 'read';
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
  const [question, setQuestion] = useState(() => Math.max(0, Math.min(2, Number(params.question) || 0)));
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const attempt = progress.data[lessonId] ?? fresh();
  const history = quizHistory(lessonId, attempt);
  const mode = requestedMode === "quiz" && attempt.completed ? "result" : requestedMode;
  const resultAnswers = selectedHistory === null ? attempt.answers : history[selectedHistory]?.answers ?? attempt.answers;
  const step = Math.min(attempt.step, (lesson?.cards.length ?? 1) - 1);
  const score = lesson?.questions.filter((q, i) => q.correct === resultAnswers[i]).length ?? 0;
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [mode, step, question, lessonId]);
  const save = (patch: Partial<Attempt>) => progress.save(lessonId, patch);
  const go = (next: string) => { if (next === "quiz" && attempt.completed) next = "result"; if (next !== "nutty") save({ view: next }); router.setParams({ view: next }); };
  const openLesson = (id: string, resume?: boolean) => {
    const item = progress.data[id];
    router.push({ pathname: '/learn', params: { lesson: id, view: resume ? item?.view ?? 'read' : 'read', question: String(resume ? item?.question ?? 0 : 0) } } as never);
  };
  const back = () => {
    if (mode === 'nutty') { router.setParams({ view: '' }); go(attempt.completed ? 'result' : 'read'); }
    else if (mode === 'result' || mode === 'read' && step === 0) router.replace('/learn' as never);
    else if (mode === 'quiz' && question > 0) setQuestion(question - 1);
    else if (mode === 'quiz') go('activity');
    else if (mode === 'activity') go('read');
    else save({ step: step - 1 });
  };
  if (progress.ready && lesson && !isLessonUnlocked(lessonId, progress.data)) return <ScreenSurface green><View style={[s.body, { justifyContent: 'center' }]}><Text style={s.eyebrow}>LECCIÓN {index + 1} · BLOQUEADA</Text><Text style={s.heading}>Avancemos paso a paso</Text><Text style={s.text}>Completa la lección {index}: {lessons[index - 1].title}, para abrir esta lección. Basta con terminar su quiz; no necesitas una nota mínima.</Text><Action label="Ver lección anterior" onPress={() => router.replace({ pathname: '/learn', params: { lesson: lessons[index - 1].id, view: 'read' } } as never)} /><Action label="Volver a lecciones" onPress={() => router.replace('/learn' as never)} /></View><Navigation /></ScreenSurface>;
  if (progress.ready && lesson && (mode === 'read' || mode === 'quiz')) return <LessonPlayer lesson={lesson} index={index} mode={mode} attempt={attempt} question={question} onQuestion={n => { setQuestion(n); save({ question: n }); }} save={save} go={go} back={back} />;
  const mascot = <Image source={require('@/assets/images/nutty-teacher.png')} resizeMode="contain" style={s.mascot} />;
  return <ScreenSurface green>
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: c.paper }} contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={{ flexGrow: 1, backgroundColor: c.green }} bounces={false} overScrollMode="never">
      {!lesson ? <View style={{ padding: 22 }}>{progress.ready ? <ContinueLesson data={progress.data} open={openLesson} /> : <Text style={s.text}>Preparando tu recorrido…</Text>}</View> : <View style={{ padding: 22, gap: 16 }}><View style={[s.row, { justifyContent: 'space-between' }]}><Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={back} style={{ padding: 10 }}><Text style={s.heading}>←</Text></Pressable><Text style={s.eyebrow}>{mode === 'nutty' ? 'REPASA CON NUTTY' : mode === 'result' ? 'RESULTADOS' : 'APRENDE'}</Text><NavigationIcon name="Calendario" size={25} /></View>
        <Text style={s.heading}>{mode === 'result' ? 'Quiz' : lesson ? lesson.title : 'Tu dinero, a tu ritmo'}</Text>
        <Text style={s.text}>{lesson ? lesson.objective : 'Pequeñas lecciones para tomar decisiones con más confianza. Sin prisas y sin compararte.'}</Text>
        {lesson && <><View style={s.track}><View style={[s.fill, { width: `${mode === 'read' ? Math.round((step + 1) / (lesson.cards.length + 2) * 100) : mode === 'activity' ? 70 : mode === 'quiz' ? 80 + question * 5 : 100}%` }]} /></View><Text style={s.muted}>{mode === 'read' ? `Explicación ${step + 1} de ${lesson.cards.length}` : mode === 'quiz' ? `Pregunta ${question + 1} de 3` : mode === 'activity' ? 'Ponlo en práctica' : 'Una oportunidad para seguir aprendiendo'}</Text></>}
      </View>}
      <View style={s.body}>
        {!!progress.error && <View style={s.card}><Text style={s.text}>{progress.error}</Text><Action label="Reintentar guardado" onPress={progress.retry} /></View>}
        {!progress.ready ? <Text style={s.text}>Preparando tus lecciones…</Text> : !lesson ? <>
          <LessonDashboard data={progress.data} open={openLesson} />
        </> : mode === 'read' ? <>
          <Text style={s.eyebrow}>LECCIÓN {index + 1} · EXPLORA</Text>
          <View style={s.bubble}><Text style={s.heading}>{lesson.cards[step].title}</Text><Text style={s.text}>{lesson.cards[step].text}</Text></View>
          {mascot}<Text style={[s.muted, { textAlign: 'center' }]}>{step === 0 ? lesson.intro : 'Vamos paso a paso. Puedes volver a leer cuando quieras.'}</Text>
          <View style={s.row}>{step > 0 && <Action label="← Anterior" onPress={() => save({ step: step - 1 })} />}<Action label={step === lesson.cards.length - 1 ? 'Practicar →' : 'Continuar →'} onPress={() => { if (step === lesson.cards.length - 1) go('activity'); else save({ step: step + 1 }); }} /></View>
          {attempt.completed && <Action label="Ver mi último resumen" onPress={() => go('result')} />}
        </> : mode === 'activity' ? <Activity key={lessonId} index={index} onDone={() => { setQuestion(0); save({ question: 0 }); go('quiz'); }} /> : mode === 'quiz' ? <>
          <Text style={s.eyebrow}>LO QUE APRENDISTE</Text><Text style={s.heading}>{lesson.questions[question].title}</Text><Text style={s.text}>{lesson.questions[question].prompt}</Text>
          {lesson.questions[question].options.map((option, i) => <Choice key={option} label={`${'ABC'[i]}. ${option}`} selected={attempt.answers[question] === i} onPress={() => { const answers = [...attempt.answers]; answers[question] = i; save({ answers, completed: false }); }} />)}
          <Text style={s.muted}>Puedes volver a las preguntas anteriores antes de ver tus resultados.</Text><View style={s.row}>{question > 0 && <Action label="← Anterior" onPress={() => setQuestion(question - 1)} />}<Action label={question === 2 ? 'Ver mis resultados' : 'Siguiente →'} disabled={attempt.answers[question] < 0 || question === 2 && attempt.answers.some(n => n < 0)} onPress={() => { if (question < 2) setQuestion(question + 1); else { save({ completed: true }); go('result'); } }} /></View>
        </> : mode === 'result' ? <>
          <View style={[s.card, { alignItems: 'center', backgroundColor: score === 3 ? '#E6EEDC' : '#F2EBDC' }]}>
            <Image accessible accessibilityLabel={score === 3 ? 'Nutty celebrando tus respuestas' : 'Nutty triste, listo para acompañarte a repasar'} source={score === 3 ? require('@/assets/images/nutty-celebrating.png') : require('@/assets/images/nutty-sad.png')} resizeMode="contain" style={{ width: '100%', maxWidth: 230, height: 210 }} />
            <Text style={[s.heading, { textAlign: 'center' }]}>{score === 3 ? '¡Lo lograste! Cada idea cuenta.' : score === 2 ? '¡Casi! Vamos por esa última idea.' : 'Un tropiezo también enseña. Sigamos juntos.'}</Text>
            <Text style={s.eyebrow}>{score} DE 3 RESPUESTAS CORRECTAS</Text>
            <Text style={[s.text, { textAlign: 'center' }]}>{score === 3 ? 'Si quieres saber más del tema o tienes alguna duda, puedes preguntarle a Nutty.' : 'Revisemos las respuestas que faltaron. Con otra explicación y un poco de práctica puedes seguir mejorando.'}</Text>
            <View style={{ width: '100%', marginTop: 4 }}><Action label="Hablar con Nutty" disabled onPress={() => {}} /></View>
            <Text style={s.muted}>Próximamente</Text>
          </View>
          <Text style={s.eyebrow}>HISTORIAL · {history.length} DE 3 QUIZZES</Text>
          {history.map((item, i) => <Choice key={item.number} label={`Quiz ${item.number} · ${item.score}/3 aciertos`} selected={(selectedHistory ?? history.length - 1) === i} onPress={() => setSelectedHistory(i)} />)}
          <Text style={s.eyebrow}>TUS RESPUESTAS</Text>
          {lesson.questions.map((q, i) => <View style={[s.card, resultAnswers[i] !== q.correct && s.warning]} key={q.id}><Text style={s.eyebrow}>{resultAnswers[i] === q.correct ? '✓ CORRECTA' : '↻ PARA REPASAR'}</Text><Text style={s.text}>{q.prompt}</Text><Text style={s.muted}>Tu respuesta: {q.options[resultAnswers[i]] ?? 'Sin responder'}</Text><Text style={s.text}>Respuesta correcta: {q.options[q.correct]}</Text><Text style={s.text}>{q.explanation}</Text>{resultAnswers[i] !== q.correct && <><Text style={s.muted}>{answerFeedback(q, resultAnswers[i])}</Text><Action label="Repasar esto con Nutty" onPress={() => { setQuestion(i); router.setParams({ view: 'nutty' }); go('nutty'); }} /></>}</View>)}
          {score < 3 && <Text style={s.text}>Toca a Nutty, la ardilla del centro de la barra inferior, para entender tus errores con más calma.</Text>}<Text style={s.heading}>{lesson.takeaway}</Text><Text style={s.text}>{lesson.challenge}</Text><Action label={history.length >= MAX_QUIZZES ? "Completaste los 3 intentos" : `Comenzar quiz ${history.length + 1} de 3`} disabled={history.length >= MAX_QUIZZES} onPress={() => { if (history.length >= MAX_QUIZZES) return; progress.startNextQuiz(lessonId); setSelectedHistory(null); setQuestion(0); router.setParams({ view: "quiz", question: "0" }); }} /><Action label="Volver a lecciones" onPress={() => router.replace('/learn' as never)} />
        </> : <>
          {mascot}<Text style={s.heading}>Vamos a entenderlo juntos</Text><Text style={s.text}>Elige una pregunta. Te mostraré la explicación y la parte de la lección que puedes repasar.</Text>
          {lesson.questions.map((q, i) => <Choice key={q.id} label={`${i + 1}. ${q.title}${resultAnswers[i] >= 0 && resultAnswers[i] !== q.correct ? ' · Por repasar' : ''}`} selected={question === i} onPress={() => setQuestion(i)} />)}
          <View style={[s.bubble, resultAnswers[question] >= 0 && resultAnswers[question] !== lesson.questions[question].correct && s.warning]}><Text style={s.text}>{lesson.questions[question].prompt}</Text><Text style={s.heading}>{lesson.questions[question].explanation}</Text>{resultAnswers[question] >= 0 && resultAnswers[question] !== lesson.questions[question].correct && <Text style={s.text}>{answerFeedback(lesson.questions[question], resultAnswers[question])}</Text>}</View><View style={[s.card, resultAnswers[question] >= 0 && resultAnswers[question] !== lesson.questions[question].correct && s.warning]}><Text style={s.eyebrow}>OTRO EJEMPLO CON NUTTY</Text><Text style={s.text}>{examples[index]}</Text><Text style={s.text}>¿Qué cambió en tu forma de entender esta pregunta? Puedes volver a intentarla cuando quieras.</Text></View><Action label="Volver a la explicación" onPress={() => { save({ step: 0 }); router.setParams({ view: '' }); go('read'); }} /><Action label="Volver al resumen" disabled={!attempt.completed} onPress={() => { router.setParams({ view: '' }); go('result'); }} />
        </>}
      </View>
    </ScrollView>
    <Navigation />
  </ScreenSurface>;
}

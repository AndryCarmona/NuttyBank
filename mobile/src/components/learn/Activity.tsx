import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Choice, styles } from './ui';

const scenarios: Record<number, { prompt: string; options: string[]; correct: number; feedback: string }[]> = {
  0: [
    { prompt: 'Recibir $500 por un trabajo', options: ['Ingreso', 'Gasto', 'Transferencia propia', 'Dinero prestado'], correct: 0, feedback: 'Recibiste dinero por tu trabajo.' },
    { prompt: 'Pagar $80 de transporte', options: ['Ingreso', 'Gasto', 'Transferencia propia', 'Dinero prestado'], correct: 1, feedback: 'Pagaste por un servicio.' },
    { prompt: 'Mover $150 entre tus cuentas', options: ['Ingreso', 'Gasto', 'Transferencia propia', 'Dinero prestado'], correct: 2, feedback: 'Sigue siendo tu dinero en otro lugar.' },
    { prompt: 'Recibir un préstamo de $300', options: ['Ingreso', 'Gasto', 'Transferencia propia', 'Dinero prestado'], correct: 3, feedback: 'También adquiriste una obligación de devolverlo.' },
  ],
  4: [
    { prompt: 'Reparación inesperada y urgente del equipo indispensable para trabajar', options: ['Emergencias', 'Gasto planeado'], correct: 0, feedback: 'Es una necesidad urgente e inesperada.' },
    { prompt: 'Renovación anual que sabías que debías pagar', options: ['Emergencias', 'Gasto planeado'], correct: 1, feedback: 'Puedes preparar un apartado con anticipación.' },
    { prompt: 'Vacaciones que estás organizando', options: ['Emergencias', 'Gasto planeado'], correct: 1, feedback: 'Pueden tener su propia meta.' },
  ],
  5: [
    { prompt: 'Corte: 10 de junio. Límite: 30 de junio. ¿Hasta cuándo debes pagar?', options: ['10 de junio', '30 de junio'], correct: 1, feedback: 'El corte cierra el periodo; el límite corresponde al pago.' },
    { prompt: 'Mínimo: $180. Pago para no generar intereses: $1,200. En compras ordinarias sin atrasos, ¿cuál corresponde a evitar intereses del periodo?', options: ['$180', '$1,200'], correct: 1, feedback: 'Son importes distintos. Revisa también las condiciones de tu tarjeta.' },
  ],
  7: [
    { prompt: '“Duplica tu dinero sin riesgo. Tienes cinco minutos para transferir.” ¿Qué pista detectas?', options: ['Ganancia extraordinaria y presión', 'Una garantía suficiente'], correct: 0, feedback: 'Pausa y verifica por canales independientes antes de transferir.' },
    { prompt: '“Mándame el código que te llegó para proteger tu cuenta.”', options: ['Compartirlo', 'No compartirlo; verificar por un canal oficial'], correct: 1, feedback: 'Un código puede permitir acceso u operaciones. No lo compartas.' },
  ],
};
export default function Activity({ index, onDone }: { index: number; onDone: () => void }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState(4);
  const [extra, setExtra] = useState(false);
  const rows = scenarios[index];
  const [i, setExercise] = useState(0);
  return <View style={{ gap: 16 }}>
    <Text style={styles.eyebrow}>TU TURNO {rows ? `· EJERCICIO ${i + 1} DE ${rows.length}` : ""}</Text><Text style={styles.heading}>Prueba con Nutty</Text>
    {rows ? rows.slice(i, i + 1).map(row => <View key={row.prompt} style={styles.card}><Text style={styles.text}>{row.prompt}</Text>{row.options.map((option, j) => <Choice key={option} label={option} selected={selected[i] === j} onPress={() => { setSelected({ ...selected, [i]: j }); setChecked(false); }} />)}{checked && <Text style={[styles.text, selected[i] !== row.correct && { backgroundColor: "#FFF0DD", color: "#813E0C", borderLeftWidth: 4, borderLeftColor: "#D97720", padding: 14, borderRadius: 12 }]}>{selected[i] === row.correct ? '✓ Bien identificado. ' : '↻ Repasemos: '}{row.feedback}</Text>}</View>) : <View style={styles.card}>
      {index === 1 && <><Text style={styles.text}>Recibiste $1,200. Reservaste $900 para necesidades. Distribuye lo restante entre ahorro y ocio.</Text><Choice label={extra ? 'Quitar imprevisto de $150' : 'Agregar imprevisto necesario de $150'} selected={extra} onPress={() => { setExtra(!extra); setValue(0); }} /><Text style={styles.heading}>Ahorro: ${value * 25}</Text><View style={styles.row}><Action label="− $25" onPress={() => setValue(Math.max(0, value - 1))} /><Action label="+ $25" onPress={() => setValue(Math.min(extra ? 6 : 12, value + 1))} /></View><Text style={styles.text}>Ocio: ${(extra ? 150 : 300) - value * 25}. El total sigue dentro de $1,200. Ajustar también es planear.</Text></>}
      {index === 2 && <><Text style={styles.text}>Tienes $200 para gustos. Cada compra cuesta $25. Elige cuántas quieres hacer.</Text><View style={styles.row}><Action label="−" onPress={() => setValue(Math.max(0, value - 1))} /><Action label="+" onPress={() => setValue(Math.min(8, value + 1))} /></View><Text style={styles.heading}>{value} compras · ${value * 25}</Text><Text style={styles.text}>Te quedan ${200 - value * 25}. Elegir cero u ocho puede ser válido: conoce el intercambio.</Text></>}
      {index === 3 && <><Text style={styles.text}>Meta: $1,200. Ya tienes $300. Faltan $900, sin rendimientos ni cambios de precio.</Text>{[6, 9].map(n => <Choice key={n} label={`${n} aportaciones: $${900 / n} cada una`} selected={value === n} onPress={() => setValue(n)} />)}<Text style={styles.text}>Más tiempo reduce la aportación necesaria. Elige un ritmo sostenible.</Text></>}
      {index === 6 && <><Text style={styles.text}>Simulación: $1,000 al 10% anual constante durante dos años, sin costos ni impuestos. No es una oferta ni una tasa esperada.</Text><Choice label="Retirar y conservar los rendimientos" selected={!extra} onPress={() => setExtra(false)} /><Choice label="Reinvertir los rendimientos" selected={extra} onPress={() => setExtra(true)} /><Text style={styles.heading}>{extra ? '$1,210 invertidos' : '$1,000 invertidos + $200 retirados'}</Text><Text style={styles.text}>{extra ? 'En el segundo año: $1,100 × 10% = $110. Esos $10 adicionales vienen de reinvertir.' : 'Cada año retiras $100. Conservándolos fuera sin invertir, sumas $1,200 en total.'}</Text></>}
    </View>}
    {rows && <Action label="Comprobar" disabled={selected[i] === undefined} onPress={() => setChecked(true)} />}
    {rows && i > 0 && <Action label="← Ejercicio anterior" onPress={() => { setExercise(i - 1); setChecked(false); }} />}
    <Action label={rows && i < rows.length - 1 ? "Siguiente ejercicio →" : "Ir al quiz →"} disabled={!!rows && !checked} onPress={() => { if (rows && i < rows.length - 1) { setExercise(i + 1); setChecked(false); } else onDone(); }} />
  </View>;
}

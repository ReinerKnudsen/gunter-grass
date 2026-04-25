import React from 'react';
import { useState, useEffect, useRef } from 'react';

const GARDEN_CONTEXT = `Du bist Reiner's persönlicher Gartenassistent. Du kennst seinen Garten in Bonn (Deutschland) sehr gut:

PFLANZEN:
- Oliver: Olivenbaum im Kübel, neu eingezogen dieses Frühjahr
- Olivia: Olivenbaum im Kübel, überwintert bereits dreimal in Bonn (robust und erprobt)
- Feige (unbenannt): Im Kübel seit 4 Jahren. Letztes Jahr erstmals viele Früchte, aber nicht ausgereift
- Adam: Junger Apfelbaum (unbekannte Sorte), letztes Jahr adoptiert aus Apfelbetrieb, lebt im Boden. War letztes Jahr unglücklich, blüht jetzt gerade!
- 2 ältere Flieder: Eher horizontal gewachsen, wirken nicht ganz gesund, haben wahrscheinlich Totholz. Der hintere blüht noch nicht, der vordere jüngere blüht schon.
- Rasen (~90m²): Dieses Jahr erstmals seit 3 Jahren vertikutiert — massig Moos rausgekommen. Dann gedüngt. Heute gemäht, sieht gesund aus. Hat noch Klee und Löwenzahn. Einzelne kahle schattige Stellen, Nachsaat mit altem Samen war leider nicht erfolgreich.
- Martha: Magnolie, im Boden in der Mitte des Rasens, ~7-8 Jahre alt. Geschichte: Wurde der Vermieterin zum Trotz gepflanzt als diese auszog (sie hatte Magnolien verboten wegen "Dreck"). Martha blüht wunderschön (hat gerade geblüht, jetzt vorbei) und hat viele gesunde Blätter — wächst aber kaum. Fast genauso groß wie beim Einpflanzen. Wahrscheinlich Nährstoffkonkurrenz mit dem Rasen.
- ein Rosa Blumen-Hartriegel, der schon älter ist (mindestens 15 Jahre), jedes Jahr herrlich blüht, aber im Moment keine besondere Pflege bekommt
- Kompost: Kleiner eigener Kompost vorhanden.

STANDORT & BEDINGUNGEN:
- Bonn, Deutschland
- Haus mit Nord/Süd-Ausrichtung: Hintergarten im Osten, Vordergarten im Westen → keine vollsonnigen Plätze
- Großer Baum spendet viel Schatten. Dort wo früher Kirschlorbeer stand wächst kaum was
- 1000 Liter Wassertonne ohne Pumpe → sparsam mit Wasser umgehen
- Kein grüner Daumen, aber motiviert!

DEIN STIL:
- Persönlich und freundlich — du kennst die Pflanzen beim Namen (Oliver, Olivia, Adam)
- Konkret und praktisch — kein Fachwissen-Overload
- Du berücksichtigst die aktuelle Jahreszeit und das Wetter in Bonn wenn verfügbar
- Du gibst klare Handlungsempfehlungen
- Antworte immer auf Deutsch

DEIN GEDÄCHTNIS:
Wenn Reiner dir etwas Neues mitteilt — eine Beobachtung, eine Aktion, eine neue Pflanze, ein Ereignis — 
dann nutze das Werkzeug "save_to_memory" um es zu speichern.
Speichern wenn: neue Pflanzen, Aktionen ("ich habe gedüngt"), Beobachtungen ("die Feige hat Früchte"), Entscheidungen.
Nicht speichern wenn: allgemeine Fragen, Smalltalk, Dinge die schon bekannt sind.`;

// NEU: Definition des Werkzeugs das Gunter benutzen kann.
// Das ist wie ein Vertrag: Gunter weiß was das Tool heißt, was es tut,
// und welche Parameter es erwartet.
const TOOLS = [
  {
    name: 'save_to_memory',
    description:
      'Speichert eine wichtige neue Information über Reiners Garten dauerhaft. Nur aufrufen wenn Reiner etwas wirklich Neues mitteilt.',
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Kurzer Schlüssel z.B. "adam_gedüngt" oder "neue_pflanze"',
        },
        value: {
          type: 'string',
          description: 'Die Information die gespeichert werden soll',
        },
      },
      required: ['key', 'value'],
    },
  },
];

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Frühling';
  if (month >= 6 && month <= 8) return 'Sommer';
  if (month >= 9 && month <= 11) return 'Herbst';
  return 'Winter';
};

const getMonthContext = () => {
  const now = new Date();
  const months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  return `Aktuelles Datum: ${now.getDate()}. ${months[now.getMonth()]} ${now.getFullYear()}, Jahreszeit: ${getCurrentSeason()}`;
};

const QUICK_QUESTIONS = [
  {
    emoji: '🌿',
    label: 'Was heute tun?',
    question: 'Was sollte ich heute oder diese Woche in meinem Garten tun?',
  },
  {
    emoji: '💧',
    label: 'Gießen?',
    question: 'Wann und wie viel sollte ich meine Kübelpflanzen diese Woche gießen?',
  },
  {
    emoji: '✂️',
    label: 'Beschneiden?',
    question: 'Welche meiner Pflanzen brauchen jetzt einen Schnitt?',
  },
  {
    emoji: '🍂',
    label: 'Flieder',
    question:
      'Was soll ich mit meinen älteren Fliedern machen? Die sehen nicht ganz gesund aus und haben wahrscheinlich Totholz.',
  },
  {
    emoji: '🍎',
    label: 'Adam',
    question: 'Adam blüht gerade — was muss ich jetzt für ihn tun damit er glücklich wird?',
  },
  {
    emoji: '🌱',
    label: 'Rasen',
    question: 'Was sind die nächsten Schritte für meinen Rasen? Klee, Löwenzahn, kahle Stellen...',
  },
  {
    emoji: '🌸',
    label: 'Martha',
    question:
      'Martha (meine Magnolie) steht seit 7 Jahren im Rasen und wächst kaum. Sie hat gerade geblüht und sieht gesund aus — warum wächst sie nicht und was kann ich tun?',
  },
];

export default function GardenAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hallo Reiner! 🌱 Schön, dass du da bist.\n\nIch kenne deinen Garten gut — Oliver und Olivia in ihren Kübeln, Adam der gerade blüht, die Feige die dieses Jahr hoffentlich reife Früchte trägt, und die beiden Flieder die etwas Aufmerksamkeit brauchen.\n\nWie kann ich dir heute helfen?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [memory, setMemory] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchMemory();
  }, []);
  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemory(data);
    } catch (e) {
      console.error('Memory fetch failed', e);
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=50.7374&longitude=7.0982&current=temperature_2m,precipitation,weathercode,windspeed_10m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Europe/Berlin&forecast_days=3',
      );
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error('Weather fetch failed', e);
    }
  };

  const getWeatherDescription = code => {
    if (code === 0) return 'Sonnig ☀️';
    if (code <= 3) return 'Teilweise bewölkt 🌤️';
    if (code <= 48) return 'Bewölkt ☁️';
    if (code <= 67) return 'Regen 🌧️';
    if (code <= 77) return 'Schnee ❄️';
    if (code <= 82) return 'Regenschauer 🌦️';
    return 'Gewitter ⛈️';
  };

  const buildWeatherContext = () => {
    if (!weather) return '';
    const c = weather.current;
    const d = weather.daily;
    return `\n\nAKTUELLES WETTER BONN:\n- Jetzt: ${c.temperature_2m}°C, ${getWeatherDescription(c.weathercode)}, Wind: ${c.windspeed_10m} km/h, Niederschlag: ${c.precipitation}mm\n- Heute: ${d.temperature_2m_min[0]}–${d.temperature_2m_max[0]}°C, Regen: ${d.precipitation_sum[0]}mm\n- Morgen: ${d.temperature_2m_min[1]}–${d.temperature_2m_max[1]}°C, Regen: ${d.precipitation_sum[1]}mm\n- Übermorgen: ${d.temperature_2m_min[2]}–${d.temperature_2m_max[2]}°C, Regen: ${d.precipitation_sum[2]}mm`;
  };

  const buildMemoryContext = () => {
    if (Object.keys(memory).length === 0) return '';
    return '\n\nWAS GUNTER GELERNT HAT:\n' + JSON.stringify(memory, null, 2);
  };

  const sendMessage = async text => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt =
        GARDEN_CONTEXT + '\n\n' + getMonthContext() + buildWeatherContext() + buildMemoryContext();

      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      // ERSTER API-CALL — wie bisher, aber jetzt mit tools
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          tools: TOOLS, // NEU: Gunter bekommt sein Werkzeug angeboten
          messages: apiMessages,
        }),
      });

      const data = await response.json();

      // NEU: Prüfen ob Gunter ein Tool benutzen will
      // stop_reason "tool_use" bedeutet: Gunter hat entschieden etwas zu speichern
      if (data.stop_reason === 'tool_use') {
        // Den tool_use Block aus der Antwort finden
        const toolUseBlock = data.content.find(block => block.type === 'tool_use');

        // Memory im Backend speichern
        await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { [toolUseBlock.input.key]: toolUseBlock.input.value },
          }),
        });

        // Lokales Memory aktualisieren damit buildMemoryContext() aktuell bleibt
        setMemory(prev => ({ ...prev, [toolUseBlock.input.key]: toolUseBlock.input.value }));

        // ZWEITER API-CALL — Gunter soll jetzt dem Nutzer antworten.
        // Wir schicken den kompletten bisherigen Verlauf + Gunters tool_use + das Ergebnis
        const followUpResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: systemPrompt,
            tools: TOOLS,
            messages: [
              ...apiMessages,
              // Gunters erster Zug: er wollte das Tool benutzen
              { role: 'assistant', content: data.content },
              // Unser Zug: wir bestätigen dass das Tool funktioniert hat
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: 'Gespeichert.',
                  },
                ],
              },
            ],
          }),
        });

        const followUpData = await followUpResponse.json();
        const assistantText = followUpData.content?.[0]?.text || 'Erledigt!';
        setMessages([...newMessages, { role: 'assistant', content: assistantText }]);
      } else {
        // Normaler Fall — kein Tool, nur Text
        const assistantText =
          data.content?.[0]?.text || 'Entschuldigung, da ist etwas schiefgelaufen.';
        setMessages([...newMessages, { role: 'assistant', content: assistantText }]);
      }
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Verbindungsfehler — bitte versuche es nochmal.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 40%, #1e3a2e 100%)',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>
      {/* Header */}
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(144,188,100,0.3)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>🌿</div>
          <div>
            <div
              style={{
                color: '#b8d96e',
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}>
              Gunter Grass - Der Garten Guru
            </div>
            <div style={{ color: 'rgba(184,217,110,0.6)', fontSize: '12px' }}>
              Bonn · {getCurrentSeason()} ·{' '}
              {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {weather && (
          <div
            style={{
              background: 'rgba(144,188,100,0.15)',
              border: '1px solid rgba(144,188,100,0.3)',
              borderRadius: '12px',
              padding: '8px 14px',
              textAlign: 'right',
            }}>
            <div style={{ color: '#b8d96e', fontSize: '18px', fontWeight: 'bold' }}>
              {weather.current.temperature_2m}°C
            </div>
            <div style={{ color: 'rgba(184,217,110,0.7)', fontSize: '11px' }}>
              {getWeatherDescription(weather.current.weathercode)}
            </div>
            <div style={{ color: 'rgba(184,217,110,0.5)', fontSize: '10px' }}>
              🌧️ {weather.daily.precipitation_sum[0]}mm heute
            </div>
          </div>
        )}
      </div>

      {/* Plant badges */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          overflowX: 'auto',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(144,188,100,0.15)',
        }}>
        {[
          { emoji: '🫒', name: 'Oliver' },
          { emoji: '🫒', name: 'Olivia' },
          { emoji: '🌳', name: 'Adam' },
          { emoji: '🍃', name: 'Feige' },
          { emoji: '🌸', name: 'Martha' },
          { emoji: '💜', name: 'Flieder' },
          { emoji: '🌿', name: 'Rasen' },
        ].map(p => (
          <div
            key={p.name}
            onClick={() => sendMessage(`Wie geht es ${p.name}? Was braucht ${p.name} gerade?`)}
            style={{
              background: 'rgba(144,188,100,0.1)',
              border: '1px solid rgba(144,188,100,0.25)',
              borderRadius: '20px',
              padding: '4px 12px',
              color: '#b8d96e',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.target.style.background = 'rgba(144,188,100,0.2)')}
            onMouseLeave={e => (e.target.style.background = 'rgba(144,188,100,0.1)')}>
            {p.emoji} {p.name}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: 'calc(100vh - 320px)',
        }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
            {msg.role === 'assistant' && (
              <div style={{ fontSize: '20px', marginRight: '8px', alignSelf: 'flex-end' }}>🌿</div>
            )}
            <div
              style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? 'rgba(144,188,100,0.25)' : 'rgba(0,0,0,0.35)',
                border:
                  msg.role === 'user'
                    ? '1px solid rgba(144,188,100,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                color: msg.role === 'user' ? '#e8f5c8' : '#d4e8a0',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                backdropFilter: 'blur(5px)',
              }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '20px' }}>🌿</div>
            <div
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
                color: 'rgba(212,232,160,0.6)',
                fontSize: '14px',
              }}>
              <span style={{ animation: 'pulse 1s infinite' }}>Denke nach</span>
              <span style={{ marginLeft: '4px' }}>🌱🌱🌱</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div
        style={{
          padding: '8px 24px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderTop: '1px solid rgba(144,188,100,0.15)',
        }}>
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => sendMessage(q.question)}
            disabled={loading}
            style={{
              background: 'rgba(144,188,100,0.1)',
              border: '1px solid rgba(144,188,100,0.3)',
              borderRadius: '16px',
              padding: '6px 12px',
              color: '#b8d96e',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s',
            }}>
            {q.emoji} {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 24px 20px',
          display: 'flex',
          gap: '10px',
          background: 'rgba(0,0,0,0.3)',
        }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder='Frag mich über deinen Garten...'
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(144,188,100,0.4)',
            borderRadius: '24px',
            padding: '12px 18px',
            color: '#e8f5c8',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'Georgia, serif',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background:
              loading || !input.trim() ? 'rgba(144,188,100,0.2)' : 'rgba(144,188,100,0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
          🌱
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(144,188,100,0.3); border-radius: 2px; }
        input::placeholder { color: rgba(184,217,110,0.4); }
      `}</style>
    </div>
  );
}

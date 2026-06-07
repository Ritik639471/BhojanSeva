import { useState, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Sample recurring events - in production these come from sevas with start_time set
const FESTIVAL_EVENTS = [
  { name: 'Gurupurab Langar', date: new Date(2026, 5, 15), type: 'Langar', color: '#8B5CF6' },
  { name: 'Navratri Bhandara', date: new Date(2026, 5, 20), type: 'Bhandara', color: '#FF9933' },
  { name: 'Eid Iftar Camp', date: new Date(2026, 5, 22), type: 'Iftar', color: '#10B981' },
  { name: 'Sunday Prasad Vitran', date: new Date(2026, 5, 7), type: 'Prasad', color: '#F59E0B' },
  { name: 'Sunday Prasad Vitran', date: new Date(2026, 5, 14), type: 'Prasad', color: '#F59E0B' },
  { name: 'Sunday Prasad Vitran', date: new Date(2026, 5, 21), type: 'Prasad', color: '#F59E0B' },
  { name: 'Sunday Prasad Vitran', date: new Date(2026, 5, 28), type: 'Prasad', color: '#F59E0B' },
  { name: 'Chabeel Water Seva', date: new Date(2026, 5, 10), type: 'Other', color: '#06B6D4' },
  { name: 'Chabeel Water Seva', date: new Date(2026, 5, 17), type: 'Other', color: '#06B6D4' },
];

export default function EventCalendar({ sevas = [] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Merge sevas with scheduled start_time + hardcoded festival events
  const getEventsForDay = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const festival = FESTIVAL_EVENTS.filter(e =>
      e.date.getDate() === day && e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear
    );
    const sevaEvents = sevas.filter(s => {
      if (!s.startTime) return false;
      const sd = new Date(s.startTime);
      return sd.getDate() === day && sd.getMonth() === currentMonth && sd.getFullYear() === currentYear;
    }).map(s => ({ name: s.title, type: s.type, color: 'var(--color-primary)' }));
    return [...festival, ...sevaEvents];
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>📅 Seva Calendar</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Upcoming Bhandaras, Langars, and festival food events.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Calendar grid */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {/* Month header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', color: 'white' }}>
            <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{MONTHS[currentMonth]} {currentYear}</h2>
            <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0.75rem 1rem 0.25rem' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.5rem 0' }}>{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 1rem 1.5rem', gap: '0.25rem' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const events = getEventsForDay(day);
              const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
              const isSelected = day === selectedDate;
              return (
                <div key={day} onClick={() => setSelectedDate(day)}
                  style={{
                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', cursor: 'pointer', fontSize: '0.875rem', fontWeight: isToday ? 800 : 500,
                    background: isSelected ? 'var(--color-primary)' : isToday ? 'rgba(255,153,51,0.12)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--color-text-primary)',
                    position: 'relative', transition: 'all 0.15s', gap: '0.15rem'
                  }}
                >
                  {day}
                  {events.length > 0 && (
                    <div style={{ display: 'flex', gap: '1px', justifyContent: 'center' }}>
                      {events.slice(0, 3).map((e, ei) => (
                        <div key={ei} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'white' : e.color }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events panel */}
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            {selectedDate ? `Events on ${MONTHS[currentMonth]} ${selectedDate}` : 'Select a date'}
          </h3>
          {selectedDate && selectedEvents.length === 0 && (
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😌</div>
              No events scheduled on this day.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selectedEvents.map((event, i) => (
              <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${event.color}` }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{event.name}</div>
                <div style={{ fontSize: '0.8rem', background: `${event.color}15`, color: event.color, display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '2rem', fontWeight: 600 }}>{event.type}</div>
              </div>
            ))}
          </div>

          {/* Upcoming events */}
          <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem' }}>Upcoming This Month</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FESTIVAL_EVENTS.filter(e => e.date.getMonth() === currentMonth && e.date.getFullYear() === currentYear).sort((a, b) => a.date - b.date).slice(0, 5).map((e, i) => (
              <div key={i} onClick={() => setSelectedDate(e.date.getDate())} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-xs)', cursor: 'pointer', display: 'flex', gap: '0.875rem', alignItems: 'center', transition: 'box-shadow 0.2s' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: `${e.color}15`, color: e.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                  {e.date.getDate()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{MONTHS[e.date.getMonth()]} {e.date.getDate()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

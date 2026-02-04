import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarPage() {
  const handleDateClick = (info: { dateStr: string }) => {
    console.log('Date clicked:', info.dateStr);
  };

  const handleEventClick = (info: { event: { title: string } }) => {
    console.log('Event clicked:', info.event.title);
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1>Calendrier</h1>
      </header>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="fr"
          firstDay={1}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={[]}
          height="auto"
        />
      </div>
    </div>
  );
}

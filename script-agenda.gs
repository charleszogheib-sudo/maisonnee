/**
 * La Maisonnée : passerelle Google Agenda.
 * Ce script lit les agendas visibles par votre compte Google et les envoie à l'appli de la tablette.
 * 1. Remplacez CHANGEZ-MOI ci-dessous par un mot de passe de votre choix (lettres et chiffres).
 * 2. Déployer → Nouveau déploiement → Application Web → Exécuter en tant que : Moi ; Accès : Tout le monde.
 */
const CLE = 'CHANGEZ-MOI';

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (CLE === 'CHANGEZ-MOI' || p.key !== CLE) return sortie({ erreur: 'cle' });
  const ids = String(p.ids || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  const debut = p.from ? new Date(p.from) : new Date();
  const jours = Math.min(Math.max(Number(p.days) || 14, 1), 62);
  const fin = new Date(debut.getTime() + jours * 86400000);
  const tz = Session.getScriptTimeZone();
  const resultat = {};
  ids.forEach(function (id) {
    try {
      const cal = CalendarApp.getCalendarById(id);
      if (!cal) { resultat[id] = { erreur: 'introuvable' }; return; }
      resultat[id] = {
        nom: cal.getName(),
        events: cal.getEvents(debut, fin).map(function (ev) {
          const allDay = ev.isAllDayEvent();
          return {
            title: ev.getTitle() || '(sans titre)',
            start: allDay ? Utilities.formatDate(ev.getAllDayStartDate(), tz, 'yyyy-MM-dd') : ev.getStartTime().toISOString(),
            end: allDay ? Utilities.formatDate(ev.getAllDayEndDate(), tz, 'yyyy-MM-dd') : ev.getEndTime().toISOString(),
            allDay: allDay,
            location: ev.getLocation() || ''
          };
        })
      };
    } catch (err) {
      resultat[id] = { erreur: String(err) };
    }
  });
  return sortie({ agendas: resultat, maj: new Date().toISOString() });
}

function sortie(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

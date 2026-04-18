# IMPLEMENTATION_PLAN.md

## Kontekst
Målet med dette prosjektet er å etablere en moderne prosjektstruktur for en .NET 10 og Angular 18+ applikasjon, med fokus på langsiktig utvikling og vedlikehold. Dette inkluderer opprettelsen av en backend med en Web API og en frontend med komponenter i Angular.

## Berørte filer
- `/backend` (en ny mappe som skal inneholde .NET 10 API)
  - `HealthCheckController.cs` (en ny kontroller for helse-sjekk)
- `/frontend` (en ny mappe som skal inneholde Angular-applikasjonen)

## Implementeringssteg
1. **Opprett mappestruktur:**
   - Lag en `/backend` og `/frontend` mappe i arbeidsområdet.

2. **Konfigurer .NET 10 Web API:**
   - I `/backend` mappen, opprett en ny .NET 10 Web API-prosjekt.
   - Implementer `HealthCheckController` ved å bruke Primary Constructors. Det skal ikke være spesifikke funksjoner i kontrolløren i denne fasen, kun en HTTP GET-endepunkt.

3. **Konfigurer Angular applikasjon:**
   - I `/frontend` mappen, opprett en ny Angular 18+ applikasjon.
   - Implementer en Komponent i Angular som er 'Standalone' og benytter Signals for intern tilstandshåndtering.

4. **Kompiler prosjektene:**
   - Sørg for at både backend og frontend prosjektene kompilerer uten feil.

5. **Opprett ny branch:**
   - Opprett en ny Git-branch med navnet `feature/INIT-001-greenfield` fra main-branchen.

6. **Push endringer:**
   - Push endringene til den nye branchen `feature/INIT-001-greenfield` i origin-repositoriet.

## Test-krav
- Utfør kompilering av Backend (.NET 10).
- Utfør kompilering av Frontend (Angular 18+).
- Valider at helse-sjekk API-endepunkt fungerer som forventet via en HTTP GET-forespørsel.
- Valider at Angular applikasjonen lastes uten feil.

---

Dette dokumentet vil tjene som en plan for implementeringen av de nødvendige trinnene for å opprette en moderne .NET 10 / Angular 18+ prosjektstruktur.
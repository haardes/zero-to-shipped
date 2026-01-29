This document contains the schedule of my presentation, the steps I will be demoing and notes to myself. Document will mostly be in Norwegian.

# Presentation notes
Når jeg fant ut at jeg skulle få stå på mainstage denne fagdagen ble jeg litt nervøs, men så tenkte jeg at det er jo ikke så lenge siden jeg talte foran 70 stykk i bryllupet mitt, så da kunne jeg jo bare beroligede meg med det. Helt til jeg kom på hvorfor jeg syntes det gikk fint, jeg tenkte med meg selv at alle tilstede var der fordi de ville meg og kona godt, det er jeg ikke sikker på om denne forsamlingen vil. Anyway.
Jeg er også veldig spent på hvor mange ganger jeg sier promp i stedenfor prompt i denne presentasjonen. 

## Introduksjon
1. Hvorfor har jeg denne presentasjonen?
    Ønsket om å holde denne presentasjonen kom underveis i Build Stuff konferansen som Jostein og Kolbein har presentert. Den "kuleste" talken der var for meg en demo av nettopp Kiro, som jeg også skal holde en egen versjon av for dere.
2. Hvorfor nå?
    Nå vet ikke jeg hvor mye AI dere alle bruker i hverdagen, til jobb og hobby, men personlig har jeg ikke vært så stor fan av AI, ei heller sett den store nytten slik at jeg har hørt andre prate om. Det vil si, helt siden jeg fikk Beta-tilgang til GitHub Copilot under Covid i 2021 har jeg benyttet meg av auto-complete av linjer, og etterhvert som Copilot ble bedre har jeg brukt det til enkle oppgaver som generering av boilerplate, repetetive arbeidsoppgaver og i fjor høst begynte jeg å bruke det til refaktorering og deduplisering av kode. 
    Men jeg var aldri helt fornøyd med resultatene når jeg ba om nye features, ofte var løsningene fulle av bugs, manglet store deler av featuren, og generelt førte til mer tid på utvikling enn jeg ville gjort om jeg bare skrev koden selv fra bunn av.
    Men det var helt til Build Stuff talken, der jeg ble introdusert til en "ny" (i alle fall for meg) måte å jobbe med AI-agenter på, noe Kiro i stor grad legger tilrette for.

    Spørsmålsrunde til publikum:
    Hvor mange bruker AI hver dag, i jobb?
    Og hva med til hobbyprosjekter?
    Hvor mange har laget egne agenter/skills/hooks?
3. Hva er Kiro?
    Kiro's eget svar: "Kiro is an agentic AI with an IDE and CLI that helps you go from prototype to production with spec-driven development. From simple to complex tasks, Kiro works alongside you to turn prompts into detailed specs, then into working code, docs, and tests—so what you build is exactly what you want and ready to share with your team."

    Utviklet av en gruppe utviklere i AWS.
4. Vise frem Kiro IDE
    - IDE'en (Som dere ser er dette veldig likt som VSCode)
    - Kiro tab (I denne taben finner man alt som gjør Kiro til Kiro og ikke bare enda en VSCode fork)
    - Specs (Dette skal vi se mer på senere når vi begynner å lage en spec for prosjektet, men her finner man alle specs som hører til prosjektet)
    - Agent hooks (Agent Hooks er nøyaktig det det høres ut som, man kan lage "oppgaver", eller scripts om du vil, som Kiro vil kjøre før, under eller etter andre oppgaver)
    - Agent Steering (Agent steering er tilsvarende CLAUDE.md og copilot-instructions.md, her kan man definere hvordan Agenten skal oppføre seg, sette begrensninger på f.eks kommandoer og bestemme strukturen på svarene man får. Verdt å merke seg at dette på ingen måte er en sikkerhet i seg selv, agenten kan gjøre som den vil uansett hva man har skrevet her eller ikke. F.eks. har jeg i et av prosjektene mine en linje som sier at agenten ALDRI skal bruke "supabase db reset", men det hender den foreslår det allikevel)
    - MCP Servers (Her kan koble til eksterne verktøy og data kilder som implementer Model Context Protocolen, vi skal se litt nærmere på dette senere)

## Oppsett
Før vi begynner å bruke Kiro til å skrive kode må vi sette opp agenten vår slik at den er best mulig rustet til å håndtere oppgavene slik jeg ønsker. 

1. Create agent steering
    Jeg har en ferdig skrevet steering-fil her som jeg bare paster inn, hvor jeg skriver litt om hvilket språk agenten skal bruke, hvilke rammeverk jeg ønsker at den skal benytte seg av, og eventuelle andre ønsker jeg har, for eksempel at den ikke skal bruke "any"-typer, hvilken casing som er aktuell når osv.
2. Create agent hook
    Som et ledd i å gjøre agenten raskere og bruke mindre context der det er relevant, så ønsker jeg at alle TypeScript filer skal være dokumentert i toppen av filen. Dette gjør at agenten stort sett bare trenger å lese de første 10-20 linjene av en fil for å bestemme om den er relevant i konteksten eller ikke. Personlig har jeg merket at dette gjør oppgaver som krever mye lesing på tvers av filer mye raskere og i kontekst av Claude Code holder det context-usage betrakelig nede.
    Her også har jeg en fil med prompten jeg vil at agenten skal bruke når filer lagres.
3. Environment variables
    Jeg legger også inn environment variables som jeg vet at jeg trenger underveis.

## Planlegging

### Database
Som med alle andre AI-verktøy i dag håndterer Kiro bilder og kan lage kode fra for eksempel en ERD.
1. Define database schema and relationship in SQL
    Her gir jeg bilde og en enkel prompt med detaljer på enums og får tilbake en SQL fil som beskriver data modellen vår
2. Generate supabase migration scripts
    Siden vi bruker supabase som backenden vår trenger vi å lage et migreringsscript for data modellen vi nettop har laget. Dette håndterer agenten helt fint og vil (forhåpentligvis) aktivere RLS på alle tabellene og legge til fornuftige policies. Jeg trenger vel egentlig ikke si det, men jeg sier det allikevel, selv om AI er et kraftig verktøy som stort sett klarer det man ber den om, så er det veldig viktig å dobbeltsjekke resultatene som omhandler sikkerhet, det er flere ganger jeg har brukt dette på hobby-prosjekter hvor resultatet har vært en RLS som tillater alt for alle.
3. Push migration to supabase
    Så ber vi bare agenten om å pushe migreringen til supabase og voila, tabellene er på plass

### Prosjektbeskrivelse
1. Project description, improve prompt and EARS
    Så er vi kommet til prosjektbeskrivelsen vår, som for øyeblikket er ganske enkel og bare tar for seg de store linjene jeg ønsker for web-appen. Et tips jeg stort sett benytter meg av selv er å ta i bruk meta-prompting, altså bruke AI til å forbedre beskrivelsen og konvertere den til et format som er litt enklere for AI å forstå seg på.
    EARS er et format som ble utviklet hos Rolls Royce for rundt 20 år siden, og som gir requirements som vi snart skal se. Fordelen med EARS er at det ser ut til at AI håndterer kontekst i dette formatet veldig godt, men det går selvfølgelig an å benytte seg av andre formater. Det viktigste mener jeg er å bruke AI til å lage bedre prompts.
2. Improve project prompt with agent

### Prosjekt spec
1. Kiro Spec mode
    Kiro har en egen chat-mode som heter Spec, og først nå kommer vi til det jeg mener er unikt med Kiro, ikke fordi det ikke går an med andre IDE-er eller modeller, men fordi måten man kommer frem til resultatet er bygget rett inn i Kiro.
2. Paste prompt and begin speccing
    Samtidig som Kiro jobber med å lage requirements for prosjektet kan jeg prate litt om hva vi ender opp med:
3. Requirements
    Først vil Kiro analysere beskrivelsen av prosjektet og lage en hel haug med Requirements som den vil bruke som veiledning gjennom resten av prosessen. Dette strukturer den som overordnede requirements, lager en User Story til den, og deretter en rekke med akseptansekriterier. Vi ser straks hvordan Kiro bruker dette når vi kommer til oppgavene den lager.
4. Design
    I tillegg til Requirements får vi en Design-fil som i større grad fokuserer på de store linjene i produktet, slik som teknologier, arkitektur og komponenter. Her finner vi også det som blir kalt "Correctness properties":
    *A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
    Som i bunn og grunn er en kobling mellom requirementene våre og hva AI-en kan teste.
5. Tasks
    Til slutt er vi kommet til de konkrete oppgavene Kiro setter opp. Her strukturerer den oppgavene slik at senere oppgaver bygger på de forrige, og som vi ser her ser vi tanken bak hvordan den har organsiert rekkefølgen på oppgavene. Her kommer også disse Requirementene inn i bildet, og vi kan se hvilket punkt eller punkter hver enkelt oppgave løser. Jeg trykket på "Keep optional tasks" for en raskere MVP, og de oppgavene som er grået ut her er stort sett oppgaver som omhandler testing. I test-oppgavene benytter Kiro seg av Design-dokumentet og "Correctness Property"-ene for å beskrive hva som skal testes.

## Implementasjon
1. Start executing tasks
    Og når vi er ferdig å lage Requirements, Design og Tasks kan vi sette i gang med implementering av oppgavene. Her kan man enten trykke på run all og forlate PCen en stund, eller man kan starte hver enkelt oppgave for seg selv og gå gjennom resultatene etterhvert som man jobber seg gjennom. Dersom man finner ut underveis at noe mangler eller man vil fjerne noe, så kan man alltids gå tilbake til Spec-moden og justere hele Speccen.
2. Complete implementation
    Jeg hopper over hele implementasjonen fordi det tar litt tid og det er vel ingen som har lyst til å sitte å se på at AI-en jobber, men nøyaktig 48 minutter og 7 sekunder senere er vi kommet hit.

## Deployment
1. Supabase migration
    Dette gjorde vi tidligere
2. Custom agents
    Det er også mulig å lage egne agenter i Kiro-miljøet, men det krever kiro-cli.
    Siden vi nå skal deploye prosjektet vårt ønsker jeg å lage en DevOps-agent som liksom skal være ekspert på Typescript, Terraform, Azure og Bash. Og her kommer vi til kanskje det flaueste øyeblikket så langt i Sonat-karrieren min, men jeg vet faktisk ikke hvordan jeg bruker nano eller vim eller hva søren dette her er, så jeg bare quitter og paster koden for DevOps-agenten inn i filen i vscode.

    Commands:
    /agent create --name devops
    /agent swap devops
3. Prompt deployment
    Så er det bare å be DevOps agenten om å deploye for oss, og etter noen minutter har vi infrastruktur på plass og en app i skyen.

    Prompt:
    Using terraform, deploy appropriate services to host the web app in azure servers
    (If this does not work, in Vibe-mode: "You are a Senior DevOps Engineer and Solutions Developer with expertise in Terraform, TypeScript, Bash scripting, and Azure Cloud Services. Using terraform, deploy appropriate services to host the web app in azure servers")
4. Deploy to Sonat Playgrond (If the above step didn't work)

Kaffepause

# Personal experience
Alt som følger av tips og triks må tas med en klype salt, jeg sitter på ingen måte på noen fasit men tenkte å dele litt erfaringer jeg har gjort meg den siste tiden som har hjulpet meg å i større grad ta i bruk AI til store deler av arbeidsoppgavene mine. Også verdt å merke seg at jeg stort sett bruker GitHub Copilot i VSCode til å skrive kode, bruker ChatGPT til å hjelpe med prompts og eventuell planlegging samtidig som Copilot jobber, og innimellom Claude. Men erfaringene er altså fra å jobbe med Copilot, så for de som bruker andre verktøy kan mulighetene variere noe.

1. Custom agents
    Det første tipset jeg har er å begynne på sin egen samling med agenter. Det er fort gjort å bli fristet til å lage store monolittiske agenter som kan håndtere alle problemer, men man oppnår stort sett bedre resultater om man har helt spesifikke agenter som er spesialisert på å løse konkrete problemer. For eksempel i et full-stack prosjekt kan det være lurt å ha én agent spesialisert på backenden sin, kall det en API-agent, en som man bruker til databasen, enda en til frontend og enda flere til andre konkrete områder i prosjektet som design, commit/pr, review osv. Dette gjør at agent-filene, eller promptene om du vil, holder seg små og gjør det mer sannsynlig at agenten faktisk holder seg til oppgavene og retningslinjene vi har satt. Har man monolitter med 300 linjer med retningslinjer hvor bare noen av de er aktuelle for det problemet man løser i øyeblikket, så kan jeg love at den "glemmer" mye av det i hvert eneste svar.
    Jeg går gjennom resten av siden her før jeg kommer tilbake til noen flere tips for agentene.
2. Skills
    Skills er en avgrenset evne eller funksjon som agentene kan bruke, det kan for eksempel være en skill som er sikkerhets-analyse, dokumentering av kode eller en bash-skill. Måten man setter opp og lager prompts til skills på ligner veldig på promptene til agenter, men man kan tenke seg at en agent er en persona med de personlighetstrekkene og retningslinjene man har gitt den, og skills er verktøyene den kan bruke underveis. Som et eksempel har jeg i samlingen min med agenter en "AngryReviewer", som benytter seg av to skills, sikkerhetsanalyse og dokumentasjonsgjennomgang. 
    Vis frem agenten og skills.
3. Agents and skill collections
    Det finnes en hel haug med samlinger av agenter og skills på nettet, så et godt utgangspunkt kan være å finne noen agenter og skills man ser behov for i prosjektet sitt, også tilpasse de til prosjektet. Slik får man erfaring med forskjellige agenter og lærer seg hva de gir gode resultater på og hva som ikke hjelper, evt. hva de får med seg fra prompten og ikke. Slik fortsetter man å iterativt endre på agenter, legge til flere og man lærer seg når og hvilke agenter og skills man bør benytte for forskjellige problemer.
4. Hooks
    Hooks er vel ganske selvforklarende, man kan lage hooks som benytter seg av AIen til å gjøre noe basert på handlingen. Vi lagde en on-save-hook som dokumenterte filene våre i Kiro.
5. Plan
    Man må ikke bruke Kiro for å få oppgavelister, eller planer, fra AI-en, det er fullt mulig å gjøre med alle AI-agenter og jeg anbefaler alle å gjøre det. Det er lettere for agenten å forholde seg til konkrete steg i en liste over hva som skal gjøres, og det fjerner en del frustrasjon når løsningene ikke stemmer med det en ønsker, da kan man fange opp det før man får koden. Mange IDE-er eller cli-er har egne "modes" for planlegging, hvis ikke kan lage en planleggingsagent som kun får tilgang til å lese filer og lage filer, men ikke redigere. Så skriver man noe ala "You do NOT implement changes yourself unless I explicitly ask you to do a small code-level example. Your default output is analysis + plan.".
6. Mentoring
    Siste tipset jeg har, og som er min favoritt, det er å lage seg en mentor-agent. For min del betyr det at jeg har laget en agent som har som oppgave å veilede meg når jeg ønsker å implementere for eksempel en feature. Jeg sender en melding med hva jeg ønsker, og agenten prøver å forstå hvorfor jeg ønsker det, hvilket problem det skal løse, og kommer så med alternativer og forslag til forbedringer. Dette hjelper meg å se flere alternativer, og innimellom forstår den akkurat hvilket problem jeg egentlig prøver å løse og foreslår noe helt annet som vil løse det. Dette hjelpes av god dokumentasjon og oppdaterte instruksjonsfiler. Det høres veldig banalt ut, men jeg bruker denne agenten mer enn alle andre og har mye mer nytte av AI etter jeg tok i bruk den.
    


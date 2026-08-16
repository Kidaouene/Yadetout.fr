import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://www.yadetout.fr';
const publisher = 'ca-pub-6699093983594327';
const now = new Date().toISOString().slice(0, 10);

const sections = {
  forex: {label:'Forex', path:'/forex', kind:'paire de devises', drivers:'les écarts de taux directeurs, les anticipations d inflation, les statistiques d activité et les flux internationaux', unit:'le différentiel de politique monétaire', related:['/guides/tendances','/guides/supports-resistances','/guides/volatilite']},
  metaux: {label:'Métaux', path:'/metaux', kind:'métal coté', drivers:'la production minière, les stocks disponibles, la demande industrielle, le dollar et les taux réels', unit:'l équilibre entre offre physique et demande financière', related:['/guides/volumes','/guides/accumulation','/guides/analyse-fondamentale']},
  matieres: {label:'Matières premières', path:'/matieres-premieres', kind:'matière première', drivers:'les récoltes, la météo, les stocks, la logistique, les coûts de production et les politiques commerciales', unit:'le rapport entre offre disponible et consommation', related:['/guides/saisonnalite','/guides/volatilite','/guides/gestion-du-risque']},
  energie: {label:'Énergie', path:'/energie', kind:'produit énergétique', drivers:'la production, les stocks, les capacités de raffinage, la demande mondiale et les décisions des pays exportateurs', unit:'l état du marché physique et des courbes à terme', related:['/guides/analyse-fondamentale','/guides/atr','/guides/gestion-du-risque']},
  actions: {label:'Actions', path:'/actions', kind:'action cotée', drivers:'le chiffre d affaires, les marges, la génération de trésorerie, la valorisation et les perspectives communiquées par la direction', unit:'la relation entre résultats, qualité du bilan et prix payé', related:['/guides/analyse-fondamentale','/guides/volumes','/guides/money-management']},
  etf: {label:'ETF', path:'/etf', kind:'fonds indiciel coté', drivers:'la composition de l indice, la méthode de réplication, les frais, la liquidité et l écart de suivi', unit:'la qualité de réplication et l exposition effectivement obtenue', related:['/guides/gestion-du-risque','/guides/volatilite','/guides/moyennes-mobiles']},
  indices: {label:'Indices', path:'/indices', kind:'indice boursier', drivers:'les résultats des sociétés membres, les taux, la croissance, les pondérations sectorielles et les flux indiciels', unit:'la contribution des principales pondérations à la performance globale', related:['/guides/tendances','/guides/macd','/guides/supports-resistances']},
};

const rows = (category, text) => text.trim().split('\n').map(line => {
  const [slug,name,symbol,focus,relations] = line.split('|');
  return {category,slug,name,symbol,focus,relations};
});

const assets = [
...rows('forex', `eur-usd|EUR/USD|EURUSD|baromètre du différentiel de taux entre la zone euro et les États-Unis|GBP/USD, USD/CHF et l indice dollar
gbp-usd|GBP/USD|GBPUSD|sensibilité aux décisions de la Banque d Angleterre et de la Réserve fédérale|EUR/GBP, EUR/USD et le FTSE 100
usd-jpy|USD/JPY|USDJPY|relation étroite avec les rendements américains et la politique de la Banque du Japon|EUR/JPY, CHF/JPY et le Nikkei 225
usd-chf|USD/CHF|USDCHF|lecture des flux défensifs vers le franc suisse face au dollar|EUR/USD, EUR/CHF et l or
aud-usd|AUD/USD|AUDUSD|exposition au cycle asiatique, aux métaux et au différentiel de taux australien|NZD/USD, le cuivre et le dollar américain
nzd-usd|NZD/USD|NZDUSD|sensibilité aux taux néo-zélandais, à l agriculture et au sentiment mondial|AUD/USD, USD/CAD et les matières premières
usd-cad|USD/CAD|USDCAD|interaction entre le dollar canadien, le pétrole et les politiques monétaires nord-américaines|WTI, AUD/USD et l indice dollar
eur-gbp|EUR/GBP|EURGBP|comparaison directe des perspectives économiques britannique et européenne|GBP/USD, EUR/USD et le DAX 40
eur-jpy|EUR/JPY|EURJPY|croisement entre le cycle européen et les conditions financières japonaises|USD/JPY, EUR/USD et le Nikkei 225
chf-jpy|CHF/JPY|CHFJPY|arbitrage entre deux devises défensives aux politiques monétaires différentes|USD/CHF, USD/JPY et l or
eur-chf|EUR/CHF|EURCHF|mesure des flux entre la zone euro et la Suisse|EUR/USD, USD/CHF et le DAX 40
eur-cad|EUR/CAD|EURCAD|confrontation entre le cycle européen et une devise liée à l énergie|EUR/USD, USD/CAD et le Brent
eur-aud|EUR/AUD|EURAUD|écart entre la conjoncture européenne et le cycle des matières premières asiatiques|AUD/USD, EUR/USD et le cuivre
gbp-jpy|GBP/JPY|GBPJPY|paire volatile influencée par les rendements et l appétit pour le risque|GBP/USD, USD/JPY et le Nasdaq 100
gbp-chf|GBP/CHF|GBPCHF|comparaison entre une devise cyclique et une devise défensive|GBP/USD, USD/CHF et le FTSE 100
aud-jpy|AUD/JPY|AUDJPY|indicateur classique de l appétit pour le risque en Asie-Pacifique|AUD/USD, USD/JPY et le Nikkei 225
cad-jpy|CAD/JPY|CADJPY|croisement sensible au pétrole et aux rendements japonais|USD/CAD, USD/JPY et le WTI
nzd-jpy|NZD/JPY|NZDJPY|exposition au portage et au sentiment de marché asiatique|NZD/USD, USD/JPY et les matières agricoles
aud-nzd|AUD/NZD|AUDNZD|comparaison des cycles australien et néo-zélandais|AUD/USD, NZD/USD et les taux régionaux
usd-cnh|USD/CNH|USDCNH|lecture du yuan offshore, de la politique chinoise et des tensions commerciales|AUD/USD, le cuivre et le Hang Seng`),
...rows('metaux', `or|Or|XAUUSD|actif monétaire, réserve de valeur et couverture suivie par les banques centrales|l argent, USD/CHF et les taux réels
argent|Argent|XAGUSD|métal précieux dont la demande combine investissement et usages industriels|l or, le cuivre et les secteurs solaires
cuivre|Cuivre|COPPER|indicateur du cycle industriel, de la construction et de l électrification|l aluminium, AUD/USD et les actions minières
platine|Platine|XPTUSD|métal rare lié à l automobile, à la joaillerie et à l hydrogène|le palladium, l argent et les constructeurs automobiles
palladium|Palladium|XPDUSD|marché concentré fortement exposé aux catalyseurs automobiles|le platine, le nickel et le secteur automobile
aluminium|Aluminium|ALUMINUM|métal industriel sensible à l énergie, au transport et à la construction|le cuivre, le zinc et les producteurs d aluminium
nickel|Nickel|NICKEL|matière stratégique pour l acier inoxydable et certaines batteries|le cuivre, le cobalt et les fabricants de batteries`),
...rows('matieres', `ble|Blé|WHEAT|céréale mondiale exposée aux récoltes, aux exportations et aux tensions géopolitiques|le maïs, le soja et les engrais
mais|Maïs|CORN|marché agricole lié à l alimentation, à l élevage et aux biocarburants|le blé, le soja et l éthanol
soja|Soja|SOYBEAN|oléagineux central pour les protéines animales et les huiles végétales|le maïs, le blé et la Chine
cafe|Café|COFFEE|produit tropical sensible au climat brésilien, au Vietnam et aux stocks certifiés|le cacao, le sucre et les devises émergentes
cacao|Cacao|COCOA|marché concentré dépendant des récoltes d Afrique de l Ouest|le café, le sucre et les groupes agroalimentaires
coton|Coton|COTTON|fibre agricole influencée par le textile, la météo et les stocks chinois|le pétrole, les détaillants et le dollar
sucre|Sucre|SUGAR|matière agricole liée à la météo, au Brésil et à l arbitrage avec l éthanol|le café, le maïs et le pétrole`),
...rows('energie', `brent|Pétrole Brent|BRENT|référence du pétrole maritime pour l Europe, l Afrique et une partie de l Asie|le WTI, le gazole et TotalEnergies
wti|Pétrole WTI|WTI|référence américaine sensible aux stocks de Cushing et à la production de schiste|le Brent, USD/CAD et les producteurs américains
gaz-naturel|Gaz naturel|NATGAS|marché régional influencé par la météo, les stocks et le GNL|le Brent, les services aux collectivités et les températures
gazole|Gazole|GASOIL|produit raffiné suivi pour le transport, l industrie et les marges de raffinage|le Brent, le WTI et les raffineurs`),
...rows('actions', `apple|Apple|AAPL|écosystème matériel et services, fidélité des utilisateurs et capacité de génération de trésorerie|Microsoft, Alphabet et le Nasdaq 100
microsoft|Microsoft|MSFT|logiciels, cloud Azure et développement de l intelligence artificielle d entreprise|Amazon, Alphabet et le Nasdaq 100
amazon|Amazon|AMZN|commerce électronique, cloud AWS, publicité et discipline opérationnelle|Microsoft, Alphabet et le S&P 500
alphabet|Alphabet|GOOGL|recherche, publicité numérique, cloud et investissements technologiques|Meta, Microsoft et le Nasdaq 100
meta|Meta Platforms|META|publicité sociale, engagement des utilisateurs et investissements dans les infrastructures|Alphabet, Amazon et le Nasdaq 100
tesla|Tesla|TSLA|véhicules électriques, énergie, capacité industrielle et pression concurrentielle|Nvidia, le cuivre et le Nasdaq 100
nvidia|Nvidia|NVDA|accélérateurs de calcul, centres de données et demande liée à l intelligence artificielle|AMD, Microsoft et le Nasdaq 100
amd|AMD|AMD|processeurs, accélérateurs et concurrence dans les centres de données|Nvidia, Intel et le Nasdaq 100
intel|Intel|INTC|transition industrielle, fonderies, processeurs et besoins d investissement|AMD, Nvidia et le S&P 500
berkshire-hathaway|Berkshire Hathaway|BRK.B|conglomérat diversifié, assurance et allocation disciplinée du capital|le S&P 500, JPMorgan et Apple
jpmorgan|JPMorgan Chase|JPM|banque diversifiée sensible aux taux, au crédit et aux marchés de capitaux|BNP Paribas, le S&P 500 et les taux américains
visa|Visa|V|réseau mondial de paiement, volumes de transactions et consommation|Mastercard, Amazon et le S&P 500
mastercard|Mastercard|MA|paiements électroniques internationaux et croissance des volumes transfrontaliers|Visa, Amazon et le S&P 500
eli-lilly|Eli Lilly|LLY|portefeuille pharmaceutique, innovation clinique et capacité de production|Novo Nordisk, Sanofi et le S&P 500
broadcom|Broadcom|AVGO|semi-conducteurs, logiciels d infrastructure et demande des centres de données|Nvidia, AMD et le Nasdaq 100
lvmh|LVMH|MC.PA|marques de luxe, demande internationale et exposition à la clientèle asiatique|Hermès, Kering et le CAC 40
hermes|Hermès|RMS.PA|rareté de l offre, puissance de marque et croissance organique du luxe|LVMH, Kering et le CAC 40
airbus|Airbus|AIR.PA|carnet de commandes, cadence de production et chaîne d approvisionnement aéronautique|Safran, Boeing et le CAC 40
bnp-paribas|BNP Paribas|BNP.PA|banque européenne diversifiée exposée aux taux, au crédit et à l épargne|JPMorgan, le CAC 40 et les taux européens
totalenergies|TotalEnergies|TTE.PA|groupe intégré exposé au pétrole, au gaz, au raffinage et à l électricité|le Brent, le gaz naturel et le CAC 40
safran|Safran|SAF.PA|motoriste et équipementier porté par le trafic aérien et les services|Airbus, Boeing et le CAC 40
sanofi|Sanofi|SAN.PA|portefeuille pharmaceutique, vaccins et exécution de la recherche clinique|Eli Lilly, Novo Nordisk et le CAC 40
schneider-electric|Schneider Electric|SU.PA|électrification, automatismes et efficacité énergétique|Siemens, le cuivre et le CAC 40
danone|Danone|BN.PA|produits alimentaires, nutrition spécialisée et évolution des marges|Nestlé, le cacao et le CAC 40
axa|AXA|CS.PA|assurance mondiale sensible aux rendements, à la sinistralité et à la tarification|Allianz, BNP Paribas et le CAC 40
vinci|Vinci|DG.PA|concessions, aéroports, construction et visibilité des flux de trésorerie|Airbus, le CAC 40 et les taux européens
air-liquide|Air Liquide|AI.PA|gaz industriels, contrats de long terme et investissements de décarbonation|Linde, l hydrogène et le CAC 40
essilorluxottica|EssilorLuxottica|EL.PA|optique, marques et intégration verticale mondiale|LVMH, Danone et le CAC 40
orange|Orange|ORA.PA|télécommunications, investissements réseaux et génération de trésorerie|Deutsche Telekom, Vodafone et le CAC 40
stellantis|Stellantis|STLAP.PA|cycle automobile, politique de prix et transition électrique|Tesla, le palladium et le CAC 40`),
...rows('etf', `cw8|Amundi MSCI World CW8|CW8|exposition diversifiée aux grandes et moyennes capitalisations des marchés développés|MSCI World, SPY et les actions américaines
spy|SPDR S&P 500 ETF|SPY|réplication liquide du S&P 500 utilisée comme référence par de nombreux investisseurs|VOO, QQQ et le S&P 500
qqq|Invesco QQQ|QQQ|exposition concentrée aux grandes sociétés non financières du Nasdaq|SPY, Nvidia et le Nasdaq 100
voo|Vanguard S&P 500 ETF|VOO|réplication à faibles frais des grandes capitalisations américaines|SPY, IWM et le S&P 500
iwm|iShares Russell 2000 ETF|IWM|exposition aux petites capitalisations américaines plus sensibles au cycle domestique|SPY, les taux américains et le Russell 2000
ewj|iShares MSCI Japan ETF|EWJ|panier d actions japonaises exposé au yen et aux réformes de gouvernance|le Nikkei 225, USD/JPY et les exportateurs japonais
msci-emerging|ETF MSCI Emerging Markets|EEM|exposition aux marchés émergents, aux devises locales et au cycle mondial|CW8, USD/CNH et les matières premières
agg|iShares Core US Aggregate Bond ETF|AGG|panier obligataire américain de référence sensible aux taux et au crédit|TLT, SPY et les rendements américains`),
...rows('indices', `cac-40|CAC 40|CAC40|indice phare de Paris, dominé par des groupes internationaux|LVMH, TotalEnergies et le DAX 40
dax-40|DAX 40|DAX40|indice allemand exposé à l industrie, aux exportations et au cycle européen|le CAC 40, EUR/USD et Siemens
nasdaq-100|Nasdaq 100|NDX|indice de croissance dominé par la technologie et les grandes capitalisations américaines|Nvidia, Microsoft et le S&P 500
sp-500|S&P 500|SPX|référence large des grandes sociétés américaines pondérée par la capitalisation|le Nasdaq 100, SPY et le Dow Jones
dow-jones|Dow Jones|DJIA|indice américain de trente grandes sociétés pondéré par les prix|le S&P 500, JPMorgan et Microsoft
ftse-100|FTSE 100|FTSE100|indice britannique international sensible aux matières premières et à la livre|GBP/USD, le Brent et le CAC 40
nikkei-225|Nikkei 225|N225|indice japonais pondéré par les prix et sensible au yen|USD/JPY, EWJ et le Topix
hang-seng|Hang Seng|HSI|indice de Hong Kong exposé à la Chine, à l immobilier et à la technologie asiatique|USD/CNH, le cuivre et les actions chinoises`),
];

const guides = rows('guides', `tendances|Comprendre les tendances|GUIDE|méthode de qualification d une direction durable par les sommets, les creux et la pente|supports, résistances et moyennes mobiles
accumulation|Identifier une accumulation|GUIDE|lecture d une phase durant laquelle l offre disponible est absorbée sans progression immédiate du prix|volumes, volatilité et breakout
distribution|Identifier une distribution|GUIDE|analyse d une phase de cession progressive après une hausse ou près d une résistance|volumes, supports et gestion du risque
supports-resistances|Supports et résistances|GUIDE|repérage des zones où l équilibre entre acheteurs et vendeurs s est déjà déplacé|breakout, pullback et tendances
volumes|Analyser les volumes|GUIDE|interprétation de la participation et validation des mouvements de prix|accumulation, distribution et breakout
analyse-fondamentale|Analyse fondamentale|GUIDE|étude structurée des données économiques, financières et sectorielles qui influencent la valeur d un actif|sources, valorisation et gestion du risque
saisonnalite|Comprendre la saisonnalité|GUIDE|analyse des comportements récurrents liés aux calendriers de production, de consommation et de publication|matières premières, volatilité et gestion du risque
breakout|Analyser un breakout|GUIDE|évaluation d une sortie de zone avec confirmation par la clôture, la volatilité et les volumes|supports, volumes et pullback
pullback|Comprendre le pullback|GUIDE|lecture d un retour du prix vers une zone franchie avant une éventuelle reprise|breakout, tendances et gestion du risque
rsi|Utiliser le RSI|GUIDE|mesure du momentum et interprétation prudente des zones extrêmes et divergences|MACD, tendances et volatilité
macd|Utiliser le MACD|GUIDE|comparaison de moyennes exponentielles pour étudier momentum et changements de régime|RSI, moyennes mobiles et tendances
moyennes-mobiles|Moyennes mobiles|GUIDE|lissage du prix pour observer direction, rythme et zones dynamiques|tendances, MACD et pullback
fibonacci|Retracements de Fibonacci|GUIDE|outil de cadrage des corrections qui doit être associé à des niveaux réellement échangés|supports, pullback et gestion du risque
volatilite|Comprendre la volatilité|GUIDE|mesure de l amplitude des variations et adaptation de la taille des positions|ATR, gestion du risque et options
atr|Utiliser l ATR|GUIDE|mesure de l amplitude moyenne récente sans indication de direction|volatilité, stops et money management
swing-trading|Cadre du swing trading|GUIDE|organisation d analyses sur plusieurs séances avec horizons et risques définis|tendances, pullback et gestion du risque
scalping|Cadre du scalping|GUIDE|discipline de très court terme soumise aux coûts, à la liquidité et à l exécution|day trading, volatilité et gestion du risque
day-trading|Cadre du day trading|GUIDE|gestion de positions ouvertes et clôturées pendant une même séance|scalping, ATR et psychologie
gestion-du-risque|Gestion du risque|GUIDE|définition préalable de la perte acceptable et contrôle de l exposition globale|money management, volatilité et psychologie
money-management|Money management|GUIDE|dimensionnement cohérent des positions selon le capital, le risque et la corrélation|gestion du risque, ATR et portefeuille
psychologie|Psychologie de marché|GUIDE|observation des biais décisionnels et mise en place de règles reproductibles|gestion du risque, journal et discipline`);

const trust = [
['a-propos','À propos de Yadetout','Présentation du projet éditorial et de son terminal de suivi des marchés.'],
['methodologie','Méthodologie d analyse','Principes utilisés pour présenter les prix, tendances, volumes et risques.'],
['politique-editoriale','Politique éditoriale','Règles de rédaction, de vérification et de mise à jour des contenus financiers.'],
['sources','Sources et références','Catégories de sources économiques, réglementaires et de marché privilégiées.'],
['mentions-legales','Mentions légales','Informations légales relatives à la publication et à l utilisation du site.'],
['confidentialite','Politique de confidentialité','Traitement des données, mesure d audience et droits des visiteurs.'],
['cookies','Politique relative aux cookies','Fonctionnement des traceurs, du consentement et des préférences publicitaires.'],
['contact','Contact','Canal de contact pour les questions éditoriales, techniques et juridiques.'],
];

const hubs = Object.entries(sections).map(([category,s])=>({category,slug:s.path.slice(1),name:s.label,symbol:'DOSSIER',focus:`dossier consacré à ${s.label.toLowerCase()} et aux méthodes utiles pour suivre ce marché`,relations:'les actifs majeurs, les guides techniques et la méthodologie'}));
const guidesHub = {category:'guides',slug:'guides',name:'Guides d analyse financière',symbol:'DOSSIER',focus:'ensemble de méthodes pour lire le prix, les volumes, la volatilité et le risque',relations:'les marchés suivis, la méthodologie et les sources'};

const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const clean = s => s.replace(/\s+/g,' ').trim();
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const pagePath = p => p === '/' ? root : path.join(root, ...p.slice(1).split('/'));
const link = (href,label) => `<a href="${href}">${esc(label)}</a>`;
const relLinks = item => {
  const s = sections[item.category];
  const candidates = assets.filter(a=>a.category===item.category && a.slug!==item.slug).slice(0,3).map(a=>[`/${item.category==='matieres'?'matieres-premieres':item.category}/${a.slug}`,a.name]);
  return [...candidates,...(s?.related||[]).map(x=>[x,x.split('/').at(-1).replaceAll('-',' ')])].slice(0,6);
};

function faqFor(item){
  const s=sections[item.category]||sections.indices;
  return [
    [`Quels facteurs influencent ${item.name} ?`,`${item.name} réagit principalement à ${s.drivers}. Leur influence varie selon l horizon observé et les anticipations déjà intégrées dans le prix.`],
    [`Comment analyser le graphique de ${item.name} ?`,`La lecture commence par la tendance de fond, les derniers sommets et creux, puis les zones de prix ayant concentré les échanges. Les volumes et la volatilité servent ensuite à évaluer la solidité du mouvement.`],
    [`Une hausse des volumes suffit-elle pour conclure ?`,`Non. Le volume doit être comparé à sa moyenne, au contexte et à la réaction du prix. Une activité élevée peut signaler une confirmation, une absorption ou une phase de distribution.`],
    [`Quels risques faut-il surveiller ?`,`Les principaux risques sont un changement de régime, une annonce inattendue, un écart de liquidité et une volatilité supérieure aux hypothèses. Une analyse reste conditionnelle et ne garantit aucun résultat.`]
  ];
}

function paragraphs(item){
  const s=sections[item.category]||{label:'Analyse financière',kind:'sujet financier',drivers:'les prix, les volumes, la volatilité, la liquidité et le contexte économique',unit:'la cohérence entre le scénario et les faits observables'};
  const seed=parseInt(hash(item.slug).slice(0,4),16);
  const horizon=seed%3===0?'plusieurs séances':seed%3===1?'plusieurs semaines':'un cycle complet de marché';
  const focus=item.focus||`analyse documentée de ${item.name}`;
  return [
    ['Présentation',`${item.name} occupe une place précise dans le suivi des marchés. Son intérêt vient de son ${focus}. Une analyse sérieuse ne se limite pas à constater la dernière variation. Elle replace le prix dans son historique, identifie les informations déjà anticipées et distingue les mouvements techniques des changements fondamentaux. Cette page fournit un cadre de lecture neutre, destiné à comprendre les mécanismes observables sans formuler de recommandation personnalisée.`],
    ['Pourquoi cet actif est suivi',`Le suivi de ${item.name} apporte une information utile sur ${s.unit}. Les opérateurs confrontent en permanence les données publiées, les attentes du consensus et les risques moins visibles. Un prix peut donc progresser malgré une statistique faible lorsque le marché anticipait un résultat encore moins favorable. Inversement, une information positive peut provoquer peu de réaction si elle était déjà intégrée. Le contexte compte davantage que le titre isolé d une actualité.`],
    ['Lecture du graphique',`Le graphique de ${item.name} se lit d abord par sa structure. Une succession de sommets et de creux ascendants traduit une pression acheteuse persistante. La configuration inverse indique une domination vendeuse. Entre les deux, le marché peut évoluer en équilibre. Les niveaux horizontaux doivent être considérés comme des zones et non comme des prix exacts. Une clôture, la durée du franchissement et la réaction suivante offrent davantage d information qu une simple pointe intrajournalière.`],
    ['Volumes et participation',`Les volumes renseignent sur la participation, mais leur interprétation dépend du marché et de la qualité des données disponibles. Sur ${item.name}, une accélération accompagnée d une activité supérieure à la normale renforce généralement la crédibilité du mouvement. Un prix qui avance avec une participation décroissante mérite davantage de prudence. Près d un niveau important, un volume élevé sans progression peut révéler une absorption des ordres plutôt qu une confirmation directionnelle.`],
    ['Volatilité et régime de marché',`La volatilité mesure l amplitude des variations, pas leur direction. Une contraction prolongée peut préparer un mouvement plus large, sans permettre d en connaître le sens. Une expansion soudaine exige d adapter les seuils d invalidation et la taille du risque. Pour ${item.name}, comparer l amplitude actuelle à celle des périodes précédentes sur ${horizon} évite de traiter un mouvement ordinaire comme un événement exceptionnel. Les annonces programmées peuvent modifier brutalement ce régime.`],
    ['Accumulation',`Une accumulation correspond à une absorption progressive de l offre disponible. Elle peut apparaître après une baisse ou pendant une consolidation, mais elle ne se déduit pas d une seule bougie. Les indices utiles sont la stabilité relative des creux, la réduction des réactions vendeuses, l amélioration graduelle des clôtures et une participation cohérente. Sur ${item.name}, la confirmation intervient seulement lorsque le prix sort de sa zone d équilibre et conserve le niveau franchi.`],
    ['Distribution',`La distribution décrit le processus inverse : des positions sont cédées progressivement alors que le prix reste encore stable ou proche de ses sommets. Des échecs répétés sous une résistance, des clôtures moins favorables et des volumes importants sans avancée peuvent constituer des signaux. Aucun de ces éléments n est suffisant isolément. Une rupture du support de la zone et l incapacité à le reprendre donnent une validation plus robuste du changement de contrôle.`],
    ['Analyse fondamentale',`Les facteurs fondamentaux de ${item.name} comprennent ${s.drivers}. Leur hiérarchie évolue. Une variable déterminante pendant une phase de tension peut devenir secondaire lorsque les conditions se normalisent. L analyse doit donc suivre les publications officielles, les décisions réglementaires et les indications des acteurs concernés. Il convient aussi de séparer les données contemporaines des indicateurs retardés, puis de comparer les chiffres aux attentes plutôt qu à leur seule valeur absolue.`],
    ['Analyse technique',`L analyse technique organise les observations du prix sans prétendre expliquer chaque mouvement. Pour ${item.name}, les tendances, supports, résistances, moyennes mobiles et indicateurs de momentum sont utiles lorsqu ils convergent avec la structure générale. Multiplier les indicateurs corrélés ne crée pas une preuve supplémentaire. Une méthode robuste définit un scénario principal, un scénario alternatif, un niveau d invalidation et les conditions concrètes qui justifieraient une réévaluation.`],
    ['Relations avec les autres marchés',`${item.name} doit être replacé parmi ${item.relations||'les actifs connexes et les grandes variables macroéconomiques'}. Une corrélation historique n est jamais fixe. Elle peut se renforcer pendant une crise, disparaître lors d un changement de politique ou s inverser lorsque le facteur dominant évolue. L observation croisée sert à tester la cohérence d un scénario, non à transformer une relation statistique en certitude. Les divergences persistantes méritent une analyse spécifique.`],
    ['Cadre de décision',`Une lecture exploitable sépare les faits, les hypothèses et les décisions. Les faits comprennent les niveaux échangés, les volumes disponibles et les publications vérifiables. Les hypothèses décrivent le mécanisme envisagé. La décision fixe l exposition maximale et les conditions de sortie. Sur ${item.name}, ce cadre réduit la tentation de modifier une analyse uniquement parce que le prix évolue temporairement contre le scénario. Il favorise une révision fondée sur des informations nouvelles.`],
    ['Résumé',`${item.name} se comprend par la combinaison du contexte fondamental, de la structure graphique, de la participation et du régime de volatilité. Aucun indicateur ne remplace cette mise en perspective. L objectif est de formuler des scénarios conditionnels, puis de vérifier si les faits continuent de les soutenir. Les données doivent être datées, les sources identifiées et les limites reconnues. Cette discipline améliore la qualité de l analyse sans supprimer l incertitude inhérente aux marchés.`],
  ];
}

function guideParagraphs(item){
  const base=paragraphs({...item,category:'indices'});
  base[0][1]=`${item.name} est un outil d analyse, pas une promesse de résultat. Son objectif est la ${item.focus}. La méthode devient utile lorsqu elle définit des observations vérifiables, un horizon précis et des conditions d invalidation. Elle doit être testée sur plusieurs régimes de marché et documentée avant toute utilisation. Les exemples servent à expliquer un raisonnement ; ils ne constituent ni un signal, ni une incitation à prendre position.`;
  base[7][0]='Mise en pratique';
  base[7][1]=`La mise en pratique de ${item.name.toLowerCase()} commence par un graphique lisible et des données cohérentes. Il faut noter le contexte, l horizon, les niveaux importants et la volatilité avant d interpréter l indicateur. Une observation réalisée après le mouvement expose au biais rétrospectif. Un journal daté permet de comparer l hypothèse initiale au résultat, d identifier les erreurs récurrentes et de séparer la qualité du processus du résultat financier ponctuel.`;
  return base;
}

function schema(item,url,title,description,faq,breadcrumbs,type='Article'){
  const graph=[
    {'@type':'Organization','@id':`${origin}/#organization`,name:'Yadetout',alternateName:'Yadetout.fr',url:origin,logo:{'@type':'ImageObject',url:`${origin}/logo-512.png`,contentUrl:`${origin}/logo-512.png`,width:512,height:512}},
    {'@type':'WebSite','@id':`${origin}/#website`,url:origin,name:'Yadetout',alternateName:'Yadetout.fr',inLanguage:'fr-FR',publisher:{'@id':`${origin}/#organization`}},
    {'@type':type,'@id':`${url}#article`,headline:title,description,inLanguage:'fr-FR',mainEntityOfPage:url,dateModified:now,author:{'@id':`${origin}/#organization`},publisher:{'@id':`${origin}/#organization`}},
    {'@type':'BreadcrumbList',itemListElement:breadcrumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b[1],item:`${origin}${b[0]}`}))},
    {'@type':'FAQPage',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
  ];
  if(item.category==='trust'&&item.slug==='contact') graph.push({'@type':'FinancialService',name:'Yadetout',url:origin,areaServed:['FR','EU']});
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
}

function render(item, route, options={}){
  const s=sections[item.category];
  const title=clean(options.title||`${item.name} : analyse, graphique et facteurs clés`);
  const finalTitle=title.length<45?`${title} | Yadetout`:title.slice(0,60).trim();
  let description=clean(options.description||`Analyse de ${item.name} : facteurs de marché, lecture du graphique, volumes, volatilité, niveaux techniques, risques et questions fréquentes.`);
  if(description.length<140) description+=` Cadre neutre et documenté pour suivre son évolution.`;
  description=description.slice(0,157).replace(/[ ,;:.]+$/,'')+'.';
  const url=`${origin}${route}`;
  const faq=faqFor(item);
  const breadcrumbs=[['/','Accueil']];
  if(s) breadcrumbs.push([s.path,s.label]);
  if(item.category==='guides') breadcrumbs.push(['/guides','Guides']);
  breadcrumbs.push([route,item.name]);
  const body=(item.category==='guides'?guideParagraphs(item):paragraphs(item)).map(([h,p])=>`<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('\n');
  const related=relLinks(item).map(([u,n])=>`<li>${link(u,n)}</li>`).join('');
  const faqHtml=faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const jsonld=schema(item,url,finalTitle,description,faq,breadcrumbs,options.schemaType||'Article');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07101b">
<title>${esc(finalTitle)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="article"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="Yadetout"><meta property="og:title" content="${esc(finalTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}/og-yadetout.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Yadetout, analyse des marchés financiers">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(finalTitle)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${origin}/og-yadetout.png"><meta name="twitter:image:alt" content="Yadetout, analyse des marchés financiers">
<link rel="icon" type="image/svg+xml" sizes="any" href="/icon.svg"><link rel="alternate icon" type="image/png" sizes="48x48" href="/favicon-48.png"><link rel="shortcut icon" href="/favicon.ico"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<script type="application/ld+json">${jsonld}</script>
<style>:root{color-scheme:light;--ink:#142033;--muted:#526173;--line:#dce3ea;--blue:#0c5688;--paper:#fff;--soft:#f5f8fa}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.72 Georgia,serif}header,main,footer{width:min(920px,calc(100% - 34px));margin:auto}header{padding:20px 0 16px;border-bottom:1px solid var(--line)}.brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:14px;color:var(--ink);font:700 16px/1 system-ui,sans-serif;text-decoration:none}.brand img{width:42px;height:42px;border-radius:12px;box-shadow:0 7px 20px #10233d1f}nav{font:14px/1.5 system-ui,sans-serif}nav a,a{color:var(--blue)}h1{font:700 clamp(32px,5vw,50px)/1.08 Georgia,serif;margin:42px 0 18px}h2{font:700 25px/1.25 Georgia,serif;margin:42px 0 10px}p{margin:0 0 17px}.lead{font-size:21px;color:#34465a}.notice{margin:30px 0;padding:17px 19px;background:var(--soft);border-left:4px solid var(--blue)}.related,.faq{margin:40px 0;padding-top:18px;border-top:1px solid var(--line)}details{border-bottom:1px solid var(--line);padding:14px 0}summary{font-weight:700;cursor:pointer}footer{margin-top:55px;padding:25px 0 45px;border-top:1px solid var(--line);color:var(--muted);font:14px/1.6 system-ui,sans-serif}@media(max-width:600px){body{font-size:16px}h1{margin-top:28px}}</style></head>
<body><header><a class="brand" href="/"><img src="/logo.svg" width="42" height="42" alt="Logo Yadetout"><span>Yadetout</span></a><nav>${breadcrumbs.map(([u,n])=>link(u,n)).join(' / ')}</nav></header><main><article><h1>${esc(item.name)}</h1><p class="lead">${esc(item.focus||description)}</p><div class="notice">Document d analyse générale. Les informations présentées ne constituent pas un conseil en investissement.</div>${body}<section class="related"><h2>Lectures associées</h2><ul>${related}</ul></section><section class="faq"><h2>Questions fréquentes</h2>${faqHtml}</section><section><h2>Avertissement</h2><p>Les marchés financiers comportent un risque de perte en capital. Les données, scénarios et méthodes présentés ont une finalité informative et pédagogique. Ils ne tiennent compte ni de la situation personnelle, ni des objectifs, ni de la tolérance au risque d un lecteur. Toute décision doit s appuyer sur des sources à jour et, lorsque cela est nécessaire, sur un professionnel habilité.</p></section></article></main><footer><a href="/">Terminal Yadetout</a> · <a href="/methodologie">Méthodologie</a> · <a href="/sources">Sources</a> · <a href="/politique-editoriale">Politique éditoriale</a> · <a href="/confidentialite">Confidentialité</a></footer></body></html>`;
}

function renderTrust([slug,name,desc]){
  const item={category:'trust',slug,name,focus:desc,relations:'la méthodologie, les sources et la politique éditoriale'};
  return render(item,`/${slug}`,{title:`${name} : informations et engagements Yadetout`,description:`${desc} Cette page précise les engagements, responsabilités et pratiques appliqués par Yadetout dans un cadre français et européen.`});
}

const outputs=[];
function write(route,html,group){const dir=pagePath(route);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);const visible=html.replace(/<head>[\s\S]*?<\/head>/,'').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ');outputs.push({route,group,html,words:(visible.match(/[A-Za-zÀ-ÿ0-9]+/g)||[]).length});}

for(const hub of hubs){const s=sections[hub.category];write(s.path,render(hub,s.path,{schemaType:'CollectionPage',title:`${s.label} : analyses, graphiques et méthodes de suivi`}),hub.category);}
write('/guides',render(guidesHub,'/guides',{schemaType:'CollectionPage',title:'Guides d analyse financière : méthodes et indicateurs'}),'guides');
for(const item of assets){const prefix=item.category==='matieres'?'matieres-premieres':item.category;write(`/${prefix}/${item.slug}`,render(item,`/${prefix}/${item.slug}`),item.category);}
for(const item of guides)write(`/guides/${item.slug}`,render(item,`/guides/${item.slug}`),'guides');
for(const item of trust)write(`/${item[0]}`,renderTrust(item),'trust');

const grouped=Object.groupBy(outputs,x=>x.group);
const sitemap=(items)=>`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.map(x=>`  <url><loc>${origin}${x.route}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${x.route.split('/').length===2?'0.8':'0.7'}</priority></url>`).join('\n')}\n</urlset>\n`;
const home={route:'/',group:'home'};
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['forex','actions','metaux','matieres','energie','etf','indices','guides','trust'].map(g=>`  <sitemap><loc>${origin}/sitemap-${g}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
for(const [g,items] of Object.entries(grouped))fs.writeFileSync(path.join(root,`sitemap-${g}.xml`),sitemap(g==='trust'?[home,...items]:items));
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /parametres\nDisallow: /alertes\nSitemap: ${origin}/sitemap.xml\n`);
if(!fs.existsSync(path.join(root,'ads.txt')))fs.writeFileSync(path.join(root,'ads.txt'),`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`);

const expected=121;
if(outputs.length!==expected)throw new Error(`Nombre de pages SEO inattendu: ${outputs.length}, attendu ${expected}`);
const short=outputs.filter(x=>x.words<800);
const duplicateHashes=new Map();
for(const x of outputs){const body=x.html.replace(/<head>[\s\S]*?<\/head>/,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();const h=hash(body);if(duplicateHashes.has(h))throw new Error(`Duplication exacte: ${x.route} et ${duplicateHashes.get(h)}`);duplicateHashes.set(h,x.route)}
fs.writeFileSync(path.join(root,'seo-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),totalUrls:outputs.length+1,editorialPages:outputs.length,minWords:Math.min(...outputs.map(x=>x.words)),maxWords:Math.max(...outputs.map(x=>x.words)),pagesBelow800:short.map(x=>({route:x.route,words:x.words})),routes:outputs.map(x=>x.route)},null,2));
console.log(JSON.stringify({generated:outputs.length,totalUrls:outputs.length+1,minWords:Math.min(...outputs.map(x=>x.words)),maxWords:Math.max(...outputs.map(x=>x.words)),below800:short.length},null,2));

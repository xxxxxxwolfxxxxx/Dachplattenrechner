/**
 * Kuratierte Dachfarben - die RAL-Toene, die bei Trapezblech, Wellblech und
 * Sandwichpaneelen tatsaechlich ab Lager bestellt werden.
 *
 * Nur diese Toene bekommen eine eigene Unterseite unter /tools/farben/<slug>/.
 * Alle 200 RAL-Farben als Einzelseiten waeren duenner Inhalt und wuerden
 * untereinander um dieselben Suchanfragen konkurrieren.
 */

import { RAL_FARBEN, type Farbton } from './farben';

export interface Dachfarbe {
  /** RAL-Nummer, Schluessel in RAL_FARBEN */
  code: string;
  /** URL-Segment, z. B. 'ral-8011' */
  slug: string;
  /** Einzeiler fuer Kachel und Meta-Description */
  usage: string;
  /** Wo der Ton typischerweise verbaut wird */
  einsatz: string;
  /** Optische Wirkung, Verschmutzung, Aufheizung */
  wirkung: string;
  /** Passende Kantteile, Regenrinnen, Nachbarfarben */
  kombination: string;
  /** RAL-Nummern verwandter Toene */
  aehnlich: readonly string[];
}

export const DACHFARBEN: readonly Dachfarbe[] = [
  {
    code: '8011',
    slug: 'ral-8011',
    usage: 'Meistbestellter Braunton für Trapezblech auf Ställen, Scheunen und Nebengebäuden.',
    einsatz:
      'RAL 8011 Nussbraun ist der Klassiker unter den Trapezblech-Farben im landwirtschaftlichen und gewerblichen Bau. Ställe, Maschinenhallen, Scheunen, Carports und Gartenhäuser werden seit Jahrzehnten in diesem Ton eingedeckt. Fast jeder Profilhersteller führt 8011 als Lagerfarbe – das bedeutet kurze Lieferzeiten und den niedrigsten Quadratmeterpreis, weil kein Sonderlauf beschichtet werden muss.',
    wirkung:
      'Das dunkle, leicht rötliche Braun wirkt unauffällig und fügt sich in ländliche Umgebung ein. Staub, Pollen und Laubränder fallen deutlich weniger auf als auf hellen Tönen. Wie alle dunklen Farben heizt sich 8011 in der Sommersonne stark auf – bei ausgebauten Dachräumen sollte die Dämmung entsprechend ausgelegt werden.',
    kombination:
      'Ortgang-, First- und Traufbleche werden üblicherweise im selben Ton gekantet. Braune Regenrinnen aus beschichtetem Stahl oder Zink passen ebenso wie Holzverschalungen in Lärche oder Douglasie. Zu rotem Ziegel am Hauptgebäude bildet 8011 einen ruhigen Kontrast.',
    aehnlich: ['8012', '8017', '8004'],
  },
  {
    code: '8012',
    slug: 'ral-8012',
    usage: 'Rotbraun als Ziegel-Alternative bei Dachpfannenprofil und Wellblech.',
    einsatz:
      'RAL 8012 Rotbraun wird vor allem dort verbaut, wo ein Blechdach optisch an eine Ziegeleindeckung anschließen soll – etwa bei Anbauten, Garagen und Wintergärten neben einem bestehenden Ziegeldach. Bei Dachpfannenprofilen ist 8012 neben 3009 die gängigste Farbe.',
    wirkung:
      'Der Ton ist deutlich röter als Nussbraun und kommt einem gealterten Tonziegel näher. In direkter Sonne zeigt er einen warmen, leicht orangestichigen Schimmer, im Schatten wirkt er fast braun.',
    kombination:
      'Zu Klinker und rotem Ziegel die naheliegendste Wahl. Kantteile und Rinnen in 8012 oder alternativ in 8004 Kupferbraun; weiße Fenster- und Ortgangdetails setzen einen bewussten Kontrast.',
    aehnlich: ['3009', '8004', '8011'],
  },
  {
    code: '8017',
    slug: 'ral-8017',
    usage: 'Dunkles Schokoladenbraun für Fassaden und Kantteile, sehr schmutzunempfindlich.',
    einsatz:
      'RAL 8017 Schokoladenbraun findet sich häufig an Fassadenverkleidungen, Toranlagen und Sockelblechen. Als Dacheindeckung wird der Ton dort gewählt, wo eine sehr dunkle, fast schwarze Anmutung gewünscht ist, ohne auf Anthrazit zu gehen.',
    wirkung:
      'Sehr dunkel und tief – aus der Entfernung kaum von Schwarzbraun zu unterscheiden. Verschmutzung ist praktisch unsichtbar, dafür zeichnen sich Kratzer und Kalkspritzer deutlich ab. Die Aufheizung im Sommer ist von allen gängigen Dachfarben mit am höchsten.',
    kombination:
      'Passt zu hellen Putzfassaden, zu weißen Fenstern und zu unbehandeltem Holz. Regenrinnen ebenfalls in 8017 oder in Anthrazit, wenn ein modernerer Auftritt gewünscht ist.',
    aehnlich: ['8019', '8022', '7016'],
  },
  {
    code: '8004',
    slug: 'ral-8004',
    usage: 'Kupferbraun – warmer Terrakotta-Ton für Carports und Gartenhäuser.',
    einsatz:
      'RAL 8004 Kupferbraun wird gern bei kleineren Bauten eingesetzt: Carports, Gerätehäusern, Terrassenüberdachungen. Als vollflächige Dacheindeckung ist der Ton seltener, als Akzentfarbe an Blenden und Kantteilen aber verbreitet.',
    wirkung:
      'Deutlich heller und wärmer als Nussbraun, mit erkennbarem Terrakotta-Charakter. Der Ton bleibt auch bei bedecktem Himmel freundlich, zeigt Verschmutzung aber stärker als die dunklen Brauntöne.',
    kombination:
      'Harmoniert mit Naturstein, Holz und rotem Ziegel. Als Kontrast dazu Kantteile in 8017 oder 7016.',
    aehnlich: ['8011', '8012', '2001'],
  },
  {
    code: '7016',
    slug: 'ral-7016',
    usage: 'Anthrazitgrau – meistverbaute Dachfarbe im Neubau, zu jeder Fassade passend.',
    einsatz:
      'RAL 7016 Anthrazitgrau ist im deutschen Neubau die mit Abstand häufigste Farbe für Dach, Fenster, Haustür und Regenrinne. Trapezbleche, Stehfalzprofile, Sandwichpaneele und Dachpfannenprofile sind in 7016 fast überall Lagerware.',
    wirkung:
      'Ein sattes, leicht bläuliches Dunkelgrau. Wirkt modern und zurückhaltend, lässt Baukörper optisch niedriger erscheinen. Die Aufheizung entspricht der dunkler Brauntöne; helle Kalkflecken und Vogelkot fallen auf.',
    kombination:
      'Der Standardpartner zu weißem Putz, hellem Klinker und grauen Fensterrahmen. Wer Kontrast will, kombiniert 7016 mit Holzverschalung oder mit Fassadenblechen in 9006.',
    aehnlich: ['7024', '7021', '7015'],
  },
  {
    code: '7024',
    slug: 'ral-7024',
    usage: 'Graphitgrau – etwas dunkler und neutraler als Anthrazit.',
    einsatz:
      'RAL 7024 Graphitgrau wird häufig alternativ zu 7016 gewählt, unter anderem weil viele Fenster- und Torhersteller diesen Ton als Standard führen. Bei Sandwichpaneelen und Fassadenkassetten ist 7024 verbreitet.',
    wirkung:
      'Etwas dunkler und weniger blaustichig als 7016, dadurch neutraler. Der Unterschied ist erst im direkten Vergleich nebeneinander sichtbar – auf demselben Gebäude sollten die beiden Töne trotzdem nicht gemischt werden.',
    kombination:
      'Wie 7016 nahezu universell einsetzbar. Achtung bei Nachbestellungen: Kantteile aus einem anderen Beschichtungslauf können leicht abweichen, deshalb Ergänzungsteile möglichst gemeinsam bestellen.',
    aehnlich: ['7016', '7021', '7043'],
  },
  {
    code: '7035',
    slug: 'ral-7035',
    usage: 'Lichtgrau – Standard bei Hallenfassaden und Innenschalen von Paneelen.',
    einsatz:
      'RAL 7035 Lichtgrau ist die klassische Innenfarbe von Sandwichpaneelen und eine häufige Fassadenfarbe im Industriebau. Als Dachfarbe wird der Ton dort verwendet, wo Aufheizung vermieden werden soll – etwa bei Lager- und Produktionshallen.',
    wirkung:
      'Helles, leicht grünstichiges Grau. Reflektiert Sonnenstrahlung deutlich stärker als dunkle Töne und hält den Dachraum im Sommer spürbar kühler. Verschmutzung und Algenbewuchs zeichnen sich dafür ab.',
    kombination:
      'Häufig als Innenschale unter einer dunklen Dachhaut. An der Fassade zu farbigen Sockelbändern in 5010 oder 3000 kombiniert.',
    aehnlich: ['9002', '7047', '7038'],
  },
  {
    code: '9002',
    slug: 'ral-9002',
    usage: 'Grauweiß – Fassadenstandard bei Hallen, günstig und lichtreflektierend.',
    einsatz:
      'RAL 9002 Grauweiß ist der meistverbaute Fassadenton im Hallenbau und die häufigste Innenschalenfarbe bei Sandwichpaneelen. Für Dachflächen wird der Ton gewählt, wenn Wärmeeintrag reduziert werden soll.',
    wirkung:
      'Gebrochenes Weiß mit leichtem Grauanteil – wirkt weniger klinisch als Reinweiß und zeigt Verschmutzung nicht so stark. Der hohe Reflexionsgrad senkt die Oberflächentemperatur im Sommer deutlich.',
    kombination:
      'Kantteile und Sockel häufig in 7016 oder 5010 abgesetzt. Zu 9002 passen graue Fensterprofile besser als weiße, da Reinweiß daneben zu hart wirkt.',
    aehnlich: ['9010', '9001', '7035'],
  },
  {
    code: '9006',
    slug: 'ral-9006',
    usage: 'Weißaluminium – metallisch glänzend, typisch für Industriedächer.',
    einsatz:
      'RAL 9006 Weißaluminium ist ein Metallic-Ton und die klassische Farbe für Industrie- und Gewerbedächer, Fassadenkassetten und Well­blech. Auch verzinkte Optik wird häufig über 9006 nachgebildet.',
    wirkung:
      'Silbriger Metallic-Effekt mit sichtbarem Glimmer. Die Wirkung ändert sich stark mit dem Lichteinfall – dieselbe Fläche kann je nach Blickwinkel hell oder mittelgrau erscheinen. Deshalb sollten alle Bleche einer Fläche gleich orientiert montiert werden.',
    kombination:
      'Zu 7016 und 9007 als Absetzfarbe. Metallic-Töne lassen sich schlecht ausbessern, weil Lackstift und Beschichtung unterschiedlich glänzen.',
    aehnlich: ['9007', '9022', '7035'],
  },
  {
    code: '9007',
    slug: 'ral-9007',
    usage: 'Graualuminium – dunklerer Metallic-Ton für Fassade und Dach.',
    einsatz:
      'RAL 9007 Graualuminium wird bei Fassadenkassetten, Trapezblechen und Kantteilen eingesetzt, wenn eine metallische Optik gewünscht ist, die dunkler ausfällt als 9006.',
    wirkung:
      'Mittelgrauer Metallic-Ton mit deutlichem Glimmeranteil. Wie bei allen Metallic-Beschichtungen ist die Richtungsabhängigkeit zu beachten.',
    kombination:
      'Gute Ergänzung zu 7016 und zu Sichtbeton. Als Dachfarbe über einer hellen Putzfassade häufig gewählt.',
    aehnlich: ['9006', '7024', '9023'],
  },
  {
    code: '9010',
    slug: 'ral-9010',
    usage: 'Reinweiß – Innenschalen, Deckenuntersichten und helle Fassaden.',
    einsatz:
      'RAL 9010 Reinweiß wird vor allem für Innenschalen von Sandwichpaneelen, Deckenuntersichten und Fassadenverkleidungen verwendet, bei denen maximale Helligkeit im Innenraum gefragt ist – Lebensmittelbetriebe, Werkstätten, Reithallen.',
    wirkung:
      'Das hellste gebräuchliche Weiß, sehr hoher Reflexionsgrad. Außen zeigt es Verschmutzung, Algen und Ablaufspuren am stärksten von allen Dachfarben.',
    kombination:
      'Innen mit 9002 kombinierbar, außen meist mit dunklen Kantteilen abgesetzt.',
    aehnlich: ['9002', '9016', '9003'],
  },
  {
    code: '9005',
    slug: 'ral-9005',
    usage: 'Tiefschwarz – für Stehfalz-Optik und moderne Architektur.',
    einsatz:
      'RAL 9005 Tiefschwarz wird bei Stehfalzprofilen, Klick-Falz-Blechen und modernen Kubusbauten eingesetzt. Auch Photovoltaik-Anlagen fügen sich auf schwarzem Dach optisch nahezu nahtlos ein.',
    wirkung:
      'Absolutes Schwarz ohne Farbstich. Höchste Aufheizung aller Dachfarben – bei ausgebauten Dachgeschossen ist eine sorgfältig geplante Dämmung Pflicht. Staub und Pollen sind auf matten Schwarzbeschichtungen weniger sichtbar als auf glänzenden.',
    kombination:
      'Zu weißem Putz, Sichtbeton und Holz. Regenrinnen und Fallrohre in 9005 oder 7016.',
    aehnlich: ['9011', '8022', '7021'],
  },
  {
    code: '3009',
    slug: 'ral-3009',
    usage: 'Oxidrot – die Ziegelrot-Alternative für Dachpfannenprofil.',
    einsatz:
      'RAL 3009 Oxidrot ist bei Dachpfannenprofilen und Trapezblechen die gängigste rote Farbe. Sie wird gewählt, wenn ein Blechdach neben oder anstelle einer Ziegeleindeckung liegt.',
    wirkung:
      'Gedecktes, bräunliches Rot ohne Signalwirkung – deutlich ruhiger als 3000 Feuerrot. Kommt der Farbe eines verwitterten Tonziegels nahe und altert optisch gut.',
    kombination:
      'Zu Klinker, Naturstein und Holz. Kantteile üblicherweise im selben Ton, Regenrinnen in 8011 oder 3009.',
    aehnlich: ['3005', '8012', '3011'],
  },
  {
    code: '3005',
    slug: 'ral-3005',
    usage: 'Weinrot – dunkles Rot für Fassadenbänder und Nebengebäude.',
    einsatz:
      'RAL 3005 Weinrot findet sich an Hallenfassaden als Absetzfarbe und bei Nebengebäuden im ländlichen Raum. Als vollflächige Dachfarbe ist der Ton seltener als 3009.',
    wirkung:
      'Sehr dunkles, ins Violette gehendes Rot. Wirkt bei großen Flächen schwer, als schmales Fassadenband dagegen elegant.',
    kombination:
      'Zu 9002 und 7035 an Hallenfassaden ein klassisches Paar. Zu warmem Holz ebenfalls stimmig.',
    aehnlich: ['3009', '3004', '3011'],
  },
  {
    code: '3000',
    slug: 'ral-3000',
    usage: 'Feuerrot – Signalfarbe für Tore, Fassadenbänder und Sonderbauten.',
    einsatz:
      'RAL 3000 Feuerrot wird bei Toranlagen, Fassadenbändern und Sonderbauten eingesetzt, in denen ein kräftiger Farbakzent gewünscht ist. Für Dachflächen wird der Ton nur selten gewählt.',
    wirkung:
      'Kräftiges, reines Rot mit Signalwirkung. Rote Pigmente sind UV-empfindlicher als Erdtöne – auf südexponierten Flächen ist mit stärkerem Ausbleichen zu rechnen als bei 3009.',
    kombination:
      'Zu 9002, 9010 und 7035. Für großflächige Anwendungen eine Beschichtung mit erhöhter UV-Beständigkeit wählen.',
    aehnlich: ['3020', '3001', '3002'],
  },
  {
    code: '6005',
    slug: 'ral-6005',
    usage: 'Moosgrün – fügt Carports und Gartenhäuser in die Umgebung ein.',
    einsatz:
      'RAL 6005 Moosgrün ist bei Gartenhäusern, Carports, Gerätehütten und Anlagen im Landschaftsschutzgebiet verbreitet. Manche Bebauungspläne schreiben gedeckte Grüntöne für Nebenanlagen ausdrücklich vor.',
    wirkung:
      'Dunkles, gedecktes Grün. Vor Bäumen und Hecken verschwindet die Dachfläche optisch fast – genau deshalb wird der Ton in sensiblen Lagen verlangt.',
    kombination:
      'Zu unbehandeltem oder dunkel lasiertem Holz. Kantteile im selben Ton; Regenrinnen in Zink oder 6005.',
    aehnlich: ['6020', '6009', '6003'],
  },
  {
    code: '6020',
    slug: 'ral-6020',
    usage: 'Chromoxidgrün – gedecktes Grün für Hallen und landwirtschaftliche Bauten.',
    einsatz:
      'RAL 6020 Chromoxidgrün wird bei landwirtschaftlichen Hallen, Reithallen und Lagergebäuden eingesetzt und ist in vielen Regionen die zweite zulässige Farbe neben Braun.',
    wirkung:
      'Mattes, leicht graustichiges Grün. Weniger dunkel als 6005 und unempfindlich gegen Staub.',
    kombination:
      'Zu 9002 an der Fassade und zu Holzverschalungen. Sockelbleche gern in 7016.',
    aehnlich: ['6005', '6011', '6003'],
  },
  {
    code: '5010',
    slug: 'ral-5010',
    usage: 'Enzianblau – klassische Hallenfarbe für Fassadenbänder und Tore.',
    einsatz:
      'RAL 5010 Enzianblau ist die verbreitetste blaue Farbe im Hallenbau – für Fassadenbänder, Toranlagen und Sockelbereiche. Als Dachfarbe kommt sie bei Gewerbe- und Sportbauten vor.',
    wirkung:
      'Tiefes, sattes Blau ohne Grünstich. Wirkt auf großen Flächen kräftig und industriell.',
    kombination:
      'Der Standardpartner zu 9002 Grauweiß – die Kombination prägt tausende Gewerbehallen. Auch zu 7035 stimmig.',
    aehnlich: ['5013', '5002', '5003'],
  },
  {
    code: '1015',
    slug: 'ral-1015',
    usage: 'Hellelfenbein – heller Fassadenton, oft an Nebengebäuden und Hallen.',
    einsatz:
      'RAL 1015 Hellelfenbein wird an Fassadenverkleidungen, Sektionaltoren und Nebengebäuden verbaut. Bei Sandwichpaneelen ist der Ton eine gängige Alternative zu 9002.',
    wirkung:
      'Warmes, cremefarbenes Hell – weniger kühl als Grauweiß und daher zu älteren Putzfassaden passender. Hoher Reflexionsgrad, geringe Aufheizung.',
    kombination:
      'Zu braunen Kantteilen in 8011 oder 8017 und zu Holz. Zu 7016 ergibt sich ein moderner Kontrast.',
    aehnlich: ['9001', '1013', '9002'],
  },
];

/** Detailinfos zu einem Farbton, falls es eine eigene Unterseite gibt. */
export function dachfarbeZuCode(code: string): Dachfarbe | undefined {
  return DACHFARBEN.find((farbe) => farbe.code === code);
}

/** Verbindet die kuratierten Infos mit Name und Hex-Wert aus dem RAL-Katalog. */
export function dachfarbeMitFarbton(dachfarbe: Dachfarbe): Dachfarbe & Farbton {
  const farbton = RAL_FARBEN.find((farbe) => farbe.code === dachfarbe.code);

  if (!farbton) {
    throw new Error(`RAL ${dachfarbe.code} fehlt im Farbkatalog (src/data/farben.ts)`);
  }

  return { ...dachfarbe, ...farbton };
}

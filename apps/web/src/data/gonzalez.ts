import type { Person } from "@workspace/family-tree";

/**
 * The González Lago family, transcribed from the working document.
 *
 * People whose name is unknown are bracketed and described by their link
 * ("[Pareja de Ramona]") rather than given a generic placeholder, so the card
 * still says something. Names and places are left in Spanish — they are proper
 * nouns. `datosPendientes` collects what the document still marks as missing.
 */
export const gonzalezLago: Person[] = [
  /* ── Castro ancestors ─────────────────────────────────────────────── */
  { id: "alfredo-castro", name: "Alfredo Castro", sex: "male" },
  {
    id: "la-ferrolana",
    name: "[Esposa de Alfredo]",
    sex: "female",
    nickname: "la Ferrolana",
    partnerIds: ["alfredo-castro"],
  },
  {
    id: "ramona-castro",
    name: "Ramona Castro",
    sex: "female",
    parentIds: ["alfredo-castro", "la-ferrolana"],
  },
  {
    id: "pareja-ramona",
    name: "[Pareja de Ramona]",
    sex: "male",
    nickname: "se fue a Argentina",
    partnerIds: ["ramona-castro"],
  },
  {
    id: "juan-castro",
    // Hijo de Alfredo Castro, luego primer apellido Castro.
    name: "Juan Castro",
    sex: "male",
    nickname: "señor Juan",
    parentIds: ["alfredo-castro", "la-ferrolana"],
  },
  {
    id: "flora-toupa",
    name: "Flora",
    nickname: "A Toupa",
    sex: "female",
    partnerIds: ["juan-castro"],
  },

  /* ── Domínguez Pombo ancestors ────────────────────────────────────── */
  {
    id: "adolfo-dominguez-fernandez",
    name: "Adolfo Domínguez Fernández",
    sex: "male",
  },
  {
    id: "dorinda-pombo-otero",
    name: "Dorinda Pombo Otero",
    sex: "female",
    partnerIds: ["adolfo-dominguez-fernandez"],
  },

  /* ── Otero Lorenzo ancestors ──────────────────────────────────────── */
  { id: "carmen-lorenzo", name: "Carmen Lorenzo", sex: "female" },
  {
    id: "padre-delia",
    name: "[Padre de Delia]",
    sex: "male",
    partnerIds: ["carmen-lorenzo"],
  },

  /* ── José Castro Castro + Carmen Domínguez Pombo ────────────────────── */
  {
    id: "jose-castro-castro",
    name: "José Castro Castro",
    sex: "male",
    birth: { date: "1928-02-28", place: "Dena, Meaño" },
    death: { date: "2006-04-06", place: "Dena, Meaño" },
    location: "Dena, Meaño",
    parentIds: ["ramona-castro", "pareja-ramona"],
  },
  {
    id: "carmen-dominguez-pombo",
    name: "Carmen Domínguez Pombo",
    sex: "female",
    birth: { date: "1935-06-24", place: "Dena, Meaño" },
    death: { date: "2004-06-27", place: "Dena, Meaño" },
    location: "Dena, Meaño",
    parentIds: ["adolfo-dominguez-fernandez", "dorinda-pombo-otero"],
    partnerIds: ["jose-castro-castro"],
  },

  /* ── Carmen Domínguez Pombo's siblings ─────────────────────────────── */
  {
    id: "jose-dominguez-pombo",
    name: "José Domínguez Pombo",
    sex: "male",
    nickname: "Tío Pepe",
    parentIds: ["adolfo-dominguez-fernandez", "dorinda-pombo-otero"],
  },
  {
    id: "regina-pineiro",
    name: "Regina Piñeiro",
    sex: "female",
    partnerIds: ["jose-dominguez-pombo"],
  },
  {
    id: "soledad-dominguez-pombo",
    name: "Soledad Domínguez Pombo",
    nickname: "Ducha",
    sex: "female",
    parentIds: ["adolfo-dominguez-fernandez", "dorinda-pombo-otero"],
  },
  {
    id: "pepe-chacarelo",
    name: "José Novas Chacarelo",
    sex: "male",
    nickname: "Pepe Chacarelo",
    partnerIds: ["soledad-dominguez-pombo"],
  },
  {
    id: "adolfo-dominguez-pombo",
    name: "Adolfo Domínguez Pombo",
    sex: "male",
    location: "Brasil",
    parentIds: ["adolfo-dominguez-fernandez", "dorinda-pombo-otero"],
  },
  {
    id: "tia-elvira",
    name: "Elvira",
    sex: "female",
    nickname: "Tía Elvira",
    partnerIds: ["adolfo-dominguez-pombo"],
  },
  {
    id: "manuel-dominguez-pombo",
    name: "Manuel Domínguez Pombo",
    sex: "male",
    parentIds: ["adolfo-dominguez-fernandez", "dorinda-pombo-otero"],
  },
  {
    id: "tia-mucha",
    name: "[Esposa de Manuel]",
    sex: "female",
    nickname: "Tía Mucha",
    partnerIds: ["manuel-dominguez-pombo"],
  },

  /* ── González Otero ─────────────────────────────────────────────────── */
  {
    id: "eliseo-gonzalez-otero",
    name: "Eliseo González Otero",
    nickname: "Perfeuto",
    sex: "male",
  },
  {
    id: "delia-otero-lorenzo",
    name: "Delia Otero Lorenzo",
    sex: "female",
    parentIds: ["padre-delia", "carmen-lorenzo"],
    partnerIds: ["eliseo-gonzalez-otero"],
  },

  /* ── González Iglesias (paternal line) ───────────────────────────────── */
  {
    id: "alfonso-gonzalez-vidal",
    name: "Alfonso González Vidal",
    sex: "male",
    location: "Vigo, Pontevedra",
  },
  /* ── Iglesias del Pazo ──────────────────────────────────────────────── */
  {
    // Sin nombre en el documento. Existe en el árbol porque es la única forma
    // de que Mary y Fernando salgan como hermanos: el parentesco se deriva de
    // los padres compartidos. Primer apellido Iglesias, por el de sus hijos.
    id: "fernando-iglesias", // Fernando Iglesias del Pazo
    name: "Fernando? Iglesias",
    sex: "male",
  },
  {
    // Igual que el anterior; su primer apellido es del Pazo.
    id: "aurita-del-pazo",
    name: "Aurita del Pazo",
    sex: "female",
    partnerIds: ["fernando-iglesias"],
  },
  {
    id: "fernando-iglesias",
    // Hermano de Mary, luego mismos dos apellidos.
    name: "Fernando Iglesias del Pazo",
    sex: "male",
    parentIds: ["fernando-iglesias", "aurita-del-pazo"],
  },

  {
    id: "carmen-iglesias-pazo",
    name: "María del Carmen Iglesias del Pazo",
    nickname: "Mary",
    birth: { date: "1939-07-22", place: "Vigo, Pontevedra" },
    death: { date: "2024-12-12", place: "Vigo, Pontevedra" },
    sex: "female",
    location: "Vigo, Pontevedra",
    parentIds: ["fernando-iglesias", "aurita-del-pazo"],
    partnerIds: ["alfonso-gonzalez-vidal"],
  },

  /* ── Lago Carrera (maternal line) ────────────────────────────────────── */
  {
    id: "pepe-lago", // Primer apellido deducido: su hija es María Dolores Lago Carrera.
    name: "José Lago",
    nickname: "Pepe",
    sex: "male",
    location: "Vigo, Pontevedra",
  },
  {
    id: "margarita",
    // Primer apellido deducido del segundo de sus hijas (Lago Carrera).
    name: "Margarita Carrera",
    sex: "female",
    location: "Vigo, Pontevedra",
    partnerIds: ["pepe-lago"],
  },

  /* ── Children of José Castro Castro and Carmen Domínguez Pombo ───────────── */
  {
    id: "palmira-castro",
    name: "Palmira Castro Domínguez",
    nickname: "Palmi",
    sex: "female",
    birth: { date: "1956-12-20", place: "Dena, Meaño" },
    location: "Dena, Meaño",
    parentIds: ["jose-castro-castro", "carmen-dominguez-pombo"],
  },
  {
    id: "manuel-gonzalez-otero",
    name: "Manuel González Otero",
    nickname: "Manolo",
    sex: "male",
    birth: { date: "1953-12-03", place: "Aios, Sanxenxo" },
    location: "Aios, Sanxenxo",
    parentIds: ["eliseo-gonzalez-otero", "delia-otero-lorenzo"],
    partnerIds: ["palmira-castro"],
  },
  {
    id: "mario-castro",
    name: "Mario Castro Domínguez",
    birth: { date: "1963", place: "Dena, Meaño" },
    location: "Dena, Meaño",
    sex: "male",
    parentIds: ["jose-castro-castro", "carmen-dominguez-pombo"],
  },
  {
    id: "teresa-carballa",
    name: "Teresa Carballa",
    nickname: "Tere",
    birth: { date: "1963", place: "Dena, Meaño" },
    sex: "female",
    partnerIds: ["mario-castro"],
  },
  {
    id: "jose-manuel-castro",
    name: "José Manuel Castro Domínguez",
    birth: { date: "1952", place: "Dena, Meaño" },
    sex: "male",
    location: "Tailfingen, DE",
    parentIds: ["jose-castro-castro", "carmen-dominguez-pombo"],
  },
  {
    id: "lourdes-chantrero",
    name: "Lourdes Chantrero Barreiro",
    sex: "female",
    partnerIds: ["jose-manuel-castro"],
  },
  {
    id: "carmina-castro",
    name: "Carmen Castro Domínguez",
    nickname: "Carmiña",
    birth: { date: "1959-12-12", place: "Dena, Meaño" },
    death: { date: "2005", place: "Sanxenxo, Pontevedra" },
    sex: "female",
    parentIds: ["jose-castro-castro", "carmen-dominguez-pombo"],
  },
  {
    id: "francisco-perez-sineiro",
    name: "Francisco Javier Pérez Sineiro",
    nickname: "Paco",
    location: "Sanxenxo, Pontevedra",
    sex: "male",
    partnerIds: ["carmina-castro"],
  },

  /* ── Manuel González Otero's sister ───────────────────────────────── */
  {
    id: "carmen-gonzalez-otero",
    name: "Carmen González Otero",
    nickname: "Mucha",
    sex: "female",
    parentIds: ["eliseo-gonzalez-otero", "delia-otero-lorenzo"],
  },
  {
    id: "vicente-dominguez-chan",
    name: "Vicente Domínguez Chan",
    nickname: "Tuco",
    sex: "male",
    partnerIds: ["carmen-gonzalez-otero"],
  },

  /* ── Children of José Domínguez Pombo (Inelsa) ─────────────────────────── */
  {
    id: "jose-carlos",
    name: "José Carlos Domínguez Piñeiro",
    sex: "male",
    parentIds: ["jose-dominguez-pombo", "regina-pineiro"],
  },
  {
    id: "manuel-dominguez-pineiro",
    name: "Manuel Domínguez Piñeiro",
    nickname: "Manolito",
    sex: "male",
    parentIds: ["jose-dominguez-pombo", "regina-pineiro"],
  },
  {
    id: "jorge-dominguez-pineiro",
    name: "Jorge Domínguez Piñeiro",
    sex: "male",
    parentIds: ["jose-dominguez-pombo", "regina-pineiro"],
  },
  {
    id: "margo",
    // Hermana de los Domínguez Piñeiro.
    name: "Margó Domínguez Piñeiro",
    sex: "female",
    parentIds: ["jose-dominguez-pombo", "regina-pineiro"],
  },
  {
    id: "rafael-dominguez-pineiro",
    name: "Rafael Domínguez Piñeiro",
    nickname: "Rafa",
    sex: "male",
    parentIds: ["jose-dominguez-pombo", "regina-pineiro"],
  },

  /* ── Soledad Domínguez Pombo's daughters ───────────────────────────────── */
  {
    id: "marisol",
    name: "Marisol Novas Domínguez",
    sex: "female",
    parentIds: ["soledad-dominguez-pombo", "pepe-chacarelo"],
  },
  {
    id: "milagros",
    name: "Milagros Novas Domínguez",
    sex: "female",
    parentIds: ["soledad-dominguez-pombo", "pepe-chacarelo"],
  },

  /* ── Adolfo Domínguez Pombo's children ────────────────────────────────── */
  {
    id: "eliane",
    name: "Eliane",
    sex: "female",
    parentIds: ["adolfo-dominguez-pombo", "tia-elvira"],
  },
  {
    id: "adolfinho",
    name: "Adolfinho",
    sex: "male",
    parentIds: ["adolfo-dominguez-pombo", "tia-elvira"],
  },
  {
    id: "hijo-adolfo-3",
    name: "[Hijo de Adolfo]",
    sex: "unknown",
    parentIds: ["adolfo-dominguez-pombo", "tia-elvira"],
  },
  {
    id: "hijo-adolfo-4",
    name: "[Hijo de Adolfo]",
    sex: "unknown",
    parentIds: ["adolfo-dominguez-pombo", "tia-elvira"],
  },

  /* ── Manuel Domínguez Pombo's daughter ─────────────────────────────────── */
  {
    id: "raquel",
    // Hija de Manuel Domínguez Pombo; falta el apellido materno.
    name: "Raquel Domínguez",
    sex: "female",
    location: "Valladolid",
    parentIds: ["manuel-dominguez-pombo", "tia-mucha"],
  },

  /* ── González Iglesias / Lago Carrera ───────────────────────────────── */
  {
    id: "alfonso-gonzalez-iglesias",
    name: "Alfonso González Iglesias",
    nickname: "Fonsi",
    sex: "male",
    birth: { date: "1963-09-08", place: "Vigo, Pontevedra" },
    location: "Vigo, Pontevedra",
    parentIds: ["alfonso-gonzalez-vidal", "carmen-iglesias-pazo"],
  },
  {
    id: "mdolores-lago-carrera",
    name: "María Dolores Lago Carrera",
    nickname: "Loly",
    sex: "female",
    birth: { date: "1966-09-25", place: "Vigo, Pontevedra" },
    location: "Vigo, Pontevedra",
    parentIds: ["pepe-lago", "margarita"],
    partnerIds: ["alfonso-gonzalez-iglesias"],
  },
  {
    id: "maica",
    name: "María del Carmen González Iglesias",
    sex: "female",
    nickname: "Maica",
    location: "Vigo, Pontevedra",
    parentIds: ["alfonso-gonzalez-vidal", "carmen-iglesias-pazo"],
  },
  { id: "julio", name: "Julio", sex: "male", partnerIds: ["maica"] },

  /* ── María Dolores Lago Carrera's sisters ─────────────────────────── */
  {
    id: "fita",
    // Hermana de María Dolores Lago Carrera: mismos dos apellidos.
    name: "Josefa Lago Carrera",
    nickname: "Fita",
    sex: "female",
    parentIds: ["pepe-lago", "margarita"],
  },
  {
    id: "jose-paradela",
    name: "Jose Paradela",
    sex: "male",
    partnerIds: ["fita"],
  },
  {
    id: "marita",
    // Hermana de María Dolores Lago Carrera: mismos dos apellidos.
    name: "Marita Lago Carrera",
    sex: "female",
    // Deceased; the document records no dates.
    death: {},
    parentIds: ["pepe-lago", "margarita"],
  },

  /* ── Children of Palmira and Manuel ──────────────────────────────────────── */
  {
    id: "ricardo-gonzalez-castro",
    name: "Ricardo González Castro",
    nickname: "Rick",
    birth: { date: "1979-10-15", place: "Sanxenxo, Pontevedra" },
    location: "London, UK",
    sex: "male",
    parentIds: ["manuel-gonzalez-otero", "palmira-castro"],
  },
  {
    id: "yago-gonzalez-castro",
    name: "Yago González Castro",
    birth: { date: "1988-01-29", place: "Sanxenxo, Pontevedra" },
    location: "London, UK",
    sex: "male",
    parentIds: ["manuel-gonzalez-otero", "palmira-castro"],
  },

  /* ── Children of Mario and Teresa ────────────────────────────────────────── */
  {
    id: "oscar-castro-carballa",
    name: "Óscar Castro Carballa",
    sex: "male",
    birth: { date: "1983", place: "Dena, Meaño" },
    parentIds: ["mario-castro", "teresa-carballa"],
  },
  {
    id: "beatriz",
    name: "Beatriz",
    nickname: "Bea",
    sex: "female",
    partnerIds: ["oscar-castro-carballa"],
  },
  {
    id: "sergio-castro-carballa",
    name: "Sergio Castro Carballa",
    birth: { date: "1998", place: "Dena, Meaño" },
    sex: "male",
    parentIds: ["mario-castro", "teresa-carballa"],
  },

  /* ── Son of José Manuel and Lourdes ──────────────────────────────────── */
  {
    id: "victor-castro-chantrero",
    name: "Víctor Javier Castro Chantrero",
    sex: "male",
    parentIds: ["jose-manuel-castro", "lourdes-chantrero"],
    partnerships: [
      { partnerId: "nicole", status: "separated" },
      { partnerId: "daniela", status: "partnership" },
    ],
  },
  {
    id: "nicole", // Primer apellido deducido de su hija, Julia Castro Weisman.
    name: "Nicole Weisman",
    sex: "female",
  },
  { id: "daniela", name: "Daniela", sex: "female" },

  /* ── Children of Carmiña and Francisco Javier ────────────────────────────── */
  {
    id: "fernando-perez-castro",
    name: "Fernando Pérez Castro",
    nickname: "Fer",
    sex: "male",
    birth: { date: "1979-09-11", place: "Sanxenxo, Pontevedra" },
    location: "Sanxenxo, Pontevedra",
    parentIds: ["carmina-castro", "francisco-perez-sineiro"],
  },
  {
    id: "esposa-fernando",
    name: "[Esposa de Fernando]",
    sex: "female",
    location: "Cuba",
    partnerIds: ["fernando-perez-castro"],
  },
  {
    id: "bruno-perez-castro",
    name: "Bruno Pérez Castro",
    sex: "male",
    birth: { date: "1983", place: "Sanxenxo, Pontevedra" },
    location: "Sanxenxo, Pontevedra",
    parentIds: ["carmina-castro", "francisco-perez-sineiro"],
  },
  {
    id: "noelia-parada",
    name: "Noelia Parada",
    sex: "female",
    location: "Sanxenxo, Pontevedra",
    partnerIds: ["bruno-perez-castro"],
  },

  /* ── Children of Carmen González Otero and Vicente Domínguez Chan ────────── */
  {
    id: "jorge-dominguez-gonzalez",
    name: "Jorge Domínguez González",
    location: "Sanxenxo, Pontevedra",
    sex: "male",
    parentIds: ["vicente-dominguez-chan", "carmen-gonzalez-otero"],
  },
  {
    id: "estibaliz-virto",
    name: "Estíbaliz Virto Martínez",
    nickname: "Esty",
    location: "Sanxenxo, Pontevedra",
    sex: "female",
    partnerIds: ["jorge-dominguez-gonzalez"],
  },
  {
    id: "carlos-dominguez-gonzalez",
    name: "Carlos Domínguez González",
    sex: "male",
    parentIds: ["vicente-dominguez-chan", "carmen-gonzalez-otero"],
  },
  {
    id: "maria-jose",
    name: "María José",
    sex: "female",
    partnerIds: ["carlos-dominguez-gonzalez"],
  },
  {
    id: "monse-dominguez-gonzalez",
    name: "Montserrat Domínguez González",
    nickname: "Montse",
    sex: "female",
    parentIds: ["vicente-dominguez-chan", "carmen-gonzalez-otero"],
  },
  {
    id: "luis-o-pito",
    name: "Luis",
    sex: "male",
    nickname: "O Pito",
    partnerIds: ["monse-dominguez-gonzalez"],
  },
  {
    id: "vicente-dominguez-gonzalez",
    name: "Vicente Domínguez González",
    sex: "male",
    parentIds: ["vicente-dominguez-chan", "carmen-gonzalez-otero"],
  },
  {
    id: "elvira-vizoso",
    name: "Elvira Vizoso",
    sex: "female",
    partnerIds: ["vicente-dominguez-gonzalez"],
  },

  /* ── González Lago ──────────────────────────────────────────────────── */
  {
    id: "mdolores-gonzalez-lago",
    name: "María Dolores González Lago",
    nickname: "Loli",
    sex: "female",
    birth: { date: "1987-10-26", place: "Vigo, Pontevedra" },
    location: "London, UK",
    parentIds: ["alfonso-gonzalez-iglesias", "mdolores-lago-carrera"],
    partnerIds: ["ricardo-gonzalez-castro"],
  },
  {
    id: "vanesa-gonzalez-lago",
    name: "Vanesa González Lago",
    nickname: "Vane",
    birth: { date: "1989-07-27", place: "Vigo, Pontevedra" },
    location: "Vigo, Pontevedra",
    sex: "female",
    parentIds: ["alfonso-gonzalez-iglesias", "mdolores-lago-carrera"],
  },
  {
    id: "jorge-fernandez-fernandez",
    name: "Jorge Fernández Fernández",
    nickname: "Jito",
    location: "Vigo, Pontevedra",
    sex: "male",
    partnerIds: ["vanesa-gonzalez-lago"],
  },

  /* ── Children of Maica and Julio ─────────────────────────────────────────── */
  {
    id: "yago-gonzalez-iglesias",
    name: "Yago",
    sex: "male",
    location: "Vigo, Pontevedra",
    parentIds: ["maica", "julio"],
  },
  {
    id: "brais",
    name: "Brais",
    sex: "male",
    location: "Vigo, Pontevedra",
    parentIds: ["maica", "julio"],
  },

  /* ── Children of Fita and Jose Paradela ──────────────────────────────────── */
  {
    id: "cristina-paradela-lago",
    name: "Cristina Paradela Lago",
    sex: "female",
    parentIds: ["fita", "jose-paradela"],
  },
  {
    id: "ruben",
    name: "Rubén",
    sex: "male",
    partnerIds: ["cristina-paradela-lago"],
  },
  {
    id: "jose-paradela-lago",
    name: "Jose Paradela Lago",
    sex: "male",
    parentIds: ["fita", "jose-paradela"],
  },

  /* ── Marita's daughter ─────────────────────────────────────────────────── */
  { id: "lorena", name: "Lorena", sex: "female", parentIds: ["marita"] },

  /* ── Youngest generation ──────────────────────────────────────────────── */
  {
    id: "david-gonzalez-gonzalez",
    name: "David González González",
    sex: "male",
    birth: { date: "2018-11-01", place: "London, UK" },
    parentIds: ["ricardo-gonzalez-castro", "mdolores-gonzalez-lago"],
  },
  {
    id: "lucas-gonzalez-gonzalez",
    name: "Lucas González González",
    sex: "male",
    birth: { date: "2023-01-13", place: "London, UK" },
    parentIds: ["ricardo-gonzalez-castro", "mdolores-gonzalez-lago"],
  },
  {
    id: "martin-fernandez-gonzalez",
    name: "Martín Fernández González",
    sex: "male",
    birth: { date: "2026", place: "Vigo, Pontevedra" },
    parentIds: ["jorge-fernandez-fernandez", "vanesa-gonzalez-lago"],
  },
  {
    id: "olivia-castro",
    name: "Olivia Castro",
    sex: "female",
    birth: { date: "2019" },
    location: "Dena, ES",
    parentIds: ["oscar-castro-carballa", "beatriz"],
  },
  {
    id: "julia-castro-weisman",
    name: "Julia Castro Weisman",
    sex: "female",
    parentIds: ["victor-castro-chantrero", "nicole"],
  },
  {
    id: "roi",
    name: "Roi",
    sex: "male",
    parentIds: ["cristina-paradela-lago", "ruben"],
  },
  {
    id: "hija-vicente",
    name: "[Hija de Vicente]",
    sex: "female",
    parentIds: ["vicente-dominguez-gonzalez", "elvira-vizoso"],
  },
  {
    id: "bebe-vicente",
    name: "[Bebé en camino]",
    sex: "unknown",
    parentIds: ["vicente-dominguez-gonzalez", "elvira-vizoso"],
  },
  {
    id: "claudia",
    // Hija de Carlos Domínguez González; falta el apellido materno.
    name: "Claudia Domínguez",
    sex: "female",
    parentIds: ["carlos-dominguez-gonzalez", "maria-jose"],
  },
  {
    id: "carlitos",
    // Hijo de Carlos Domínguez González; falta el apellido materno.
    name: "Carlitos Domínguez",
    sex: "male",
    parentIds: ["carlos-dominguez-gonzalez", "maria-jose"],
  },
  {
    id: "hijo-lorena",
    name: "[Hijo de Lorena]",
    sex: "unknown",
    parentIds: ["lorena"],
  },
];

/**
 * Deducciones del sistema de dos apellidos que NO se han aplicado, porque solo
 * se conoce el apellido materno: escribirlo solo haría que se leyera como
 * paterno, que es peor que dejarlo incompleto.
 */
export const apellidosDeducidos = [
  "Roi: segundo apellido Paradela (hijo de Cristina Paradela Lago).",
  "Yago y Brais: segundo apellido González (hijos de Maica, González Iglesias).",
  "Lorena: segundo apellido Lago (hija de Marita Lago Carrera).",
  "Hijo de Lorena: segundo apellido, el primero de Lorena.",
  "[Padre de Delia]: su primer apellido es Otero, por Delia Otero Lorenzo.",
  "Hija y bebé de Vicente: apellidos Domínguez Vizoso.",
  "Eliane y Adolfinho: en Brasil el orden se invierte (materno y luego paterno), así que la regla española no aplica.",
];

/** Cosas que no cuadran y conviene confirmar antes de darlas por buenas. */
export const dudasPorConfirmar = [
  "José Castro Castro lleva Castro por partida doble: o el padre que se fue a Argentina también era Castro, o se le inscribió repitiendo el apellido materno por no constar padre.",
  "José Castro Castro (1928) y Carmen Domínguez Pombo (1935) no tienen fecha de defunción; si han fallecido, añadirla evita que se les calcule la edad de hoy.",
];

/** What the document explicitly still lists as missing. */
export const datosPendientes = [
  "Zonas de origen de más miembros de la rama de Palmira.",
  "Primer apellido de Beatriz, que es el segundo de Olivia.",
  "Pareja de Jose Paradela Lago.",
  "Pareja de Marita.",
  "Pareja e hijo de Lorena.",
  "Padre de Delia Otero Lorenzo.",
  "Padres de Eliseo González Otero.",
  "Nombre del hombre que fue pareja de Ramona Castro y se fue a Argentina.",
  "Dos hijos desconocidos de Adolfo Domínguez Pombo.",
  "Nombre de la hija de Vicente Domínguez González y Elvira Vizoso.",
  "Nombre de la esposa cubana de Fernando Pérez Castro.",
  "Más información de las ramas de José, Soledad y Manuel Domínguez Pombo.",
  "Fechas de nacimiento, matrimonio y fallecimiento.",
];

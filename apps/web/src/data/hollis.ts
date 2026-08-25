import type { Person } from "@workspace/family-tree"

/**
 * The Hollis–Adeyemi family — invented for the demo, and deliberately messy:
 * a remarriage with half-siblings, a step-parent, an adoption, partners who
 * married in from outside, and four generations to colour by.
 */
export const hollis: Person[] = [
  /* ------------------------------ generation 1 ----------------------------- */
  {
    id: "walter",
    name: "Walter Hollis",
    sex: "male",
    birth: { date: "1931", place: "Bristol" },
    death: { date: "2009" },
    location: "Bristol, UK",
  },
  {
    id: "marguerite",
    name: "Marguerite Hollis",
    sex: "female",
    nickname: "Margo",
    birth: { date: "1934", place: "Lyon" },
    death: { date: "2018" },
    partnerIds: ["walter"],
    location: "Bristol, UK",
  },
  {
    id: "olufemi",
    name: "Olufemi Adeyemi",
    sex: "male",
    birth: { date: "1929", place: "Ibadan" },
    death: { date: "2001" },
    location: "Ibadan, NG",
  },
  {
    id: "yetunde",
    name: "Yetunde Adeyemi",
    sex: "female",
    birth: { date: "1936" },
    partnerships: [{ partnerId: "olufemi", status: "married", since: "1955" }],
    location: "Lagos, NG",
  },

  /* ------------------------------ generation 2 ----------------------------- */
  {
    id: "colin",
    name: "Colin Hollis",
    sex: "male",
    birth: { date: "1958" },
    parentIds: ["walter", "marguerite"],
    partnerships: [
      {
        partnerId: "rosalind",
        status: "divorced",
        since: "1981",
        until: "1994",
      },
      { partnerId: "sunita", status: "married", since: "1998" },
    ],
    location: "Manchester, UK",
  },
  {
    id: "rosalind",
    name: "Rosalind Vance",
    sex: "female",
    birth: { date: "1960" },
    location: "Edinburgh, UK",
  },
  {
    id: "sunita",
    name: "Sunita Rao",
    sex: "female",
    birth: { date: "1966" },
    location: "Manchester, UK",
  },
  {
    id: "helena",
    name: "Helena Hollis",
    sex: "female",
    birth: { date: "1962" },
    parentIds: ["walter", "marguerite"],
    partnerIds: ["tunde"],
    location: "London, UK",
  },
  {
    id: "tunde",
    name: "Tunde Adeyemi",
    sex: "male",
    birth: { date: "1961" },
    parentIds: ["olufemi", "yetunde"],
    location: "London, UK",
  },
  {
    id: "bisi",
    name: "Bisi Adeyemi",
    sex: "female",
    birth: { date: "1964" },
    parentIds: ["olufemi", "yetunde"],
    location: "Lagos, NG",
  },

  /* ------------------------------ generation 3 ----------------------------- */
  {
    id: "iris",
    name: "Iris Hollis",
    sex: "female",
    nickname: "Ri",
    birth: { date: "1984" },
    parentIds: ["colin", "rosalind"],
    partnerIds: ["mateo"],
    location: "Lisbon, PT",
  },
  {
    id: "mateo",
    name: "Mateo Ferreira",
    sex: "male",
    birth: { date: "1982" },
    location: "Lisbon, PT",
  },
  {
    id: "dev",
    name: "Dev Hollis",
    sex: "male",
    birth: { date: "2001" },
    parentIds: ["colin", "sunita"],
    location: "Manchester, UK",
  },
  {
    id: "ayo",
    name: "Ayo Adeyemi-Hollis",
    sex: "male",
    birth: { date: "1989" },
    parentIds: ["helena", "tunde"],
    location: "Berlin, DE",
  },
  {
    id: "nkem",
    name: "Nkem Adeyemi-Hollis",
    sex: "other",
    nickname: "Kem",
    birth: { date: "1992" },
    parentIds: ["helena", "tunde"],
    partnerships: [{ partnerId: "jo", status: "partnership", since: "2019" }],
    location: "Berlin, DE",
  },
  {
    id: "jo",
    name: "Jo Lindqvist",
    sex: "other",
    birth: { date: "1991" },
    location: "Berlin, DE",
  },
  {
    id: "femi",
    name: "Femi Okafor",
    sex: "male",
    birth: { date: "1990" },
    parentIds: ["bisi"],
    location: "Lagos, NG",
  },

  /* ------------------------------ generation 4 ----------------------------- */
  {
    id: "sofia",
    name: "Sofia Ferreira",
    sex: "female",
    birth: { date: "2012" },
    parentIds: ["iris", "mateo"],
    location: "Lisbon, PT",
  },
  {
    id: "luca",
    name: "Luca Ferreira",
    sex: "male",
    birth: { date: "2015" },
    parentIds: ["iris", "mateo"],
    location: "Lisbon, PT",
  },
  {
    id: "esme",
    name: "Esme Lindqvist",
    sex: "female",
    birth: { date: "2021" },
    parentIds: ["nkem", "jo"],
    location: "Berlin, DE",
  },
]

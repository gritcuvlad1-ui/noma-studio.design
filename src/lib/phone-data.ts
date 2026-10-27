export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "MD", name: "Moldova", dial: "373", flag: "/flags/md.svg" },
  { code: "RO", name: "România", dial: "40", flag: "/flags/ro.svg" },
  { code: "IT", name: "Italia", dial: "39", flag: "/flags/it.svg" },
  { code: "UA", name: "Ucraina", dial: "380", flag: "/flags/ua.svg" },
  { code: "DE", name: "Germania", dial: "49", flag: "/flags/de.svg" },
  { code: "FR", name: "Franța", dial: "33", flag: "/flags/fr.svg" },
  { code: "GB", name: "Regatul Unit", dial: "44", flag: "/flags/gb.svg" },
  { code: "ES", name: "Spania", dial: "34", flag: "/flags/es.svg" },
  { code: "CH", name: "Elveția", dial: "41", flag: "/flags/ch.svg" },
  { code: "US", name: "Statele Unite", dial: "1", flag: "/flags/us.svg" },
  { code: "AE", name: "Emiratele Arabe Unite", dial: "971", flag: "/flags/ae.svg" },
  { code: "AT", name: "Austria", dial: "43", flag: "/flags/at.svg" },
  { code: "BE", name: "Belgia", dial: "32", flag: "/flags/be.svg" },
  { code: "BG", name: "Bulgaria", dial: "359", flag: "/flags/bg.svg" },
  { code: "CA", name: "Canada", dial: "1", flag: "/flags/ca.svg" },
  { code: "CY", name: "Cipru", dial: "357", flag: "/flags/cy.svg" },
  { code: "CZ", name: "Cehia", dial: "420", flag: "/flags/cz.svg" },
  { code: "DK", name: "Danemarca", dial: "45", flag: "/flags/dk.svg" },
  { code: "EE", name: "Estonia", dial: "372", flag: "/flags/ee.svg" },
  { code: "FI", name: "Finlanda", dial: "358", flag: "/flags/fi.svg" },
  { code: "GR", name: "Grecia", dial: "30", flag: "/flags/gr.svg" },
  { code: "HR", name: "Croația", dial: "385", flag: "/flags/hr.svg" },
  { code: "HU", name: "Ungaria", dial: "36", flag: "/flags/hu.svg" },
  { code: "IE", name: "Irlanda", dial: "353", flag: "/flags/ie.svg" },
  { code: "IL", name: "Israel", dial: "972", flag: "/flags/il.svg" },
  { code: "LU", name: "Luxemburg", dial: "352", flag: "/flags/lu.svg" },
  { code: "MC", name: "Monaco", dial: "377", flag: "/flags/mc.svg" },
  { code: "NL", name: "Olanda", dial: "31", flag: "/flags/nl.svg" },
  { code: "NO", name: "Norvegia", dial: "47", flag: "/flags/no.svg" },
  { code: "PL", name: "Polonia", dial: "48", flag: "/flags/pl.svg" },
  { code: "PT", name: "Portugalia", dial: "351", flag: "/flags/pt.svg" },
  { code: "QA", name: "Qatar", dial: "974", flag: "/flags/qa.svg" },
  { code: "SA", name: "Arabia Saudită", dial: "966", flag: "/flags/sa.svg" },
  { code: "SE", name: "Suedia", dial: "46", flag: "/flags/se.svg" },
  { code: "SI", name: "Slovenia", dial: "386", flag: "/flags/si.svg" },
  { code: "SK", name: "Slovacia", dial: "421", flag: "/flags/sk.svg" },
  { code: "TR", name: "Turcia", dial: "90", flag: "/flags/tr.svg" },
  { code: "AU", name: "Australia", dial: "61", flag: "/flags/au.svg" },
  { code: "BR", name: "Brazilia", dial: "55", flag: "/flags/br.svg" },
  { code: "CN", name: "China", dial: "86", flag: "/flags/cn.svg" },
  { code: "JP", name: "Japonia", dial: "81", flag: "/flags/jp.svg" },
  { code: "KZ", name: "Kazahstan", dial: "7", flag: "/flags/kz.svg" },
  { code: "MT", name: "Malta", dial: "356", flag: "/flags/mt.svg" },
  { code: "RU", name: "Rusia", dial: "7", flag: "/flags/ru.svg" },
  { code: "RS", name: "Serbia", dial: "381", flag: "/flags/rs.svg" },
  { code: "SG", name: "Singapore", dial: "65", flag: "/flags/sg.svg" },
  { code: "TH", name: "Thailanda", dial: "66", flag: "/flags/th.svg" },
  { code: "VN", name: "Vietnam", dial: "84", flag: "/flags/vn.svg" },
];

export const DEFAULT_COUNTRY =
  COUNTRIES.find((country) => country.code === "MD") ?? COUNTRIES[0];

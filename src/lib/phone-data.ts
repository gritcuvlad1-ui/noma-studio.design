export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "MD", name: "Moldova", dial: "373", flag: "https://flagcdn.com/md.svg" },
  { code: "RO", name: "România", dial: "40", flag: "https://flagcdn.com/ro.svg" },
  { code: "IT", name: "Italia", dial: "39", flag: "https://flagcdn.com/it.svg" },
  { code: "UA", name: "Ucraina", dial: "380", flag: "https://flagcdn.com/ua.svg" },
  { code: "DE", name: "Germania", dial: "49", flag: "https://flagcdn.com/de.svg" },
  { code: "FR", name: "Franța", dial: "33", flag: "https://flagcdn.com/fr.svg" },
  { code: "GB", name: "Regatul Unit", dial: "44", flag: "https://flagcdn.com/gb.svg" },
  { code: "ES", name: "Spania", dial: "34", flag: "https://flagcdn.com/es.svg" },
  { code: "CH", name: "Elveția", dial: "41", flag: "https://flagcdn.com/ch.svg" },
  { code: "US", name: "Statele Unite", dial: "1", flag: "https://flagcdn.com/us.svg" },
  { code: "AE", name: "Emiratele Arabe Unite", dial: "971", flag: "https://flagcdn.com/ae.svg" },
  { code: "AT", name: "Austria", dial: "43", flag: "https://flagcdn.com/at.svg" },
  { code: "BE", name: "Belgia", dial: "32", flag: "https://flagcdn.com/be.svg" },
  { code: "BG", name: "Bulgaria", dial: "359", flag: "https://flagcdn.com/bg.svg" },
  { code: "CA", name: "Canada", dial: "1", flag: "https://flagcdn.com/ca.svg" },
  { code: "CY", name: "Cipru", dial: "357", flag: "https://flagcdn.com/cy.svg" },
  { code: "CZ", name: "Cehia", dial: "420", flag: "https://flagcdn.com/cz.svg" },
  { code: "DK", name: "Danemarca", dial: "45", flag: "https://flagcdn.com/dk.svg" },
  { code: "EE", name: "Estonia", dial: "372", flag: "https://flagcdn.com/ee.svg" },
  { code: "FI", name: "Finlanda", dial: "358", flag: "https://flagcdn.com/fi.svg" },
  { code: "GR", name: "Grecia", dial: "30", flag: "https://flagcdn.com/gr.svg" },
  { code: "HR", name: "Croația", dial: "385", flag: "https://flagcdn.com/hr.svg" },
  { code: "HU", name: "Ungaria", dial: "36", flag: "https://flagcdn.com/hu.svg" },
  { code: "IE", name: "Irlanda", dial: "353", flag: "https://flagcdn.com/ie.svg" },
  { code: "IL", name: "Israel", dial: "972", flag: "https://flagcdn.com/il.svg" },
  { code: "LU", name: "Luxemburg", dial: "352", flag: "https://flagcdn.com/lu.svg" },
  { code: "MC", name: "Monaco", dial: "377", flag: "https://flagcdn.com/mc.svg" },
  { code: "NL", name: "Olanda", dial: "31", flag: "https://flagcdn.com/nl.svg" },
  { code: "NO", name: "Norvegia", dial: "47", flag: "https://flagcdn.com/no.svg" },
  { code: "PL", name: "Polonia", dial: "48", flag: "https://flagcdn.com/pl.svg" },
  { code: "PT", name: "Portugalia", dial: "351", flag: "https://flagcdn.com/pt.svg" },
  { code: "QA", name: "Qatar", dial: "974", flag: "https://flagcdn.com/qa.svg" },
  { code: "SA", name: "Arabia Saudită", dial: "966", flag: "https://flagcdn.com/sa.svg" },
  { code: "SE", name: "Suedia", dial: "46", flag: "https://flagcdn.com/se.svg" },
  { code: "SI", name: "Slovenia", dial: "386", flag: "https://flagcdn.com/si.svg" },
  { code: "SK", name: "Slovacia", dial: "421", flag: "https://flagcdn.com/sk.svg" },
  { code: "TR", name: "Turcia", dial: "90", flag: "https://flagcdn.com/tr.svg" },
  { code: "AU", name: "Australia", dial: "61", flag: "https://flagcdn.com/au.svg" },
  { code: "BR", name: "Brazilia", dial: "55", flag: "https://flagcdn.com/br.svg" },
  { code: "CN", name: "China", dial: "86", flag: "https://flagcdn.com/cn.svg" },
  { code: "JP", name: "Japonia", dial: "81", flag: "https://flagcdn.com/jp.svg" },
  { code: "KZ", name: "Kazahstan", dial: "7", flag: "https://flagcdn.com/kz.svg" },
  { code: "MT", name: "Malta", dial: "356", flag: "https://flagcdn.com/mt.svg" },
  { code: "RU", name: "Rusia", dial: "7", flag: "https://flagcdn.com/ru.svg" },
  { code: "RS", name: "Serbia", dial: "381", flag: "https://flagcdn.com/rs.svg" },
  { code: "SG", name: "Singapore", dial: "65", flag: "https://flagcdn.com/sg.svg" },
  { code: "TH", name: "Thailanda", dial: "66", flag: "https://flagcdn.com/th.svg" },
  { code: "VN", name: "Vietnam", dial: "84", flag: "https://flagcdn.com/vn.svg" },
];

export const DEFAULT_COUNTRY =
  COUNTRIES.find((country) => country.code === "MD") ?? COUNTRIES[0];

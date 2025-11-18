export type Document = {
  title: string;
  titleEn: string;
  location?: string;
  date: string;
  url: string;
  category: 'statute' | 'founding' | 'closing-statement';
};

export const documentsData: Document[] = [
  // Statute
  {
    title: "Alapszabály",
    titleEn: "Charter",
    date: "2024",
    url: "https://cdn.prod.website-files.com/5dc9c03aaf8806097e345dac/66703f6a5f000e585aba7bd6_K%C3%89RA_logo_.png",
    category: "statute"
  },
  
  // Founding Declaration
  {
    title: "Alapító Nyilatkozat",
    titleEn: "Founding Declaration",
    date: "2003",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5eb96eb5b7feb0a0c8544c6f_Alapito_okoirat.pdf",
    category: "founding"
  },
  
  // Closing Statements (Zárónyilatkozatok)
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Komárom",
    date: "2023-11-25",
    url: "https://cdn.prod.website-files.com/5dc9c03aaf8806097e345dac/656eee42652fb40bf97899c0_ZA%CC%81RO%CC%81NYILATKOZAT%202023.11.25.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Szabadka",
    date: "2023-05-20",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/646b48572d209d718df0913c_Z%C3%A1r%C3%B3nyilatkozat%20Szabadka%2C%202023.05.20..pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kecskemét",
    date: "2022-12-10",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/63985baa4eb1bd3ad4e907b9_Kecskem%C3%A9t_Z%C3%81R%C3%93NYILATKOZAT.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Székelyudvarhely",
    date: "2022-05-28",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/6295d58d355095a9889ecafa_MIK%20Z%C3%A1r%C3%B3nyilatkozat%202022_1.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Budapest",
    date: "2019-11-30",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5e9dcb17ca0b95d4e0a5297c_Z%C3%A1r%C3%B3nyilatkozat.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Felsőőr",
    date: "2019-05-11",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0f7fbc1f71ba00c293fc_Felso%CC%8Bo%CC%8Br.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Várgesztes",
    date: "2018-11-23",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0f8c578bab96532f8311_Vargesztes.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Párkány",
    date: "2018-06-02",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0f99f61f37465a5d6862_Parkany.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Nyíregyháza",
    date: "2018-02-10",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0faec8721f060d84596d_Nyiregyhaza.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Lendva",
    date: "2017-05-13",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0fbb578bab260d2f88b6_Lendva.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Balatonmáriafürdő",
    date: "2016-11-26",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0fcb5d412b7ec33841b3_Balatonma%CC%81riafu%CC%88rdo%CC%8B.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Antalóc",
    date: "2016-04-23",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc0ff6cd7d370e2c2cba08_Antalo%CC%81c2016.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Makó",
    date: "2015-11-28",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc1007967a3b612f3df1c7_Mako.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kolozsvár",
    date: "2015-03-28",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc101ac8721f581d845f43_Kolozsva%CC%81r.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Visegrád",
    date: "2014-12-13",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc1027967a3bd2bd3df21e_Visegrad.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Dunaszerdahely",
    date: "2014-05-03",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc1032b8242156bdbc6fd4_Dunaszerdahely.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kaposvár",
    date: "2013-09-07",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc103fcd7d3727762cc6f4_Kaposvar.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Vukovár (Valkóvár)",
    date: "2013-06-08",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc10565d412b2587384666_Vukovar.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kecskemét",
    date: "2012-10-27",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc1061b82421471bbc709a_Kecskemet.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Szováta",
    date: "2012-05-19",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc106ec8721fc4e4846063_Szovata.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Debrecen",
    date: "2011-10-15",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc107bf61f37c27e5d7796_Debrecen.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Felsőőr",
    date: "2011-05-14",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc1089b8242113ebbc713b_Felso%CC%8Bo%CC%8Br2011.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Budapest",
    date: "2010-12-11",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc10945d412b15d9384714_Budapest2010.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Munkács",
    date: "2010-09-04",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc10c0d31f0f0be07103d7_Munkacs.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Zánka",
    date: "2009-10-17",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc10ecc8721f2e618465f2_Za%CC%81nka2008.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kovácspatak",
    date: "2009-05-16",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc112f578bab657d2f8d62_Kovacspatak.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Zánka",
    date: "2008-10-04",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc10ecc8721f2e618465f2_Za%CC%81nka2008.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Kolozsvár",
    date: "2008-06-15",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc306f58529f3a8a1502f2_Kolozsva%CC%81r2008.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Felsőőr",
    date: "2006-03-18",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc307d58529f29a2150319_Felso%CC%8Bo%CC%8Br2006.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Szabadka",
    date: "2005-11-19",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc308f02b5e1b445422c2b_Szabadka.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Nagykovácsi",
    date: "2005-06-18",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc30a3c27a491548ca29e7_Nagykova%CC%81csi.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Zánka",
    date: "2004-06-26",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc30b98275bc2ed8b5a9b0_Za%CC%81nka2004.pdf",
    category: "closing-statement"
  },
  {
    title: "Zárónyilatkozat",
    titleEn: "Closing Statement",
    location: "Lendva",
    date: "2003-11-01",
    url: "https://cdn.prod.website-files.com/5dcc3e7be62de18dff4ac43a/5ddc30c8967a3be2a43e0c24_Lendva2003.pdf",
    category: "closing-statement"
  }
];

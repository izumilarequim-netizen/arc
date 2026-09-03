export const INITIAL_LOCATIONS_DATA: Record<string, { baleValue: number; siteRemarksHistory: []; roles: Record<string, string[]> }> = {
  "SAN JOSEF": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["WILLY MANIBIN", "JERWIN MAGALLON", "JERRY MATUTE", "MICHAEL CANLAPAN", "JEFF DELA CRUZ", "MICHAEL CAMACHO", "JONATHAN BARGAMENTO", "MONOLITO CABAGAN", "PESELITO APILADO", "FAUSTINO MENDOZA", "CARLOS VALINO", "ARNEL BARELO"],
      "LABOR": ["JOHN DELOS REYES", "NELSON MIRANDA", "NOEL MEDRIANO", "ACE GARCIA", "REY MANINANG", "RICHARD SARMIENTO", "ROLANDO TOREJOS", "JAIME ANCHETA", "ADRIAN RAMON", "RYAN BRIONES", "RIC VARGAS"],
      "BALE": ["S- NIKKO DIZON", "L- JESSIE DIZON"]
    }
  },
  "PILIGAN": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["OGIE DE VARA", "RONEL TELEZ", "ROWEL SEBASTIAN", "RONNIE TELEZ", "RHEGIE SEBASTIAN"],
      "LABOR": ["ROBIN DIZON", "GREGORIO PUNZAL", "ANGELITO ABALOS", "JOHN CARLO TRIGUEROS"],
      "STAY IN": ["S- ROBERT DIAZ", "L- DANNY DELA CRUZ"]
    }
  },
  "GVE REYES": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["ED APOSTOL", "REX GONZALES", "JUN BERNABE", "MAVERIC DELOS SANTOS", "EDUARDO JAVIER"],
      "LABOR": ["ALBERTO DELA CRUZ", "RANDY BERNARDINO", "RENE BERNABE", "ARNOLD CASTRO"]
    }
  },
  "GVE MORALES": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["WILLY ARELLANO", "MARIO AQUINO", "ALBERT RIVERA", "ROMMEL SANTOS", "EDGAR VALENTIN", "DANNY GUILERMO", "PIOLO VALENTIN"],
      "WELDER": ["ORLAN REYES"],
      "LABOR": ["RICHARD RIVERA", "ALJHON PALASAN", "CHRIS ANTONIO", "CENEN DANGAL"]
    }
  },
  "BALOC PINTOR": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["ARSENIO ESCUDERO", "JULIUS ESCUDERO", "JOHN DY", "JUN-JUN RAMOS", "JHON REY RAMOS"],
      "LABOR": ["ALBERTO DELA CRUZ", "RANDY BERNARDINO", "RENE BERNABE", "ARNOLD CASTRO"]
    }
  },
  "BALOC SAMONTE": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["ROMEL SANTOS"],
      "LABOR": ["JM VALLEJO", "CHRIS ANTONIO"]
    }
  },
  "AVIDA": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["MARCELO BULACLAC", "DANILO BULACLAC", "DAMASO BULACLAC", "BERNIE SYLVESTRE", "ROLY SYLVESTRE", "JOMVIC VALINO", "DARWIN GUSTO", "MARLON BULACLAC", "ROLANDO MEDOZA"],
      "LABOR": ["MARCOS BULACLAC", "LON-LON CUAZON", "JUSTINE DELA CRUZ", "ANDREI DUMANGAN", "JAYSON DELA CRUZ", "JERIC YAKAT", "EMERSON SANTILLANA", "RAYBIN BARON", "ALLAN MABALAY"]
    }
  },
  "DINTOR ZARAGOZA": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["PHILIP CASTILLO", "JOHN PAUL CASTILLO", "JOHN GENRE PALANAN", "ROMEO RAMOS"]
    }
  },
  "NABAO": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["RESTY DIZON", "ILENG TABALDO", "ANTHONY TOLENTINO", "JOSE JUAN", "ROY GONZALES", "MARCELINO TOLENTINO", "ARVIN SANTOS", "ROBERT GONZALES", "MICHAEL TOLENTINO"],
      "LABOR": ["FREDIE GUSTO", "LAUREN TABALDO", "REYNALDO LAGASCA", "WAWI VARGAS", "MARCIAL KATAHAN", "MARIANO BRIÑA", "RAMIL PAJARDO", "ANGELO SANTOS", "JEFFREY ESTIPULAR", "FELIPE GONZALES"],
      "STAY IN": ["MARLON MAON"]
    }
  },
  "GEN LUNA": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["MICHAEL TOLENTINO"],
      "LABOR": ["FELIPE GONZALES"]
    }
  },
  "SAN ANTONIO": {
    baleValue: 0,
    siteRemarksHistory: [],
    roles: {
      "SKILLED": ["ARMANDO JOSE", "JUN MARQUEZ", "ARNOLD SALAYSAY"],
      "LABOR": ["MAVIN MAGNO", "AMARDY DELA CRUZ", "BENJIE LOPEZ", "JR DELA CRUZ", "RAMIL FAUSTINO", "DENNIS VICOS"]
    }
  }
};

export const ALL_ROLES = ["FOREMAN", "SKILLED", "WELDER", "LABOR", "STAY IN", "BALE", "EXTRA"];
export const DAY_KEYS = ['S', 'M', 'T', 'W', 'Th', 'F'] as const;
export const STORAGE_KEY = "arcdesign_timesheet_records_v20";

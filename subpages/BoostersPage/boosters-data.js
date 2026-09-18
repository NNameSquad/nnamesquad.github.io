const boosters_data = [
  { id: "448894048586170369", boosts: 60 }, //SAYO
  // Boosting since 5.01.2025 | +2 on the 4th of every month | 
  { id: "756482164262043720", boosts: 53 }, //KIRKA
  // Boosting since 16.11.2024 | +2 on the 15th of every month | 
  // Data for Sayo and Kirka showing boosts as of 04.10.2026(sayo) and 15.10.2026(kirka), due to counting their boosts in one-month forward manner. Trusting they wont unboost before the next boost accumulation date.
  { id: "692026308049240074", boosts: 14 }, //Kotek
  // Boosting since 27.08.2026 | +2 on the 26th of every month | (Remove if boost deleted before 26.09.2026)
  { id: "239932087925342209", boosts: 10 },
  { id: "531129228532645888", boosts: 6 },
  { id: "429661571019571200", boosts: 6 },
  { id: "439828776659058688", boosts: 4 },
  { id: "637972039332003841", boosts: 4 },
  { id: "925174809682387024", boosts: 4 },
  { id: "817810005255258142", boosts: 3 },
  { id: "762262927477964800", boosts: 2 },
  { id: "376320713101148163", boosts: 2 },
  { id: "636210705632067586", boosts: 2 },
  { id: "1158020020832579596", boosts: 2 }, //Felix
  // Boosting since 17.09.2026 | +2 on the 16th of every month | (Remove if boost deleted before 16.10.2026)
  { id: "794910561891647498", boosts: 1 },
  { id: "613661919676596225", boosts: 1 },
  { id: "657650990786281486", boosts: 1 },
  { id: "478496812811026433", boosts: 1 },
  // ID 0 means Users who deleted their account or asked to remove their stats.
  { id: "0", boosts: 5 }
];

// Last update:
// ID:448894048586170369 + ID:756482164262043720 Action: Added 2 boosts for date starting at 4.10 and 15.10 respectively.
// ID:1158020020832579596 Action: Added 2 boosts.
const boosters_updatetime = "2026-09-18T13:00:00+02:00"; // leave +02:00 for Warsaw timezone
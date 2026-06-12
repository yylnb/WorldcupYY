import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { INITIAL_BALANCE } from "../lib/constants";

const prisma = new PrismaClient();

const ADMIN_HASH = "$2b$12$DPeD1YdyowRvyvPffiiuxOs8ILpn5FVkm6u.rnI0re7q63G806sne";

const OFFICIAL_TEAM_NAMES_ZH = new Map(
  [
    "墨西哥",
    "南非",
    "韩国",
    "捷克",
    "加拿大",
    "波黑",
    "卡塔尔",
    "瑞士",
    "巴西",
    "摩洛哥",
    "海地",
    "苏格兰",
    "美国",
    "巴拉圭",
    "澳大利亚",
    "土耳其",
    "德国",
    "库拉索",
    "科特迪瓦",
    "厄瓜多尔",
    "荷兰",
    "日本",
    "瑞典",
    "突尼斯",
    "比利时",
    "埃及",
    "伊朗",
    "新西兰",
    "西班牙",
    "佛得角",
    "沙特阿拉伯",
    "乌拉圭",
    "法国",
    "塞内加尔",
    "伊拉克",
    "挪威",
    "阿根廷",
    "阿尔及利亚",
    "奥地利",
    "约旦",
    "葡萄牙",
    "刚果民主共和国",
    "乌兹别克斯坦",
    "哥伦比亚",
    "英格兰",
    "克罗地亚",
    "加纳",
    "巴拿马"
  ].map((name, index) => [String(index + 1), name])
);

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...data] = rows;
  return data.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]))
  );
}

function readCsv(fileName: string) {
  return parseCsv(readFileSync(path.join(process.cwd(), "prisma", fileName), "utf8"));
}

function stageName(type: string) {
  if (type === "group") return "小组赛";
  return "淘汰赛";
}

function startsAtFromCsvLocalDate(localDate: string) {
  const [datePart, timePart] = localDate.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const beijingWallTime = new Date(Date.UTC(year, month - 1, day, hour, minute));
  beijingWallTime.setMinutes(beijingWallTime.getMinutes() + 570);
  const yyyy = beijingWallTime.getUTCFullYear();
  const mm = String(beijingWallTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(beijingWallTime.getUTCDate()).padStart(2, "0");
  const hh = String(beijingWallTime.getUTCHours()).padStart(2, "0");
  const min = String(beijingWallTime.getUTCMinutes()).padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+08:00`);
}

function buildKnockoutSlots() {
  const slots: Array<{
    matchNumber: number;
    stage: string;
    startsAt: Date;
    homeTeam: string;
    awayTeam: string;
  }> = [];

  const ranges = [
    { start: 73, end: 88, stage: "32强赛", date: "2026-06-28T18:00:00.000Z" },
    { start: 89, end: 96, stage: "16强赛", date: "2026-07-04T18:00:00.000Z" },
    { start: 97, end: 100, stage: "四分之一决赛", date: "2026-07-09T18:00:00.000Z" },
    { start: 101, end: 102, stage: "半决赛", date: "2026-07-14T18:00:00.000Z" },
    { start: 103, end: 103, stage: "季军赛", date: "2026-07-18T18:00:00.000Z" },
    { start: 104, end: 104, stage: "决赛", date: "2026-07-19T18:00:00.000Z" }
  ];

  for (const range of ranges) {
    for (let matchNumber = range.start; matchNumber <= range.end; matchNumber += 1) {
      const offsetHours = (matchNumber - range.start) * 3;
      slots.push({
        matchNumber,
        stage: range.stage,
        startsAt: new Date(new Date(range.date).getTime() + offsetHours * 60 * 60 * 1000),
        homeTeam: `${range.stage}球队 A`,
        awayTeam: `${range.stage}球队 B`
      });
    }
  }

  return slots;
}

async function seedAdmin() {
  const admin = await prisma.user.upsert({
    where: { username: "Leon" },
    create: {
      username: "Leon",
      passwordHash: ADMIN_HASH,
      role: "ADMIN",
      balance: INITIAL_BALANCE
    },
    update: {
      passwordHash: ADMIN_HASH,
      role: "ADMIN"
    }
  });

  await prisma.ledgerEntry.upsert({
    where: { id: `seed-initial-${admin.id}` },
    create: {
      id: `seed-initial-${admin.id}`,
      userId: admin.id,
      type: "INITIAL_GRANT",
      amount: INITIAL_BALANCE,
      balance: admin.balance,
      note: "管理员初始虚拟币"
    },
    update: {}
  });
}

async function seedMatches() {
  const teams = new Map(readCsv("worldcup2026.teams.csv").map((team) => [team.id, team.name_en]));
  const games = readCsv("worldcup2026.games.csv");

  for (const game of games) {
    const homeTeam =
      OFFICIAL_TEAM_NAMES_ZH.get(game.home_team_id) ?? teams.get(game.home_team_id) ?? `球队 #${game.home_team_id}`;
    const awayTeam =
      OFFICIAL_TEAM_NAMES_ZH.get(game.away_team_id) ?? teams.get(game.away_team_id) ?? `球队 #${game.away_team_id}`;
    const stage = stageName(game.type);
    const groupName = game.group || null;
    const startsAt = startsAtFromCsvLocalDate(game.local_date);

    await prisma.match.upsert({
      where: { matchNumber: Number(game.id) },
      create: {
        matchNumber: Number(game.id),
        stage,
        groupName,
        homeTeam,
        awayTeam,
        startsAt,
        venue: "",
        status: "SCHEDULED"
      },
      update: {
        stage,
        groupName,
        homeTeam,
        awayTeam,
        startsAt,
        venue: ""
      }
    });
  }

  for (const slot of buildKnockoutSlots()) {
    await prisma.match.upsert({
      where: { matchNumber: slot.matchNumber },
      create: {
        matchNumber: slot.matchNumber,
        stage: slot.stage,
        homeTeam: slot.homeTeam,
        awayTeam: slot.awayTeam,
        startsAt: slot.startsAt,
        venue: "",
        status: "SCHEDULED"
      },
      update: {
        stage: slot.stage,
        homeTeam: slot.homeTeam,
        awayTeam: slot.awayTeam,
        venue: ""
      }
    });
  }
}

async function main() {
  await seedAdmin();
  await seedMatches();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

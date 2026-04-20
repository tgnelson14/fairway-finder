import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const [, , inputPath, outputPath = "public/courses.json"] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/updateCoursesFromOpenGolf.mjs <input.csv> [output.json]");
  process.exit(1);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function toNullableNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const courses = [];
  const seen = new Set();

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, "utf8"),
    crlfDelay: Infinity,
  });

  let headers = [];

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (headers.length === 0) {
      headers = parseCsvLine(line);
      continue;
    }

    const fields = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? ""]));

    if (!row.id || seen.has(row.id)) continue;
    seen.add(row.id);

    const name = row.name?.trim();
    const state = row.state?.trim();
    const city = row.city?.trim();
    const latitude = toNullableNumber(row.latitude);
    const longitude = toNullableNumber(row.longitude);

    if (!name || !state || !city || latitude === null || longitude === null) continue;

    courses.push({
      id: row.id,
      cn: name,
      n: name,
      lat: latitude,
      lng: longitude,
      city,
      st: state,
      co: row.country?.trim() || "US",
      addr: row.address?.trim() || "",
      par: toNullableNumber(row.par),
      yards: toNullableNumber(row.total_yardage),
      holes: toNullableNumber(row.holes),
      rating: null,
      slope: null,
    });
  }

  courses.sort((a, b) =>
    a.st.localeCompare(b.st) ||
    a.city.localeCompare(b.city) ||
    a.n.localeCompare(b.n)
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(courses, null, 2)}\n`);

  console.log(`Wrote ${courses.length} courses to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

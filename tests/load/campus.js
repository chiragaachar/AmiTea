// k6 run -e TARGET_URL=https://your-staging.example -e VUS=50 tests/load/campus.js
// Run 50 and 100 separately; NEVER point this at an unapproved third-party service.
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";
const writeFailures = new Rate("failed_writes");
const vus = Number(__ENV.VUS || 50);
// Optional file has one staging bearer token per virtual user. Do not commit it.
const tokens = __ENV.TOKEN_FILE ? JSON.parse(open(__ENV.TOKEN_FILE)) : [];
export const options = {
  stages: [
    { duration: "1m", target: vus },
    { duration: "5m", target: vus },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    failed_writes: ["rate<0.01"],
  },
};
export default function campusTraffic() {
  const token = tokens[(__VU - 1) % Math.max(tokens.length, 1)];
  if (
    Math.random() < 0.05 &&
    token &&
    __ENV.SUPABASE_URL &&
    __ENV.PUBLIC_KEY &&
    __ENV.POST_ID
  ) {
    const response = http.post(
      `${__ENV.SUPABASE_URL}/rest/v1/rpc/mutate`,
      JSON.stringify({
        kind: "vote_post",
        payload: { id: __ENV.POST_ID, active: Math.random() > 0.5 },
      }),
      {
        headers: {
          apikey: __ENV.PUBLIC_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        tags: { operation: "write" },
      },
    );
    writeFailures.add(response.status !== 200);
    check(response, { "write accepted": (r) => r.status === 200 });
  } else {
    const paths = [
      "/",
      "/",
      "/",
      "/explore?q=campus",
      "/trending",
      "/polls",
      "/suggestions",
    ];
    const response = http.get(
      `${__ENV.TARGET_URL}${paths[Math.floor(Math.random() * paths.length)]}`,
      { tags: { operation: "read" } },
    );
    check(response, {
      "public page loaded": (r) =>
        r.status === 200 && r.body.includes("amiTea"),
    });
  }
  sleep(2 + Math.random() * 4);
}

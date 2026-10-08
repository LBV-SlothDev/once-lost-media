// Backlot HD voices: turns script lines into speech with ElevenLabs.
// The ElevenLabs key lives only here (Supabase secret ELEVENLABS_API_KEY), never in the website.
// Every line is saved in the private "tts-cache" storage bucket, so replays cost nothing.
import { createClient } from "jsr:@supabase/supabase-js@2";

const EL = "https://api.elevenlabs.io/v1";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return json({ error: "HD voices aren't set up yet. Add the ELEVENLABS_API_KEY secret in Supabase." }, 503);
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Only the Once Lost Media team can spend voice credits.
  const asUser = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const { data: allowed, error: permErr } = await asUser.rpc("can_use_hd_voices");
  if (permErr || allowed !== true) return json({ error: "HD voices are only available to the Once Lost Media team." }, 403);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const action = new URL(req.url).searchParams.get("action") || body.action || "speak";

  if (action === "voices") {
    const r = await fetch(`${EL}/voices`, { headers: { "xi-api-key": key } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: j?.detail?.message || "Couldn't load the voice list." }, r.status);
    return json({ voices: (j.voices || []).map((v: any) => ({ id: v.voice_id, name: v.name, labels: v.labels || {}, category: v.category })) });
  }
  if (action === "quota") {
    const r = await fetch(`${EL}/user/subscription`, { headers: { "xi-api-key": key } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: "unavailable" }, r.status);
    return json({ used: j.character_count, limit: j.character_limit, tier: j.tier, resets: j.next_character_count_reset_unix });
  }

  const text = String(body.text || "").trim().slice(0, 1500);
  const voice = String(body.voice || "").replace(/[^A-Za-z0-9]/g, "");
  const model = body.model === "eleven_flash_v2_5" ? "eleven_flash_v2_5" : "eleven_multilingual_v2";
  if (!text || !voice) return json({ error: "Missing text or voice." }, 400);

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${model}|${voice}|${text}`));
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const path = `${voice}/${model}/${hash}.mp3`;
  const admin = createClient(url, service);

  const cached = await admin.storage.from("tts-cache").download(path);
  if (cached.data) return new Response(cached.data, { headers: { ...cors, "Content-Type": "audio/mpeg", "X-Cache": "hit" } });

  const r = await fetch(`${EL}/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true } }),
  });
  if (!r.ok) {
    let msg = "The voice service didn't respond.";
    try { const j = await r.json(); msg = j?.detail?.message || j?.detail?.status || msg; } catch (_) { /* not json */ }
    return json({ error: msg }, r.status);
  }
  const audio = new Uint8Array(await r.arrayBuffer());
  await admin.storage.from("tts-cache").upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  return new Response(audio, { headers: { ...cors, "Content-Type": "audio/mpeg", "X-Cache": "miss" } });
});

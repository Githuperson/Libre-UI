export default async function handler(req, res) {
    const target = new URL("https://libre-y-theta.vercel.app/api.php");

    for (const key of ["q", "p", "t"]) {
        if (req.query?.[key] !== undefined) target.searchParams.set(key, req.query[key]);
    }

    if (!target.searchParams.has("p")) target.searchParams.set("p", "0");
    if (!target.searchParams.has("t")) target.searchParams.set("t", "0");

    try {
        const response = await fetch(target, {
            headers: { Accept: "application/json" }
        });
        const body = await response.text();
        res.status(response.status);
        res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
        res.send(body);
    } catch (error) {
        res.status(502).json({ error: { message: "Libre-y backend could not be reached." } });
    }
}

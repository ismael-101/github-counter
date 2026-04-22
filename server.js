export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split('/');
    const username = path[2]; // سيأخذ الاسم من الرابط /counter/username

    if (!username) {
      return new Response('Please provide a username', { status: 400 });
    }

    const ip = request.headers.get('cf-connecting-ip');
    const kvKey = `count_${username}`;
    const ipKey = `last_visit_${username}_${ip}`;

    // 1. جلب العداد الحالي من الـ KV
    let count = parseInt(await env.COUNTER_KV.get(kvKey)) || 0;

    // 2. التحقق من الـ IP لمنع التكرار (Cooldown لمدة 30 دقيقة)
    const lastVisit = await env.COUNTER_KV.get(ipKey);
    if (!lastVisit) {
      count++;
      await env.COUNTER_KV.put(kvKey, count.toString());
      // تخزين الـ IP مع وقت انتهاء (Expiration) بعد 1800 ثانية (30 دقيقة)
      await env.COUNTER_KV.put(ipKey, 'true', { expirationTtl: 1800 });
    }

    // 3. تصميم الـ SVG البسيط
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20">
        <rect width="60" height="20" fill="#555"/>
        <rect x="60" width="40" height="20" fill="#4c1"/>
        <g fill="#fff" text-anchor="middle" font-family="Verdana,sans-serif" font-size="11">
            <text x="30" y="14">views</text>
            <text x="80" y="14" font-weight="bold">${count}</text>
        </g>
    </svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};